import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { WebviewTag, remote } from "electron";
import * as url from "url";
import * as path from "path";
import { NavItem } from "epubjs/types/navigation";

import { THEMES } from "@src/app/services/settings.service.base";
import { SettingsService } from "@src/app/services/settings.service";
import { BookService, IBook } from "@src/app/services/book.service";
import { SearchResultsComponent } from "@src/app/search-results/search-results.component";
import { WebSheetComponent } from "@src/app/web-sheet/web-sheet.component";


const { app } = remote;


@Component({
	selector: "app-reader",
	templateUrl: "./reader.component.html",
	styleUrls: ["./reader.component.scss"]
})
export class ReaderComponent implements OnInit, AfterViewInit {
	@ViewChild("webview") private webview: ElementRef<WebviewTag>;
	private selectionTime: number;

	public fullscreen = true;
	public background: string;
	public bookPath: string;
	public epub: boolean;
	public book: IBook;
	public chapter: { label: string, current: number, total: number } = { label: "-", current: 0, total: 0 };
	public pageSliderValue: number;
	public toc: NavItem[] = [];
	public bookmarked: boolean;
	public searching = false;
	public selection: { selected: boolean, selection: string | null } = { selected: false, selection: null };
	public dirButtons: boolean;

	constructor(
		private route: ActivatedRoute,
		private cdRef: ChangeDetectorRef,
		private dialog: MatDialog,
		private sheet: MatBottomSheet,
		private settings: SettingsService,
		private bookService: BookService,
	) {
		this.background = THEMES[this.settings.prefs.theme]["html, body"]["background-color"];
		this.bookPath = this.route.snapshot.queryParamMap.get("path");

		// tslint:disable-next-line:newline-per-chained-call
		const ext = this.bookPath.split(".").pop();
		this.epub = ext.toLocaleLowerCase() === "epub";
		if (this.epub) {
			this.dirButtons = this.settings.prefs.flow !== "scrolled";
		} else {
			this.dirButtons = this.settings.prefs.flow === "paginated";
		}
	}

	public ngOnInit() { }

	public ngAfterViewInit() {
		const webview = this.webview.nativeElement;

		webview.src = url.format({
			pathname: path.join(app.getAppPath(), `src/app/webview/reader.${this.epub ? "epub" : "pdf"}.html`),
			protocol: "file:",
			slashes: true,
		});
		webview.addEventListener("ipc-message", (event) => {
			// console.log(event.channel, event.args);
			const payload = event.args[0];

			switch (event.channel) {
				case "BOOKID":
					this.book = this.bookService.getBook(payload);
					if (this.book) {
						webview.send("CFI", this.book.location);
					} else {
						webview.send("META", null);
					}
					break;
				case "META":
					this.book = payload;
					this.bookService.setBook(payload);
					break;
				case "TOC":
					this.toc = payload;
					this.cdRef.detectChanges();
					break;
				case "CFI":
					if (this.book) {
						this.book.location = payload;
						this.bookService.setBook(this.book);
						this.bookmarked = !!this.book.bookmarks.find((b) => b.cfi === payload);
						this.cdRef.detectChanges();
					}
					break;
				case "CHAPTER":
					this.chapter = payload;
					this.cdRef.detectChanges();
					break;
				case "PERCENT":
					this.pageSliderValue = payload;
					this.cdRef.detectChanges();
					break;
				case "SEARCH":
					this.dialog.open(SearchResultsComponent, {
						data: payload,
					})
					.afterClosed()
					.subscribe((cfi) => {
						if (typeof cfi === "string") {
							this.navigateTOC(cfi);
						} else {
							webview.send("SEARCHNAV", cfi);
						}
					});
					break;
				case "SELECTION":
					this.selection = payload;
					if (payload.selected && !!payload.selection) {
						this.selectionTime = Date.now();
						setTimeout(() => {
							if (Date.now() - this.selectionTime >= 750) {
								this.sheet.open(WebSheetComponent, { data: { ...payload, lang: this.book.language } });
							}
						}, 750);
					}
					break;
				case "FULLSCREEN":
					this.fullscreen = !this.fullscreen;
			}
		});
		webview.addEventListener("dom-ready", () => {
			// webview.openDevTools();

			webview.send("FILEPATH", {
				filePath: this.bookPath,
				flow: this.settings.prefs.flow !== "scrolled" ? "paginated" : "scrolled",
				spread: this.settings.prefs.flow === "spread" ? "auto" : "none",
				theme: this.settings.prefs.theme,
				fontSize: this.settings.prefs.fontSize,
			});
		});
	}

	public pageEvent(direction: string) {
		this.webview.nativeElement.send("PAGE", direction);
	}

	public pageSliderLabel(value: number): string {
		return (value / 10).toFixed(2);
	}

	public onPageSliderValueChange(value: number) {
		this.webview.nativeElement.send("PERCENT", value);
	}

	public navigateTOC(cfi: string) {
		this.webview.nativeElement.send("CFI", cfi);
	}

	public navigateOutline(dest: any) {
		this.webview.nativeElement.send("OUTLINE", dest);
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

	public onSearchSubmit(event: KeyboardEvent, searchbar: HTMLInputElement) {
		if (!event || event.key === "Enter") {
			const query = searchbar.value;
			this.webview.nativeElement.send("SEARCH", query);
			searchbar.value = "";
			this.searching = false;
		}
	}

	public onSearchClear(searchbar: HTMLInputElement) {
		searchbar.value = "";
		this.searching = false;
	}
}
