import { Component, OnInit } from "@angular/core";
import { Mediafilepicker, FilePickerOptions } from "nativescript-mediafilepicker";

import "nativescript-xml2js";
import * as epub from "epub";


@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
	private filePicker: Mediafilepicker;

	constructor() {
		this.filePicker = new Mediafilepicker();
	}

	public ngOnInit() {}

	public openBook() {
		const options: FilePickerOptions = {
			android: {
				extensions: ["epub", "pdf"],
				maxNumberFiles: 1,
			},
		};
		this.filePicker.openFilePicker(options);

		this.filePicker.on("getFiles", (data) => {
			const files = data.object.get("results");
			const book = new epub(files[0].file);
			book.once("end", () => console.log(book.metadata));
		});
	}
}
