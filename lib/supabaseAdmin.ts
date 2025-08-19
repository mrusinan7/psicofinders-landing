// Server-side Supabase client con Service Role (NO usar en cliente)
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'psicofinders-backoffice' } },
  }
)