import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import type {
	CrearSolicitudPayload,
	EntregarSolicitudPayload,
	SolicitudDetalleResponse,
	SolicitudesResponse,
} from "../../models/solicitud.interface";

export interface FiltrosSolicitud {
	estado?: string;
	tipo?: string;
}

@Injectable({ providedIn: "root" })
export class SolicitudService {
	private apiUrl = `${environment.apiUrl}/solicitudes`;

	constructor(private http: HttpClient) {}

	listar(
		page = 1,
		limit = 10,
		filtros: FiltrosSolicitud = {},
	): Observable<SolicitudesResponse> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		for (const [clave, valor] of Object.entries(filtros)) {
			if (valor !== undefined && valor !== null && valor !== "") {
				params = params.set(clave, String(valor));
			}
		}

		return this.http.get<SolicitudesResponse>(this.apiUrl, { params });
	}

	detalle(id: number): Observable<SolicitudDetalleResponse> {
		return this.http.get<SolicitudDetalleResponse>(`${this.apiUrl}/${id}`);
	}

	crear(payload: CrearSolicitudPayload): Observable<SolicitudDetalleResponse> {
		return this.http.post<SolicitudDetalleResponse>(this.apiUrl, payload);
	}

	aprobar(
		id: number,
		comentario?: string,
	): Observable<{ data: unknown; message: string }> {
		return this.http.patch<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/aprobar`,
			{ comentario },
		);
	}

	rechazar(
		id: number,
		comentario?: string,
	): Observable<{ data: unknown; message: string }> {
		return this.http.patch<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/rechazar`,
			{ comentario },
		);
	}

	entregar(
		id: number,
		payload: EntregarSolicitudPayload,
	): Observable<{ data: unknown; message: string }> {
		return this.http.patch<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/entregar`,
			payload,
		);
	}
}
