import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { LayoutComponent } from "@src/app/layout/layout.component";
import { ReaderComponent } from "@src/app/reader/reader.component";
import { HomeComponent } from "@src/app/home/home.component";
import { LibraryComponent } from "@src/app/library/library.component";
import { CatalogsComponent } from "@src/app/catalogs/catalogs.component";
import { SettingsComponent } from "@src/app/settings/settings.component";
import { FeedComponent } from "@src/app/feed/feed.component";

export const routes: Routes = [
	{
		path: "",
		redirectTo: "/home",
		pathMatch: "full",
	},
	{
		path: "",
		component: LayoutComponent,
		children: [
			{
				path: "home",
				component: HomeComponent,
			},
			{
				path: "library",
				component: LibraryComponent,
			},
			{
				path: "catalogs",
				component: CatalogsComponent,
			},
			{
				path: "settings",
				component: SettingsComponent,
			},
			{
				path: "feed/:catalogId",
				component: FeedComponent,
			},
		],
	},
	{
		path: "reader",
		component: ReaderComponent,
	},
];

@NgModule({
	imports: [NativeScriptRouterModule.forRoot(routes)],
	exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
