import { Component, AfterViewInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";
import * as fs from "tns-core-modules/file-system";
import { Page } from "tns-core-modules/ui/page";
import { WebView } from "tns-core-modules/ui/web-view";
import { SwipeGestureEventData, SwipeDirection } from "tns-core-modules/ui/gestures";
import { WebViewInterface } from "nativescript-webview-interface";
import { Mediafilepicker, FilePickerOptions } from "nativescript-mediafilepicker";


@Component({
	selector: "app-reader",
	templateUrl: "./reader.component.html",
	styleUrls: ["./reader.component.scss"]
})
export class ReaderComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
	@ViewChild("wv", { static: false }) private wv: ElementRef<WebView>;
	private wvInterface: WebViewInterface;
	private filePicker: Mediafilepicker;

	public fullscreen = true;
	public bookPath: string;

	constructor(
		private page: Page,
		private cdRef: ChangeDetectorRef,
	) {
		this.filePicker = new Mediafilepicker();
	}

	public async ngAfterViewInit() {
		const webView = this.wv.nativeElement;
		this.fullscreenEnable();

		// Yay possibly infinite loops :'(
		while (platform.isAndroid && !webView.android) {
			await new Promise<void>((resolve) => setTimeout(resolve, 50));
		}

		if (webView.android) {
			const settings = webView.android.getSettings();
			settings.setAllowUniversalAccessFromFileURLs(true);
			settings.setAllowFileAccessFromFileURLs(true);
			settings.setDisplayZoomControls(false);
		}

		this.wvInterface = new WebViewInterface(webView, fs.path.join(fs.knownFolders.currentApp().path, "app/webview/reader.html"));
		this.wvInterface.on("debug", (data) => console.log("DEBUG", data));
		this.wv.nativeElement.on(WebView.loadFinishedEvent, () => this.wvInterface.emit("FILEPATH", this.bookPath));
	}

	public ngAfterViewChecked() {
	}

	public ngOnDestroy() {
		if (this.wvInterface) {
			this.wvInterface.destroy();
		}
		this.wvInterface = null;
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
			this.bookPath = files[0].file;
			this.wv.nativeElement.reload();
		});
	}

	public onSwipe(data: SwipeGestureEventData) {
		switch (data.direction) {
			case SwipeDirection.left:
				this.wvInterface.emit("PAGE", "NEXT");
				break;
			case SwipeDirection.right:
				this.wvInterface.emit("PAGE", "PREV");
				break;
			case SwipeDirection.down:
				this.fullscreenDisable();
				break;
			case SwipeDirection.up:
				this.fullscreenEnable();
		}
	}

	private fullscreenEnable() {
		const View = global.android.view.View;
		const window = app.android.startActivity.getWindow();
		const decorView = window.getDecorView();
		decorView.setSystemUiVisibility(
			View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
			| View.SYSTEM_UI_FLAG_FULLSCREEN
			| View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
		);
		this.fullscreen = true;
		this.page.actionBarHidden = true;
		if (this.wv && this.wv.nativeElement) {
			this.wv.nativeElement.reload();
		}
	}

	private fullscreenDisable() {
		const View = global.android.view.View;
		const window = app.android.startActivity.getWindow();
		const decorView = window.getDecorView();
		decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
		this.fullscreen = false;
		this.page.actionBarHidden = false;
		if (this.wv && this.wv.nativeElement) {
			this.wv.nativeElement.reload();
		}
	}
}
