import { Observable, Subject } from "rxjs";


export interface ICatalog {
	id: string | null;
	name: string;
	url: string;
	username: string;
	password: string;
}


export class CatalogServiceBase {
	private catalogStream: Subject<ICatalog>;
	public catalogs: Observable<ICatalog>;

	constructor(
		protected getAllKeys: () => string[],
		protected setItem: (key: string, value: string) => void,
		protected getItem: (key: string) => string,
		protected delItem: (key: string) => void,
	) {
		this.catalogStream = new Subject<ICatalog>();
		this.catalogs = this.catalogStream.asObservable();
	}

	public genKey(name: string): string {
		return `CATALOG(${name}::${Date.now()})`;
	}

	public getAllCatalogs(): void {
		for (const key of this.getAllKeys()) {
			if (key.startsWith("CATALOG")) {
				const catalog: ICatalog = JSON.parse(this.getItem(key));
				this.catalogStream.next(catalog);
			}
		}
		this.catalogStream.complete();
		this.catalogStream = new Subject<ICatalog>();
		this.catalogs = this.catalogStream.asObservable();
	}

	public getCatalog(id: string): ICatalog {
		const catalogStr = this.getItem(id);
		return catalogStr && JSON.parse(catalogStr);
	}

	public setCatalog(catalog: ICatalog): void {
		this.setItem(catalog.id, JSON.stringify(catalog));
	}

	public removeCatalog(catalog: ICatalog): void {
		this.delItem(catalog.id);
	}
}
