import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, throwError, timeout } from "rxjs";
import { AuthService } from "./auth.service";

const CODIGOS_SESION = new Set([
	"SIN_TOKEN",
	"TOKEN_EXPIRADO",
	"TOKEN_INVALIDO",
	"SESION_INVALIDADA",
	"CUENTA_INACTIVA",
]);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private authService: AuthService) {}

	intercept(
		req: HttpRequest<unknown>,
		next: HttpHandler,
	): Observable<HttpEvent<unknown>> {
		const requestId = this.crearRequestId();
		const token = this.authService.getToken();

		const headers: Record<string, string> = {
			Accept: "application/json",
			"x-request-id": requestId,
		};

		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		if (!(req.body instanceof FormData)) {
			headers["Content-Type"] = "application/json";
		}

		req = req.clone({ setHeaders: headers });

		const esReporte = req.url.includes("/reportes/generar");
		const timeoutMs =
			req.body instanceof FormData || esReporte ? 120_000 : 20_000;

		return next.handle(req).pipe(
			timeout(timeoutMs),
			catchError((error: unknown) => {
				if (error instanceof HttpErrorResponse) {
					const serverRequestId =
						error.headers.get("x-request-id") ?? requestId;

					Object.assign(error, { requestId: serverRequestId });

					const codigo = (error.error as { codigo?: string } | null)?.codigo;
					const esLogin = req.url.includes("/auth/login");

					if (
						error.status === 401 &&
						!esLogin &&
						codigo &&
						CODIGOS_SESION.has(codigo) &&
						this.authService.getToken()
					) {
						const mensaje =
							(error.error as { error?: string } | null)?.error ??
							"Tu sesión terminó. Vuelve a iniciar sesión.";
						this.authService.logout(mensaje);
					}

					console.error(
						`[HTTP ${error.status}] ${req.method} ${req.url} · requestId=${serverRequestId}`,
					);
				} else if ((error as Error)?.name === "TimeoutError") {
					console.error(
						`[HTTP TIMEOUT] ${req.method} ${req.url} · requestId=${requestId}`,
					);
				}

				return throwError(() => error);
			}),
		);
	}

	private crearRequestId(): string {
		if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
			return crypto.randomUUID();
		}

		return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
}
