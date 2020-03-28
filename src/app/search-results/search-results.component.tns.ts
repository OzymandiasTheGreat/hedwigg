import { Component } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";


@Component({
	selector: "app-search-results",
	templateUrl: "./search-results.component.html",
	styleUrls: ["./search-results.component.scss"],
})
export class SearchResultsComponent {
	public title: string;
	public results: [];

	constructor(
		private params: ModalDialogParams,
	) {}

	public onLoaded() {
		this.title = `"${this.params.context.query}" (${this.params.context.results.length})`;
		this.results = this.params.context.results;
	}

	public onSelect(cfi: string) {
		this.params.closeCallback(cfi);
	}
}
