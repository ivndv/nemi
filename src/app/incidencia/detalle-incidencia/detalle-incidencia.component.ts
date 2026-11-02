import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import type { IncidenciaItem } from "../../models/incidencia.interface";
import { IncidenciaService } from "../services/incidencia.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-incidencia",
	standalone: false,
	templateUrl: "./detalle-incidencia.component.html",
	styleUrl: "./detalle-incidencia.component.css",
})
export class DetalleIncidenciaComponent implements OnInit, OnDestroy {
	incidencia: IncidenciaItem | null = null;
	cargando = true;
	errorMessage = "";
	private destroy$ = new Subject<void>();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private incidenciaService: IncidenciaService,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			const id = Number(params.get("id"));
			if (Number.isNaN(id)) {
				this.errorMessage = "ID inválido";
				this.cargando = false;
				return;
			}
			this.cargar(id);
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	volver(): void {
		this.router.navigate(["/incidencias"]);
	}

	private cargar(id: number): void {
		this.cargando = true;
		this.incidenciaService.detalle(id).subscribe({
			next: (respuesta) => {
				this.incidencia = respuesta.data;
				this.cargando = false;
				this.errorMessage = "";
				this.cdr.markForCheck();
			},
			error: (error) => {
				this.errorMessage =
					error.error?.error ?? "No se pudo cargar la incidencia";
				this.cargando = false;
				this.cdr.markForCheck();
			},
		});
	}
}
