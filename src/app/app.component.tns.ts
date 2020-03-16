import { Component } from "@angular/core";
import { Theme } from "@nativescript/theme";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
})

export class AppComponent {
	constructor() {
		Theme.setMode(Theme.Light);
	}
}
