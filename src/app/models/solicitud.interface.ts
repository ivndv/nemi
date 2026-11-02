import type { Pagination } from "./pagination.interface";

export interface SolicitudItem {
	readonly id: number;
	solicitante_id: number;
	solicitante: string;
	tipo: "equipo" | "licencia" | "accesorio" | "reemplazo";
	tipo_label: string;
	tipo_activo_id: number | null;
	tipo_activo: string | null;
	motivo: string;
	prioridad: "baja" | "media" | "alta";
	prioridad_label: string;
	estado: "pendiente" | "aprobada" | "rechazada" | "entregada";
	estado_label: string;
	resuelta_por: number | null;
	activo_id: number | null;
	fecha_resolucion: string | null;
	created_at: string;
}

export type SolicitudesResponse = Pagination<SolicitudItem>;

export interface SolicitudDetalleResponse {
	data: SolicitudItem;
	message?: string;
}

export interface CrearSolicitudPayload {
	tipo: "equipo" | "licencia" | "accesorio" | "reemplazo";
	tipo_activo_id?: number;
	motivo: string;
	prioridad: "baja" | "media" | "alta";
}

export interface EntregarSolicitudPayload {
	activo_id: number;
	ubicacion_id: number;
	persona_id?: number;
}
