import { Component } from "@angular/core";
import { action, ActionOptions } from "tns-core-modules/ui/dialogs";

import { THEMES, LANGUAGES } from "@src/app/services/settings.service.base";
import { SettingsService } from "@src/app/services/settings.service";

@Component({
	selector: "app-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
	public themes = Object.entries(THEMES);
	public fontSize: number;
	public languages: string[] = LANGUAGES.map((lang) => lang.name);
	public language: string;

	constructor(public settings: SettingsService) {
		this.fontSize = parseInt(this.settings.prefs.fontSize.slice(0, this.settings.prefs.fontSize.length - 1), 10);
		this.language = this.settings.prefs.webLang.name;
	}

	public setFlow(flow: "paginated" | "spread" | "scrolled") {
		this.settings.prefs.flow = flow;
		this.settings.save();
	}

	public setTheme(theme: "Default" | "Soft" | "Tan" | "Dark" | "Inverted") {
		this.settings.prefs.theme = theme;
		this.settings.save();
	}

	public setFontSize(size: number) {
		this.fontSize = size;
		this.settings.prefs.fontSize = `${size}%`;
		this.settings.save();
	}

	public selectLang() {
		const options: ActionOptions = {
			title: "Select Language",
			message: "This will be used for web lookups",
			cancelable: true,
			actions: this.languages,
		};

		action(options)
			.then((langName) => {
				const lang = LANGUAGES.find((l) => l.name === langName);
				if (lang) {
					this.language = lang.name;
					this.settings.prefs.webLang = lang;
					this.settings.save();
				}
			});
	}

	public setAppTheme(mode: "Auto" | "Light" | "Dark") {
		this.settings.prefs.appTheme = mode;
		this.settings.save();
	}
}
