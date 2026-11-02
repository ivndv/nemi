import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import type {
	CerrarMantenimientoPayload,
	CrearMantenimientoPayload,
	MantenimientoDetalleResponse,
	MantenimientosResponse,
} from "../../models/mantenimiento.interface";

export interface FiltrosMantenimiento {
	estado?: string;
	responsable?: string;
	activo_id?: number;
	desde?: string;
	hasta?: string;
}

@Injectable({ providedIn: "root" })
export class MantenimientoService {
	private apiUrl = `${environment.apiUrl}/mantenimientos`;

	constructor(private http: HttpClient) {}

	listar(
		page = 1,
		limit = 10,
		filtros: FiltrosMantenimiento = {},
	): Observable<MantenimientosResponse> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		for (const [clave, valor] of Object.entries(filtros)) {
			if (valor !== undefined && valor !== null && valor !== "") {
				params = params.set(clave, String(valor));
			}
		}

		return this.http.get<MantenimientosResponse>(this.apiUrl, { params });
	}

	detalle(id: number): Observable<MantenimientoDetalleResponse> {
		return this.http.get<MantenimientoDetalleResponse>(`${this.apiUrl}/${id}`);
	}

	crear(
		payload: CrearMantenimientoPayload,
	): Observable<MantenimientoDetalleResponse> {
		return this.http.post<MantenimientoDetalleResponse>(this.apiUrl, payload);
	}

	cerrar(
		id: number,
		payload: CerrarMantenimientoPayload,
	): Observable<{ data: unknown; message: string }> {
		return this.http.patch<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}/cerrar`,
			payload,
		);
	}
}
