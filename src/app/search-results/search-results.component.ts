import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";


@Component({
	selector: "app-search-results",
	templateUrl: "./search-results.component.html",
	styleUrls: ["./search-results.component.scss"],
})
export class SearchResultsComponent {

	constructor(
		public dialogRef: MatDialogRef<SearchResultsComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) { }
}
