import { Injectable } from "@angular/core";
import * as fs from "fs";

import { BookServiceBase } from "@src/app/services/book.service.base";


export * from "@src/app/services/book.service.base";


@Injectable({
	providedIn: "root"
})
export class BookService extends BookServiceBase {

	constructor() {
		super(
			() => Object.keys(window.localStorage),
			window.localStorage.setItem.bind(window.localStorage),
			window.localStorage.getItem.bind(window.localStorage),
			window.localStorage.removeItem.bind(window.localStorage),
			fs.existsSync,
			fs.unlinkSync,
		);
	}
}
