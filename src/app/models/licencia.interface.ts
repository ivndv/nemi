import type { Pagination } from "./pagination.interface";

export interface LicenciaItem {
	readonly activo_id: number;
	nombre: string;
	tipo: string | null;
	proveedor: string | null;
	modalidad: "perpetua" | "suscripcion";
	modalidad_label: string;
	tipo_uso: "dispositivo" | "usuario" | "concurrente" | "volumen";
	tipo_uso_label: string;
	asientos_comprados: number;
	ocupados: number;
	libres: number;
	costo: string | null;
	periodicidad_costo: "mensual" | "anual" | "unica";
	periodicidad_costo_label: string;
	fecha_renovacion: string | null;
	renovacion_automatica: boolean;
	estado: "disponible" | "asignada" | "vencida";
	estado_label: string;
}

export type LicenciasResponse = Pagination<LicenciaItem>;

export interface AsientoLicencia {
	readonly id: number;
	asiento: number;
	destino_tipo: "persona" | "activo";
	destino_tipo_label: string;
	persona_id: number | null;
	persona: string | null;
	activo_id: number | null;
	activo: string | null;
	fecha_asignacion: string;
	fecha_liberacion: string | null;
}

export interface RenovacionLicencia {
	readonly id: number;
	fecha: string;
	asientos: number;
	costo: string | null;
	adjunto_id: number | null;
	adjunto: string | null;
}

export interface LicenciaDetalle extends LicenciaItem {
	referencia_clave: string | null;
	estado_activo: string;
	asientos: AsientoLicencia[];
	renovaciones: RenovacionLicencia[];
}

export interface LicenciaDetalleResponse {
	data: LicenciaDetalle;
	message?: string;
}

export interface AsignarAsientoPayload {
	destino_tipo: "persona" | "activo";
	persona_id?: number;
	activo_id?: number;
	fecha_asignacion: string;
}

export interface CrearRenovacionPayload {
	fecha: string;
	asientos: number;
	costo?: number;
	adjunto_id?: number;
}
