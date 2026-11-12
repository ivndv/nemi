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
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom, Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { CatalogosFacade } from "../../core/catalogos/catalogos.facade";
import { getHttpErrorMessage } from "../../core/http/http-error";
import type { PersonaListItem } from "../../models/persona.interface";
import {
	type UsuarioFormData,
	UsuarioFormDialogComponent,
	type UsuarioFormResult,
} from "../dialogs/usuario-form-dialog.component";
import {
	type FiltrosPersona,
	PersonaService,
} from "../services/persona.service";

interface Opcion {
	id: number;
	nombre: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-usuarios",
	standalone: false,
	templateUrl: "./lista-usuarios.component.html",
	styleUrl: "./lista-usuarios.component.css",
})
export class ListaUsuariosComponent implements OnInit, OnDestroy {
	roles: Opcion[] = [];
	departamentos: Opcion[] = [];

	paginaActual = 1;
	limitePorPagina = 10;
	filtros: FiltrosPersona = {};

	private readonly personaService = inject(PersonaService);
	private readonly catalogosFacade = inject(CatalogosFacade);
	private readonly dialog = inject(Dialog);
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly refresco = signal(0);
	private readonly destroy$ = new Subject<void>();
	private searchTimer: ReturnType<typeof setTimeout> | null = null;

	private readonly query = injectQuery(() => ({
		queryKey: [
			"personas",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				filtros: this.filtros,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.personaService.listar(
					this.paginaActual,
					this.limitePorPagina,
					this.filtros,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get personas(): PersonaListItem[] {
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
			"Error al cargar los usuarios",
		);
	}

	ngOnInit(): void {
		this.cargarCatalogos();
	}

	ngOnDestroy(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.destroy$.next();
		this.destroy$.complete();
	}

	cargarPersonas(): void {
		this.refresco.update((valor) => valor + 1);
	}

	onSearchInput(event: Event): void {
		const valor = (event.target as HTMLInputElement).value;
		this.filtros = { ...this.filtros, search: valor || undefined };
		this.paginaActual = 1;
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => this.cargarPersonas(), 400);
	}

	aplicarRol(event: Event): void {
		const valor = (event.target as HTMLSelectElement).value;
		this.filtros = {
			...this.filtros,
			rol_id: valor ? Number(valor) : undefined,
		};
		this.paginaActual = 1;
		this.cargarPersonas();
	}

	cambiarPagina(pagina: number): void {
		if (pagina < 1 || pagina > this.pagination.totalPages) return;
		this.paginaActual = pagina;
		this.cargarPersonas();
	}

	crear(): void {
		const ref = this.dialog.open<UsuarioFormResult | null, UsuarioFormData>(
			UsuarioFormDialogComponent,
			{
				data: { roles: this.roles, departamentos: this.departamentos },
				width: "620px",
				maxWidth: "92vw",
				autoFocus: "first-tabbable",
			},
		);

		ref.closed.subscribe((resultado) => {
			if (resultado?.tipo !== "crear") return;

			this.personaService.crear(resultado.payload).subscribe({
				next: () => {
					this.avisar("Usuario creado");
					this.catalogosFacade.invalidar();
					this.cargarPersonas();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	editar(persona: PersonaListItem): void {
		const ref = this.dialog.open<UsuarioFormResult | null, UsuarioFormData>(
			UsuarioFormDialogComponent,
			{
				data: {
					persona,
					roles: this.roles,
					departamentos: this.departamentos,
				},
				width: "620px",
				maxWidth: "92vw",
				autoFocus: "first-tabbable",
			},
		);

		ref.closed.subscribe((resultado) => {
			if (resultado?.tipo !== "editar") return;

			this.personaService.actualizar(persona.id, resultado.payload).subscribe({
				next: () => {
					this.avisar("Usuario actualizado");
					this.catalogosFacade.invalidar();
					this.cargarPersonas();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	cambiarPassword(persona: PersonaListItem): void {
		Swal.fire({
			title: `Contraseña de ${persona.nombre}`,
			input: "password",
			inputPlaceholder: "Nueva contraseña (mínimo 12)",
			showCancelButton: true,
			confirmButtonText: "Actualizar",
			cancelButtonText: "Cancelar",
			buttonsStyling: false,
			customClass: {
				popup: "premium-swal-popup",
				title: "premium-swal-title",
				htmlContainer: "premium-swal-html",
				confirmButton: "premium-swal-confirm",
				cancelButton: "premium-swal-cancel",
			},
			preConfirm: (valor) => {
				if (!valor || valor.length < 12) {
					Swal.showValidationMessage(
						"La contraseña debe tener al menos 12 caracteres",
					);
					return false;
				}
				return valor as string;
			},
		}).then((resultado) => {
			if (!resultado.isConfirmed || !resultado.value) return;

			this.personaService
				.cambiarPassword(persona.id, resultado.value)
				.subscribe({
					next: () => this.avisar("Contraseña actualizada"),
					error: (error) => this.avisarError(error),
				});
		});
	}

	estaBloqueada(persona: PersonaListItem): boolean {
		if (!persona.bloqueado_hasta) return false;
		return new Date(persona.bloqueado_hasta) > new Date();
	}

	desbloquear(persona: PersonaListItem): void {
		this.personaService.desbloquear(persona.id).subscribe({
			next: () => {
				this.avisar("Usuario desbloqueado");
				this.cargarPersonas();
			},
			error: (error) => this.avisarError(error),
		});
	}

	darDeBaja(persona: PersonaListItem): void {
		Swal.fire({
			icon: "warning",
			title: `Dar de baja a ${persona.nombre}`,
			text: "El usuario dejará de aparecer y su correo quedará libre.",
			showCancelButton: true,
			confirmButtonText: "Dar de baja",
			cancelButtonText: "Cancelar",
			buttonsStyling: false,
			customClass: {
				popup: "premium-swal-popup",
				title: "premium-swal-title",
				htmlContainer: "premium-swal-html",
				confirmButton: "premium-swal-confirm",
				cancelButton: "premium-swal-cancel",
			},
		}).then((resultado) => {
			if (!resultado.isConfirmed) return;

			this.personaService.darDeBaja(persona.id).subscribe({
				next: () => {
					this.avisar("Usuario dado de baja");
					this.catalogosFacade.invalidar();
					this.cargarPersonas();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}

	trackById(_indice: number, persona: PersonaListItem): number {
		return persona.id;
	}

	private cargarCatalogos(): void {
		this.personaService
			.catalogos()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (respuesta) => {
					this.roles = respuesta.data.roles.map((rol) => ({
						id: rol.id,
						nombre: rol.nombre,
					}));
					this.departamentos = respuesta.data.departamentos.map((d) => ({
						id: d.id,
						nombre: d.nombre,
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
