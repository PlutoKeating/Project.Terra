import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (window.location.hash.includes('type=recovery')) {
  sessionStorage.setItem('terra-password-recovery', 'true')
}

export const supabase = url && key ? createClient(url, key) : null
