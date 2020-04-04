import * as PDFJSLIB from "pdfjs-dist";
// tslint:disable-next-line:no-duplicate-imports
import { PDFLoadingTask, PDFDocumentProxy, PDFPromise, PDFInfo, PDFMetadata } from "pdfjs-dist";


const wvInterface = (<any> window).nsWebViewInterface;
const pdfjsLib: typeof PDFJSLIB = (<any> window)["pdfjs-dist/build/pdf"];
const pdfjsViewer = (<any> window)["pdfjs-dist/web/pdf_viewer"];
let app: PDFViewerApplication;


pdfjsLib.GlobalWorkerOptions.workerSrc =
	"./build/pdf.worker.js";


const USE_ONLY_CSS_ZOOM = true;
const TEXT_LAYER_MODE = 2;
// const MAX_IMAGE_SIZE = 1024 * 1024;
const MAX_IMAGE_SIZE = -1;
const CMAP_URL = "./cmaps/";
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

		const linkService = new pdfjsViewer.PDFLinkService({
			eventBus,
		});
		this.pdfLinkService = linkService;

		const findController = new pdfjsViewer.PDFFindController({
			eventBus,
			linkService,
		});
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

		this.pdfHistory = new pdfjsViewer.PDFHistory({
			eventBus,
			linkService,
		});
		linkService.setHistory(this.pdfHistory);

		eventBus.on("pagesinit", () => {
			// We can use pdfViewer now, e.g. let's change default scale.
			pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
			pdfViewer.spreadMode = SPREAD;

			const current = this.page;
			const total = this.pdfDocument.numPages;

			wvInterface.emit("CFI", current.toString(10));
			wvInterface.emit("CHAPTER", { label: "-", current, total });
			wvInterface.emit("PERCENT", current / total);
		});

		eventBus.on("pagechanging", (evt) => {
			const page: number = evt.pageNumber;
			const numPages: number = this.pagesCount;

			wvInterface.emit("CFI", page.toString(10));
			wvInterface.emit("CHAPTER", { label: pdfViewer.currentPageLabel || "-", current: page, total: numPages });
			wvInterface.emit("PERCENT", page / numPages);
		});
	}

	public open(params: any): PDFPromise<void> {
		if (this.pdfLoadingTask) {
			// We need to destroy already opened document
			return this.close()
				// ... and repeat the open() call.
				.then(() => { this.open(params); });
		}

		this.url = params.url;

		// Loading document.
		const loadingTask = pdfjsLib.getDocument({
			url: this.url,
			maxImageSize: MAX_IMAGE_SIZE,
			cMapUrl: CMAP_URL,
			cMapPacked: CMAP_PACKED,
		});
		this.pdfLoadingTask = loadingTask;

		return loadingTask.promise.then((pdfDocument) => {
			// Document loaded, specifying document for the viewer.
			this.pdfDocument = pdfDocument;
			this.pdfViewer.setDocument(pdfDocument);
			this.pdfLinkService.setDocument(pdfDocument);
			this.pdfHistory.initialize({ fingerprint: pdfDocument.fingerprint });
			this.setMetadata(pdfDocument);

			wvInterface.emit("BOOKID", `BOOK(${pdfDocument.fingerprint})`);
			pdfDocument.getOutline()
				.then((outline) => {
					wvInterface.emit("TOC", outline ? outline.map(({ title, dest }) => ({ title, dest, key: "OUTLINE" })) : []);
				});
		}, (exception: any) => {
			const message = exception && exception.message;
			let loadingErrorMessage;

			if (exception instanceof (<any> pdfjsLib).InvalidPDFException) {
				// change error message also for other builds
				loadingErrorMessage = this.l10n.get(
					"invalid_file_error",
					null,
					"Invalid or corrupted PDF file."
				);
			} else if (exception instanceof (<any> pdfjsLib).MissingPDFException) {
				// special message for missing PDFs
				loadingErrorMessage = this.l10n.get(
					"missing_file_error",
					null,
					"Missing PDF file."
				);
			} else if (exception instanceof (<any> pdfjsLib).UnexpectedResponseException) {
				loadingErrorMessage = this.l10n.get(
					"unexpected_response_error",
					null,
					"Unexpected server response."
				);
			} else {
				loadingErrorMessage = this.l10n.get(
					"loading_error",
					null,
					"An error occurred while loading the PDF."
				);
			}
			loadingErrorMessage.then((msg) => {
				wvInterface.emit("debug", `PDFERROR ${message}\n${msg}`);
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


wvInterface.on("FILEPATH", (options: { filePath: string, flow: string, spread: string, theme: string, fontSize: string }) => {
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
wvInterface.on("META", () => {
	let pdfTitle;
	if (app.meta && app.meta.has("dc:title")) {
		const title = app.meta.get("dc:title");
		// Ghostscript sometimes returns 'Untitled', so prevent setting the
		// title to 'Untitled.
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
			// decodeURIComponent may throw URIError,
			// fall back to using the unprocessed url in that case
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
			wvInterface.emit("META", ibook);
		});
});
wvInterface.on("CFI", (page) => {
	const num = parseInt(page, 10);
	if (num) {
		app.page = num;
	}
});
wvInterface.on("PERCENT", (percent) => {
	app.page = Math.round(app.pdfDocument.numPages * percent);
});
wvInterface.on("PAGE", (direction) => {
	if (SWIPE) {
		switch (direction) {
			case "LEFT":
				app.page++;
				break;
			case "RIGHT":
				app.page--;
		}
	}
});
wvInterface.on("OUTLINE", (dest) => {
	app.pdfLinkService.navigateTo(dest);
});
wvInterface.on("SEARCH", (query) => {
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
		wvInterface.emit("SEARCH", { query, results });
	}, 3750);
});
wvInterface.on("SEARCHNAV", (selected) => {
	app.pdfFindController._selected = selected;
	app.pdfFindController._updateMatch();
});


document.addEventListener("selectstart", () => {
	setTimeout(() => {
		const selection = window.getSelection();
		if (!selection || !selection.toString()) {
			wvInterface.emit("SELECTION", { selected: false, selection: null });
		}
	}, 100);
});
document.addEventListener("selectionchange", () => {
	const selection = window.getSelection();
	if (selection) {
		wvInterface.emit("SELECTION", { selected: true, selection: selection.toString() });
	}
});
