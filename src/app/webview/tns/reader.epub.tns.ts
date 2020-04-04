// tslint:disable:prefer-mapped-imports

import { Book, Contents } from "epubjs";
import Rendition, { Location } from "epubjs/types/rendition";

// import { IBook } from "../services/book.service.base";


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


const wvInterface = (<any> window).nsWebViewInterface;
const ePub = (<any> window).ePub;

let path: string;
let META = false;
let book: Book;
let rendition: Rendition;
let locGen: boolean;
let SWIPE: boolean;
let BOTTOMTOP: number;
let EVENTTIME: number;


wvInterface.on("FILEPATH", (options: { filePath: string, flow: string, spread: string, theme: string, fontSize: string }) => {
	path = options.filePath;
	book = ePub(options.filePath);
	SWIPE = options.flow !== "scrolled";
	rendition = book.renderTo("renderArea", {
		width: "100%",
		height: "100%",
		// This is broken: font-size is not applied and screen goes blank on resize
		// method: "continuous",
		flow: options.flow,
		spread: options.spread,
		minSpreadWidth: 0,
	} as any);

	rendition.themes.register(THEMES);
	rendition.themes.default({ "html, body": { height: "100%" } });
	rendition.themes.select(options.theme);
	rendition.themes.fontSize(options.fontSize);

	book.ready.then(() => {
		wvInterface.emit("BOOKID", `BOOK(${book.key()})`);
		wvInterface.emit("TOC", book.navigation.toc.map((navItem) => ({ ...navItem, key: "TOC" })));
		(<Promise<void>> book.locations.generate(1024))
			.then(() => {
				locGen = true;
				rendition.location
				&& rendition.location.start
				&& wvInterface.emit("PERCENT", book.locations.percentageFromCfi(rendition.location.start.cfi));
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
					wvInterface.emit("META", ibook);
				});
		}
		wvInterface.emit("CFI", data.start.cfi);

		const spineItem = book.spine.get(data.start.cfi);
		const navItem = book.navigation.get(spineItem.href);
		wvInterface.emit("CHAPTER", {
			label: navItem ? navItem.label.trim() : "-",
			current: data.end.displayed.page,
			total: data.end.displayed.total,
		});
		if (locGen) {
			wvInterface.emit("PERCENT", book.locations.percentageFromCfi(data.start.cfi));
		}
	});
	// rendition.on("selected", (range: EpubCFI, contents: Contents) => {
	// 	// tslint:disable-next-line:newline-per-chained-call
	// 	wvInterface.emit("debug", `SELECTED ${contents.window.getSelection().toString()}`);
	// });
	rendition.hooks.content.register((contents: Contents) => {
		contents.document.addEventListener("selectstart", () => {
			setTimeout(() => {
				const selection = contents.window.getSelection();
				if (!selection || !selection.toString()) {
					wvInterface.emit("SELECTION", { selected: false, selection: null });
				}
			}, 100);
		});
		contents.document.addEventListener("selectionchange", () => {
			const selection = contents.window.getSelection();
			if (selection) {
				wvInterface.emit("SELECTION", { selected: true, selection: selection.toString() });
			}
		});
		if (!SWIPE) {
			const container = document.querySelector(".epub-container");
			BOTTOMTOP = container.scrollHeight - container.clientHeight - 1;
			EVENTTIME = performance.now();
			container.addEventListener("scroll", (event) => {
				if (event.isTrusted && (event.timeStamp - EVENTTIME) > 250) {
					BOTTOMTOP = container.scrollHeight - container.clientHeight - 1;
					if (container.scrollTop <= 0) {
						EVENTTIME = event.timeStamp;
						rendition.prev();
					} else if (container.scrollTop >= (BOTTOMTOP)) {
						EVENTTIME = event.timeStamp;
						rendition.next();
					}
				}
			});
		}
	});
});
wvInterface.on("CFI", (location: string) => {
	rendition && rendition.display(location);
});
wvInterface.on("PERCENT", (percent) => {
	if (locGen) {
		const cfi = book.locations.cfiFromPercentage(percent);
		rendition && rendition.display(cfi);
	}
});
wvInterface.on("META", () => {
	META = true;
	rendition && rendition.display();
});
wvInterface.on("PAGE", (direction) => {
	if (rendition) {
		if (SWIPE) {
			switch (direction) {
				case "LEFT":
					(<any> book.packaging.metadata).direction === "rtl" ? rendition.prev() : rendition.next();
					break;
				case "RIGHT":
					(<any> book.packaging.metadata).direction === "rtl" ? rendition.next() : rendition.prev();
			}
		}
	}
});
wvInterface.on("SEARCH", async (query) => {
	const results = await Promise.all(
		(<any> book.spine).spineItems.map((item) => item.load(book.load.bind(book))
			.then(item.find.bind(item, query))
			.finally(item.unload.bind(item)))
	)
	.then((res) => Promise.resolve([].concat.apply([], res)));
	wvInterface.emit("SEARCH", { query, results });
	results.forEach((res: { excerpt: string, cfi: string }) => {
		rendition.annotations.highlight(res.cfi);
	});
});
