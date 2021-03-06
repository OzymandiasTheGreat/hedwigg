import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { ModalDialogService } from "nativescript-angular/modal-dialog";

import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
import { NativeScriptMaterialBottomSheetModule } from "nativescript-material-bottomsheet/angular";
import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";
import { TNSImageCacheItModule } from "nativescript-image-cache-it/angular";

import { AppRoutingModule } from "@src/app/app-routing.module.tns";
import { AppComponent } from "@src/app/app.component";
import { LayoutComponent } from "@src/app/layout/layout.component";
import { ReaderComponent } from "@src/app/reader/reader.component";
import { HomeComponent } from "@src/app/home/home.component";
import { LibraryComponent } from "@src/app/library/library.component";
import { CatalogsComponent } from "@src/app/catalogs/catalogs.component";
import { SettingsComponent } from "@src/app/settings/settings.component";
import { SearchResultsComponent } from "@src/app/search-results/search-results.component";
import { WebSheetComponent } from "@src/app/web-sheet/web-sheet.component";
import { WebResultsComponent } from "@src/app/web-results/web-results.component";
import { CatalogFormComponent } from "@src/app/catalog-form/catalog-form.component";
import { FeedComponent } from "@src/app/feed/feed.component.tns";
import { MaxLinesDirective } from "@src/app/directives/max-lines.directive";
import { BookSheetComponent } from "@src/app/book-sheet/book-sheet.component";


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from "nativescript-angular/forms";

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";

@NgModule({
	declarations: [
		AppComponent,
		LayoutComponent,
		ReaderComponent,
		HomeComponent,
		LibraryComponent,
		CatalogsComponent,
		SettingsComponent,
		SearchResultsComponent,
		WebSheetComponent,
		WebResultsComponent,
		CatalogFormComponent,
		FeedComponent,
		MaxLinesDirective,
		BookSheetComponent,
	],
	entryComponents: [
		SearchResultsComponent,
		WebSheetComponent,
		WebResultsComponent,
		CatalogFormComponent,
		BookSheetComponent,
	],
	imports: [
		NativeScriptModule,
		NativeScriptRouterModule,
		AppRoutingModule,
		NativeScriptUISideDrawerModule,
		NativeScriptUIListViewModule,
		NativeScriptMaterialBottomSheetModule.forRoot(),
		NativeScriptUIDataFormModule,
		TNSImageCacheItModule,
	],
	providers: [ModalDialogService],
	bootstrap: [AppComponent],
	schemas: [NO_ERRORS_SCHEMA],
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }
