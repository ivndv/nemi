import type { Pagination } from "./pagination.interface";

export interface PersonaListItem {
	readonly id: number;
	nombre: string;
	email: string;
	rol_id: number;
	rol_slug: string;
	rol: string;
	departamento_id: number | null;
	departamento: string | null;
	sede_id: number | null;
	sede: string | null;
	fecha_ingreso: string;
	ultimo_acceso: string | null;
	readonly created_at: string;
	intentos_fallidos: number;
	bloqueado_hasta: string | null;
}

export type PersonasResponse = Pagination<PersonaListItem>;

export interface PersonaDetalleResponse {
	data: PersonaListItem;
	message?: string;
}

export interface CrearPersonaPayload {
	nombre: string;
	email: string;
	contrasena: string;
	rol: string;
	departamento: string;
	sede_id?: number;
	fecha_ingreso: string;
}

export interface ActualizarPersonaPayload {
	nombre?: string;
	email?: string;
	rol?: string;
	departamento?: string;
	sede_id?: number | null;
	fecha_ingreso?: string;
}

export interface CatalogoRol {
	readonly id: number;
	slug: string;
	nombre: string;
}

export interface CatalogosPersonasResponse {
	data: {
		roles: CatalogoRol[];
		departamentos: { readonly id: number; nombre: string }[];
		sedes: { readonly id: number; nombre: string }[];
	};
}
