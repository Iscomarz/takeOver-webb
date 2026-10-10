import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { config as dotenvConfig } from 'dotenv';

// Populates process.env for the Vite/Node process only (dev server SSR, build, analyse).
// It is NOT inlined into any bundle. Server code reads process.env at runtime (Vercel/Node).
dotenvConfig();

// Public Supabase values for the browser client. Only these two are exposed, by name.
// The anon key is public by design (protected by RLS). Never expose a service_role key.
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY || '';

function assertNotServiceRole(key) {
	try {
		const payload = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString());
		if (payload.role === 'service_role') {
			throw new Error(
				'Refusing to build: the Supabase key exposed to the browser is a service_role key. Use the anon key.'
			);
		}
	} catch (err) {
		if (err instanceof Error && err.message.startsWith('Refusing')) throw err;
	}
}
assertNotServiceRole(supabaseAnonKey);

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__PUBLIC_SUPABASE_URL__: JSON.stringify(supabaseUrl),
		__PUBLIC_SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey)
	}
});
