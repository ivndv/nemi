export interface AdjuntoItem {
	readonly id: number;
	entidad:
		| "activo"
		| "licencia"
		| "garantia"
		| "mantenimiento"
		| "incidencia"
		| "solicitud";
	entidad_label: string;
	entidad_id: number;
	tipo: "factura" | "poliza" | "acta" | "foto" | "otro";
	tipo_label: string;
	nombre: string;
	key: string | null;
	url: string;
	mime: string;
	tamano: number;
	subido_por: number | null;
	autor: string | null;
	created_at: string;
}

export interface AdjuntosResponse {
	data: AdjuntoItem[];
}

export interface CrearAdjuntoPayload {
	entidad: AdjuntoItem["entidad"];
	entidad_id: number;
	tipo: AdjuntoItem["tipo"];
	nombre?: string;
}
