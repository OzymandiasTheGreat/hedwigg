import { Component, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Button } from "tns-core-modules/ui/button";
import { BottomSheetParams } from "nativescript-material-bottomsheet/angular";
import { Menu } from "nativescript-menu";
import { Entry } from "opds-parser2";

import { DownloaderService } from "@src/app/services/downloader.service";
import { FeedService } from "@src/app/services/feed.service";


@Component({
	selector: "app-book-sheet",
	templateUrl: "./book-sheet.component.html",
	styleUrls: ["./book-sheet.component.scss"]
})
export class BookSheetComponent {
	private headers: any = {};
	public book: Entry & { cover: string, root: string, headers: Map<string, string> };
	public downloadLinks: Array<{ link: string, type: "Epub" | "PDF" | null }>;
	public downloadSample: boolean;
	public downloading = false;

	constructor(
		private params: BottomSheetParams,
		private zone: NgZone,
		private router: RouterExtensions,
		private downloader: DownloaderService,
		private feedService: FeedService,
	) {
		this.book = params.context;

		this.book.headers.forEach((v, k) => this.headers[k] = v);

		const fullLinks = this.book.links.filter((l) => l["@"].rel === "http://opds-spec.org/acquisition");
		const sampLinks = this.book.links.filter((l) => l["@"].rel === "http://opds-spec.org/acquisition/sample");
		if (fullLinks.length > 0) {
			this.downloadSample = false;
			this.downloadLinks = fullLinks.map((l) => {
				const { uri, headers } = this.feedService.resolveURI(l["@"].href, this.book.root);
				headers.forEach((v, k) => this.headers[k] = v);
				return {
					link: uri,
					type: l["@"].type === "application/epub+zip" ? "Epub" : l["@"].type === "application/pdf" ? "PDF" : null,
				};
			});
		} else {
			this.downloadSample = true;
			this.downloadLinks = sampLinks.map((l) => {
				const { uri, headers } = this.feedService.resolveURI(l["@"].href, this.book.root);
				headers.forEach((v, k) => this.headers[k] = v);
				return {
					link: uri,
					type: l["@"].type === "application/epub+zip" ? "Epub" : l["@"].type === "application/pdf" ? "PDF" : null,
				};
			});
		}
	}

	public getBookAuthors(book: Entry): string {
		if (Array.isArray(book.authors)) {
			// tslint:disable-next-line:newline-per-chained-call
			return (<Array<Entry["authors"]>> <unknown> book.authors).map((a) => a.name).join(", ");
		}
		return book.authors.name;
	}

	public getBookCategories(book: Entry): string {
		if (Array.isArray(book.categories)) {
			// tslint:disable-next-line:newline-per-chained-call
			return (<Array<Entry["categories"]>> <unknown> book.categories).map((c) => c.label).join(", ");
		}
		return book.categories.label;
	}

	public getPublished(book: Entry): string {
		return new Date(book.published).toLocaleDateString();
	}

	public download(button: Button) {
		if (this.downloadLinks.filter((dl) => ["Epub", "PDF"].includes(dl.type)).length > 1) {
			const actions = [];

			this.downloadLinks.forEach((dl) => {
				if (["Epub", "PDF"].includes(dl.type)) {
					actions.push({ title: dl.type, link: dl.link });
				}
			});
			Menu.popup({
				view: button,
				actions,
			})
			.then((action) => {
				this.zone.run(() => this.downloading = true);
				return this.downloader.getFile(action.link, this.headers);
			})
			.then((path) => {
				this.downloading = false;
				this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path } }));
				this.params.closeCallback();
			});
		} else {
			const link = this.downloadLinks.find((dl) => ["Epub", "PDF"].includes(dl.type));
			if (link) {
				this.downloading = true;
				this.downloader.getFile(link.link, this.headers)
					.then((path) => {
						this.downloading = false;
						this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path } }));
						this.params.closeCallback();
					});
			}
		}
	}
}
