export interface ILanguage {
	name: string;
	code: string;
}


export interface ISettings {
	flow: "paginated" | "spread" | "scrolled";
	theme: "Default" | "Soft" | "Tan" | "Dark" | "Inverted";
	fontSize: string;
	webLang: ILanguage;
	appTheme: "Auto" | "Light" | "Dark";
}


export const LANGUAGES: ILanguage[] = [
	{ name: "Afrikaans", code: "af" },
	{ name: "Albanian", code: "sq" },
	{ name: "Amharic", code: "am" },
	{ name: "Arabic", code: "ar" },
	{ name: "Armenian", code: "hy" },
	{ name: "Azerbaijani", code: "az" },
	{ name: "Basque", code: "eu" },
	{ name: "Belarusian", code: "be" },
	{ name: "Bengali", code: "bn" },
	{ name: "Bosnian", code: "bs" },
	{ name: "Bulgarian", code: "bg" },
	{ name: "Catalan", code: "ca" },
	{ name: "Cebuano", code: "ceb" },
	{ name: "Chinese (Simplified)", code: "zh-CN" },
	{ name: "Chinese (Traditional)", code: "zh-TW" },
	{ name: "Corsican", code: "co" },
	{ name: "Croatian", code: "hr" },
	{ name: "Czech", code: "cs" },
	{ name: "Danish", code: "da" },
	{ name: "Dutch", code: "nl" },
	{ name: "English", code: "en" },
	{ name: "Esperanto", code: "eo" },
	{ name: "Estonian", code: "et" },
	{ name: "Finnish", code: "fi" },
	{ name: "French", code: "fr" },
	{ name: "Frisian", code: "fy" },
	{ name: "Galician", code: "gl" },
	{ name: "Georgian", code: "ka" },
	{ name: "German", code: "de" },
	{ name: "Greek", code: "el" },
	{ name: "Gujarati", code: "gu" },
	{ name: "Haitian Creole", code: "ht" },
	{ name: "Hausa", code: "ha" },
	{ name: "Hawaiian", code: "haw" },
	{ name: "Hebrew", code: "he" },
	{ name: "Hindi", code: "hi" },
	{ name: "Hmong", code: "hmn" },
	{ name: "Hungarian", code: "hu" },
	{ name: "Icelandic", code: "is" },
	{ name: "Igbo", code: "ig" },
	{ name: "Indonesian", code: "id" },
	{ name: "Irish", code: "ga" },
	{ name: "Italian", code: "it" },
	{ name: "Japanese", code: "ja" },
	{ name: "Javanese", code: "jv" },
	{ name: "Kannada", code: "kn" },
	{ name: "Kazakh", code: "kk" },
	{ name: "Khmer", code: "km" },
	{ name: "Korean", code: "ko" },
	{ name: "Kurdish", code: "ku" },
	{ name: "Kyrgyz", code: "ky" },
	{ name: "Lao", code: "lo" },
	{ name: "Latin", code: "la" },
	{ name: "Latvian", code: "lv" },
	{ name: "Lithuanian", code: "lt" },
	{ name: "Luxembourgish", code: "lb" },
	{ name: "Macedonian", code: "mk" },
	{ name: "Malagasy", code: "mg" },
	{ name: "Malay", code: "ms" },
	{ name: "Malayalam", code: "ml" },
	{ name: "Maltese", code: "mt" },
	{ name: "Maori", code: "mi" },
	{ name: "Marathi", code: "mr" },
	{ name: "Mongolian", code: "mn" },
	{ name: "Myanmar (Burmese)", code: "my" },
	{ name: "Nepali", code: "ne" },
	{ name: "Norwegian", code: "no" },
	{ name: "Nyanja (Chichewa)", code: "ny" },
	{ name: "Pashto", code: "ps" },
	{ name: "Persian", code: "fa" },
	{ name: "Polish", code: "pl" },
	{ name: "Portuguese", code: "pt" },
	{ name: "Punjabi", code: "pa" },
	{ name: "Romanian", code: "ro" },
	{ name: "Russian", code: "ru" },
	{ name: "Samoan", code: "sm" },
	{ name: "Scots Gaelic", code: "gd" },
	{ name: "Serbian", code: "sr" },
	{ name: "Sesotho", code: "st" },
	{ name: "Shona", code: "sn" },
	{ name: "Sindhi", code: "sd" },
	{ name: "Sinhala (Sinhalese)", code: "si" },
	{ name: "Slovak", code: "sk" },
	{ name: "Slovenian", code: "sl" },
	{ name: "Somali", code: "so" },
	{ name: "Spanish", code: "es" },
	{ name: "Sundanese", code: "su" },
	{ name: "Swahili", code: "sw" },
	{ name: "Swedish", code: "sv" },
	{ name: "Tagalog (Filipino)", code: "tl" },
	{ name: "Tajik", code: "tg" },
	{ name: "Tamil", code: "ta" },
	{ name: "Telugu", code: "te" },
	{ name: "Thai", code: "th" },
	{ name: "Turkish", code: "tr" },
	{ name: "Ukrainian", code: "uk" },
	{ name: "Urdu", code: "ur" },
	{ name: "Uzbek", code: "uz" },
	{ name: "Vietnamese", code: "vi" },
	{ name: "Welsh", code: "cy" },
	{ name: "Xhosa", code: "xh" },
	{ name: "Yiddish", code: "yi" },
	{ name: "Yoruba", code: "yo" },
	{ name: "Zulu", code: "zu" },
];


export const THEMES = {
	Default: { "html, body": {
			height: "100%",
			"background-color": "#FFFFFF",
			color: "#000000",
		} },
	Soft: { "html, body": {
			height: "100%",
			"background-color": "#fafafa",
			color: "#212121",
	} },
	Tan: { "html, body": {
			height: "100%",
			"background-color": "#ffecb3",
			color: "#212121",
	} },
	Dark: { "html, body": {
			height: "100%",
			"background-color": "#212121",
			color: "#fafafa",
	} },
	Inverted: { "html, body": {
			height: "100%",
			"background-color": "#000000",
			color: "#FFFFFF",
	} },
};


export class Settings {
	private key = "APP_SETTINGS";
	public prefs: ISettings;

	constructor(
		protected getter: (key: string) => string,
		protected setter: (key: string, value: string) => void,
	) {
		const prefs = this.getter(this.key);
		if (prefs) {
			this.prefs = <ISettings> JSON.parse(prefs);
		} else {
			this.prefs = {
				flow: "paginated",
				theme: "Default",
				fontSize: "100%",
				webLang: {
					name: "English",
					code: "en",
				},
				appTheme: "Auto",
			};
			this.setter(this.key, JSON.stringify(this.prefs));
		}
	}

	public save(): void {
		this.setter(this.key, JSON.stringify(this.prefs));
	}
}
