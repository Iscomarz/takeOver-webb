import supabase from '$lib/supabase';

export async function getActiveSounds() {
	const { data, error } = await supabase
		.from('tSoundsTakeOver')
		.select('id,titulo,artista,soundcloud_url,artwork_url,orden')
		.eq('activo', true)
		.order('orden', { ascending: true })
		.order('creado_en', { ascending: true });

	if (error) {
		console.error('Error loading Sounds of Take Over:', error);
		return [];
	}

	return data ?? [];
}
