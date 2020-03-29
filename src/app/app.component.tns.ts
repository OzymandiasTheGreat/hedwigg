import { Component, OnInit, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { android } from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import * as fs from "tns-core-modules/file-system";
import { handleOpenURL, AppURL } from "nativescript-urlhandler";

import { DownloaderService } from "@src/app/services/downloader.service";


@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
	constructor(
		private zone: NgZone,
		private router: RouterExtensions,
		private downloader: DownloaderService,
	) { }

	public ngOnInit() {
		handleOpenURL((url: AppURL) => {
			let uri = url.toString();
			// tslint:disable-next-line:newline-per-chained-call
			const scheme = uri.split(":").shift();
			switch (scheme) {
				case "content":
					if (platform.isAndroid) {
						uri = this.makeLocalCopy(uri);
					}
				case "file":
					this.zone.run(() => this.router.navigate(["/reader"], { queryParams: { path: uri } }));
			}
		});
	}

	private makeLocalCopy(url: string) {
		const uri = global.android.net.Uri.parse(url);
		const content = android.context.getContentResolver();
		const id = global.android.provider.DocumentsContract.getDocumentId(uri);
		let fileName: string = id.split(":")[1] || id;
		if (!fileName.endsWith(".pdf") && !fileName.endsWith(".epub")) {
			const type = content.getType(uri);
			fileName = `${fileName}.${type === "application/pdf" ? "pdf" : "epub"}`;
		}
		const dest = fs.File.fromPath(fs.path.join(this.downloader.booksDir, fileName));
		const iStream = content.openInputStream(uri);
		const buffer = new (<any> Array).create("byte", 4096);
		const oStream = new (<any> global).java.io.ByteArrayOutputStream();
		let size = iStream.read(buffer);
		while (size !== -1) {
			oStream.write(buffer, 0, size);
			size = iStream.read(buffer);
		}
		dest.writeSync(oStream.toByteArray());
		return dest.path;
	}
}
