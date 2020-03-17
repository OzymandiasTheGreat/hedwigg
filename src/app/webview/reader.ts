import { ePub } from "epubjs/src";


const wvInterface = (<any> window).nsWebViewInterface;
const ePub = (<ePub> window).ePub;

let rendition;


wvInterface.on("FILEPATH", (filePath: string) => {
	const book = ePub(filePath);
	rendition = book.renderTo("renderArea", { method: "default", width: "100%", height: "100%" });
	rendition.display();

	rendition.themes.default({ html: { height: "100%" }, body: { height: "100%", "background-color": "#FF0000" } });
});
wvInterface.on("PAGE", (direction) => {
	if (rendition) {
		switch (direction) {
			case "NEXT":
				rendition.next();
				break;
			case "PREV":
				rendition.prev();
		}
	}
});


document.addEventListener("DOMContentLoaded", () => {
	//
});
