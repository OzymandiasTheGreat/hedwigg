import { Component } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

import { Layout } from "@src/app/layout/layout.component.base";


@Component({
	selector: "app-layout",
	templateUrl: "./layout.component.html",
	styleUrls: ["./layout.component.scss"]
})
export class LayoutComponent extends Layout {
	constructor(router: RouterExtensions) {
		super(router.router);
	}
}
