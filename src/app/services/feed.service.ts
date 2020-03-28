import { Injectable } from "@angular/core";
import { parseString, getFeedType, Feed } from "opds-parser2";
import * as Url from "url-parse";

import { base64 } from "@src/app/functions/base64";


@Injectable({
	providedIn: "root"
})
export class FeedService {
	private cookieJar: any = {};

	constructor() { }

	public async getFeed(url: string, username?: string, password?: string): Promise<Feed> {
		const hostname = new Url(url).hostname;
		let headers: { Authorization?: string, Cookie?: string };

		if (username && password) {
			const authStr = `${username}:${password}`;
			headers = { Authorization: `Basic ${base64(authStr)}` };
		}
		if (this.cookieJar[hostname]) {
			headers = headers ? headers : {};
			headers.Cookie = this.cookieJar[hostname];
		}
		return fetch(url, { headers, credentials: "same-origin" })
			.then((response) => {
				if (response.status === 200) {
					const cookie = response.headers.get("set-cookie");
					if (cookie) {
						this.cookieJar[hostname] = cookie;
					}
					return response.text();
				}
				throw new Error(`Network Error: ${response.status}`);
			})
			.then(parseString);
	}

	public async getFeedType(feed: Feed): Promise<"acquisition" | "navigation"> {
		return getFeedType(feed);
	}

	public resolveURI(uri: string, base: string): { uri: string, headers: Map<string, string> } {
		const url = new Url(uri, base);
		const headers = new Map<string, string>();
		if (this.cookieJar[url.hostname]) {
			headers.set("Cookie", this.cookieJar[url.hostname]);
		}
		return { uri: url.toString(), headers };
	}
}
