import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { queryClient } from "./core/query/query-client";
import { AuthInterceptor } from "./login/services/auth-interceptor.service";
import { NavigationModule } from "./navigation/navigation.module";
import { FooterComponent } from "./shared/footer/footer.component";
import { HeaderComponent } from "./shared/header/header.component";

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		HeaderComponent,
		FooterComponent,
		NavigationModule,
	],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptor,
			multi: true,
		},
		provideTanStackQuery(queryClient),
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
