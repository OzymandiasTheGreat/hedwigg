import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ViewContainerRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import * as fs from "tns-core-modules/file-system";
import { Page } from "tns-core-modules/ui/page";
import { WebView } from "tns-core-modules/ui/web-view";
import { GestureEventData, SwipeGestureEventData, SwipeDirection, TouchGestureEventData, TouchAction } from "tns-core-modules/ui/gestures";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import * as utils from "tns-core-modules/utils/utils";
import { WebViewInterface } from "nativescript-webview-interface";
import { BottomSheetService, BottomSheetOptions } from "nativescript-material-bottomsheet/angular";
import { NavItem } from "epubjs/types/navigation";

import { THEMES } from "@src/app/services/settings.service.base";
import { SettingsService } from "@src/app/services/settings.service";
import { BookService, IBook } from "@src/app/services/book.service";
import { SearchResultsComponent } from "@src/app/search-results/search-results.component";
import { WebSheetComponent } from "@src/app/web-sheet/web-sheet.component";


export class HedwiggWebViewClient extends global.android.webkit.WebViewClient {

	constructor() {
		super();
		return global.__native(this);
	}

	public shouldOverrideUrlLoading(view, request) {
		// const url = request &&  request.getUrl();
		// // tslint:disable-next-line:newline-per-chained-call
		// if (url !== null && url.toString().startsWith("http")) {
		// 	utils.openUrl(url.toString());
		// 	return true;
		// }
		console.log(request);
		return false;
	}
}


@Component({
	selector: "app-reader",
	templateUrl: "./reader.component.html",
	styleUrls: ["./reader.component.scss"]
})
export class ReaderComponent implements AfterViewInit, OnDestroy {
	@ViewChild("wv", { static: false }) private wv: ElementRef<WebView>;
	private wvInterface: WebViewInterface;
	private selectionTime: number;

	public fullscreen = true;
	public bookPath: string;
	public epub: boolean;
	public book: IBook;
	public chapter: { label: string, current: number, total: number } = { label: "-", current: 0, total: 0 };
	public pageSliderValue: number;
	public toc: NavItem[] = [];
	public bookmarked: boolean;
	public searching = false;
	public selection: { selected: boolean, selection: string | null } = { selected: false, selection: null };

	constructor(
		private route: ActivatedRoute,
		private cdRef: ChangeDetectorRef,
		private page: Page,
		private vcRef: ViewContainerRef,
		private settings: SettingsService,
		private bookService: BookService,
		private modalService: ModalDialogService,
		private sheetService: BottomSheetService,
	) {
		this.bookPath = this.route.snapshot.queryParamMap.get("path");

		// tslint:disable-next-line:newline-per-chained-call
		const ext = this.bookPath.split(".").pop();
		this.epub = ext.toLowerCase() === "epub";
	}

	public async ngAfterViewInit() {
		const webView = this.wv.nativeElement;

		// Handling fullscreening
		this.fullscreenEnable();
		this.page.once(Page.navigatingFromEvent, () => this.fullscreen && this.fullscreenDisable());

		// Yay possibly infinite loops :'(
		while (platform.isAndroid && !webView.android) {
			await new Promise<void>((resolve) => setTimeout(resolve, 50));
		}

		if (webView.android) {
			const settings = webView.android.getSettings();
			settings.setAllowUniversalAccessFromFileURLs(true);
			settings.setAllowFileAccessFromFileURLs(true);
			settings.setDisplayZoomControls(false);
		}

		this.wvInterface = new WebViewInterface(
			webView,
			fs.path.join(fs.knownFolders.currentApp().path, `app/webview/tns/reader.${this.epub ? "epub" : "pdf"}.tns.html`)
		);
		// And this somehow break WebViewInterface... FFS
		// webView.android.setWebViewClient(new HedwiggWebViewClient());

		this.wvInterface.on("BOOKID", (bookId) => {
			this.book = this.bookService.getBook(bookId);
			if (this.book) {
				this.wvInterface.emit("CFI", this.book.location);
			} else {
				this.wvInterface.emit("META", null);
			}
		});
		this.wvInterface.on("META", (bookMeta) => {
			this.book = bookMeta;
			this.bookService.setBook(bookMeta);
		});
		this.wvInterface.on("TOC", (toc: NavItem[]) => {
			this.toc = toc;
			this.cdRef.detectChanges();
		});
		this.wvInterface.on("CFI", (location: string) => {
			if (this.book) {
				this.book.location = location;
				this.bookService.setBook(this.book);

				this.bookmarked = !!this.book.bookmarks.find((b) => b.cfi === location);
				this.cdRef.detectChanges();
			}
		});
		this.wvInterface.on("CHAPTER", (chapter) => this.chapter = chapter);
		this.wvInterface.on("PERCENT", (percent) => {
			this.pageSliderValue = percent;
			this.cdRef.detectChanges();
		});

		this.wvInterface.on("SEARCH", ({ query, results }: { query: string, results: Array<{ excerpt: string, cfi: string }>}) => {
			const options: ModalDialogOptions = {
				viewContainerRef: this.vcRef,
				animated: true,
				context: { query, results },
				fullscreen: true,
			};
			this.modalService.showModal(SearchResultsComponent, options)
				.then((cfi) => {
					if (cfi) {
						if (typeof cfi === "string") {
							this.navigateTOC(cfi);
						} else {
							this.wvInterface.emit("SEARCHNAV", cfi);
						}
					}
				});
		});

		this.wvInterface.on("SELECTION", (selection) => {
			this.selection = selection;
			this.cdRef.detectChanges();
			if (this.selection.selected && !!this.selection.selection) {
				this.selectionTime = Date.now();
				this.showWebSheet();
			}
		});

		this.wvInterface.on("debug", (data) => console.log("DEBUG", data));
		if (platform.isAndroid) {
			webView.android.setBackgroundColor(global.android.graphics.Color.parseColor(
				THEMES[this.settings.prefs.theme]["html, body"]["background-color"]));
		}
		this.page.on(Page.navigatedToEvent, () => {
			if (platform.isAndroid) {
				webView.android.setBackgroundColor(global.android.graphics.Color.parseColor(
					THEMES[this.settings.prefs.theme]["html, body"]["background-color"]));
			}
			this.load();
			webView.reload();
		});
	}

