import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { SubirImagenResponse } from "../../models/common.interface";
import {
	ConfiguracionAplicacionResponse,
	PerfilResponse,
} from "../../models/configuracion.interface";

export interface PerfilPayload {
	nombre?: string;
	email?: string;
	departamento?: string;
	foto_url?: string;
}

export interface CambioContrasenaPayload {
	contrasena_actual: string;
	nueva_contrasena: string;
	confirmar_nueva_contrasena: string;
}

@Injectable({
	providedIn: "root",
})
export class ConfiguracionService {
	private apiUrl = `${environment.apiUrl}/configuracion`;

	constructor(private http: HttpClient) {}

	getConfiguracionAplicacion(): Observable<ConfiguracionAplicacionResponse> {
		return this.http.get<ConfiguracionAplicacionResponse>(
			`${this.apiUrl}/aplicacion`,
		);
	}

	updateConfiguracionAplicacion(
		datos: Partial<ConfiguracionAplicacionResponse["data"]>,
	): Observable<{ message: string }> {
		return this.http.put<{ message: string }>(
			`${this.apiUrl}/aplicacion`,
			datos,
		);
	}

	getPerfilUsuario(): Observable<PerfilResponse> {
		return this.http.get<PerfilResponse>(`${this.apiUrl}/perfil`);
	}

	updatePerfilUsuario(datos: PerfilPayload): Observable<PerfilResponse> {
		return this.http.put<PerfilResponse>(`${this.apiUrl}/perfil`, datos);
	}

	cambiarContrasena(
		datos: CambioContrasenaPayload,
	): Observable<{ message: string }> {
		return this.http.put<{ message: string }>(
			`${this.apiUrl}/perfil/contrasena`,
			datos,
		);
	}

	subirImagen(formData: FormData): Observable<SubirImagenResponse> {
		return this.http.post<SubirImagenResponse>(
			`${this.apiUrl}/perfil/imagen`,
			formData,
		);
	}
}
