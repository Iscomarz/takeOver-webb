import { getActiveSounds } from '$lib/services/sounds-service.js';

export async function load() {
	const sounds = await getActiveSounds();
	return {
		sounds
	};
}
