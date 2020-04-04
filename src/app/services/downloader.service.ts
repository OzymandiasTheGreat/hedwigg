import { Injectable } from "@angular/core";
import { remote } from "electron";
import * as path from "path";
import * as fs from "fs";
import { Readable } from "stream";
import * as mkdirp from "mkdirp";
import * as contentDisposition from "content-disposition";


const { app } = remote;


@Injectable({
	providedIn: "root"
})
export class DownloaderService {
	public booksDir: string;

	constructor() {
		this.booksDir = path.join(app.getPath("downloads"), "Hedwigg");
	}

	public async getFile(uri: string, headers: any): Promise<string | void> {
		const response = await fetch(uri, { headers });
		const reader = response.body.getReader();
		const readable = new Readable();

		readable._read = async () => {
			const result = await reader.read();
			if (!result.done) {
				readable.push(Buffer.from(result.value));
			} else {
				readable.push(null);
				return;
			}
		};

		mkdirp.sync(this.booksDir);
		const fileName = contentDisposition.parse(response.headers.get("Content-Disposition")).parameters.filename;
		const mimetype = response.headers.get("Content-Type");
		const fileExt = mimetype === "application/pdf" ? "pdf" : "epub";
		const filePath = path.join(this.booksDir, fileName || `${Date.now()}.${fileExt}`);
		const fileStream = fs.createWriteStream(filePath);

		return new Promise((resolve) => {
			readable.pipe(fileStream);
			fileStream.on("finish", () => resolve(filePath));
		});
	}
}
