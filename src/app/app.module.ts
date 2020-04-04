import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSliderModule } from "@angular/material/slider";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatMenuModule } from "@angular/material/menu";
import { MatExpansionModule } from "@angular/material/expansion";
import { VirtualScrollerModule } from "ngx-virtual-scroller";

import { AppRoutingModule } from "@src/app/app-routing.module";
import { AppComponent } from "@src/app/app.component";
import { ReaderComponent } from "@src/app/reader/reader.component";
import { LayoutComponent } from "@src/app/layout/layout.component";
import { HomeComponent } from "@src/app/home/home.component";
import { LibraryComponent } from "@src/app/library/library.component";
import { CatalogsComponent } from "@src/app/catalogs/catalogs.component";
import { SettingsComponent } from "@src/app/settings/settings.component";
import { SearchResultsComponent } from "@src/app/search-results/search-results.component";
import { WebSheetComponent } from "@src/app/web-sheet/web-sheet.component";
import { WebResultsComponent } from "@src/app/web-results/web-results.component";
import { CatalogFormComponent } from "@src/app/catalog-form/catalog-form.component";
import { FeedComponent } from "@src/app/feed/feed.component";
import { BookSheetComponent } from "@src/app/book-sheet/book-sheet.component";
import { WebviewDirective } from "@src/app/directives/webview.directive";
import { WarningDialogComponent } from "@src/app/warning-dialog/warning-dialog.component";
import { LanguageSelectComponent } from "@src/app/language-select/language-select.component";

@NgModule({
	declarations: [
		AppComponent,
		ReaderComponent,
		LayoutComponent,
		HomeComponent,
		LibraryComponent,
		CatalogsComponent,
		SettingsComponent,
		SearchResultsComponent,
		WebSheetComponent,
		WebResultsComponent,
		CatalogFormComponent,
		FeedComponent,
		BookSheetComponent,
		WebviewDirective,
		WarningDialogComponent,
		LanguageSelectComponent,
	],
	entryComponents: [
		SearchResultsComponent,
		WebSheetComponent,
		WebResultsComponent,
		WarningDialogComponent,
		LanguageSelectComponent,
		CatalogFormComponent,
		BookSheetComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		BrowserAnimationsModule,
		MatToolbarModule,
		MatIconModule,
		MatSidenavModule,
		MatListModule,
		MatCardModule,
		MatButtonModule,
		MatTabsModule,
		MatSliderModule,
		MatInputModule,
		MatDialogModule,
		MatBottomSheetModule,
		MatProgressSpinnerModule,
		MatMenuModule,
		MatExpansionModule,
		VirtualScrollerModule,
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
