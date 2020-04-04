import { Component, Inject } from "@angular/core";
import { MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import wtype from "wtf_wikipedia";
import wtf from "wtf_wikipedia/builds/wtf_wikipedia-client";
import translate from "translate";

import { LANGUAGES, ILanguage } from "@src/app/services/settings.service.base";
import { SettingsService } from "@src/app/services/settings.service";


translate.engine = "google";
translate.key = "AIzaSyASq-d5V0KnmFX172gyA04xTXApVxgR50c";


@Component({
	selector: "app-web-results",
	templateUrl: "./web-results.component.html",
	styleUrls: ["./web-results.component.scss"],
})
export class WebResultsComponent {
	public languages: ILanguage[] = [];
	public loading = true;
	public content: string[] = [];
	public tabs: string[] = [];
	public blurb = "";
	public showTabs: boolean;

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) private data: any,
		private settings: SettingsService,
	) {
		let deviceLang = navigator.language;
		if (deviceLang.includes("-")) {
			// tslint:disable-next-line:newline-per-chained-call
			deviceLang = deviceLang.split("-").shift();
		}
		const defaultLang = LANGUAGES.find((lang) => lang.code === deviceLang);
		const preferLang = this.settings.prefs.webLang;
		const bookLang = LANGUAGES.find((lang) => lang.code === this.data.lang);

		for (const lang of [preferLang, defaultLang, bookLang]) {
			if (lang && this.languages.findIndex((l) => l.code === lang.code) <= -1) {
				this.languages.push(lang);
			}
		}

		for (const lang of this.languages) {
			this.tabs.push(lang.name);
		}

		switch (this.data.provider) {
			case "wikipedia":
				this.wikipedia(this.data.query)
					.then(() => {
						this.loading = false;
						this.showTabs = true;
					});
				break;
			case "wiktionary":
				this.wiktionary(this.data.query)
					.then(() => {
						this.loading = false;
						this.showTabs = true;
					});
				break;
			case "gtranslate":
				this.gtranslate(this.data.query)
					.then(() => {
						this.loading = false;
						this.showTabs = false;
					});
		}
	}

	public onTabSelected(data) {
		this.blurb = this.content[data];
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
