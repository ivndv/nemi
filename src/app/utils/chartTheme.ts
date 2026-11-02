import { Chart, type ChartOptions } from "chart.js";

/**
 * Paleta sobria derivada del acento teal.
 * Se usa en dashboard y reportes para mantener el mismo lenguaje visual.
 */
export const CHART_PALETTE = [
	"#0f766e",
	"#0ea5e9",
	"#f59e0b",
	"#f43f5e",
	"#8b5cf6",
	"#22c55e",
	"#64748b",
];

export interface ChartTheme {
	text: string;
	muted: string;
	grid: string;
	surface: string;
	border: string;
}

export function getChartTheme(): ChartTheme {
	const dark = document.body.classList.contains("dark-mode");

	return {
		text: dark ? "#e7e5e4" : "#57534e",
		muted: dark ? "#a8a29e" : "#78716c",
		grid: dark ? "rgba(255, 255, 255, 0.07)" : "#f0efed",
		surface: dark ? "#141416" : "#ffffff",
		border: dark ? "#2a2a2e" : "#e7e5e4",
	};
}

/** Aplica la tipografía y colores base a todas las gráficas. */
export function applyChartDefaults(): void {
	const theme = getChartTheme();

	Chart.defaults.font.family =
		"'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";
	Chart.defaults.font.size = 11;
	Chart.defaults.color = theme.muted;
	Chart.defaults.borderColor = theme.grid;
}

export function pieChartOptions(): ChartOptions<"pie"> {
	const theme = getChartTheme();

	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "bottom",
				labels: {
					usePointStyle: true,
					pointStyle: "circle",
					boxWidth: 8,
					boxHeight: 8,
					padding: 16,
					color: theme.text,
					font: { family: "Instrument Sans", size: 11 },
				},
			},
			tooltip: {
				backgroundColor: theme.surface,
				titleColor: theme.text,
				bodyColor: theme.text,
				borderColor: theme.border,
				borderWidth: 1,
				padding: 10,
				cornerRadius: 8,
				displayColors: true,
				boxPadding: 4,
			},
		},
	};
}

export function barChartOptions(
	showLegend = false,
	axisTitles?: { x?: string; y?: string },
): ChartOptions<"bar"> {
	const theme = getChartTheme();

	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: showLegend,
				position: "bottom",
				labels: {
					usePointStyle: true,
					pointStyle: "circle",
					boxWidth: 8,
					boxHeight: 8,
					padding: 16,
					color: theme.text,
					font: { family: "Instrument Sans", size: 11 },
				},
			},
			tooltip: {
				backgroundColor: theme.surface,
				titleColor: theme.text,
				bodyColor: theme.text,
				borderColor: theme.border,
				borderWidth: 1,
				padding: 10,
				cornerRadius: 8,
				displayColors: false,
			},
		},
		scales: {
			x: {
				grid: { display: false },
				border: { display: false },
				ticks: {
					color: theme.muted,
					font: { family: "Instrument Sans", size: 11 },
				},
				title: axisTitles?.x
					? { display: true, text: axisTitles.x, color: theme.muted }
					: undefined,
			},
			y: {
				beginAtZero: true,
				grid: { display: true, color: theme.grid, drawTicks: false },
				border: { display: false },
				ticks: {
					color: theme.muted,
					font: { family: "Instrument Sans", size: 11 },
					padding: 8,
					precision: 0,
				},
				title: axisTitles?.y
					? { display: true, text: axisTitles.y, color: theme.muted }
					: undefined,
			},
		},
	};
}

/** Colores con transparencia suave para rellenos de barras. */
export function withAlpha(hex: string, alpha: number): string {
	const value = hex.replace("#", "");
	const r = Number.parseInt(value.substring(0, 2), 16);
	const g = Number.parseInt(value.substring(2, 4), 16);
	const b = Number.parseInt(value.substring(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
