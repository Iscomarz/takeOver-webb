import { getActiveSounds } from '$lib/services/sounds-service.js';
import { getActiveGallery } from '$lib/services/gallery-service.js';

export async function load() {
	const [sounds, gallery] = await Promise.all([getActiveSounds(), getActiveGallery()]);
	return {
		sounds,
		gallery
	};
}
