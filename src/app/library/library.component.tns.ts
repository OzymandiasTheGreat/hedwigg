import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Page } from "tns-core-modules/ui/page";
import { Button } from "tns-core-modules/ui/button";
import { confirm } from "tns-core-modules/ui/dialogs";
import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import { Subject, fromEvent } from "rxjs";
import { takeUntil, toArray } from "rxjs/operators";
import { Mediafilepicker, FilePickerOptions } from "nativescript-mediafilepicker";
import { Menu } from "nativescript-menu";

import { IBookBase } from "@src/app/services/book.service.base";
import { BookService } from "@src/app/services/book.service";


@Component({
	selector: "app-library",
	templateUrl: "./library.component.html",
	styleUrls: ["./library.component.scss"]
})
export class LibraryComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;
	private filePicker: Mediafilepicker;

	public columns: number;
	public books: IBookBase[] = [];

	constructor(
		private router: RouterExtensions,
		private zone: NgZone,
		private cdRef: ChangeDetectorRef,
		private page: Page,
		private bookService: BookService,
	) {
		this.ngUnsubscribe = new Subject<void>();
		this.filePicker = new Mediafilepicker();
	}

	public ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}

	public ngOnInit() {
		this.page.on(Page.loadedEvent, (data) => this.load());
		this.columns = Math.floor(platform.screen.mainScreen.widthDIPs / 192);
		fromEvent(app, app.orientationChangedEvent)
			.pipe(
				takeUntil(this.ngUnsubscribe),
			)
			.subscribe((data: app.OrientationChangedEventData) => {
				setTimeout(() => {
					this.columns = Math.floor(platform.screen.mainScreen.widthDIPs / 192);
					this.cdRef.detectChanges();
				}, 100);
			});
	}

	public load() {
		this.bookService.books.pipe(
			toArray(),
			takeUntil(this.ngUnsubscribe),
		)
		.subscribe((books) => this.books = books.sort((a, b) => {
			if (a.title < b.title) {
				return -1;
			}
			if (a.title > b.title) {
				return 1;
			}
			if (a.author < b.author) {
				return -1;
			}
			if (a.author > b.author) {
				return 1;
			}
			return 0;
		}));
		this.bookService.getAllBooks();
	}

	public star(book: IBookBase) {
		book.starred = !book.starred;
		this.bookService.setBook(book);
	}

	public toggleFinished(book: IBookBase) {
		book.finished = !book.finished;
		this.bookService.setBook(book);
	}

	public remove(book: IBookBase) {
		this.bookService.removeBook(book);
		this.books.splice(this.books.findIndex((b) => b.id === book.id), 1);
	}

	public unlink(book: IBookBase) {
		this.bookService.deleteBook(book);
		this.books.splice(this.books.findIndex((b) => b.id === book.id), 1);
	}

	public openMenu(book: IBookBase, button: Button) {
		const actions = [
			{ id: "finished", title: book.finished ? "Mark as Reading" : "Mark as Finished" },
			{ id: "remove", title: "Remove from Library" },
			{ id: "delete", title: "Delete from disk" },
		];
		Menu.popup({
			view: button,
			actions,
		})
		.then((action) => {
			switch (action.id) {
				case "finished":
					this.toggleFinished(book);
					break;
				case "remove":
					confirm({
						title: "Remove Book from Library",
						message: "This will remove the Book from Library, but it will remain on disk.\nYou can add it again later.",
						okButtonText: "Remove",
						cancelable: true,
					})
					.then((remove) => {
						if (remove) {
							this.remove(book);
						}
					});
					break;
				case "delete":
					confirm({
						title: "Delete Book from disk",
						message: "This will delete the book from disk and remove it from Library.\nYou will have to download it again.",
						okButtonText: "Delete",
						cancelable: true,
					})
					.then((unlink) => {
						if (unlink) {
							this.unlink(book);
						}
					});
			}
		});
	}

	public openBook() {
		const options: FilePickerOptions = {
			android: {
				extensions: ["epub", "pdf"],
				maxNumberFiles: 1,
			},
		};
		this.filePicker.openFilePicker(options);

		this.filePicker.on("getFiles", (data) => {
			const files = data.object.get("results");
			this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path: files[0].file } }));
		});
	}
}
