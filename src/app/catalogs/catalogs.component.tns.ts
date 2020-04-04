import { Component, OnInit, OnDestroy, ViewContainerRef } from "@angular/core";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import { Page } from "tns-core-modules/ui/page";
import { Button } from "tns-core-modules/ui/button";
import { confirm } from "tns-core-modules/ui/dialogs";
import { Subject } from "rxjs";
import { takeUntil, toArray } from "rxjs/operators";
import { Menu } from "nativescript-menu";

import { ICatalog } from "@src/app/services/catalog.service.base";
import { CatalogService } from "@src/app/services/catalog.service";
import { CatalogFormComponent } from "@src/app/catalog-form/catalog-form.component";


@Component({
	selector: "app-catalogs",
	templateUrl: "./catalogs.component.html",
	styleUrls: ["./catalogs.component.scss"]
})
export class CatalogsComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;

	public catalogs: ICatalog[];

	constructor(
		private page: Page,
		private modalService: ModalDialogService,
		private vcRef: ViewContainerRef,
		private catalogService: CatalogService,
	) {
		this.page.actionBarHidden = true;
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
		const options: ModalDialogOptions = {
			viewContainerRef: this.vcRef,
			animated: true,
			cancelable: true,
			fullscreen: false,
			stretched: false,
			context: { catalog },
		};

		this.modalService.showModal(CatalogFormComponent, options)
			.then((cat: ICatalog) => {
				if (cat) {
					this.catalogService.setCatalog(cat);
					this.load();
				}
			});
	}

	public openMenu(catalog: ICatalog, button: Button) {
		const actions = [
			{ id: "edit", title: "Edit" },
			{ id: "delete", title: "Remove" },
		];

		Menu.popup({
			view: button,
			actions,
		})
		.then((action) => {
			switch (action.id) {
				case "edit":
					this.edit(catalog);
					break;
				case "delete":
					confirm({
						title: "Remove Catalog",
						message: "This will permanently remove the catalog.\nBooks downloaded from this catalog will not be affected.",
						cancelable: true,
						cancelButtonText: "Cancel",
						okButtonText: "Remove",
					})
					.then((remove) => {
						if (remove) {
							this.catalogService.removeCatalog(catalog);
							this.load();
						}
					});
			}
		});
	}
}