	public ngOnDestroy() {
		if (this.wvInterface) {
			this.wvInterface.destroy();
		}
		this.wvInterface = null;
	}

	public load() {
		this.wv.nativeElement.once(WebView.loadFinishedEvent, () => {
			setTimeout(() => {
				this.wvInterface.emit("FILEPATH", {
					filePath: this.bookPath,
					flow: this.settings.prefs.flow !== "scrolled" ? "paginated" : "scrolled",
					spread: this.settings.prefs.flow === "spread" ? "auto" : "none",
					theme: this.settings.prefs.theme,
					fontSize: this.settings.prefs.fontSize,
				});
			}, 750);
		});
	}

	public TOCSelector(item: { key: string } & any, index: number, items: any): string {
		return item.key;
	}

	public navigateTOC(location: string) {
		this.wvInterface.emit("CFI", location);
	}

	public navigateOutline(dest: any) {
		this.wvInterface.emit("OUTLINE", dest);
	}

	public bookmark() {
		if (this.book && this.chapter) {
			const label = `${this.chapter.label.trim()} - ${this.chapter.current}/${this.chapter.total}`;
			if (this.bookmarked) {
				this.book.bookmarks.splice(this.book.bookmarks.findIndex((b) => b.label === label), 1);
				this.bookService.setBook(this.book);
				this.bookmarked = false;
			} else {
				this.book.bookmarks.push({ label, cfi: this.book.location });
				this.book.bookmarks = this.book.bookmarks.sort();
				this.bookService.setBook(this.book);
				this.bookmarked = true;
			}
		}
	}

	public search() {
		this.searching = true;
	}

	public onSearchSubmit(searchbar: SearchBar) {
		const query = searchbar.text;
		this.wvInterface.emit("SEARCH", query);
		searchbar.text = "";
		this.searching = false;
	}

	public onSearchClear() {
		this.searching = false;
	}

	public onSwipe(data: SwipeGestureEventData) {
		switch (data.direction) {
			case SwipeDirection.left:
				this.wvInterface.emit("PAGE", "LEFT");
				break;
			case SwipeDirection.right:
				this.wvInterface.emit("PAGE", "RIGHT");
				break;
			case SwipeDirection.down:
				this.wvInterface.emit("PAGE", "DOWN");
				break;
			case SwipeDirection.up:
				this.wvInterface.emit("PAGE", "UP");
		}
	}

	public onTap(data: GestureEventData) {
		if (!this.selection.selected) {
			if (this.fullscreen) {
				if (platform.isAndroid) {
					this.fullscreenDisable();
				}
			} else {
				if (platform.isAndroid) {
					this.fullscreenEnable();
				}
			}
		}
	}

	public onPageSliderValueChange(value: number) {
		this.pageSliderValue = value;
	}

	public onPageSliderTouch(data: TouchGestureEventData) {
		if ([TouchAction.up, TouchAction.cancel].includes(data.action)) {
			this.wvInterface.emit("PERCENT", this.pageSliderValue);
		}
	}

	private showWebSheet() {
		setTimeout(() => {
			if (Date.now() - this.selectionTime >= 750) {
				const options: BottomSheetOptions = {
					viewContainerRef: this.vcRef,
					animated: true,
					dismissOnBackgroundTap: true,
					dismissOnDraggingDownSheet: true,
					context: { ...this.selection, lang: this.book.language, vcRef: this.vcRef },
				};
				this.sheetService.show(WebSheetComponent, options);
			}
		}, 750);
	}

	private fullscreenEnable() {
		const View = global.android.view.View;
		const window = app.android.startActivity.getWindow();
		const decorView = window.getDecorView();
		decorView.setSystemUiVisibility(
			View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
			| View.SYSTEM_UI_FLAG_FULLSCREEN
			| View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
		);
		this.fullscreen = true;
		this.page.actionBarHidden = true;
	}

	private fullscreenDisable() {
		const View = global.android.view.View;
		const window = app.android.startActivity.getWindow();
		const decorView = window.getDecorView();
		decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
		this.fullscreen = false;
		this.page.actionBarHidden = false;
	}
}
