export interface ActivoPayload {
	nombre: string;
	tipo_id: number;
	fecha_adquisicion: string;
	valor_compra: number;
	estado: string;
	proveedor_id: number;
	ubicacion_id: number;
	dueno_id: number;
	modelo?: string;
	version_software?: string;
	tipo_licencia?: string;
	fecha_vencimiento_licencia?: string;
	costo_mensual?: number;
	recursos_asignados?: string;
	condicion_fisica?: "Nuevo" | "Usado" | "Dañado";
	etiqueta_serial?: string;
	descripcion?: string;
	nombre_garantia?: string;
	proveedor_garantia_id?: number;
	fecha_inicio?: string;
	fecha_fin?: string;
	estado_garantia?: "Vigente" | "Por vencer" | "Vencida";
	descripcion_garantia?: string;
	costo?: number;
	condiciones?: string;
}

export interface ActivoResponse {
	data: { readonly id: number };
	message: string;
}

export type ActivoDetalle = ActivoDetalleResponse["data"];

export interface GarantiaItem {
	readonly id: number;
	nombre_garantia: string;
	proveedor?: { readonly id: number; nombre: string };
	fecha_inicio: string;
	fecha_fin: string;
	estado_garantia: string;
	estado: string;
	descripcion?: string;
	costo?: number;
	condiciones?: string;
}

export interface ActivoDetalleResponse {
	data: {
		readonly id: number;
		nombre: string;
		tipo: { readonly id: number; nombre: string };
		estado: string;
		estado_label?: string;
		fecha_adquisicion: string;
		valor_compra: number;
		valor_actual: number;
		descripcion: string;
		foto_url: string;
		ubicacion: { readonly id: number; nombre: string };
		ubicacion_id?: number;
		usuario_asignado_id: number | null;
		readonly fecha_creacion: string;
		readonly fecha_actualizacion: string;
		readonly fecha_registro: string;
		dueno: { readonly id: number; nombre: string };
		proveedor: { readonly id: number; nombre: string };
		modelo?: string;
		version_software?: string;
		tipo_licencia?: string;
		condicion_fisica?: string;
		etiqueta_serial?: string;
		fecha_vencimiento_licencia?: string;
		costo_mensual?: number;
		recursos_asignados?: string;
		garantia: GarantiaItem[];
	};
}

export interface ActivoListItem {
	readonly id: number;
	nombre: string;
	foto_url: string;
	estado: string;
	estado_label?: string;
	tipo: string;
	ubicacion: string;
	usuario_asignado?: string;
}

export interface ActivoDisponibleResponse {
	readonly id: number;
	activo: string;
	foto_url: string;
	tipo_activo: string;
	estado_activo: string;
	proveedor: string;
	ubicacion: string;
}
