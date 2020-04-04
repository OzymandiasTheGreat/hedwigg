import { Injectable } from "@angular/core";
import * as settings from "tns-core-modules/application-settings";
import * as fs from "tns-core-modules/file-system";

import { BookServiceBase } from "@src/app/services/book.service.base";


export * from "@src/app/services/book.service.base";


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
