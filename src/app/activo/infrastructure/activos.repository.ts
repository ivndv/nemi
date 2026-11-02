import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import { environment } from "../../../environments/environment";
import {
	ActivoDetalleResponse,
	ActivoListItem,
	ActivoResponse,
} from "../../models/activo.interface";
import { Pagination } from "../../models/pagination.interface";

export interface ActivosQuery {
	page: number;
	limit: number;
	searchTerm?: string;
	filtro?: string;
	valorFiltro?: string;
	orden?: string;
}

/**
 * Puerto de datos de activos.
 * Permite cambiar la implementación (REST, GraphQL, mock) sin tocar la UI.
 */
export abstract class ActivosRepository {
	abstract listar(query: ActivosQuery): Promise<Pagination<ActivoListItem>>;
	abstract detalle(id: number): Promise<ActivoDetalleResponse["data"]>;
	abstract crear(formData: FormData): Promise<ActivoResponse>;
	abstract editar(id: number, formData: FormData): Promise<ActivoResponse>;
	abstract darDeBaja(
		id: number,
	): Promise<{ data: { success: boolean }; message: string }>;
}

@Injectable({ providedIn: "root" })
export class ActivosHttpRepository extends ActivosRepository {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/gestion-activos`;

	listar(query: ActivosQuery): Promise<Pagination<ActivoListItem>> {
		let params = new HttpParams()
			.set("page", query.page.toString())
			.set("limit", query.limit.toString());

		if (query.searchTerm) {
			params = params.set("search", query.searchTerm);
		}

		if (query.filtro && query.valorFiltro) {
			params = params.set(query.filtro, query.valorFiltro);
		}

		if (query.orden) {
			params = params.set("orden", query.orden);
		}

		return firstValueFrom(
			this.http.get<Pagination<ActivoListItem>>(`${this.apiUrl}/activos`, {
				params,
			}),
		);
	}

	detalle(id: number): Promise<ActivoDetalleResponse["data"]> {
		return firstValueFrom(
			this.http
				.get<ActivoDetalleResponse>(`${this.apiUrl}/activos/${id}`)
				.pipe(map((response) => response.data)),
		);
	}

	crear(formData: FormData): Promise<ActivoResponse> {
		return firstValueFrom(
			this.http.post<ActivoResponse>(`${this.apiUrl}/activos`, formData),
		);
	}

	editar(id: number, formData: FormData): Promise<ActivoResponse> {
		return firstValueFrom(
			this.http.put<ActivoResponse>(`${this.apiUrl}/activos/${id}`, formData),
		);
	}

	darDeBaja(
		id: number,
	): Promise<{ data: { success: boolean }; message: string }> {
		return firstValueFrom(
			this.http.patch<{ data: { success: boolean }; message: string }>(
				`${this.apiUrl}/baja/${id}`,
				{},
			),
		);
	}
}
