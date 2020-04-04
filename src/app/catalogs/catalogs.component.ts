import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subject, pipe } from "rxjs";
import { takeUntil, toArray } from "rxjs/operators";

import { ICatalog } from "@src/app/services/catalog.service.base";
import { CatalogService } from "@src/app/services/catalog.service";
import { CatalogFormComponent } from "@src/app/catalog-form/catalog-form.component";
import { WarningDialogComponent } from "@src/app/warning-dialog/warning-dialog.component";


@Component({
	selector: "app-catalogs",
	templateUrl: "./catalogs.component.html",
	styleUrls: ["./catalogs.component.scss"]
})
export class CatalogsComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;

	public catalogs: ICatalog[];

	constructor(
		private dialog: MatDialog,
		private catalogService: CatalogService,
	) {
		this.ngUnsubscribe = new Subject<void>();
	}

	public ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}

	public ngOnInit() {
		this.load();
	}

	public load() {
		this.catalogService.catalogs.pipe(
			toArray(),
			takeUntil(this.ngUnsubscribe),
		)
		.subscribe((catalogs) => this.catalogs = catalogs.sort((a, b) => a.name.localeCompare(b.name)));
		this.catalogService.getAllCatalogs();
	}

	public edit(catalog: ICatalog) {
		this.dialog.open(CatalogFormComponent, { data: catalog })
			.afterClosed()
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((cat: ICatalog) => {
				if (cat) {
					this.catalogService.setCatalog(cat);
					this.load();
				}
			});
	}

	public remove(catalog: ICatalog) {
		this.dialog.open(WarningDialogComponent, {
			data: {
				title: "Remove Catalog",
				content: "This will permanently remove the catalog.\nBooks downloaded from this catalog will not be affected.",
				action: "Remove",
			},
		})
		.afterClosed()
		.pipe(takeUntil(this.ngUnsubscribe))
		.subscribe((remove) => {
			if (remove) {
				this.catalogService.removeCatalog(catalog);
				this.load();
			}
		});
	}
}
