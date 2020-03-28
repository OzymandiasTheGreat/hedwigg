import { Component } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

import { ICatalog } from "@src/app/services/catalog.service.base";
import { CatalogService } from "@src/app/services/catalog.service";


@Component({
	selector: "app-catalog-form",
	templateUrl: "./catalog-form.component.html",
	styleUrls: ["./catalog-form.component.scss"]
})
export class CatalogFormComponent {
	public catalog: ICatalog;

	constructor(
		private params: ModalDialogParams,
		private catalogService: CatalogService,
	) {
		const catalog: ICatalog = this.catalogService.getCatalog(this.params.context.catalog ? this.params.context.catalog.id : "");
		this.catalog = catalog ? catalog : { id: null, name: "", url: "", username: "", password: "" };
	}

	public cancel() {
		this.params.closeCallback(null);
	}

	public save() {
		if (!this.catalog.id) {
			this.catalog.id = this.catalogService.genKey(this.catalog.name);
		}
		this.params.closeCallback(this.catalog);
	}
}
