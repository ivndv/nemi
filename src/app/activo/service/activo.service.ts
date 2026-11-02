import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
	ActivoDetalleResponse,
	ActivoListItem,
	ActivoResponse,
} from "../../models/activo.interface";
import { Pagination } from "../../models/pagination.interface";

@Injectable({
	providedIn: "root",
})
export class ActivoService {
	private apiUrl = `${environment.apiUrl}/gestion-activos`;

	constructor(private http: HttpClient) {}

	// Obtener activos con búsqueda y paginación
	getActivos(
		page: number = 1,
		limit: number = 10,
		searchTerm: string = "",
		filtro?: string,
		valorFiltro?: string,
		orden?: string,
	): Observable<Pagination<ActivoListItem>> {
		// Construir parámetros con logs detallados
		let params = new HttpParams()
			.set("page", page.toString())
			.set("limit", limit.toString());

		if (searchTerm) {
			params = params.set("search", searchTerm);
		}

		if (filtro && valorFiltro) {
			params = params.set(filtro, valorFiltro);
		}

		if (orden) {
			params = params.set("orden", orden);
		}
		return this.http.get<Pagination<ActivoListItem>>(`${this.apiUrl}/activos`, {
			params,
		});
	}

	// Obtener un activo por ID
	getActivoById(id: number): Observable<ActivoDetalleResponse> {
		return this.http.get<ActivoDetalleResponse>(`${this.apiUrl}/activos/${id}`);
	}

	// Crear un nuevo activo
	createActivo(formData: FormData): Observable<ActivoResponse> {
		return this.http.post<ActivoResponse>(`${this.apiUrl}/activos`, formData);
	}

	// Actualizar un activo existente
	updateActivo(id: number, formData: FormData): Observable<ActivoResponse> {
		return this.http.put<ActivoResponse>(
			`${this.apiUrl}/activos/${id}`,
			formData,
		);
	}

	// Eliminar un activo
	deleteActivo(id: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(
			`${this.apiUrl}/activos/${id}`,
		);
	}

	darDeBajaActivo(
		id: number,
	): Observable<{ data: { success: boolean }; message: string }> {
		return this.http.patch<{ data: { success: boolean }; message: string }>(
			`${this.apiUrl}/baja/${id}`,
			{},
		);
	}

	//  método para subir imágenes
	subirImagen(
		formData: FormData,
	): Observable<{ data: { url: string; filename: string }; message?: string }> {
		return this.http.post<{
			data: { url: string; filename: string };
			message?: string;
		}>(`${this.apiUrl}/upload`, formData);
	}
}
