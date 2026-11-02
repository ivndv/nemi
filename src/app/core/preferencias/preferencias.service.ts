import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment";

interface AjustesSistemaResponse {
	data: {
		zona_horaria: string;
		formato_fecha: string;
		moneda: string;
	};
}

/**
 * Preferencias del sistema que necesita el frontend para presentar datos.
 * La zona horaria se usa para formatear instantes (TIMESTAMP) en la zona
 * de negocio configurada, sin importar la zona del navegador.
 */
@Injectable({
	providedIn: "root",
})
export class PreferenciasService {
	private readonly apiUrl = `${environment.apiUrl}/configuracion/ajustes`;
	readonly zonaHoraria = signal("America/Mexico_City");

	private cargando = false;

	constructor(private http: HttpClient) {}

	cargar(): void {
		if (this.cargando) return;
		this.cargando = true;

		this.http.get<AjustesSistemaResponse>(this.apiUrl).subscribe({
			next: (response) => {
				if (response.data?.zona_horaria) {
					this.zonaHoraria.set(response.data.zona_horaria);
				}
			},
			error: () => {
				this.cargando = false;
			},
		});
	}

	setZonaHoraria(zona: string): void {
		if (zona) this.zonaHoraria.set(zona);
	}

	/** Fecha de hoy (YYYY-MM-DD) en la zona de negocio. */
	fechaHoy(): string {
		this.cargar();

		const partes = new Intl.DateTimeFormat("en-CA", {
			timeZone: this.zonaHoraria(),
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(new Date());

		const valor = (tipo: string) =>
			partes.find((parte) => parte.type === tipo)?.value ?? "";

		return `${valor("year")}-${valor("month")}-${valor("day")}`;
	}

	/** Fecha de hoy formateada como dd/MM/yyyy en la zona de negocio. */
	fechaHoyFormateada(): string {
		return new Intl.DateTimeFormat("es-MX", {
			timeZone: this.zonaHoraria(),
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(new Date());
	}
}
