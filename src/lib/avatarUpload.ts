import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type PickAvatarAssetResult =
  | { ok: true; uri: string; width: number; height: number }
  | { ok: false; cancelled?: boolean; error?: string };

export type UploadAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

/**
 * Opens the photo library and returns the raw selected image dimensions + URI
 * so the cross-platform drag/zoom cropper can frame it consistently on Web, iOS, and Android.
 */
export async function pickAvatarAsset(): Promise<PickAvatarAssetResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return {
      ok: false,
      error: 'Allow photo library access in Settings to upload a profile picture.',
    };
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (picked.canceled || !picked.assets?.[0]?.uri) {
    return { ok: false, cancelled: true };
  }

  const asset = picked.assets[0];
  return {
    ok: true,
    uri: asset.uri,
    width: asset.width || 1,
    height: asset.height || 1,
  };
}

/**
 * Crops the selected image using the exact VaultFlow pan/zoom math,
 * resizes to 400x400 JPEG, and uploads to Supabase Storage `avatars/{userId}/avatar.jpg`
 * so the photo syncs across all devices.
 */
export async function cropAndUploadAvatar(params: {
  userId: string;
  uri: string;
  naturalWidth: number;
  naturalHeight: number;
  cropSize: number;
  zoom: number;
  panX: number;
  panY: number;
}): Promise<UploadAvatarResult> {
  const { userId, uri, naturalWidth, naturalHeight, cropSize, zoom, panX, panY } = params;

  try {
    const safeW = Math.max(1, naturalWidth);
    const safeH = Math.max(1, naturalHeight);
    const baseScale = Math.max(cropSize / safeW, cropSize / safeH);
    const totalScale = baseScale * Math.max(1, zoom);
    const currentW = safeW * totalScale;
    const currentH = safeH * totalScale;

    const imgLeft = cropSize / 2 + panX - currentW / 2;
    const imgTop = cropSize / 2 + panY - currentH / 2;

    const rawOriginX = Math.round(-imgLeft / totalScale);
    const rawOriginY = Math.round(-imgTop / totalScale);
    const rawCropSize = Math.round(cropSize / totalScale);

    const clampedSize = Math.max(1, Math.min(rawCropSize, safeW, safeH));
    const originX = Math.max(0, Math.min(safeW - clampedSize, rawOriginX));
    const originY = Math.max(0, Math.min(safeH - clampedSize, rawOriginY));

    const manipulated = await manipulateAsync(
      uri,
      [
        {
          crop: {
            originX,
            originY,
            width: clampedSize,
            height: clampedSize,
          },
        },
        { resize: { width: 400, height: 400 } },
      ],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    const response = await fetch(manipulated.uri);
    const arrayBuffer = await response.arrayBuffer();
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadErr) {
      return { ok: false, error: uploadErr.message || 'Could not upload photo.' };
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    return { ok: true, publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not upload photo.',
    };
  }
}

/**
 * Deletes the user's avatar from Supabase Storage.
 */
export async function deleteAvatarFromStorage(userId: string): Promise<void> {
  try {
    await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);
  } catch {
    // best-effort cleanup
  }
}
