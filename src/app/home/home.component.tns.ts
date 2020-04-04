import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Page } from "tns-core-modules/ui/page";
import { Button } from "tns-core-modules/ui/button";
import { confirm } from "tns-core-modules/ui/dialogs";
import { Subject } from "rxjs";
import { takeUntil, toArray } from "rxjs/operators";
import { Mediafilepicker, FilePickerOptions } from "nativescript-mediafilepicker";
import { Menu } from "nativescript-menu";

import { BookService, IBook } from "@src/app/services/book.service";


@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;
	private filePicker: Mediafilepicker;

	public starred: IBook[] = [];
	public recent: IBook[] = [];
	public finished: IBook[] = [];

	constructor(
		private router: RouterExtensions,
		private zone: NgZone,
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
	}

	public load() {
		this.bookService.books.pipe(
			toArray(),
			takeUntil(this.ngUnsubscribe),
		)
		.subscribe((books) => {
			const sorted = books.sort((a, b) => a.openedAt - b.openedAt);
			this.starred = sorted.filter((book) => book.starred);
			// tslint:disable-next-line:newline-per-chained-call
			this.recent = sorted.filter((book) => !book.finished).slice(0, 9);
			// tslint:disable-next-line:newline-per-chained-call
			this.finished = sorted.filter((book) => book.finished).slice(0, 9);
		});
		this.bookService.getAllBooks();
	}

	public star(book: IBook) {
		book.starred = !book.starred;
		this.bookService.setBook(book);
		if (book.starred) {
			this.starred.unshift(book);
		} else {
			this.starred.splice(this.starred.findIndex((b) => b.id === book.id), 1);
		}
	}

	public markFinished(book: IBook) {
		book.finished = true;
		this.bookService.setBook(book);
		this.recent.splice(this.recent.findIndex((b) => b.id === book.id), 1);
		this.finished.unshift(book);
	}

	public unmarkFinished(book: IBook) {
		book.finished = false;
		this.bookService.setBook(book);
		this.finished.splice(this.finished.findIndex((b) => b.id === book.id), 1);
		this.recent.unshift(book);
	}

	public remove(book: IBook) {
		this.bookService.removeBook(book);
		this.recent.splice(this.recent.findIndex((b) => b.id === book.id), 1);
		this.starred.splice(this.starred.findIndex((b) => b.id === book.id), 1);
		this.finished.splice(this.finished.findIndex((b) => b.id === book.id), 1);
	}

	public unlink(book: IBook) {
		this.bookService.deleteBook(book);
		this.recent.splice(this.recent.findIndex((b) => b.id === book.id), 1);
		this.starred.splice(this.starred.findIndex((b) => b.id === book.id), 1);
		this.finished.splice(this.finished.findIndex((b) => b.id === book.id), 1);
	}

	public openMenu(book: IBook, button: Button, finished: boolean) {
		const actions = [
			{ id: "finished", title: finished ? "Mark as Finished" : "Mark as Reading" },
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
					if (finished) {
						this.markFinished(book);
					} else {
						this.unmarkFinished(book);
					}
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
