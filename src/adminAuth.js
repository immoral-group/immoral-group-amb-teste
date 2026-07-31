import { supabase } from './supabaseClient.js';

/**
 * Devuelve la sesión actual y el perfil (app_role) del usuario autenticado,
 * o { session: null, profile: null } si no hay sesión.
 */
export async function getSessionAndProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, profile: null };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, app_role')
    .eq('id', session.user.id)
    .single();

  if (error) return { session, profile: null };
  return { session, profile };
}

export async function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
