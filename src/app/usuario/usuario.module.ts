import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ListaUsuariosComponent } from "./lista-usuarios/lista-usuarios.component";
import { UsuarioRoutingModule } from "./usuario-routing.module";

@NgModule({
	declarations: [ListaUsuariosComponent],
	imports: [CommonModule, UsuarioRoutingModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UsuarioModule {}
