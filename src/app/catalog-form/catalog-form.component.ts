import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

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
		@Inject(MAT_DIALOG_DATA) private data: ICatalog,
		private dialogRef: MatDialogRef<CatalogFormComponent>,
		private catalogService: CatalogService,
	) {
		const catalog: ICatalog = this.catalogService.getCatalog((data && data.id) || "");
		this.catalog = catalog || { id: null, name: "", url: "", username: "", password: "" };
	}

	public cancel() {
		this.dialogRef.close(null);
	}

	public save(event?: Event) {
		event && event.preventDefault();
		if (!this.catalog.id) {
			this.catalog.id = this.catalogService.genKey(this.catalog.name);
		}
		if (this.catalog.name && this.catalog.url) {
			this.dialogRef.close(this.catalog);
		} else {
			this.dialogRef.close(null);
		}
	}
}
