import { createClient } from '@supabase/supabase-js';

// Browser-reachable module: only public values (URL + anon key) injected at build time
// by vite.config.js. Never read process.env here.
const supabaseUrl = __PUBLIC_SUPABASE_URL__;
const supabaseKey = __PUBLIC_SUPABASE_ANON_KEY__;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
