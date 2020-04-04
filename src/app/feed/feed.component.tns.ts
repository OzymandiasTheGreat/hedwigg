import { Component, OnInit, NgZone, ViewContainerRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { Frame } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { NavigationButton } from "tns-core-modules/ui/action-bar";
import { RadListView, LoadOnDemandListViewEventData } from "nativescript-ui-listview";
import { BottomSheetService, BottomSheetOptions } from "nativescript-material-bottomsheet/angular";
import { Feed, Entry } from "opds-parser2";

import { ICatalog } from "@src/app/services/catalog.service.base";
import { CatalogService } from "@src/app/services/catalog.service";
import { FeedService } from "@src/app/services/feed.service";
import { BookSheetComponent } from "@src/app/book-sheet/book-sheet.component";
import { base64 } from "@src/app/functions/base64";


let feedType;


@Component({
	selector: "app-feed",
	templateUrl: "./feed.component.html",
	styleUrls: ["./feed.component.scss"]
})
export class FeedComponent implements OnInit {
	private prevRoute: string;
	private prevQuery: string[] = [];

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

	constructor(
		private route: ActivatedRoute,
		private router: RouterExtensions,
		private zone: NgZone,
		private page: Page,
		private vcRef: ViewContainerRef,
		private sheetService: BottomSheetService,
		private catalogService: CatalogService,
		private feedService: FeedService,
	) {
		this.prevRoute = this.router.router.url;

		const catalog = this.route.snapshot.paramMap.get("catalogId");
		this.catalog = this.catalogService.getCatalog(catalog);

		if (this.catalog.username && this.catalog.password) {
			const authStr = `${this.catalog.username}:${this.catalog.password}`;
			this.headers.set("Authorization", `Basic ${base64(authStr)}`);
		}

		const topPage = Frame.topmost().page;
		const prevTitle = topPage.actionBar.title;
		const prevButton = topPage.actionBar.navigationButton;
		const backButton = new NavigationButton();
		backButton.className = "mdi back-button";
		backButton.icon = "font://\u{F030D}";
		backButton.on("tap", () => {
			if (this.prevQuery.length > 0) {
				this.prevQuery.pop();
				this.zone.run(() => this.router.navigate([this.prevRoute], { queryParams: { feed: this.prevQuery.pop() } }));
			} else {
				this.zone.run(() => this.router.back());
			}
		});
		topPage.actionBar.navigationButton = backButton;
		this.page.on(Page.navigatingFromEvent, () => {
			topPage.actionBar.navigationButton = prevButton;
			topPage.actionBar.title = prevTitle;
		});

		this.route.queryParamMap.subscribe(async (queryParams) => {
			this.loading = true;
			this.url = queryParams.get("feed") || this.catalog.url;
			this.prevQuery.push(this.url);
			const feed = await this.feedService.getFeed(this.url, this.catalog.username, this.catalog.password);
			feedType = await feedService.getFeedType(feed);
			this.feed = feed;
			topPage.actionBar.title = this.feed.title;
			const nextLink = this.feed.links.find((l) => l["@"].rel.includes("next"));
			this.next = nextLink && nextLink["@"].href;
			this.loading = false;
		});
	}

	public ngOnInit() {
	}

	public templateSelector(item: Entry, index: number, items: Entry[]): "acquisition" | "navigation" {
		return feedType;
	}

	public getEntryThumb(entry: Entry): string {
		const image = entry.links.find((link) => link["@"].rel === "http://opds-spec.org/image");
		const thumb = entry.links.find((link) => link["@"].rel === "http://opds-spec.org/image/thumbnail");
		const imageLink = image && this.feedService.resolveURI(image["@"].href, this.catalog.url);
		const thumbLink = thumb && this.feedService.resolveURI(thumb["@"].href, this.catalog.url);
		imageLink.headers.forEach((v, k) => this.headers.set(k, v));
		thumbLink.headers.forEach((v, k) => this.headers.set(k, v));
		return imageLink.uri || thumbLink.uri || "";
	}

	public getEntryLink(entry: Entry): string {
		const feedTypes = [
			"application/atom+xml;profile=opds-catalog;kind=navigation",
			"application/atom+xml;profile=opds-catalog;kind=acquisition",
		];
		const fileTypes = [
			"application/epub+zip",
			"application/pdf",
		];
		const fileRels = [
			"http://opds-spec.org/acquisition",
		];
		for (const link of entry.links) {
			if (feedTypes.includes(link["@"].type)) {
				return this.feedService.resolveURI(link["@"].href, this.catalog.url).uri;
			}
		}
		return null;
	}

	public getEntryAuthors(entry: Entry): string {
		if (Array.isArray(entry.authors)) {
			// tslint:disable-next-line:newline-per-chained-call
			return (<Array<Entry["authors"]>> <unknown> entry.authors).map((a) => a.name).join(", ");
		}
		return entry.authors.name;
	}

	public async nextPage(data: LoadOnDemandListViewEventData) {
		const listView: RadListView = data.object;
		if (this.next) {
			this.loading = true;
			const feed = await this.feedService.getFeed(this.next, this.catalog.username, this.catalog.password);
			const nextLink = feed.links.find((l) => l["@"].rel.includes("next"));
			this.next = nextLink && nextLink["@"].href;
			for (const entry of feed.entries) {
				this.feed.entries.push(entry);
			}
		}
		listView.notifyLoadOnDemandFinished(false);
		this.loading = false;
	}

	public openDetails(book: Entry) {
		const options: BottomSheetOptions = {
			viewContainerRef: this.vcRef,
			animated: true,
			dismissOnBackgroundTap: true,
			dismissOnDraggingDownSheet: false,
			context: { ...book, cover: this.getEntryThumb(book), root: this.catalog.url, headers: this.headers },
		};
		this.sheetService.show(BookSheetComponent, options);
	}
}
