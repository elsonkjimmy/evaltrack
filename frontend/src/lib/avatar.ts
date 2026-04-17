import { supabase } from './supabase';

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function resolveAvatarUrl(
  avatarValue: string | null | undefined,
): Promise<string | null> {
  if (!avatarValue) return null;

  if (avatarValue.startsWith('http://') || avatarValue.startsWith('https://')) {
    return avatarValue;
  }

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarValue, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error('Unable to create signed avatar URL:', error.message);
    return null;
  }

  return data.signedUrl;
}
