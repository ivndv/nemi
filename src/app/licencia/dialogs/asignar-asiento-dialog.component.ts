import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import type { AsignarAsientoPayload } from "../../models/licencia.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface AsignarAsientoData {
	personas: { id: number; nombre: string }[];
	activos: { id: number; nombre: string }[];
}

@Component({
	selector: "app-asignar-asiento-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./asignar-asiento-dialog.component.html",
})
export class AsignarAsientoDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<AsignarAsientoPayload | null>>(DialogRef);
	private readonly preferencias = inject(PreferenciasService);
	readonly data = inject<AsignarAsientoData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		destino_tipo: ["persona", Validators.required],
		persona_id: [null as number | null, Validators.required],
		activo_id: [null as number | null],
		fecha_asignacion: [this.preferencias.fechaHoy(), Validators.required],
	});

	constructor() {
		this.form.get("destino_tipo")?.valueChanges.subscribe((value) => {
			const persona = this.form.get("persona_id");
			const activo = this.form.get("activo_id");

			if (value === "persona") {
				persona?.setValidators(Validators.required);
				activo?.clearValidators();
				activo?.setValue(null);
			} else {
				activo?.setValidators(Validators.required);
				persona?.clearValidators();
				persona?.setValue(null);
			}

			persona?.updateValueAndValidity();
			activo?.updateValueAndValidity();
		});
	}

	get esPersona(): boolean {
		return this.form.get("destino_tipo")?.value === "persona";
	}

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: AsignarAsientoPayload = {
			destino_tipo: value.destino_tipo as "persona" | "activo",
			fecha_asignacion: value.fecha_asignacion as string,
			...(value.destino_tipo === "persona"
				? { persona_id: Number(value.persona_id) }
				: { activo_id: Number(value.activo_id) }),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
