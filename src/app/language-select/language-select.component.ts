import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";


@Component({
	selector: "app-language-select",
	templateUrl: "./language-select.component.html",
	styleUrls: ["./language-select.component.scss"]
})
export class LanguageSelectComponent {

	constructor(
		public dialogRef: MatDialogRef<LanguageSelectComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) { }
}
