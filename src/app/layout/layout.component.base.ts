import { OnInit, OnDestroy } from "@angular/core";
import { NavigationEnd } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";


export class Layout implements OnInit, OnDestroy {
	private ngUnsubscribe: Subject<void>;

	public activeLink: { title: string, link: string, icon: string, iconClass: string };
	public navlinks: Array<{ title: string, link: string, icon: string, iconClass: string }> = [
		{ title: "Home", link: "/home", icon: "font://\u{F02DC}", iconClass: "mdi-home" },
		{ title: "Library", link: "/library", icon: "font://\u{F0331}", iconClass: "mdi-library" },
		{ title: "Catalogs", link: "/catalogs", icon: "font://\u{F059F}", iconClass: "mdi-web" },
		{ title: "Settings", link: "/settings", icon: "font://\u{F0493}", iconClass: "mdi-cog" },
	];

	constructor(
		protected router: any,
	) {
		this.ngUnsubscribe = new Subject<void>();
	}

	public ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}

	public ngOnInit() {
		this.activeLink = this.navlinks.find((link) => this.router.isActive(link.link, true));
		this.router.events
			.subscribe((event) => {
				if (event instanceof NavigationEnd) {
					this.activeLink = this.navlinks.find((link) => this.router.isActive(link.link, true)) || this.activeLink;
				}
			});
	}
}
