import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatIconRegistry } from "@angular/material/icon";
import { remote } from "electron";
import * as path from "path";
import * as fs from "fs";

import { SettingsService } from "@src/app/services/settings.service";


const argv = remote.process.argv;


@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
	public title = "hedwigg";

	constructor(
		private router: Router,
		private iconRegistry: MatIconRegistry,
		private settings: SettingsService,
	) {
		this.iconRegistry.setDefaultFontSetClass("mdi");

		if (this.settings.prefs.appTheme === "Dark") {
			document.body.classList.add("hedwigg-dark-theme");
		}
	}

	public ngOnInit() {
		for (const arg of argv) {
			// tslint:disable-next-line:newline-per-chained-call
			if (arg.toLowerCase().endsWith("epub") || arg.toLowerCase().endsWith("pdf")) {
				const filepath = path.resolve(arg);
				if (fs.existsSync(filepath)) {
					this.router.navigate(["/reader"], { queryParams: { path: filepath } });
					break;
				}
			}
		}
	}
}
