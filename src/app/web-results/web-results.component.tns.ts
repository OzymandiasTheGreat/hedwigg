import { Component } from "@angular/core";
import * as platform from "tns-core-modules/platform";
import { SegmentedBarItem } from "tns-core-modules/ui/segmented-bar";
import { BottomSheetParams } from "nativescript-material-bottomsheet/angular";
import wtype from "wtf_wikipedia";
import wtf from "wtf_wikipedia/builds/wtf_wikipedia-client";
import translate from "translate";

import { LANGUAGES, ILanguage } from "@src/app/services/settings.service.base";
import { SettingsService } from "@src/app/services/settings.service";


declare const GTRANSLATE_API_KEY: string;


translate.engine = "google";
translate.key = GTRANSLATE_API_KEY;


@Component({
	selector: "app-web-results",
	templateUrl: "./web-results.component.html",
	styleUrls: ["./web-results.component.scss"],
})
export class WebResultsComponent {
	public languages: ILanguage[] = [];
	public loading = true;
	public content: string[] = [];
	public tabs: SegmentedBarItem[] = [];
	public blurb = "";
	public showTabs: boolean;

	constructor(
		private params: BottomSheetParams,
		private settings: SettingsService,
	) {
		let deviceLang = platform.device.language;
		if (deviceLang.includes("-")) {
			// tslint:disable-next-line:newline-per-chained-call
			deviceLang = deviceLang.split("-").shift();
		}
		const defaultLang = LANGUAGES.find((lang) => lang.code === deviceLang);
		const preferLang = this.settings.prefs.webLang;
		const bookLang = LANGUAGES.find((lang) => lang.code === this.params.context.lang);

		for (const lang of [preferLang, defaultLang, bookLang]) {
			if (lang && this.languages.findIndex((l) => l.code === lang.code) <= -1) {
				this.languages.push(lang);
			}
		}

		for (const lang of this.languages) {
			const item = new SegmentedBarItem();
			item.title = lang.name;
			this.tabs.push(item);
		}

		switch (this.params.context.provider) {
			case "wikipedia":
				this.wikipedia(this.params.context.query)
					.then(() => {
						this.loading = false;
						this.showTabs = true;
					});
				break;
			case "wiktionary":
				this.wiktionary(this.params.context.query)
					.then(() => {
						this.loading = false;
						this.showTabs = true;
					});
				break;
			case "gtranslate":
				this.gtranslate(this.params.context.query)
					.then(() => {
						this.loading = false;
						this.showTabs = false;
					});
		}
	}

	public onTabSelected(data) {
		this.blurb = this.content[data.value];
	}

	private async gtranslate(query): Promise<void> {
		let blurb = "";
		for (const lang of this.languages) {
			const translation = await translate(query, { to: lang.code });
			if (translation) {
				blurb += `${lang.name}:\n\t\t\t${translation}\n`;
			}
		}
		this.content = [blurb || "NOT FOUND"];
		this.blurb = this.content[0];
	}

	private async wiktionary(query: string): Promise<void> {
		const blurbs: string[] = [];
		for (const lang of this.languages) {
			const definition = await wtf.fetch(query, { lang: lang.code, wiki: "wiktionary" })
				.then((doc: wtype.Document) => this.parseWiktionaryDoc(doc, lang.code));
			if (definition) {
				blurbs.push(`${definition}\n\n`);
			} else {
				blurbs.push("NOT FOUND");
			}
		}
		this.content = blurbs;
		this.blurb = this.content[0];
	}

	private parseWiktionaryDoc(doc: wtype.Document, lang: string): string | null {
		let sections = doc && doc.sections();
		let blurb = "";
		if (sections) {
			// tslint:disable-next-line:newline-per-chained-call
			sections = sections.filter((section) => section.templates().some((template: any) => template.template.startsWith(lang)));
			sections.forEach((section) => {
				if (section) {
					blurb += section.title() + "\n";
					blurb += section.text() + "\n";
				}
			});
		}
		return blurb || null;
	}

	private async wikipedia(query: string): Promise<void> {
		const blurbs: string[] = [];
		for (const lang of this.languages) {
			const article = await wtf.fetch(query, { lang: lang.code, wiki: "wikipedia" })
				.then((doc: wtype.Document) => {
					if (doc) {
						if (doc.isDisambiguation()) {
							return doc.text();
						}
						// tslint:disable-next-line:newline-per-chained-call
						return doc.section(0) && doc.section(0).text();
					}
					return null;
				});
			if (article) {
				blurbs.push(`${article}\n\n`);
			} else {
				blurbs.push("NOT FOUND");
			}
		}
		this.content = blurbs;
		this.blurb = this.content[0];
	}
}
