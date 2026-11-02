import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ActivoDisponibleResponse } from "../../models/activo.interface";
import { Pagination } from "../../models/pagination.interface";

@Injectable({
	providedIn: "root",
})
export class ActivosDisponiblesService {
	private apiUrl = `${environment.apiUrl}/asignaciones/activos-disponibles`;

	constructor(private http: HttpClient) {}

	getActivosDisponibles(
		page: number = 1,
		limit: number = 10,
		search: string = "",
		filtroSeleccionado?: string,
		opcionSeleccionada?: string,
		orden?: string,
	): Observable<Pagination<ActivoDisponibleResponse>> {
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		if (search) {
			params = params.set("search", search);
		}

		if (filtroSeleccionado && opcionSeleccionada) {
			params = params.set(filtroSeleccionado, opcionSeleccionada);
		}

		if (orden) {
			params = params.set("orden", orden);
		}
		return this.http.get<Pagination<ActivoDisponibleResponse>>(this.apiUrl, {
			params,
		});
	}
}
