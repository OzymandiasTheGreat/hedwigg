import { Observable, Subject } from "rxjs";
import {} from "rxjs/operators";


export interface IBook {
	id: string;
	path: string;
	cover: string;
	title: string;
	author: string;
	language: string;
	location: string;
	finished: boolean;
	openedAt: number;
	starred: boolean;
	bookmarks: Array<{ label: string, cfi: string }>;
}


export class BookServiceBase {
	private bookStream: Subject<IBook>;
	public books: Observable<IBook>;

	constructor(
		protected getAllKeys: () => string[],
		protected setItem: (key: string, value: string) => void,
		protected getItem: (key: string) => string,
		protected delItem: (key: string) => void,
		protected exists: (path: string) => boolean,
		protected remove: (path: string) => void,
	) {
		this.bookStream = new Subject<IBook>();
		this.books = this.bookStream.asObservable();
	}

	public getBook(id: string): IBook {
		const bookStr = this.getItem(id);
		return bookStr && JSON.parse(bookStr);
	}

	public setBook(book: IBook): void {
		this.setItem(book.id, JSON.stringify(book));
	}

	public removeBook(book: IBook): void {
		this.delItem(book.id);
	}

	public deleteBook(book: IBook): void {
		this.delItem(book.id);
		this.remove(book.path);
	}

	public getAllBooks(): void {
		for (const key of this.getAllKeys()) {
			if (key.startsWith("BOOK")) {
				const book: IBook = JSON.parse(this.getItem(key));
				if (this.exists(book.path)) {
					this.bookStream.next(book);
				}
			}
		}
		this.bookStream.complete();
		this.bookStream = new Subject<IBook>();
		this.books = this.bookStream.asObservable();
	}
}
