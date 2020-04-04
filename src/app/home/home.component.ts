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
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;

	public starred: IBook[] = [];
	public recent: IBook[] = [];
	public finished: IBook[] = [];

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
			const sorted = books.sort((a, b) => a.openedAt - b.openedAt);
			this.starred = sorted.filter((book) => book.starred);
			this.recent = sorted.filter((book) => !book.finished);
			this.finished = sorted.filter((book) => book.finished);
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
