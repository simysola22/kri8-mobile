/**
 * BiometricService
 *
 * Manages native biometric authentication (Face ID, Touch ID, Android Fingerprint).
 * Biometric unlock is optional — users enable it from Settings after signing in with Clerk.
 * On failure, falls back to device PIN or Clerk authentication.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { createStorage } from '@/lib/kv';

const storage = createStorage('kri8-biometric');
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

// ── Capability checks ─────────────────────────────────────────

/** Returns true if the device hardware supports biometrics. */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Returns which authentication types are supported on this device.
 * e.g. [FINGERPRINT, FACIAL_RECOGNITION, IRIS]
 */
export async function getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}

// ── User preference ───────────────────────────────────────────

/** Returns whether the user has opted into biometric unlock. */
export function isBiometricEnabled(): boolean {
  return storage.getString(BIOMETRIC_ENABLED_KEY) === 'true';
}

/** Enable or disable biometric unlock. */
export function setBiometricEnabled(enabled: boolean): void {
  storage.set(BIOMETRIC_ENABLED_KEY, String(enabled));
}

// ── Authentication ────────────────────────────────────────────

export interface BiometricResult {
  success: boolean;
  /** Set when authentication failed but fallback to device PIN is possible. */
  canFallback: boolean;
  error?: string;
}

/**
 * Prompt the user for biometric authentication.
 * Enables device-passcode fallback automatically.
 */
export async function authenticateWithBiometrics(
  promptMessage = 'Unlock Kri8',
): Promise<BiometricResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return { success: true, canFallback: false };
    }

    // Device cancelled or error — check if we can still offer PIN fallback
    const canFallback =
      result.error === 'user_fallback' || result.error === 'system_cancel';

    return {
      success: false,
      canFallback,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      canFallback: false,
      error: err instanceof Error ? err.message : 'Unknown biometric error',
    };
  }
}
