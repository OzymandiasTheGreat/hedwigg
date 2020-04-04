import { ipcRenderer } from "electron";
import { Book, Rendition, Contents } from "epubjs";
import { Location } from "epubjs/types/rendition";


const THEMES = {
	Default: { "html, body": {
			height: "100%",
			"background-color": "#FFFFFF",
			color: "#000000",
		} },
	Soft: { "html, body": {
			height: "100%",
			"background-color": "#fafafa",
			color: "#212121",
	} },
	Tan: { "html, body": {
			height: "100%",
			"background-color": "#ffecb3",
			color: "#212121",
	} },
	Dark: { "html, body": {
			height: "100%",
			"background-color": "#212121",
			color: "#fafafa",
	} },
	Inverted: { "html, body": {
			height: "100%",
			"background-color": "#000000",
			color: "#FFFFFF",
	} },
};


let path: string;
let book: Book;
let rendition: Rendition;
let locGen: boolean;
let META = false;
let SWIPE: boolean;
let BOTTOMTOP: number;
let EVENTTIME: number;


ipcRenderer.on("FILEPATH", (evt, options: { filePath: string, flow: string, spread: string, theme: string, fontSize: string }) => {
	path = options.filePath;
	book = new Book(options.filePath);
	SWIPE = options.flow !== "scrolled";
	rendition = book.renderTo("renderArea", {
		width: "100%",
		height: "100%",
		flow: options.flow,
		spread: options.spread,
		minSpreadWidth: 0,
	});

	rendition.themes.register(THEMES);
	rendition.themes.default({ "html, body": { height: "100%" } });
	rendition.themes.select(options.theme);
	rendition.themes.fontSize(options.fontSize);

	book.ready.then(() => {
		ipcRenderer.sendToHost("BOOKID", `BOOK(${book.key()})`);
		ipcRenderer.sendToHost("TOC", book.navigation.toc.map((navItem) => ({ ...navItem, key: "TOC" })));
		(<Promise<void>> book.locations.generate(1024))
			.then(() => {
				locGen = true;
				rendition.location
				&& rendition.location.start
				&& ipcRenderer.sendToHost("PERCENT", book.locations.percentageFromCfi(rendition.location.start.cfi));
			});
	});
	rendition.on("relocated", (data: Location) => {
		if (META) {
			// tslint:disable-next-line:newline-per-chained-call
			(<any> book.archive).zip.files[book.path.resolve(book.packaging.coverPath).slice(1)]
				.async("base64")
				.then((b64) => {
					// tslint:disable-next-line:newline-per-chained-call
					const ext = book.packaging.coverPath.split(".").pop();
					const mime = ext === "jpg"
						? "image/jpeg" : ext === "jpeg"
						? "image/jpeg" : ext === "png"
						? "image/png" : "application/octet-stream";
					const ibook = {
						id: `BOOK(${book.key()})`,
						path,
						cover: `data:${mime};base64,${b64}`,
						title: book.packaging.metadata.title,
						author: book.packaging.metadata.creator,
						language: book.packaging.metadata.language,
						location: data.start.cfi,
						finished: false,
						openedAt: Date.now(),
						starred: false,
						bookmarks: [],
					};
					ipcRenderer.sendToHost("META", ibook);
				});
		}
		ipcRenderer.sendToHost("CFI", data.start.cfi);

		const spineItem = book.spine.get(data.start.cfi);
		const navItem = book.navigation.get(spineItem.href);
		ipcRenderer.sendToHost("CHAPTER", {
			label: navItem ? navItem.label.trim() : "-",
			current: data.end.displayed.page,
			total: data.end.displayed.total,
		});
		if (locGen) {
			ipcRenderer.sendToHost("PERCENT", book.locations.percentageFromCfi(data.start.cfi));
		}
	});

	rendition.hooks.content.register((contents: Contents) => {
		contents.document.documentElement.addEventListener("click", () => {
			setTimeout(() => {
				const selection = contents.window.getSelection();
				if (!selection || !selection.toString()) {
					ipcRenderer.sendToHost("FULLSCREEN", null);
				}
			}, 100);
		});
		contents.document.addEventListener("selectstart", () => {
			setTimeout(() => {
				const selection = contents.window.getSelection();
				if (!selection || !selection.toString()) {
					ipcRenderer.sendToHost("SELECTION", { selected: false, selection: null });
				}
			}, 100);
		});
		contents.document.addEventListener("selectionchange", () => {
			const selection = contents.window.getSelection();
			if (selection) {
				ipcRenderer.sendToHost("SELECTION", { selected: true, selection: selection.toString() });
			}
		});

		if (!SWIPE) {
			const container = document.querySelector(".epub-container");
			BOTTOMTOP = container.scrollHeight - container.clientHeight - 1;
			EVENTTIME = performance.now();
			container.addEventListener("scroll", (event) => {
				if (event.isTrusted && (event.timeStamp - EVENTTIME) > 750) {
					BOTTOMTOP = container.scrollHeight - container.clientHeight - 1;
					if (container.scrollTop <= 0) {
						EVENTTIME = event.timeStamp;
						rendition.prev();
					} else if (container.scrollTop >= BOTTOMTOP) {
						EVENTTIME = event.timeStamp;
						rendition.next();
					}
				}
			});
		}
	});
});

ipcRenderer.on("CFI", (evt, location: string) => {
	rendition && rendition.display(location);
});
ipcRenderer.on("PERCENT", (evt, percent) => {
	if (locGen) {
		const cfi = book.locations.cfiFromPercentage(percent);
		rendition && rendition.display(cfi);
	}
});
ipcRenderer.on("META", () => {
	META = true;
	rendition && rendition.display();
});
ipcRenderer.on("PAGE", (evt, direction) => {
	if (rendition && SWIPE) {
		switch (direction) {
			case "LEFT":
				(<any> book.packaging.metadata).direction === "rtl" ? rendition.next() : rendition.prev();
				break;
			case "RIGHT":
				(<any> book.packaging.metadata).direction === "rtl" ? rendition.prev() : rendition.next();
		}
	}
});

ipcRenderer.on("SEARCH", async (evt, query) => {
	const results = await Promise.all(
		(<any> book.spine).spineItems.map((item) => item.load(book.load.bind(book))
			.then(item.find.bind(item, query))
			.finally(item.unload.bind(item)))
	)
	.then((res) => Promise.resolve([].concat.apply([], res)));
	ipcRenderer.sendToHost("SEARCH", { query, results });
	results.forEach((res: { excerpt: string, cfi: string }) => {
		rendition.annotations.highlight(res.cfi);
	});
});


document.documentElement.addEventListener("click", () => {
	setTimeout(() => {
		const selection = window.getSelection();
		if (!selection || !selection.toString()) {
			ipcRenderer.sendToHost("FULLSCREEN", null);
		}
	}, 100);
});
