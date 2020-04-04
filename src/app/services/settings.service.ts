import { Injectable } from "@angular/core";

import { Settings } from "@src/app/services/settings.service.base";


@Injectable({
	providedIn: "root"
})
export class SettingsService extends Settings {

	constructor() {
		super(
			window.localStorage.getItem.bind(window.localStorage),
			window.localStorage.setItem.bind(window.localStorage),
		);
	}

	public save() {
		super.save();
		if (this.prefs.appTheme === "Dark") {
			document.body.classList.add("hedwigg-dark-theme");
		} else {
			document.body.classList.remove("hedwigg-dark-theme");
		}
	}
}
