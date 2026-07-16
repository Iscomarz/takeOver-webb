import { getActiveSounds } from '$lib/services/sounds-service.js';

export async function load() {
	return {
		sounds: await getActiveSounds()
	};
}
