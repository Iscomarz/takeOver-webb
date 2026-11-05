import { getActiveGallery } from '$lib/services/gallery-service.js';

export async function load() {
	const gallery = await getActiveGallery();
	return {
		gallery
	};
}
