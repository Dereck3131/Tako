import React, { useImperativeHandle, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from 'react-native';

import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';
import { applyOtpBoxInput } from '@/lib/validation';

export interface OtpSixBoxInputHandle {
  focus: (index?: number) => void;
}

type TextInputInstance = React.ComponentRef<typeof TextInput>;

interface OtpSixBoxInputProps {
  value: string;
  onChange: (nextCode: string) => void;
  onComplete?: (completedCode: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * 6 separate digit boxes for OTP entry with paste normalization,
 * keyboard navigation, SMS/email one-time-code autofill, and clear focus state.
 * Error border appears only when `hasError` is true (after blur or submit).
 */
export const OtpSixBoxInput = React.forwardRef<OtpSixBoxInputHandle, OtpSixBoxInputProps>(
  function OtpSixBoxInput(
    {
      value,
      onChange,
      onComplete,
      onBlur,
      hasError = false,
      disabled = false,
      autoFocus = false,
    },
    ref
  ) {
    const { palette } = useTakoTheme();
    const boxRefs = useRef<(TextInputInstance | null)[]>([null, null, null, null, null, null]);
    const focusedIndexRef = useRef<number | null>(autoFocus ? 0 : null);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
    const lastCompletedRef = useRef<string>('');

    useImperativeHandle(ref, () => ({
      focus: (idx = 0) => {
        const targetIdx = Math.min(5, Math.max(0, idx));
        boxRefs.current[targetIdx]?.focus();
      },
    }));

    const handleBoxChange = (index: number, rawText: string) => {
      const { code: nextCode, nextFocusIndex, isComplete } = applyOtpBoxInput(
        value,
        index,
        rawText
      );
      onChange(nextCode);

      if (nextFocusIndex !== index) {
        boxRefs.current[nextFocusIndex]?.focus();
      }

      if (isComplete && nextCode !== lastCompletedRef.current) {
        lastCompletedRef.current = nextCode;
        onComplete?.(nextCode);
      } else if (!isComplete) {
        lastCompletedRef.current = '';
      }
    };

    const handleKeyPress = (index: number, e: TextInputKeyPressEvent) => {
      if (e.nativeEvent.key === 'Backspace') {
        const currentDigit = value[index] ?? '';
        if (!currentDigit && index > 0) {
          const slots = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
          slots[index - 1] = '';
          const nextCode = slots.join('');
          lastCompletedRef.current = '';
          onChange(nextCode);
          boxRefs.current[index - 1]?.focus();
        }
      }
    };

    return (
      <View
        style={styles.row}
        accessibilityRole="none"
        accessibilityLabel="6-digit verification code">
        {Array.from({ length: 6 }, (_, index) => {
          const digit = value[index] ?? '';
          const isFocused = focusedIndex === index;
          const borderColor = hasError
            ? palette.destructive
            : isFocused
              ? palette.ink
              : digit
                ? palette.border
                : 'transparent';

          return (
            <Pressable
              key={index}
              onPress={() => {
                if (!disabled) {
                  // Focus first empty slot or the tapped slot
                  const firstEmpty = Math.min(value.length, 5);
                  const target = digit ? index : firstEmpty;
                  boxRefs.current[target]?.focus();
                }
              }}
              style={[
                styles.boxWrap,
                {
                  backgroundColor: palette.surfaceAlt,
                  borderColor,
                },
              ]}>
              <TextInput
                ref={(el) => {
                  boxRefs.current[index] = el;
                }}
                value={digit}
                editable={!disabled}
                autoFocus={autoFocus && index === 0}
                onChangeText={(txt) => handleBoxChange(index, txt)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                onFocus={() => {
                  focusedIndexRef.current = index;
                  setFocusedIndex(index);
                }}
                onBlur={() => {
                  if (focusedIndexRef.current === index) {
                    focusedIndexRef.current = null;
                  }
                  setFocusedIndex((prev) => (prev === index ? null : prev));
                  // Trigger form-level blur check when leaving all 6 boxes
                  setTimeout(() => {
                    if (focusedIndexRef.current === null) {
                      onBlur?.();
                    }
                  }, 25);
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={12}
                selectTextOnFocus
                accessibilityLabel={`Digit ${index + 1} of 6`}
                style={[
                  styles.boxInput,
                  {
                    color: palette.ink,
                    fontFamily: TakoFonts.black,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  boxWrap: {
    flex: 1,
    minHeight: 54,
    maxWidth: 52,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxInput: {
    width: '100%',
    height: 52,
    fontSize: 22,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none' as never,
          caretColor: '#FF7A8A',
        }
      : {}),
  },
});
