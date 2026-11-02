import type { Pagination } from "./pagination.interface";

export interface MantenimientoItem {
	readonly id: number;
	activo_id: number;
	activo: string;
	responsable: "interno" | "externo";
	responsable_label: string;
	tecnico_id: number | null;
	tecnico: string | null;
	proveedor_id: number | null;
	proveedor: string | null;
	tipo: "preventivo" | "correctivo";
	tipo_label: string;
	fecha_salida: string;
	fecha_retorno: string | null;
	diagnostico: string | null;
	costo: string | null;
	estado: "abierto" | "cerrado";
	estado_label: string;
}

export type MantenimientosResponse = Pagination<MantenimientoItem>;

export interface MantenimientoDetalleResponse {
	data: MantenimientoItem;
	message?: string;
}

export interface CrearMantenimientoPayload {
	activo_id: number;
	responsable: "interno" | "externo";
	tecnico_id?: number;
	proveedor_id?: number;
	tipo: "preventivo" | "correctivo";
	fecha_salida: string;
	diagnostico?: string;
	costo?: number;
}

export interface CerrarMantenimientoPayload {
	fecha_retorno: string;
	diagnostico?: string;
	costo?: number;
}
