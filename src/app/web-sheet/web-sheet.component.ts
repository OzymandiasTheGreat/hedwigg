import { Component, Inject } from "@angular/core";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet } from "@angular/material/bottom-sheet";

import { WebResultsComponent } from "@src/app/web-results/web-results.component";


@Component({
	selector: "app-web-sheet",
	templateUrl: "./web-sheet.component.html",
	styleUrls: ["./web-sheet.component.scss"],
})
export class WebSheetComponent {

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
		private sheet: MatBottomSheet,
	) { }

	public onTap(provider: string) {
		setTimeout(() => {
			this.sheet.open(WebResultsComponent, { data: {
				provider,
				query: this.data.selection,
				lang: this.data.lang,
			} });
		}, 50);
	}
}
