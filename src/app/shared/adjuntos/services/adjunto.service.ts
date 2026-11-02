import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import type {
	AdjuntoItem,
	AdjuntosResponse,
	CrearAdjuntoPayload,
} from "../../../models/adjunto.interface";

@Injectable({ providedIn: "root" })
export class AdjuntoService {
	private apiUrl = `${environment.apiUrl}/adjuntos`;

	constructor(private http: HttpClient) {}

	listar(entidad: string, entidadId: number): Observable<AdjuntosResponse> {
		const params = new HttpParams()
			.set("entidad", entidad)
			.set("entidad_id", entidadId.toString());

		return this.http.get<AdjuntosResponse>(this.apiUrl, { params });
	}

	crear(
		file: File,
		payload: CrearAdjuntoPayload,
	): Observable<{ data: AdjuntoItem; message: string }> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("entidad", payload.entidad);
		formData.append("entidad_id", String(payload.entidad_id));
		formData.append("tipo", payload.tipo);
		if (payload.nombre) formData.append("nombre", payload.nombre);

		return this.http.post<{ data: AdjuntoItem; message: string }>(
			this.apiUrl,
			formData,
		);
	}

	eliminar(id: number): Observable<{ data: unknown; message: string }> {
		return this.http.delete<{ data: unknown; message: string }>(
			`${this.apiUrl}/${id}`,
		);
	}
}
