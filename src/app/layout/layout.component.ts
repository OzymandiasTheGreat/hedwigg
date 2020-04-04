import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { takeUntil } from "rxjs/operators";

import { Layout } from "@src/app/layout/layout.component.base";


@Component({
	selector: "app-layout",
	templateUrl: "./layout.component.html",
	styleUrls: ["./layout.component.scss"]
})
export class LayoutComponent extends Layout implements OnInit {
	public historyStack = 1;

	constructor(router: Router) {
		super(router);
	}

	public ngOnInit() {
		super.ngOnInit();
		this.router.events.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((event) => {
				if (event instanceof NavigationEnd) {
					this.historyStack = window.history.length;
				}
			});
	}

	public goBack() {
		window.history.back();
	}
}
