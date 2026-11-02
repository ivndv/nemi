import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import type {
	CrearRenovacionPayload,
	LicenciaDetalle,
} from "../../models/licencia.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface RenovarLicenciaData {
	licencia: LicenciaDetalle;
}

@Component({
	selector: "app-renovar-licencia-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./renovar-licencia-dialog.component.html",
})
export class RenovarLicenciaDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<CrearRenovacionPayload | null>>(DialogRef);
	private readonly preferencias = inject(PreferenciasService);
	readonly data = inject<RenovarLicenciaData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		fecha: [this.preferencias.fechaHoy(), Validators.required],
		asientos: [
			this.data.licencia.asientos_comprados,
			[Validators.required, Validators.min(1)],
		],
		costo: [
			this.data.licencia.costo
				? Number(this.data.licencia.costo)
				: (null as number | null),
		],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: CrearRenovacionPayload = {
			fecha: value.fecha as string,
			asientos: Number(value.asientos),
			costo: value.costo === null ? undefined : Number(value.costo),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
