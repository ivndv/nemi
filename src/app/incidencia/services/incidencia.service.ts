import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import type {
	AbrirMantenimientoIncidenciaPayload,
	CrearIncidenciaPayload,
	IncidenciaDetalleResponse,
	IncidenciasResponse,
} from "../../models/incidencia.interface";

export interface FiltrosIncidencia {
	estado?: string;
	prioridad?: string;
	activo_id?: number;
}

@Injectable({ providedIn: "root" })
export class IncidenciaService {
	private apiUrl = `${environment.apiUrl}/incidencias`;

	constructor(private http: HttpClient) {}

	listar(
		page = 1,
		limit = 10,
		filtros: FiltrosIncidencia = {},
	): Observable<IncidenciasResponse> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		for (const [clave, valor] of Object.entries(filtros)) {
			if (valor !== undefined && valor !== null && valor !== "") {
				params = params.set(clave, String(valor));
			}
		}

		return this.http.get<IncidenciasResponse>(this.apiUrl, { params });
	}

	detalle(id: number): Observable<IncidenciaDetalleResponse> {
		return this.http.get<IncidenciaDetalleResponse>(`${this.apiUrl}/${id}`);
	}

	crear(
		payload: CrearIncidenciaPayload,
	): Observable<IncidenciaDetalleResponse> {
		return this.http.post<IncidenciaDetalleResponse>(this.apiUrl, payload);
	}

	cambiarEstado(
		id: number,
		estado: "abierta" | "en_revision" | "resuelta" | "cerrada",
	): Observable<{ data: unknown; message: string }> {
		return this.http.patch<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/estado`,
			{ estado },
		);
	}

	abrirMantenimiento(
		id: number,
		payload: AbrirMantenimientoIncidenciaPayload,
	): Observable<{ data: unknown; message: string }> {
		return this.http.post<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/mantenimiento`,
			payload,
		);
	}
}
