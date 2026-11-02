import { inject, Pipe, type PipeTransform } from "@angular/core";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";

export type FormatoFecha =
	| "fecha"
	| "fechaCorta"
	| "fechaTexto"
	| "hora"
	| "fechaHora";

/**
 * Formatea fechas respetando la zona horaria de negocio.
 *
 * - `YYYY-MM-DD` se trata como fecha sin hora y no se desplaza.
 * - Los instantes (ISO con hora) se convierten a la zona configurada.
 */
@Pipe({
	name: "fechaApp",
	standalone: true,
	pure: false,
})
export class FechaAppPipe implements PipeTransform {
	private readonly preferencias = inject(PreferenciasService);

	transform(
		value: string | Date | null | undefined,
		formato: FormatoFecha = "fecha",
	): string {
		if (!value) return "—";

		this.preferencias.cargar();

		const soloFecha =
			typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
		const fecha =
			typeof value === "string"
				? this.parsear(value, soloFecha)
				: new Date(value);

		if (Number.isNaN(fecha.getTime())) return "—";

		const opciones: Intl.DateTimeFormatOptions = {
			timeZone: soloFecha ? "UTC" : this.preferencias.zonaHoraria(),
		};

		if (formato === "hora") {
			opciones.hour = "2-digit";
			opciones.minute = "2-digit";
			opciones.hour12 = false;
		} else {
			opciones.day = "2-digit";
			opciones.month = formato === "fechaTexto" ? "short" : "2-digit";
			opciones.year = formato === "fechaCorta" ? "2-digit" : "numeric";

			if (formato === "fechaHora") {
				opciones.hour = "2-digit";
				opciones.minute = "2-digit";
				opciones.hour12 = false;
			}
		}

		return new Intl.DateTimeFormat("es-MX", opciones).format(fecha);
	}

	private parsear(value: string, soloFecha: boolean): Date {
		if (!soloFecha) return new Date(value);

		const [year, month, day] = value.split("-").map(Number);
		return new Date(Date.UTC(year, month - 1, day));
	}
}
