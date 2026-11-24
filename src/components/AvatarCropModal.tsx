import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  Image as RNImage,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

export const AVATAR_CROP_SIZE = 220;

interface AvatarCropModalProps {
  visible: boolean;
  uri: string;
  naturalWidth: number;
  naturalHeight: number;
  saving?: boolean;
  onCancel: () => void;
  onSave: (params: {
    naturalWidth: number;
    naturalHeight: number;
    zoom: number;
    panX: number;
    panY: number;
  }) => void;
}

/**
 * Cross-platform circular avatar cropper supporting drag-to-reposition,
 * pinch-to-zoom, and +/- zoom controls (matching VaultFlow's adjust modal).
 */
export function AvatarCropModal({
  visible,
  uri,
  naturalWidth,
  naturalHeight,
  saving = false,
  onCancel,
  onSave,
}: AvatarCropModalProps) {
  const { palette } = useTakoTheme();
  const [fetchedSize, setFetchedSize] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [zoomState, setZoomState] = useState<{ uri: string; zoom: number }>({
    uri,
    zoom: 1,
  });

  const zoomLabel = zoomState.uri === uri ? zoomState.zoom : 1;
  const resolvedSize =
    fetchedSize && fetchedSize.uri === uri
      ? fetchedSize
      : { width: Math.max(1, naturalWidth), height: Math.max(1, naturalHeight) };

  const safeW = Math.max(1, resolvedSize.width);
  const safeH = Math.max(1, resolvedSize.height);
  const baseScale = Math.max(AVATAR_CROP_SIZE / safeW, AVATAR_CROP_SIZE / safeH);

  const zoomSv = useSharedValue(1);
  const panXSv = useSharedValue(0);
  const panYSv = useSharedValue(0);
  const startPanXSv = useSharedValue(0);
  const startPanYSv = useSharedValue(0);
  const startZoomSv = useSharedValue(1);

  useEffect(() => {
    zoomSv.set(1);
    panXSv.set(0);
    panYSv.set(0);

    if (uri && (naturalWidth <= 1 || naturalHeight <= 1)) {
      let mounted = true;
      RNImage.getSize(
        uri,
        (w, h) => {
          if (mounted && w > 0 && h > 0) {
            setFetchedSize({ uri, width: w, height: h });
          }
        },
        () => {}
      );
      return () => {
        mounted = false;
      };
    }
  }, [uri, naturalWidth, naturalHeight, zoomSv, panXSv, panYSv]);

  const applyClampedZoom = (nextZoom: number) => {
    const z = Math.max(1, Math.min(3, Number(nextZoom.toFixed(2))));
    const w = safeW * baseScale * z;
    const h = safeH * baseScale * z;
    const maxX = Math.max(0, (w - AVATAR_CROP_SIZE) / 2);
    const maxY = Math.max(0, (h - AVATAR_CROP_SIZE) / 2);
    zoomSv.set(z);
    panXSv.set(Math.max(-maxX, Math.min(maxX, panXSv.get())));
    panYSv.set(Math.max(-maxY, Math.min(maxY, panYSv.get())));
    setZoomState({ uri, zoom: z });
  };

  const handleReset = () => {
    zoomSv.set(1);
    panXSv.set(0);
    panYSv.set(0);
    setZoomState({ uri, zoom: 1 });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startPanXSv.set(panXSv.get());
      startPanYSv.set(panYSv.get());
    })
    .onUpdate((e) => {
      const z = zoomSv.get();
      const w = safeW * baseScale * z;
      const h = safeH * baseScale * z;
      const maxX = Math.max(0, (w - AVATAR_CROP_SIZE) / 2);
      const maxY = Math.max(0, (h - AVATAR_CROP_SIZE) / 2);
      panXSv.set(Math.max(-maxX, Math.min(maxX, startPanXSv.get() + e.translationX)));
      panYSv.set(Math.max(-maxY, Math.min(maxY, startPanYSv.get() + e.translationY)));
    });

  const updateZoomFromPinch = (z: number) => {
    setZoomState({ uri, zoom: Number(z.toFixed(2)) });
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startZoomSv.set(zoomSv.get());
    })
    .onUpdate((e) => {
      const z = Math.max(1, Math.min(3, startZoomSv.get() * e.scale));
      const w = safeW * baseScale * z;
      const h = safeH * baseScale * z;
      const maxX = Math.max(0, (w - AVATAR_CROP_SIZE) / 2);
      const maxY = Math.max(0, (h - AVATAR_CROP_SIZE) / 2);
      zoomSv.set(z);
      panXSv.set(Math.max(-maxX, Math.min(maxX, panXSv.get())));
      panYSv.set(Math.max(-maxY, Math.min(maxY, panYSv.get())));
      scheduleOnRN(updateZoomFromPinch, z);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageAnimStyle = useAnimatedStyle(() => {
    const z = zoomSv.get();
    const w = safeW * baseScale * z;
    const h = safeH * baseScale * z;
    return {
      width: w,
      height: h,
      left: AVATAR_CROP_SIZE / 2 + panXSv.get() - w / 2,
      top: AVATAR_CROP_SIZE / 2 + panYSv.get() - h / 2,
    };
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Adjust photo
              </Text>
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel photo adjustment"
                style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={palette.mute} />
              </Pressable>
            </View>

            <Text style={[styles.hint, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Drag to reposition and pinch or use +/- to zoom
            </Text>

            <View style={styles.cropStageWrap}>
              <GestureDetector gesture={composedGesture}>
                <View
                  style={[
                    styles.cropCircle,
                    {
                      borderColor: palette.coral,
                      backgroundColor: palette.surfaceAlt,
                    },
                  ]}>
                  {!!uri && (
                    <Animated.Image
                      source={{ uri }}
                      style={[styles.cropImg, imageAnimStyle]}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </GestureDetector>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomBar}>
              <Pressable
                onPress={() => applyClampedZoom(zoomLabel - 0.2)}
                disabled={zoomLabel <= 1 || saving}
                accessibilityRole="button"
                accessibilityLabel="Zoom out"
                style={[styles.zoomBtn, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons
                  name="remove"
                  size={18}
                  color={zoomLabel <= 1 ? palette.mute : palette.ink}
                />
              </Pressable>

              <Text style={[styles.zoomText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                {Math.round(zoomLabel * 100)}%
              </Text>

              <Pressable
                onPress={() => applyClampedZoom(zoomLabel + 0.2)}
                disabled={zoomLabel >= 3 || saving}
                accessibilityRole="button"
                accessibilityLabel="Zoom in"
                style={[styles.zoomBtn, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons
                  name="add"
                  size={18}
                  color={zoomLabel >= 3 ? palette.mute : palette.ink}
                />
              </Pressable>

              <Pressable
                onPress={handleReset}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Reset crop"
                style={[styles.resetBtn, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="refresh" size={15} color={palette.ink} />
                <Text style={[styles.resetText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Reset
                </Text>
              </Pressable>
            </View>

            <PrimaryButton
              label={saving ? 'Uploading...' : 'Save photo'}
              loading={saving}
              onPress={() =>
                onSave({
                  naturalWidth: safeW,
                  naturalHeight: safeH,
                  zoom: zoomSv.get(),
                  panX: panXSv.get(),
                  panY: panYSv.get(),
                })
              }
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 20, 36, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
  cropStageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cropCircle: {
    width: AVATAR_CROP_SIZE,
    height: AVATAR_CROP_SIZE,
    borderRadius: AVATAR_CROP_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'grab' as never, touchAction: 'none' as never } : {}),
  },
  cropImg: {
    position: 'absolute',
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    minWidth: 52,
    textAlign: 'center',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  resetText: {
    fontSize: 13,
  },
});
