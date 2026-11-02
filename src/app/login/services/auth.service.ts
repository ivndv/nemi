import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { environment } from "../../../environments/environment";
import {
	LoginResponse,
	TokenPayload,
	UserData,
} from "../../models/auth.interface";

// Normaliza un rol para compararlo sin acentos ni mayúsculas
function normalizarRol(valor: string): string {
	return valor
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

@Injectable({
	providedIn: "root",
})
export class AuthService {
	// URL base del backend
	private apiUrl = `${environment.apiUrl}/auth`;
	// Claves para almacenar el token y datos del usuario en localStorage
	private tokenKey = "authToken";
	private userKey = "user";
	private readonly messageKey = "authMessage";
	// Sujeto para manejar el evento de logout
	private logoutSubject = new Subject<void>();
	// Datos del usuario en memoria para actualizaciones reactivas
	private readonly userSubject = new BehaviorSubject<UserData | null>(
		this.getUserData(),
	);
	readonly user$ = this.userSubject.asObservable();

	constructor(
		private http: HttpClient,
		private router: Router,
	) {}

	/**
	 * Realiza la autenticación del usuario enviando las credenciales al backend.
	 * @param email - Correo electrónico del usuario.
	 * @param contrasena - Contraseña del usuario.
	 * @returns Observable con la respuesta del backend.
	 */
	login(email: string, contrasena: string): Observable<LoginResponse> {
		const body = { email, contrasena };
		return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body);
	}

	/**
	 * Guarda el token JWT y los datos del usuario en localStorage.
	 * @param token - Token JWT a guardar.
	 * @param userData - Datos del usuario a guardar (opcional).
	 */
	saveToken(token: string, userData?: UserData): void {
		if (!token) {
			console.error("El token no puede ser nulo o vacío.");
			return;
		}

		localStorage.setItem(this.tokenKey, token); // Guarda el token
		if (userData) {
			localStorage.setItem(this.userKey, JSON.stringify(userData)); // Guarda datos del usuario
			this.userSubject.next(userData);
		}
	}

	onLogout() {
		return this.logoutSubject.asObservable();
	}

	/**
	 * Cierra sesión eliminando el token y los datos del usuario, y redirige al login.
	 */
	logout(motivo?: string): void {
		localStorage.removeItem(this.tokenKey); // Elimina el token
		localStorage.removeItem(this.userKey); // Elimina los datos del usuario
		if (motivo) sessionStorage.setItem(this.messageKey, motivo);
		this.userSubject.next(null);
		this.logoutSubject.next(); // Notificar a los componentes
		this.router.navigate(["/login"]); // Redirige al login
	}

	/**
	 * Cierra la sesión en todos los dispositivos del usuario.
	 */
	logoutAll(): Observable<{ message: string }> {
		return this.http.post<{ message: string }>(`${this.apiUrl}/logout-all`, {});
	}

	/**
	 * Lee y limpia el mensaje que se muestra en el login tras un cierre de sesión.
	 */
	consumirMensaje(): string {
		const mensaje = sessionStorage.getItem(this.messageKey) ?? "";
		if (mensaje) sessionStorage.removeItem(this.messageKey);
		return mensaje;
	}

	/**
	 * Verifica si el usuario está autenticado.
	 * @returns `true` si el token existe y no ha expirado, `false` en caso contrario.
	 */
	isLoggedIn(): boolean {
		const token = this.getToken();
		if (!token) return false;

		try {
			const decodedToken = this.decodeToken(token);
			const currentTime = Date.now() / 1000; // Tiempo actual en segundos
			return decodedToken.exp > currentTime; // Retorna `true` si el token no ha expirado
		} catch (error) {
			console.error("Error al verificar el token:", error);
			return false;
		}
	}

	/**
	 * Obtiene el token JWT almacenado en localStorage.
	 * @returns El token JWT o `null` si no existe.
	 */
	getToken(): string | null {
		return localStorage.getItem(this.tokenKey);
	}

	/**
	 * Decodifica un token JWT para extraer su contenido.
	 * @param token - Token JWT a decodificar.
	 * @returns El contenido del token decodificado.
	 * @throws Error si el token es inválido o corrupto.
	 */
	private decodeToken(token: string): TokenPayload {
		try {
			const payload = token.split(".")[1]; // Extrae la parte del payload
			return JSON.parse(atob(payload)); // Decodifica el payload
		} catch (error) {
			console.error("Error al decodificar el token:", error);
			throw new Error("Token inválido o corrupto.");
		}
	}

	/**
	 * Obtiene los datos del usuario almacenados en localStorage.
	 * @returns Los datos del usuario o `null` si no existen.
	 */
	getUserData(): UserData | null {
		const userData = localStorage.getItem(this.userKey);
		return userData ? JSON.parse(userData) : null;
	}

	/**
	 * Actualiza parcialmente los datos del usuario guardados en sesión.
	 */
	updateStoredUser(partial: Partial<UserData>): void {
		const actual = this.getUserData();
		if (!actual) return;

		const actualizado = { ...actual, ...partial };
		localStorage.setItem(this.userKey, JSON.stringify(actualizado));
		this.userSubject.next(actualizado);
	}

	/**
	 * Verifica si el usuario tiene un rol específico.
	 * @param role - Rol a verificar.
	 * @returns `true` si el usuario tiene el rol, `false` en caso contrario.
	 */
	hasRole(role: string): boolean {
		const user = this.getUserData();
		if (!user) return false;

		const buscado = normalizarRol(role);
		const actuales = [user.rol, user.rol_slug]
			.filter(Boolean)
			.map((valor) => normalizarRol(valor as string));

		return actuales.includes(buscado);
	}

	/**
	 * Verifica si el usuario tiene alguno de los roles indicados.
	 */
	hasAnyRole(roles: string[]): boolean {
		return roles.some((rol) => this.hasRole(rol));
	}

	/**
	 * Slug del rol actual (administrador, tecnico, almacen, empleado).
	 */
	getRolSlug(): string | null {
		const user = this.getUserData();
		return user?.rol_slug ?? null;
	}

	/**
	 * Verifica si el usuario es administrador.
	 */
	isAdmin(): boolean {
		return this.hasRole("Administrador");
	}

	/**
	 * Verifica si el usuario es técnico.
	 */
	isTecnico(): boolean {
		return this.hasRole("Técnico");
	}

	/**
	 * Verifica si el usuario es de almacén.
	 */
	isAlmacen(): boolean {
		return this.hasRole("Almacén");
	}

	/**
	 * Verifica si el usuario es empleado.
	 */
	isEmpleado(): boolean {
		return this.hasRole("Empleado");
	}

	/**
	 * Puede gestionar mantenimientos.
	 */
	puedeMantenimiento(): boolean {
		return this.isAdmin() || this.isTecnico();
	}

	/**
	 * Puede gestionar inventario y asignaciones.
	 */
	puedeOperar(): boolean {
		return this.hasAnyRole(["Administrador", "Técnico", "Almacén"]);
	}

	/**
	 * Verifica si el token JWT es válido y no ha expirado.
	 * @returns `true` si el token es válido, `false` en caso contrario.
	 */
	isTokenValid(): boolean {
		const token = this.getToken();
		if (!token) return false;

		try {
			const decodedToken = this.decodeToken(token);
			const currentTime = Date.now() / 1000; // Tiempo actual en segundos
			return decodedToken.exp > currentTime; // Retorna `true` si el token no ha expirado
		} catch (error) {
			console.error("Error al validar el token:", error);
			return false;
		}
	}
}
