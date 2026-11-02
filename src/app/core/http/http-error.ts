/**
 * Extrae un mensaje legible de un error HTTP del backend.
 */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
	if (!error) return "";

	const httpError = error as {
		error?: { error?: string; message?: string };
		message?: string;
	};

	return (
		httpError.error?.error ??
		httpError.error?.message ??
		httpError.message ??
		fallback
	);
}
