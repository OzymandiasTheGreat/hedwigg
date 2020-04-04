import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { takeUntil, toArray } from "rxjs/operators";
import { remote } from "electron";

import { BookService, IBook } from "@src/app/services/book.service";
import { WarningDialogComponent } from "@src/app/warning-dialog/warning-dialog.component";


const { dialog } = remote;


@Component({
	selector: "app-library",
	templateUrl: "./library.component.html",
	styleUrls: ["./library.component.scss"]
})
export class LibraryComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;

	public books: IBook[] = [];

	constructor(
		private zone: NgZone,
		private router: Router,
		private matDialog: MatDialog,
		private bookService: BookService,
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
		this.bookService.books.pipe(
			toArray(),
			takeUntil(this.ngUnsubscribe),
		)
		.subscribe((books) => {
			this.books = books.sort((a, b) => {
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
			});
		});
		this.bookService.getAllBooks();
	}

	public star(book: IBook) {
		book.starred = !book.starred;
		this.bookService.setBook(book);
	}

	public toggleFinished(book: IBook) {
		book.finished = !book.finished;
		this.bookService.setBook(book);
	}

	public remove(book: IBook) {
		this.bookService.removeBook(book);
		this.books.splice(this.books.findIndex((b) => b.id === book.id), 1);
	}

	public unlink(book: IBook) {
		this.bookService.deleteBook(book);
		this.books.splice(this.books.findIndex((b) => b.id === book.id), 1);
	}

	public menuRemove(book: IBook) {
		this.matDialog.open(WarningDialogComponent, {
			data: {
				title: "Remove Book from Library",
				content: "This will remove the Book from Library, but it will remain on disk.\nYou can add it again later.",
				action: "Remove",
			},
		})
		.afterClosed()
		.pipe(takeUntil(this.ngUnsubscribe))
		.subscribe((remove) => {
			if (remove) {
				this.remove(book);
			}
		});
	}

	public menuUnlink(book: IBook) {
		this.matDialog.open(WarningDialogComponent, {
			data: {
				title: "Delete Book from disk",
				content: "This will delete the book from disk and remove it from Library.\nYou will have to download it again.",
				action: "Delete",
			},
		})
		.afterClosed()
		.pipe(takeUntil(this.ngUnsubscribe))
		.subscribe((unlink) => {
			if (unlink) {
				this.unlink(book);
			}
		});
	}

	public openBook() {
		dialog.showOpenDialog(
			remote.getCurrentWindow(),
			{
				title: "Open Book",
				properties: ["openFile"],
				filters: [
					{ name: "All Books", extensions: ["pdf", "epub"] },
					{ name: "Portable Document Format (PDF)", extensions: ["pdf"] },
					{ name: "Electronic Publication (ePub)", extensions: ["epub"] },
				],
			},
		)
		.then((result) => {
			if (!result.canceled) {
				this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path: result.filePaths[0] } }));
			}
		});
	}
}
