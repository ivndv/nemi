import type { Pagination } from "./pagination.interface";

export interface IncidenciaItem {
	readonly id: number;
	activo_id: number;
	activo: string;
	reportante_id: number;
	reportante: string | null;
	descripcion: string;
	prioridad: "baja" | "media" | "alta";
	prioridad_label: string;
	estado: "abierta" | "en_revision" | "resuelta" | "cerrada";
	estado_label: string;
	mantenimiento_id: number | null;
	fecha_resolucion: string | null;
	created_at: string;
}

export type IncidenciasResponse = Pagination<IncidenciaItem>;

export interface IncidenciaDetalleResponse {
	data: IncidenciaItem;
	message?: string;
}

export interface CrearIncidenciaPayload {
	activo_id: number;
	descripcion: string;
	prioridad: "baja" | "media" | "alta";
}

export interface AbrirMantenimientoIncidenciaPayload {
	responsable: "interno" | "externo";
	tecnico_id?: number;
	proveedor_id?: number;
	tipo: "preventivo" | "correctivo";
	fecha_salida: string;
	diagnostico?: string;
	costo?: number;
}
