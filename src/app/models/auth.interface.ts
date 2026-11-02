export interface UserData {
	readonly id: number;
	readonly email: string;
	nombre: string;
	rol: string;
	rol_slug: string;
	foto_url?: string;
	departamento?: string;
}

export interface LoginResponse {
	data: { readonly token: string; userData: UserData };
	message: string;
}

export interface TokenPayload {
	readonly id: number;
	readonly email: string;
	rol: string;
	readonly exp: number;
	readonly iat: number;
}
