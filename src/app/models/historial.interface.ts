export interface HistorialEntry {
	readonly id: number;
	readonly activo_id: number;
	accion: "creado" | "editado" | "eliminado" | "asignado" | string;
	slug?: string;
	usuario_responsable: string;
	readonly fecha: string;
	detalles: string | Record<string, unknown>;
}
