import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
	AsignacionData,
	AsignacionPayload,
	AsignacionResponse,
} from "../../models/asignacion.interface";
import { Pagination } from "../../models/pagination.interface";

@Injectable({
	providedIn: "root",
})
export class AsignacionService {
	private apiUrl = `${environment.apiUrl}/asignaciones`;

	constructor(private http: HttpClient) {}

	getAsignaciones(
		page: number = 1,
		limit: number = 10,
		search: string = "",
		filtroSeleccionado?: string,
		opcionSeleccionada?: string,
		orden?: string,
	): Observable<Pagination<AsignacionData>> {
		// Construir parámetros dinámicamente
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		if (search) {
			params = params.set("search", search); // Agregar término de búsqueda
		}

		if (filtroSeleccionado && opcionSeleccionada) {
			// Enviar el filtro como clave y su valor como valor
			params = params.set(filtroSeleccionado, opcionSeleccionada);
		}

		if (orden) {
			params = params.set("orden", orden); // Agregar ordenamiento
		}
		return this.http.get<Pagination<AsignacionData>>(this.apiUrl, {
			params,
		});
	}

	// Método para crear una nueva asignación
	createAsignacion(
		asignacionData: AsignacionPayload,
	): Observable<AsignacionResponse> {
		return this.http.post<AsignacionResponse>(`${this.apiUrl}`, asignacionData);
	}

	// Método para obtener los datos de una asignación por su ID
	getAsignacionPorId(id: number): Observable<AsignacionResponse> {
		const url = `${this.apiUrl}/${id}`;
		return this.http.get<AsignacionResponse>(url);
	}

	// Método para actualizar una asignación existente
	updateAsignacion(
		id: number,
		asignacionData: AsignacionPayload,
	): Observable<AsignacionResponse> {
		const url = `${this.apiUrl}/${id}`;
		return this.http.put<AsignacionResponse>(url, asignacionData);
	}

	// Método para eliminar una asignación por ID
	deleteAsignacion(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}
}
