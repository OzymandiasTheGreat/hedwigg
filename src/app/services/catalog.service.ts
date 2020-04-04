import { Injectable } from "@angular/core";

import { CatalogServiceBase } from "@src/app/services/catalog.service.base";


@Injectable({
	providedIn: "root",
})
export class CatalogService extends CatalogServiceBase {

	constructor() {
		super(
			() => Object.keys(window.localStorage),
			window.localStorage.setItem.bind(window.localStorage),
			window.localStorage.getItem.bind(window.localStorage),
			window.localStorage.removeItem.bind(window.localStorage),
		);
	}
}
