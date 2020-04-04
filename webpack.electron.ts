import * as webpack from "webpack";
import * as CopyPlugin from "copy-webpack-plugin";


// tslint:disable-next-line:no-default-export
export default {
	target: "electron-renderer",
	plugins: [
		new CopyPlugin([
			{ from: "app/webview/*", to: "src/", ignore: ["**/tns/*", "*.tns.*"], },
		]),
	],
} as webpack.Configuration;
