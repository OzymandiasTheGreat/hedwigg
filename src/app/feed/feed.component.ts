import { Component } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { IPageInfo } from "ngx-virtual-scroller";
import { Feed, Entry } from "opds-parser2";

import { ICatalog } from "@src/app/services/catalog.service.base";
import { CatalogService } from "@src/app/services/catalog.service";
import { FeedService } from "@src/app/services/feed.service";
import { BookSheetComponent } from "@src/app/book-sheet/book-sheet.component";
import { base64 } from "@src/app/functions/base64";


@Component({
	selector: "app-feed",
	templateUrl: "./feed.component.html",
	styleUrls: ["./feed.component.scss"]
})
export class FeedComponent {
	private catalog: ICatalog;
	private url: string | null;
	private next: string;

	public headers: Map<string, string> = new Map();
	public loading = true;
	public feed: Feed = {
		"@": [],
		id: null,
		title: null,
		author: { name: null, email: null, uri: null },
		updated: null,
		icon: null,
		links: [],
		entries: [],
	};
	public feedType: "acquisition" | "navigation";
	public images: any = {};

	constructor(
		private route: ActivatedRoute,
		private sanitizer: DomSanitizer,
		private sheetService: MatBottomSheet,
		private catalogService: CatalogService,
		private feedService: FeedService,
	) {
		const catalog = this.route.snapshot.paramMap.get("catalogId");
		this.catalog = this.catalogService.getCatalog(catalog);

		if (this.catalog.username && this.catalog.password) {
			const authStr = `${this.catalog.username}:${this.catalog.password}`;
			this.headers.set("Authorization", `Basic ${base64(authStr)}`);
		}

		this.route.queryParamMap.subscribe(async (queryParams) => {
			this.loading = true;
			this.url = queryParams.get("feed") || this.catalog.url;
			const feed = await this.feedService.getFeed(this.url, this.catalog.username, this.catalog.password);
			this.feedType = await this.feedService.getFeedType(feed);
			feed.entries.forEach((entry) => this.getEntryThumb(entry));
			this.feed = feed;
			const nextLink = this.feed.links.find((l) => l["@"].rel.includes("next"));
			this.next = nextLink && nextLink["@"].href;
			this.loading = false;
		});
	}

	public async getEntryThumb(entry: Entry): Promise<void> {
		const image = entry.links.find((link) => link["@"].rel === "http://opds-spec.org/image");
		const thumb = entry.links.find((link) => link["@"].rel === "http://opds-spec.org/image/thumbnail");
		const imageLink = image && this.feedService.resolveURI(image["@"].href, this.catalog.url);
		const thumbLink = thumb && this.feedService.resolveURI(thumb["@"].href, this.catalog.url);
		imageLink && imageLink.headers.forEach((v, k) => this.headers.set(k, v));
		thumbLink && thumbLink.headers.forEach((v, k) => this.headers.set(k, v));
		const uri = (imageLink && imageLink.uri) || (thumbLink && thumbLink.uri) || "";
		const headers = {};
		this.headers.forEach((v, k) => headers[k] = v);
		// tslint:disable-next-line:newline-per-chained-call
		const blob = await fetch(uri, { headers }).then((response) => response.blob());
		this.images[entry.id] = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
	}

	public getEntryLink(entry: Entry): string {
		const feedTypes = [
			"application/atom+xml;profile=opds-catalog;kind=navigation",
			"application/atom+xml;profile=opds-catalog;kind=acquisition",
		];
		for (const link of entry.links) {
			if (feedTypes.includes(link["@"].type)) {
				return this.feedService.resolveURI(link["@"].href, this.catalog.url).uri;
			}
		}
		return null;
	}

	public getEntryAuthors(entry: Entry): string {
		// tslint:disable-next-line:newline-per-chained-call
		return (<Array<Entry["authors"]>> <unknown> entry.authors).map((a) => a.name).join(", ");
	}

	public async nextPage(info: IPageInfo) {
		if (this.next && (info.maxScrollPosition - info.scrollEndPosition) < 350) {
			this.loading = true;
			const feed = await this.feedService.getFeed(this.next, this.catalog.username, this.catalog.password);
			const nextLink = feed.links.find((l) => l["@"].rel.includes("next"));
			this.next = nextLink && nextLink["@"].href;
			for (const entry of feed.entries) {
				this.getEntryThumb(entry);
				this.feed.entries.push(entry);
			}
		}
		this.loading = false;
	}

	public openDetails(book: Entry) {
		this.sheetService.open(BookSheetComponent, {
			data: {
				...book,
				cover: this.images[book.id],
				root: this.catalog.url,
				headers: this.headers,
			},
		});
	}
}
