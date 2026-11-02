import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import type {
	CerrarMantenimientoPayload,
	MantenimientoItem,
} from "../../models/mantenimiento.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface CerrarMantenimientoData {
	mantenimiento: MantenimientoItem;
}

@Component({
	selector: "app-cerrar-mantenimiento-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./cerrar-mantenimiento-dialog.component.html",
})
export class CerrarMantenimientoDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<CerrarMantenimientoPayload | null>>(DialogRef);
	private readonly preferencias = inject(PreferenciasService);
	readonly data = inject<CerrarMantenimientoData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		fecha_retorno: [this.preferencias.fechaHoy(), Validators.required],
		diagnostico: [this.data.mantenimiento.diagnostico ?? ""],
		costo: [
			this.data.mantenimiento.costo
				? Number(this.data.mantenimiento.costo)
				: (null as number | null),
		],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: CerrarMantenimientoPayload = {
			fecha_retorno: value.fecha_retorno as string,
			diagnostico: value.diagnostico || undefined,
			costo: value.costo === null ? undefined : Number(value.costo),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
