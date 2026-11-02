import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import type { CrearMantenimientoPayload } from "../../models/mantenimiento.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface AbrirMantenimientoData {
	activos: { id: number; nombre: string }[];
	personas: { id: number; nombre: string }[];
	proveedores: { id: number; nombre: string }[];
}

@Component({
	selector: "app-abrir-mantenimiento-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./abrir-mantenimiento-dialog.component.html",
})
export class AbrirMantenimientoDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<CrearMantenimientoPayload | null>>(DialogRef);
	private readonly preferencias = inject(PreferenciasService);
	readonly data = inject<AbrirMantenimientoData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		activo_id: [null as number | null, Validators.required],
		responsable: ["interno", Validators.required],
		tecnico_id: [null as number | null, Validators.required],
		proveedor_id: [null as number | null],
		tipo: ["correctivo", Validators.required],
		fecha_salida: [this.preferencias.fechaHoy(), Validators.required],
		diagnostico: [""],
		costo: [null as number | null],
	});

	constructor() {
		this.form.get("responsable")?.valueChanges.subscribe((value) => {
			const tecnico = this.form.get("tecnico_id");
			const proveedor = this.form.get("proveedor_id");

			if (value === "interno") {
				tecnico?.setValidators(Validators.required);
				proveedor?.clearValidators();
				proveedor?.setValue(null);
			} else {
				proveedor?.setValidators(Validators.required);
				tecnico?.clearValidators();
				tecnico?.setValue(null);
			}

			tecnico?.updateValueAndValidity();
			proveedor?.updateValueAndValidity();
		});
	}

	get esInterno(): boolean {
		return this.form.get("responsable")?.value === "interno";
	}

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: CrearMantenimientoPayload = {
			activo_id: Number(value.activo_id),
			responsable: value.responsable as "interno" | "externo",
			tipo: value.tipo as "preventivo" | "correctivo",
			fecha_salida: value.fecha_salida as string,
			diagnostico: value.diagnostico || undefined,
			costo: value.costo === null ? undefined : Number(value.costo),
			...(value.responsable === "interno"
				? { tecnico_id: Number(value.tecnico_id) }
				: { proveedor_id: Number(value.proveedor_id) }),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
