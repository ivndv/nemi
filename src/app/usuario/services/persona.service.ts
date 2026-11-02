import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import type {
	ActualizarPersonaPayload,
	CatalogosPersonasResponse,
	CrearPersonaPayload,
	PersonaDetalleResponse,
	PersonasResponse,
} from "../../models/persona.interface";

export interface FiltrosPersona {
	search?: string;
	rol_id?: number;
	sede_id?: number;
	departamento_id?: number;
}

@Injectable({ providedIn: "root" })
export class PersonaService {
	private apiUrl = `${environment.apiUrl}/personas`;

	constructor(private http: HttpClient) {}

	listar(
		page = 1,
		limit = 10,
		filtros: FiltrosPersona = {},
	): Observable<PersonasResponse> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		for (const [clave, valor] of Object.entries(filtros)) {
			if (valor !== undefined && valor !== null && valor !== "") {
				params = params.set(clave, String(valor));
			}
		}

		return this.http.get<PersonasResponse>(this.apiUrl, { params });
	}

	catalogos(): Observable<CatalogosPersonasResponse> {
		return this.http.get<CatalogosPersonasResponse>(`${this.apiUrl}/catalogos`);
	}

	detalle(id: number): Observable<PersonaDetalleResponse> {
		return this.http.get<PersonaDetalleResponse>(`${this.apiUrl}/${id}`);
	}

	crear(payload: CrearPersonaPayload): Observable<PersonaDetalleResponse> {
		return this.http.post<PersonaDetalleResponse>(this.apiUrl, payload);
	}

	actualizar(
		id: number,
		payload: ActualizarPersonaPayload,
	): Observable<PersonaDetalleResponse> {
		return this.http.put<PersonaDetalleResponse>(
			`${this.apiUrl}/${id}`,
			payload,
		);
	}

	cambiarPassword(
		id: number,
		contrasena: string,
	): Observable<{ message: string }> {
		return this.http.patch<{ message: string }>(
			`${this.apiUrl}/${id}/password`,
			{ contrasena },
		);
	}

	desbloquear(id: number): Observable<{ message: string }> {
		return this.http.patch<{ message: string }>(
			`${this.apiUrl}/${id}/desbloquear`,
			{},
		);
	}

	darDeBaja(id: number): Observable<{ message: string }> {
		return this.http.patch<{ message: string }>(
			`${this.apiUrl}/${id}/baja`,
			{},
		);
	}
}
