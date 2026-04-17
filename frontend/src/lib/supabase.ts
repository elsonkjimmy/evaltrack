import { createClient } from '@supabase/supabase-js';

// En attendant les vraies clés de l'environnement, on utilise des valeurs factices 
// ou on gère ça via Zustand localement. Le client est prêt pour quand les clés seront là.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
