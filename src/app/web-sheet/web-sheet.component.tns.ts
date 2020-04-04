import { Component, OnInit } from "@angular/core";
import { BottomSheetParams, BottomSheetService, BottomSheetOptions } from "nativescript-material-bottomsheet/angular";

import { WebResultsComponent } from "@src/app/web-results/web-results.component";


@Component({
	selector: "app-web-sheet",
	templateUrl: "./web-sheet.component.html",
	styleUrls: ["./web-sheet.component.scss"],
})
export class WebSheetComponent implements OnInit {

	constructor(
		private params: BottomSheetParams,
		private sheets: BottomSheetService,
	) { }

	public ngOnInit() { }

	public onTap(provider: string) {
		setTimeout(() => {
			const options: BottomSheetOptions = {
				viewContainerRef: this.params.context.vcRef,
				animated: true,
				dismissOnBackgroundTap: true,
				dismissOnDraggingDownSheet: false,
				context: { provider, query: this.params.context.selection, lang: this.params.context.lang },
			};
			this.sheets.show(WebResultsComponent, options);
		}, 50);
		this.params.closeCallback();
	}
}
