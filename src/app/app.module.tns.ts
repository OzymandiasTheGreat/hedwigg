import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";

import { AppRoutingModule } from "@src/app/app-routing.module.tns";
import { AppComponent } from "@src/app/app.component";
import { AutoGeneratedComponent } from "@src/app/auto-generated/auto-generated.component";
import { LayoutComponent } from "@src/app/layout/layout.component";
import { ReaderComponent } from "@src/app/reader/reader.component";
import { HomeComponent } from "@src/app/home/home.component";
import { LibraryComponent } from "@src/app/library/library.component";
import { CatalogsComponent } from "@src/app/catalogs/catalogs.component";
import { SettingsComponent } from "@src/app/settings/settings.component";


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from "nativescript-angular/forms";

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";

@NgModule({
	declarations: [
		AppComponent,
		AutoGeneratedComponent,
		LayoutComponent,
		ReaderComponent,
		HomeComponent,
		LibraryComponent,
		CatalogsComponent,
		SettingsComponent,
	],
	imports: [
		NativeScriptModule,
		NativeScriptRouterModule,
		AppRoutingModule,
		NativeScriptUISideDrawerModule,
		NativeScriptUIListViewModule,
	],
	providers: [],
	bootstrap: [AppComponent],
	schemas: [NO_ERRORS_SCHEMA],
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }
