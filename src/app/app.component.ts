import { Component } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";

import { SettingsService } from "@src/app/services/settings.service";


@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent {
	public title = "hedwigg";

	constructor(
		private iconRegistry: MatIconRegistry,
		private settings: SettingsService,
	) {
		this.iconRegistry.setDefaultFontSetClass("mdi");

		if (this.settings.prefs.appTheme === "Dark") {
			document.body.classList.add("hedwigg-dark-theme");
		}
	}
}
