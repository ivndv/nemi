export interface ReporteFiltros {
	tipo_activo_id?: number | null;
	usuario_id?: number | null;
	ubicacion_id?: number | null;
	proveedor_id?: number | null;
	fecha_inicio?: string | null;
	fecha_fin?: string | null;
}

export interface GenerarReporteRequest {
	tipo_id: number;
	filtros: ReporteFiltros;
}

export interface ReporteResponse {
	data: {
		tipo_reporte?: string;
		alcance?: "global" | "propio";
		descripcion?: string;
		filtros?: {
			tipo_activo: string;
			usuario: string;
			ubicacion: string;
			proveedor: string;
			fecha_inicio: string | null;
			fecha_fin: string | null;
		};
		resultados?: {
			resumen: Record<string, number>;
			detalles: Record<string, string | number>[];
		};
	};
	message?: string;
}

export interface TiposReporteResponse {
	data: { tiposReporte?: TipoReporte[] };
}

export interface TipoReporte {
	readonly id: number;
	slug?: string;
	nombre: string;
	descripcion: string;
	alcance?: "global" | "propio";
	activo: boolean;
}

export interface DatosAuxiliaresResponse {
	data: {
		tiposActivo?: { id: number; nombre: string }[];
		usuarios?: { id: number; nombre: string }[];
		ubicaciones?: { id: number; nombre: string }[];
		proveedores?: { id: number; nombre: string }[];
	};
}
