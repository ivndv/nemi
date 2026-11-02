import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CajaNavComponent } from "./caja-nav/caja-nav.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { NavigationRoutingModule } from "./navigation-routing.module";

@NgModule({
	declarations: [NavbarComponent, CajaNavComponent],
	imports: [CommonModule, NavigationRoutingModule],
	exports: [NavbarComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NavigationModule {}
