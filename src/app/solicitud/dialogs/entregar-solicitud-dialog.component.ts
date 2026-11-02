import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import type {
	EntregarSolicitudPayload,
	SolicitudItem,
} from "../../models/solicitud.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface EntregarSolicitudData {
	solicitud: SolicitudItem;
	activos: { id: number; nombre: string }[];
	ubicaciones: { id: number; nombre: string }[];
}

@Component({
	selector: "app-entregar-solicitud-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./entregar-solicitud-dialog.component.html",
})
export class EntregarSolicitudDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<EntregarSolicitudPayload | null>>(DialogRef);
	readonly data = inject<EntregarSolicitudData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		activo_id: [null as number | null, Validators.required],
		ubicacion_id: [null as number | null, Validators.required],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: EntregarSolicitudPayload = {
			activo_id: Number(value.activo_id),
			ubicacion_id: Number(value.ubicacion_id),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
