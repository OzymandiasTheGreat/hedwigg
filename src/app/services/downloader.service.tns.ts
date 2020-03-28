import { Injectable } from "@angular/core";
import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import { Downloader } from "nativescript-downloader";


@Injectable({
	providedIn: "root"
})
export class DownloaderService {
	private downloader: Downloader;
	public booksDir: string;

	constructor() {
		Downloader.init();
		this.downloader = new Downloader();
		if (platform.isAndroid) {
			// tslint:disable-next-line:newline-per-chained-call
			this.booksDir = app.android.context.getExternalMediaDirs()[0].getAbsolutePath();
		}
	}

	public getFile(uri: string, headers: any): Promise<string | void> {
		const download = this.downloader.createDownload({
			url: uri,
			path: this.booksDir,
			headers,
		});

		return this.downloader.start(download)
			.then((data) => data.path)
			.catch((err) => console.log(err.message));
	}
}
