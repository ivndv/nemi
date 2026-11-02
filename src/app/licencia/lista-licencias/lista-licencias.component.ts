import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnDestroy,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom } from "rxjs";
import { getHttpErrorMessage } from "../../core/http/http-error";
import type { LicenciaItem } from "../../models/licencia.interface";
import { LicenciaService } from "../services/licencia.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-licencias",
	standalone: false,
	templateUrl: "./lista-licencias.component.html",
	styleUrl: "./lista-licencias.component.css",
})
export class ListaLicenciasComponent implements OnDestroy {
	paginaActual = 1;
	limitePorPagina = 10;
	orden: "asc" | "desc" = "asc";
	searchTerm = "";

	private readonly licenciaService = inject(LicenciaService);
	private readonly router = inject(Router);
	private readonly refresco = signal(0);
	private searchTimer: ReturnType<typeof setTimeout> | null = null;

	private readonly query = injectQuery(() => ({
		queryKey: [
			"licencias",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				search: this.searchTerm,
				orden: this.orden,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.licenciaService.listar(
					this.paginaActual,
					this.limitePorPagina,
					this.searchTerm,
					this.orden,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get licencias(): LicenciaItem[] {
		return this.query.data()?.data ?? [];
	}

	get pagination() {
		return (
			this.query.data()?.pagination ?? {
				total: 0,
				totalPages: 0,
				page: this.paginaActual,
				limit: this.limitePorPagina,
			}
		);
	}

	get cargando(): boolean {
		return this.query.isPending();
	}

	get errorMessage(): string {
		return getHttpErrorMessage(
			this.query.error(),
			"Error al cargar las licencias",
		);
	}

	ngOnDestroy(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
	}

	cargarLicencias(): void {
		this.refresco.update((valor) => valor + 1);
	}

	onSearchInput(event: Event): void {
		const valor = (event.target as HTMLInputElement).value;
		this.searchTerm = valor;
		this.paginaActual = 1;
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => this.cargarLicencias(), 400);
	}

	cambiarOrden(event: Event): void {
		this.orden = (event.target as HTMLSelectElement).value as "asc" | "desc";
		this.paginaActual = 1;
		this.cargarLicencias();
	}

	cambiarPagina(pagina: number): void {
		if (pagina < 1 || pagina > this.pagination.totalPages) return;
		this.paginaActual = pagina;
		this.cargarLicencias();
	}

	verDetalle(id: number): void {
		this.router.navigate(["/licencias", id]);
	}

	porcentaje(licencia: LicenciaItem): number {
		if (!licencia.asientos_comprados) return 0;
		return Math.min(
			Math.round((licencia.ocupados / licencia.asientos_comprados) * 100),
			100,
		);
	}

	claseEstado(estado: LicenciaItem["estado"]): string {
		return `chip chip-${estado}`;
	}

	trackById(_indice: number, licencia: LicenciaItem): number {
		return licencia.activo_id;
	}
}
