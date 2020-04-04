import { ipcRenderer } from "electron";
import * as pdfjsLib from "pdfjs-dist";
// tslint:disable-next-line:no-duplicate-imports
import { PDFLoadingTask, PDFDocumentProxy, PDFPromise, PDFInfo, PDFMetadata } from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";


pdfjsLib.GlobalWorkerOptions.workerSrc = "../../../node_modules/pdfjs-dist/build/pdf.worker.js";


let app: PDFViewerApplication;


const USE_ONLY_CSS_ZOOM = true;
const TEXT_LAYER_MODE = 2;
const MAX_IMAGE_SIZE = -1;
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const DEFAULT_SCALE_VALUE = "page-fit";
let SWIPE: boolean;
let VIEWER: any;
let SPREAD: number;


class PDFViewerApplication {
	public pdfLoadingTask: PDFLoadingTask<PDFDocumentProxy>;
	public pdfDocument: PDFDocumentProxy;
	public pdfViewer: any;
	public pdfHistory: any;
	public pdfLinkService: any;
	public pdfFindController: any;
	public eventBus: any;
	public l10n: any;
	public info: PDFInfo;
	public meta: PDFMetadata;
	public url: string;

	constructor() {
		const eventBus = new pdfjsViewer.EventBus();
		this.eventBus = eventBus;

		const linkService = new pdfjsViewer.PDFLinkService({ eventBus });
		this.pdfLinkService = linkService;

		const findController = new pdfjsViewer.PDFFindController({ eventBus, linkService });
		this.pdfFindController = findController;

		this.l10n = pdfjsViewer.NullL10n;

		const container = document.getElementById("viewerContainer");
		const pdfViewer = new VIEWER({
			container,
			eventBus,
			linkService,
			findController,
			l10n: this.l10n,
			removePageBorders: true,
			useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
			textLayerMode: TEXT_LAYER_MODE,
		});
		this.pdfViewer = pdfViewer;
		linkService.setViewer(pdfViewer);

		this.pdfHistory = new pdfjsViewer.PDFHistory({ eventBus, linkService });
		linkService.setHistory(this.pdfHistory);

		eventBus.on("pagesinit", () => {
			pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
			pdfViewer.spreadMode = SPREAD;

			const current = this.page;
			const total = this.pdfDocument.numPages;

			ipcRenderer.sendToHost("CFI", current.toString(10));
			ipcRenderer.sendToHost("CHAPTER", { label: "-", current, total });
			ipcRenderer.sendToHost("PERCENT", current / total);
		});

		eventBus.on("pagechanging", (evt) => {
			const page: number = evt.pageNumber;
			const numPages: number = this.pagesCount;

			ipcRenderer.sendToHost("CFI", page.toString(10));
			ipcRenderer.sendToHost("CHAPTER", { label: pdfViewer.currentPageLabel || "-", current: page, total: numPages });
			ipcRenderer.sendToHost("PERCENT", page / numPages);
		});
	}

	public open(params): any {
		if (this.pdfLoadingTask) {
			return this.close()
				.then(() => { this.open(params); });
		}

		this.url = params.url;

		const loadingTask = pdfjsLib.getDocument({
			url: this.url,
			maxImageSize: MAX_IMAGE_SIZE,
			cMapUrl: CMAP_URL,
			cMapPacked: CMAP_PACKED,
		});
		this.pdfLoadingTask = loadingTask;

		return loadingTask.promise.then((pdfDocument) => {
			this.pdfDocument = pdfDocument;
			this.pdfViewer.setDocument(pdfDocument);
			this.pdfLinkService.setDocument(pdfDocument);
			this.pdfHistory.initialize({ fingerprint: pdfDocument.fingerprint });
			this.setMetadata(pdfDocument);

			ipcRenderer.sendToHost("BOOKID", `BOOK(${pdfDocument.fingerprint})`);
			pdfDocument.getOutline()
				.then((outline) => {
					ipcRenderer.sendToHost("TOC", outline ? outline.map(({ title, dest }) => ({ title, dest, key: "OUTLINE" })) : []);
				});
		});
	}

	public close(): PDFPromise<void> {
		if (!this.pdfLoadingTask) {
			return <PDFPromise<void>> <unknown> Promise.resolve();
		}

		const promise = (<any> this.pdfLoadingTask).destroy();
		this.pdfLoadingTask = null;

		if (this.pdfDocument) {
			this.pdfDocument = null;

			this.pdfViewer.setDocument(null);
			this.pdfLinkService.setDocument(null, null);

			if (this.pdfHistory) {
				this.pdfHistory.reset();
			}
		}

		return promise;
	}

	public setMetadata(pdfDocument: PDFDocumentProxy): void {
		pdfDocument.getMetadata()
			.then((data) => {
				this.info = data.info;
				this.meta = data.metadata;
			});
	}

	get pagesCount(): number {
		return this.pdfDocument.numPages;
	}

	set page(val: number) {
		this.pdfViewer.currentPageNumber = val;
	}

