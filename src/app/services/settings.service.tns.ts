import { Injectable } from "@angular/core";
import * as settings from "tns-core-modules/application-settings";
import { Theme } from "@nativescript/theme";

import { Settings } from "@src/app/services/settings.service.base";


@Injectable({
	providedIn: "root"
})
export class SettingsService extends Settings {

	constructor() {
		super(settings.getString, settings.setString);
		if (this.prefs.appTheme !== "Auto") {
			Theme.setMode(Theme[this.prefs.appTheme]);
		}
	}

	public save(): void {
		super.save();
		const mode = this.prefs.appTheme === "Auto" ? Theme.getMode() : Theme[this.prefs.appTheme];
		Theme.setMode(mode);
	}
}
