import supabase from '$lib/supabase';

export async function getActiveGallery() {
	const [{ data: gallery, error }, { data: events }] = await Promise.all([
		supabase
			.from('tGaleria')
			.select('id,evento_id,tipo,storage_path,url_publica,descripcion,fecha_contenido,orden')
			.eq('activo', true)
			.order('fecha_contenido', { ascending: false })
			.order('orden', { ascending: true }),
		supabase.from('mEvento').select('idevento,nombreEvento,fechaInicio')
	]);

	if (error) {
		console.error('Error loading Vibe Wall:', error);
		return [];
	}

	const eventMap = new Map((events ?? []).map((event) => [String(event.idevento), event]));
	return (gallery ?? []).map((item) => {
		const event = eventMap.get(String(item.evento_id));
		const publicUrl = item.url_publica || supabase.storage
			.from('galeria-eventos')
			.getPublicUrl(item.storage_path).data.publicUrl;
		return {
			...item,
			url_publica: publicUrl,
			evento_nombre: event?.nombreEvento ?? 'Take Over',
			evento_fecha: event?.fechaInicio ?? item.fecha_contenido
		};
	});
}
