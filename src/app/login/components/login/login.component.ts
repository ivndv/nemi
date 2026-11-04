import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	Renderer2,
	signal,
	ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { ThemeService } from "../../../shared/services/theme.service";
import { AuthService } from "../../services/auth.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-login",
	standalone: false,
	templateUrl: "./login.component.html",
	styleUrl: "./login.component.css",
})
export class LoginComponent implements OnInit, OnDestroy {
	loginForm: FormGroup;
	errorMessage: string = "";
	noticeMessage: string = "";
	isPasswordVisible = signal(false);
	timeoutRef: ReturnType<typeof setTimeout> | null = null;
	isLoading = signal(false);
	// Paso actual del escenario: intro de marca o formulario de acceso
	readonly step = signal<"intro" | "form">("intro");
	private destroy$ = new Subject<void>();

	@ViewChild("passwordInput") passwordInput!: ElementRef;
	@ViewChild("emailInput") emailInput?: ElementRef<HTMLInputElement>;
	@ViewChild("introCta") introCta?: ElementRef<HTMLButtonElement>;

	constructor(
		private cdr: ChangeDetectorRef,
		private fb: FormBuilder,
		private authService: AuthService, // Servicio de autenticación
		private router: Router,
		private renderer: Renderer2, // Manipulación segura del DOM
		public themeService: ThemeService,
	) {
		// Inicialización del formulario con validaciones
		this.loginForm = this.fb.group({
			email: ["", [Validators.required, Validators.email]],
			password: ["", [Validators.required, Validators.minLength(6)]],
		});
	}

	ngOnInit(): void {
		this.noticeMessage = this.authService.consumirMensaje();
		if (this.noticeMessage) this.cdr.markForCheck();
	}

	toggleTheme(): void {
		this.themeService.toggle();
		this.cdr.markForCheck();
	}

	// Muestra el formulario y enfoca el correo cuando termina el render
	abrirLogin(): void {
		this.step.set("form");
		this.cdr.markForCheck();
		setTimeout(() => this.emailInput?.nativeElement.focus(), 0);
	}

	// Regresa a la intro y devuelve el foco al CTA
	volver(): void {
		this.step.set("intro");
		this.cdr.markForCheck();
		setTimeout(() => this.introCta?.nativeElement.focus(), 0);
	}

	get isDarkMode(): boolean {
		return this.themeService.isDark();
	}

	get themeIcon(): string {
		return this.isDarkMode ? "ph:sun" : "ph:moon";
	}

	// Alterna visibilidad de contraseña
	togglePasswordVisibility() {
		this.isPasswordVisible.update((v: boolean) => !v);
		this.renderer.setProperty(
			this.passwordInput.nativeElement,
			"type",
			this.isPasswordVisible() ? "text" : "password",
		);

		// Oculta automáticamente después de 10 segundos
		if (this.isPasswordVisible()) {
			if (this.timeoutRef) clearTimeout(this.timeoutRef);
			this.timeoutRef = setTimeout(() => {
				this.isPasswordVisible.set(false);
				this.renderer.setProperty(
					this.passwordInput.nativeElement,
					"type",
					"password",
				);
			}, 10000);
		}
	}

	// Envío de formulario
	onSubmit() {
		if (this.loginForm.valid) {
			this.isLoading.set(true);
			this.errorMessage = "";
			this.noticeMessage = "";
			const { email, password } = this.loginForm.value;

			this.authService
				.login(email, password)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						this.isLoading.set(false);
						this.cdr.markForCheck();
						// Guarda el token y datos del usuario
						this.authService.saveToken(
							response.data.token,
							response.data.userData,
						);
						this.router.navigate([
							this.authService.isEmpleado() ? "/gestion-activos" : "/dashboard",
						]);
					},
					error: (error) => {
						this.isLoading.set(false);
						this.errorMessage = error.error?.error || "Error al iniciar sesión";
						this.cdr.markForCheck();
					},
				});
		}
	}

	// Limpieza al destruir componente
	ngOnDestroy() {
		if (this.timeoutRef) clearTimeout(this.timeoutRef);
		this.destroy$.next();
		this.destroy$.complete();
	}
}
