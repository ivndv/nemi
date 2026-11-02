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
	CrearSolicitudPayload,
	EntregarSolicitudPayload,
	SolicitudItem,
} from "../../models/solicitud.interface";
import {
	type DecisionSolicitudData,
	DecisionSolicitudDialogComponent,
	type DecisionSolicitudResult,
} from "../dialogs/decision-solicitud-dialog.component";
import {
	type EntregarSolicitudData,
	EntregarSolicitudDialogComponent,
} from "../dialogs/entregar-solicitud-dialog.component";
import {
	type NuevaSolicitudData,
	NuevaSolicitudDialogComponent,
} from "../dialogs/nueva-solicitud-dialog.component";
import {
	type FiltrosSolicitud,
	SolicitudService,
} from "../services/solicitud.service";

interface Opcion {
	id: number;
	nombre: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-solicitudes",
	standalone: false,
	templateUrl: "./lista-solicitudes.component.html",
	styleUrl: "./lista-solicitudes.component.css",
})
export class ListaSolicitudesComponent implements OnInit, OnDestroy {
	tipos: Opcion[] = [];
	ubicaciones: Opcion[] = [];
	activos: ActivoListItem[] = [];

	paginaActual = 1;
	limitePorPagina = 10;
	filtros: FiltrosSolicitud = {};

	private readonly solicitudService = inject(SolicitudService);
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
			"solicitudes",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				filtros: this.filtros,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.solicitudService.listar(
					this.paginaActual,
					this.limitePorPagina,
					this.filtros,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get solicitudes(): SolicitudItem[] {
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
			"Error al cargar las solicitudes",
		);
	}

	ngOnInit(): void {
		this.cargarCatalogos();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	puedeAprobar(): boolean {
		return this.authService.puedeMantenimiento();
	}

	puedeEntregar(): boolean {
		return this.authService.puedeOperar();
	}

	cargarSolicitudes(): void {
		this.refresco.update((valor) => valor + 1);
	}

	aplicarFiltro(clave: keyof FiltrosSolicitud, event: Event): void {
		const valor = (event.target as HTMLSelectElement).value;
		this.filtros = { ...this.filtros, [clave]: valor || undefined };
		this.paginaActual = 1;
		this.cargarSolicitudes();
	}

	cambiarPagina(pagina: number): void {
		if (pagina < 1 || pagina > this.pagination.totalPages) return;
		this.paginaActual = pagina;
		this.cargarSolicitudes();
	}

	verDetalle(id: number): void {
		this.router.navigate(["/solicitudes", id]);
	}

	crear(): void {
		const ref = this.dialog.open<
			CrearSolicitudPayload | null,
			NuevaSolicitudData
		>(NuevaSolicitudDialogComponent, {
			data: { tipos: this.tipos },
			width: "560px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.solicitudService.crear(payload).subscribe({
				next: () => {
					this.avisar("Solicitud creada");
					this.cargarSolicitudes();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	aprobar(solicitud: SolicitudItem): void {
		this.decidir(solicitud, "aprobar");
	}

	rechazar(solicitud: SolicitudItem): void {
		this.decidir(solicitud, "rechazar");
	}

	private decidir(
		solicitud: SolicitudItem,
		decision: "aprobar" | "rechazar",
	): void {
		const ref = this.dialog.open<
			DecisionSolicitudResult | null,
			DecisionSolicitudData
		>(DecisionSolicitudDialogComponent, {
			data: { solicitud, decision },
			width: "520px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((resultado) => {
			if (!resultado) return;

			const peticion =
				decision === "aprobar"
					? this.solicitudService.aprobar(solicitud.id, resultado.comentario)
					: this.solicitudService.rechazar(solicitud.id, resultado.comentario);

			peticion.subscribe({
				next: () => {
					this.avisar(
						decision === "aprobar"
							? "Solicitud aprobada"
							: "Solicitud rechazada",
					);
					this.cargarSolicitudes();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	entregar(solicitud: SolicitudItem): void {
		if (this.activos.length === 0) {
			Swal.fire({
				icon: "info",
				title: "Sin activos disponibles",
				text: "No hay activos disponibles para entregar.",
				confirmButtonColor: "#1e293b",
			});
			return;
		}

		const ref = this.dialog.open<
			EntregarSolicitudPayload | null,
			EntregarSolicitudData
		>(EntregarSolicitudDialogComponent, {
			data: {
				solicitud,
				activos: this.activos.map((activo) => ({
					id: activo.id,
					nombre: activo.nombre,
				})),
				ubicaciones: this.ubicaciones,
			},
			width: "520px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.solicitudService.entregar(solicitud.id, payload).subscribe({
				next: () => {
					this.avisar("Solicitud entregada");
					this.cargarSolicitudes();
					this.cargarCatalogos();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	trackById(_indice: number, solicitud: SolicitudItem): number {
		return solicitud.id;
	}

	private cargarCatalogos(): void {
		this.activoService
			.getActivos(1, 100, "", "estado", "Disponible")
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
					this.tipos = (respuesta.data.tiposActivos ?? []).map((t) => ({
						id: t.id,
						nombre: t.nombre,
					}));
					this.ubicaciones = (respuesta.data.ubicaciones ?? []).map((u) => ({
						id: u.id,
						nombre: u.nombre,
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
