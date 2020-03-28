import * as platform from "tns-core-modules/platform";

declare var java: any;

export function base64(value) {
	if (platform.isAndroid) {
		const text = new java.lang.String(value);
		const data = text.getBytes("UTF-8");
		return global.android.util.Base64.encodeToString(data, global.android.util.Base64.NO_WRAP);
	}
}
