import { Dialog } from "@angular/cdk/dialog";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom, Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { ActivoService } from "../../activo/service/activo.service";
import { DatosService } from "../../activo/service/datos.service";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import type { ActivoListItem } from "../../models/activo.interface";
import type {
	AbrirMantenimientoIncidenciaPayload,
	CrearIncidenciaPayload,
	IncidenciaItem,
} from "../../models/incidencia.interface";
import {
	type GenerarMantenimientoData,
	GenerarMantenimientoDialogComponent,
} from "../dialogs/generar-mantenimiento-dialog.component";
import {
	type ReportarIncidenciaData,
	ReportarIncidenciaDialogComponent,
} from "../dialogs/reportar-incidencia-dialog.component";
import {
	type FiltrosIncidencia,
	IncidenciaService,
} from "../services/incidencia.service";

interface Opcion {
	id: number;
	nombre: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-incidencias",
	standalone: false,
	templateUrl: "./lista-incidencias.component.html",
	styleUrl: "./lista-incidencias.component.css",
})
export class ListaIncidenciasComponent implements OnInit, OnDestroy {
	activos: ActivoListItem[] = [];
	personas: Opcion[] = [];
	proveedores: Opcion[] = [];

	paginaActual = 1;
	limitePorPagina = 10;
	filtros: FiltrosIncidencia = {};

	private readonly incidenciaService = inject(IncidenciaService);
	private readonly activoService = inject(ActivoService);
	private readonly datosService = inject(DatosService);
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);
	private readonly dialog = inject(Dialog);
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly refresco = signal(0);
	private readonly destroy$ = new Subject<void>();

	private readonly query = injectQuery(() => ({
		queryKey: [
			"incidencias",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				filtros: this.filtros,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.incidenciaService.listar(
					this.paginaActual,
					this.limitePorPagina,
					this.filtros,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get incidencias(): IncidenciaItem[] {
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
			"Error al cargar las incidencias",
		);
	}

	ngOnInit(): void {
		this.cargarCatalogos();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	puedeAtender(): boolean {
		return this.authService.puedeMantenimiento();
	}

	cargarIncidencias(): void {
		this.refresco.update((valor) => valor + 1);
	}

	aplicarFiltro(clave: keyof FiltrosIncidencia, event: Event): void {
		const valor = (event.target as HTMLSelectElement).value;
		this.filtros = { ...this.filtros, [clave]: valor || undefined };
		this.paginaActual = 1;
		this.cargarIncidencias();
	}

	cambiarPagina(pagina: number): void {
		if (pagina < 1 || pagina > this.pagination.totalPages) return;
		this.paginaActual = pagina;
		this.cargarIncidencias();
	}

	verDetalle(id: number): void {
		this.router.navigate(["/incidencias", id]);
	}

	reportar(): void {
		if (this.activos.length === 0) {
			Swal.fire({
				icon: "info",
				title: "Sin activos",
				text: "No tienes activos disponibles para reportar una incidencia.",
				confirmButtonColor: "#1e293b",
			});
			return;
		}

		const ref = this.dialog.open<
			CrearIncidenciaPayload | null,
			ReportarIncidenciaData
		>(ReportarIncidenciaDialogComponent, {
			data: {
				activos: this.activos.map((activo) => ({
					id: activo.id,
					nombre: activo.nombre,
				})),
			},
			width: "560px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.incidenciaService.crear(payload).subscribe({
				next: () => {
					this.avisar("Incidencia reportada");
					this.cargarIncidencias();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	cambiarEstado(incidencia: IncidenciaItem): void {
		Swal.fire({
			title: `Incidencia #${incidencia.id}`,
			input: "select",
			inputOptions: {
				abierta: "Abierta",
				en_revision: "En revisión",
				resuelta: "Resuelta",
				cerrada: "Cerrada",
			},
			inputValue: incidencia.estado,
			showCancelButton: true,
			confirmButtonText: "Guardar",
			cancelButtonText: "Cancelar",
			confirmButtonColor: "#1e293b",
		}).then((resultado) => {
			if (!resultado.isConfirmed || !resultado.value) return;

			this.incidenciaService
				.cambiarEstado(
					incidencia.id,
					resultado.value as "abierta" | "en_revision" | "resuelta" | "cerrada",
				)
				.subscribe({
					next: () => {
						this.avisar("Incidencia actualizada");
						this.cargarIncidencias();
					},
					error: (error) => this.avisarError(error),
				});
		});
	}

	abrirMantenimiento(incidencia: IncidenciaItem): void {
		const ref = this.dialog.open<
			AbrirMantenimientoIncidenciaPayload | null,
			GenerarMantenimientoData
		>(GenerarMantenimientoDialogComponent, {
			data: {
				incidencia,
				personas: this.personas,
				proveedores: this.proveedores,
			},
			width: "640px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.incidenciaService
				.abrirMantenimiento(incidencia.id, payload)
				.subscribe({
					next: () => {
						this.avisar("Mantenimiento abierto desde la incidencia");
						this.cargarIncidencias();
					},
					error: (error) => this.avisarError(error),
				});
		});
	}
	trackById(_indice: number, incidencia: IncidenciaItem): number {
		return incidencia.id;
	}

	private cargarCatalogos(): void {
		this.activoService
			.getActivos(1, 100)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (respuesta) => {
					this.activos = respuesta.data;
					this.cdr.markForCheck();
				},
				error: () => {},
			});

		this.datosService
			.obtenerDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (respuesta) => {
					this.personas = (respuesta.data.duenos ?? []).map((p) => ({
						id: p.id,
						nombre: p.nombre,
					}));
					this.proveedores = (respuesta.data.proveedores ?? []).map((p) => ({
						id: p.id,
						nombre: p.nombre,
					}));
					this.cdr.markForCheck();
				},
				error: () => {},
			});
	}

	private avisar(mensaje: string): void {
		Swal.fire({
			toast: true,
			position: "top-end",
			icon: "success",
			title: mensaje,
			showConfirmButton: false,
			timer: 2500,
		});
	}

	private avisarError(error: { error?: { error?: string } }): void {
		Swal.fire({
			icon: "error",
			title: "No se pudo completar",
			text: error.error?.error ?? "Error inesperado",
			confirmButtonColor: "#1e293b",
		});
	}
}
