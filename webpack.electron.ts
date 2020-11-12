import * as webpack from "webpack";
import * as CopyPlugin from "copy-webpack-plugin";


// tslint:disable-next-line:no-default-export
export default {
	target: "electron-renderer",
	plugins: [
		new CopyPlugin({ patterns: [
			{ from: "src/app/webview/*", to: "./", globOptions: { ignore: ["**/tns/*", "*.tns.*"] } },
		]}),
		new webpack.DefinePlugin({
			GTRANSLATE_API_KEY: JSON.stringify(process.env.GTRANSLATE_API_KEY),
		}),
	],
} as webpack.Configuration;
