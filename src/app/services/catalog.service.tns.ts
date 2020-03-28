import { Injectable } from "@angular/core";
import * as settings from "tns-core-modules/application-settings";

import { CatalogServiceBase } from "@src/app/services/catalog.service.base";


@Injectable({
	providedIn: "root",
})
export class CatalogService extends CatalogServiceBase {

	constructor() {
		super(
			settings.getAllKeys,
			settings.setString,
			settings.getString,
			settings.remove,
		);
	}
}
