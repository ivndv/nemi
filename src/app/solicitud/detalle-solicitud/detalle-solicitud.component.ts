import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import type { SolicitudItem } from "../../models/solicitud.interface";
import { SolicitudService } from "../services/solicitud.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-solicitud",
	standalone: false,
	templateUrl: "./detalle-solicitud.component.html",
	styleUrl: "./detalle-solicitud.component.css",
})
export class DetalleSolicitudComponent implements OnInit, OnDestroy {
	solicitud: SolicitudItem | null = null;
	cargando = true;
	errorMessage = "";
	private destroy$ = new Subject<void>();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private solicitudService: SolicitudService,
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
		this.router.navigate(["/solicitudes"]);
	}

	private cargar(id: number): void {
		this.cargando = true;
		this.solicitudService.detalle(id).subscribe({
			next: (respuesta) => {
				this.solicitud = respuesta.data;
				this.cargando = false;
				this.errorMessage = "";
				this.cdr.markForCheck();
			},
			error: (error) => {
				this.errorMessage =
					error.error?.error ?? "No se pudo cargar la solicitud";
				this.cargando = false;
				this.cdr.markForCheck();
			},
		});
	}
}
