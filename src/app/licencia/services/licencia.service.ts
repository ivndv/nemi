import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
	AsientoLicencia,
	AsignarAsientoPayload,
	CrearRenovacionPayload,
	LicenciaDetalleResponse,
	LicenciasResponse,
	RenovacionLicencia,
} from "../../models/licencia.interface";

@Injectable({ providedIn: "root" })
export class LicenciaService {
	private apiUrl = `${environment.apiUrl}/licencias`;

	constructor(private http: HttpClient) {}

	listar(
		page = 1,
		limit = 10,
		search = "",
		orden: "asc" | "desc" = "asc",
	): Observable<LicenciasResponse> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString())
			.set("orden", orden);

		if (search) params = params.set("search", search);

		return this.http.get<LicenciasResponse>(this.apiUrl, { params });
	}

	detalle(id: number): Observable<LicenciaDetalleResponse> {
		return this.http.get<LicenciaDetalleResponse>(`${this.apiUrl}/${id}`);
	}

	asientos(id: number): Observable<{ data: AsientoLicencia[] }> {
		return this.http.get<{ data: AsientoLicencia[] }>(
			`${this.apiUrl}/${id}/asientos`,
		);
	}

	asignarAsiento(
		id: number,
		payload: AsignarAsientoPayload,
	): Observable<{ data: AsientoLicencia; message: string }> {
		return this.http.post<{ data: AsientoLicencia; message: string }>(
			`${this.apiUrl}/${id}/asientos`,
			payload,
		);
	}

	liberarAsiento(
		id: number,
		asiento: number,
	): Observable<{ data: { asiento: number }; message: string }> {
		return this.http.patch<{ data: { asiento: number }; message: string }>(
			`${this.apiUrl}/${id}/asientos/${asiento}/liberar`,
			{},
		);
	}

	renovaciones(id: number): Observable<{ data: RenovacionLicencia[] }> {
		return this.http.get<{ data: RenovacionLicencia[] }>(
			`${this.apiUrl}/${id}/renovaciones`,
		);
	}

	crearRenovacion(
		id: number,
		payload: CrearRenovacionPayload,
	): Observable<{ data: RenovacionLicencia; message: string }> {
		return this.http.post<{ data: RenovacionLicencia; message: string }>(
			`${this.apiUrl}/${id}/renovaciones`,
			payload,
		);
	}
}
