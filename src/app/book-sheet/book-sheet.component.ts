import { Component, OnInit, NgZone, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
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
	public downloadLinks: Array<{ link: string, type: "Epub" | "PDF" }>;
	public downloadSample: boolean;
	public downloading = false;

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) private data: any,
		private dialogRef: MatBottomSheetRef,
		private zone: NgZone,
		private router: Router,
		private downloader: DownloaderService,
		private feedService: FeedService,
	) {
		this.book = data;

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
		this.downloadLinks = this.downloadLinks.filter((link) => link.type !== null);
	}

	public getBookAuthors(book: Entry) {
		// tslint:disable-next-line:newline-per-chained-call
		return (<Array<Entry["authors"]>> <unknown> book.authors).map((a) => a.name).join(", ");
	}

	public getBookCategories(book: Entry) {
		// tslint:disable-next-line:newline-per-chained-call
		return (<Array<Entry["categories"]>> <unknown> book.categories).map((c) => c.label).join(", ");
	}

	public getPublished(book: Entry) {
		return new Date(book.published).toLocaleDateString();
	}

	public download(link: string) {
		this.downloading = true;
		this.downloader.getFile(link, this.headers)
			.then((path) => {
				this.downloading = false;
				this.dialogRef.dismiss();
				this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path } }));
			});
	}
}
