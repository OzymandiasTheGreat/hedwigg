import { Directive, ElementRef, Input, OnInit, OnChanges } from "@angular/core";
import { Label } from "tns-core-modules/ui/label";

declare const android: any;
declare const NSLineBreakMode: any;

@Directive({
	// tslint:disable-next-line:directive-selector
	selector: "Label[maxLines]",
})
export class MaxLinesDirective implements OnInit, OnChanges {
	// tslint:disable-next-line:no-input-rename
	@Input("maxLines") public maxLines = 1;

	public get nativeView(): Label {
		return this.el.nativeElement;
	}

	constructor(private el: ElementRef) {}

	public ngOnInit() {
		const nativeView = this.nativeView;

		if (nativeView instanceof Label) {
			nativeView.on(Label.loadedEvent, () => {
				this.applyMaxLines();
			});
		}
	}

	public ngOnChanges(changes: any) {
		if (changes.maxLines) {
			this.applyMaxLines();
		}
	}

	private applyMaxLines() {
		const nativeView = this.nativeView;

		const maxLines = Math.max(Number(this.maxLines) || 0, 1);

		if (nativeView.android) {
			nativeView.android.setMaxLines(maxLines);
			nativeView.android.setEllipsize(android.text.TextUtils.TruncateAt.END);
		} else if (nativeView.ios) {
			setTimeout(() => {
				nativeView.ios.numberOfLines = maxLines;
				nativeView.ios.adjustsFontSizeToFitWidth = false;
				nativeView.ios.lineBreakMode = NSLineBreakMode.ByTruncatingTail;
			}, 0);
		}
	}
}
