import { Injectable } from "@angular/core";
import * as settings from "tns-core-modules/application-settings";
import * as fs from "tns-core-modules/file-system";

import { BookServiceBase, IBookBase } from "@src/app/services/book.service.base";


// tslint:disable-next-line:no-empty-interface
export interface IBook extends IBookBase {}

@Injectable({
	providedIn: "root"
})
export class BookService extends BookServiceBase {

	constructor() {
		super(
			settings.getAllKeys,
			settings.setString,
			settings.getString,
			settings.remove,
			fs.File.exists,
			// tslint:disable-next-line:newline-per-chained-call
			(path: string): void => fs.File.fromPath(path).removeSync(),
		);
	}
}
