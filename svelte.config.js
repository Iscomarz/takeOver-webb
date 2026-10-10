import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		
		adapter: adapter({ runtime: 'nodejs22.x' }),
		prerender: {
			handleHttpError: ({status, path, referrer, referenceType }) =>{
				if(status === 404){
					console.warn(`404 error on prerendering: ${path}`);
					return;
				}
				throw new Error(`${status} ${path} (linked from ${referrer})`);
			}
		}
	},
	preprocess: vitePreprocess()
};

export default config;
