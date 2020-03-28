import { Observable, Subject } from "rxjs";
import {} from "rxjs/operators";


export interface IBookBase {
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
	private bookStream: Subject<IBookBase>;
	public books: Observable<IBookBase>;

	constructor(
		protected getAllKeys: () => string[],
		protected setItem: (key: string, value: string) => void,
		protected getItem: (key: string) => string,
		protected delItem: (key: string) => void,
		protected exists: (path: string) => boolean,
		protected remove: (path: string) => void,
	) {
		this.bookStream = new Subject<IBookBase>();
		this.books = this.bookStream.asObservable();
	}

	public getBook(id: string): IBookBase {
		const bookStr = this.getItem(id);
		return bookStr && JSON.parse(bookStr);
	}

	public setBook(book: IBookBase): void {
		this.setItem(book.id, JSON.stringify(book));
	}

	public removeBook(book: IBookBase): void {
		this.delItem(book.id);
	}

	public deleteBook(book: IBookBase): void {
		this.delItem(book.id);
		this.remove(book.path);
	}

	public getAllBooks(): void {
		for (const key of this.getAllKeys()) {
			if (key.startsWith("BOOK")) {
				const book: IBookBase = JSON.parse(this.getItem(key));
				if (this.exists(book.path)) {
					this.bookStream.next(book);
				}
			}
		}
		this.bookStream.complete();
		this.bookStream = new Subject<IBookBase>();
		this.books = this.bookStream.asObservable();
	}
}
