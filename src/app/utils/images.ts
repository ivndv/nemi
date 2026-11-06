export interface ImageOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: string;
	fit?: string;
}

/**
 * Resuelve y optimiza las URLs de imágenes usando Cloudflare Image Resizing
 * Basado en la lógica del portafolio del usuario.
 */
export function getCloudflareImage(
	url: string | null | undefined,
	options: ImageOptions = {},
): string {
	if (!url || typeof url !== "string" || url.trim() === "") {
		return "";
	}

	// Si es una imagen en base64 (data:), la devolvemos tal cual
	if (url.startsWith("data:")) {
		return url;
	}

	// Si es local (no empieza con http), pegamos el servidor
	if (!url.startsWith("http")) {
		return `http://localhost:3000${url}`;
	}

	const myDomain = "assets.liuma.app";

	// Si es una URL externa pero no de nuestro dominio, la devolvemos tal cual
	if (!url.includes(myDomain)) {
		return url;
	}

	// Parámetros por defecto
	const width = options.width || null;
	const height = options.height || null;
	const quality = options.quality || 85;
	const format = options.format || "auto";
	const fit = options.fit || "cover";

	const paramsParts = [];
	if (width) paramsParts.push(`width=${width}`);
	if (height) paramsParts.push(`height=${height}`);
	paramsParts.push(`quality=${quality}`);
	paramsParts.push(`format=${format}`);
	paramsParts.push(`fit=${fit}`);

	const paramsString = paramsParts.join(",");

	// Prefijo base para la transformación (aseguramos que termine en /)
	const cdnPrefix = `https://${myDomain}/cdn-cgi/image/${paramsString}/`;

	try {
		// Extraemos solo el nombre del archivo y quitamos la barra inicial si existe
		const urlObj = new URL(url);
		const pathname = urlObj.pathname.startsWith("/")
			? urlObj.pathname.substring(1)
			: urlObj.pathname;
		return `${cdnPrefix}${pathname}`;
	} catch (_e) {
		const filename = url.split("/").pop() || "";
		return `${cdnPrefix}${filename}`;
	}
}