	get page(): number {
		return this.pdfViewer.currentPageNumber;
	}
}


async function genCover(doc: PDFDocumentProxy): Promise<string> {
	return doc.getPage(1)
		.then((page) => {
			const canvas = <HTMLCanvasElement> document.getElementById("renderArea");
			const ctx = canvas.getContext("2d");
			const viewport = page.getViewport({ scale: 0.3 });
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const renderCtx = {
				canvasContext: ctx,
				viewport,
			};
			const renderTask = page.render(renderCtx);

			return renderTask.promise.then(() => canvas.toDataURL("image/jpeg"));
		});
}


ipcRenderer.on("FILEPATH", (evt, options: { filePath: string, flow: string, spread: string, theme: string, fontSize: string }) => {
	SWIPE = options.flow === "paginated" && options.spread === "none";
	VIEWER = options.flow === "paginated" && options.spread === "none" ? pdfjsViewer.PDFSinglePageViewer : pdfjsViewer.PDFViewer;
	SPREAD = options.spread === "none" ? 0 : 1;
	app = new PDFViewerApplication();
	new Promise((resolve) => {
		window.requestAnimationFrame(resolve);
	})
	.then(() => {
		app.open({ url: options.filePath });
	});
});
ipcRenderer.on("META", () => {
	let pdfTitle;
	if (app.meta && app.meta.has("dc:title")) {
		const title = app.meta.get("dc:title");
		if (title !== "Untitled") {
			pdfTitle = title;
		}
	}
	if (!pdfTitle && app.info && app.info.Title) {
		pdfTitle = app.info.Title;
	}
	if (!pdfTitle) {
		pdfTitle = (<any> pdfjsLib).getFilenameFromUrl(app.url) || app.url;
		try {
			pdfTitle = decodeURIComponent(pdfTitle);
		} catch (e) {
			// see tns version
		}
	}

	genCover(app.pdfDocument)
		.then((cover) => {
			const ibook = {
				id: `BOOK(${app.pdfDocument.fingerprint})`,
				path: app.url,
				cover,
				title: pdfTitle,
				author: ((app.info && (app.info.Author || app.info.Producer || app.info.Creator)) || "-").trim(),
				language: (app.info && app.info.Lang) || null,
				location: "1",
				finished: false,
				openedAt: Date.now(),
				starred: false,
				bookmarks: [],
			};
			ipcRenderer.sendToHost("META", ibook);
		});
});
ipcRenderer.on("CFI", (evt, page) => {
	const num = parseInt(page, 10);
	if (num) {
		app.page = num;
	}
});
ipcRenderer.on("PERCENT", (evt, percent) => {
	app.page = Math.round(app.pdfDocument.numPages * percent);
});
ipcRenderer.on("PAGE", (evt, direction) => {
	if (SWIPE) {
		switch (direction) {
			case "LEFT":
				app.page--;
				break;
			case "RIGHT":
				app.page++;
		}
	}
});
ipcRenderer.on("OUTLINE", (evt, dest) => {
	app.pdfLinkService.navigateTo(dest);
});
ipcRenderer.on("SEARCH", (evt, query) => {
	app.pdfFindController.executeCommand("find", {
		caseSensitive: false,
		phraseSearch: true,
		entireWord: false,
		highlightAll: true,
		findPrevious: false,
		query,
	});
	setTimeout(() => {
		const results = [];
		app.pdfFindController.pageMatches.forEach((page, i) => {
			page.forEach((match, j) => {
				const strRangeEnd = 250;
				let strRangeStart = match - 100;
				strRangeStart = strRangeStart < 0 ? 0 : strRangeStart;
				let excerpt: string = app.pdfFindController._pageContents[i].substr(strRangeStart, strRangeEnd);
				excerpt = `...${excerpt.substr(excerpt.indexOf(" ") + 1 || 0, excerpt.lastIndexOf(" ") - 1 || excerpt.length)}...`;
				results.push({ excerpt, cfi: { matchIdx: j, pageIdx: i } });
			});
		});
		ipcRenderer.sendToHost("SEARCH", { query, results });
	}, 3750);
});
ipcRenderer.on("SEARCHNAV", (evt, selected) => {
	app.pdfFindController._selected = selected;
	app.pdfFindController._updateMatch();
});


document.documentElement.addEventListener("click", () => {
	setTimeout(() => {
		const selection = window.getSelection();
		if (!selection || !selection.toString()) {
			ipcRenderer.sendToHost("FULLSCREEN", null);
		}
	}, 100);
});
document.addEventListener("selectstart", () => {
	setTimeout(() => {
		const selection = window.getSelection();
		if (!selection || !selection.toString()) {
			ipcRenderer.sendToHost("SELECTION", { selected: false, selection: null });
		}
	}, 100);
});
document.addEventListener("selectionchange", () => {
	const selection = window.getSelection();
	if (selection) {
		ipcRenderer.sendToHost("SELECTION", { selected: true, selection: selection.toString() });
	}
});
