/**
 * useBiometric
 *
 * Hook for biometric authentication state and operations.
 * Surfaces availability, enabled state, and an authenticate function.
 */
import { useState, useEffect, useCallback } from 'react';
import * as BiometricService from '@/services/BiometricService';
import { analytics } from '@/services/analytics/AnalyticsService';

export interface UseBiometricResult {
  /** True if the device supports biometrics and has enrolled credentials. */
  isAvailable: boolean;
  /** True if the user has opted in to biometric unlock. */
  isEnabled: boolean;
  /** Enable or disable biometric unlock. */
  setEnabled: (enabled: boolean) => void;
  /** Prompt the user for biometric authentication. */
  authenticate: (promptMessage?: string) => Promise<BiometricService.BiometricResult>;
  /** Loading state while checking availability. */
  isChecking: boolean;
  /** Native biometric types enrolled on the device, when available. */
  supportedTypes: BiometricService.LocalAuthentication.AuthenticationType[];
}

export function useBiometric(): UseBiometricResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [supportedTypes, setSupportedTypes] = useState<
    BiometricService.LocalAuthentication.AuthenticationType[]
  >([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [available, types] = await Promise.all([
          BiometricService.isBiometricAvailable(),
          BiometricService.getSupportedTypes(),
        ]);
        if (mounted) {
          setIsAvailable(available);
          setSupportedTypes(types);
          setIsEnabledState(BiometricService.isBiometricEnabled());
        }
      } catch {
        // Unsupported platforms (including web) should behave as unavailable.
        if (mounted) setIsAvailable(false);
      } finally {
        if (mounted) setIsChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    BiometricService.setBiometricEnabled(enabled);
    setIsEnabledState(enabled);
    analytics.track(enabled ? 'biometric_enabled' : 'biometric_disabled');
  }, []);

  const authenticate = useCallback(async (promptMessage?: string) => {
    const result = await BiometricService.authenticateWithBiometrics(promptMessage);
    analytics.track(
      result.success ? 'biometric_auth_success' : 'biometric_auth_failed',
      { canFallback: result.canFallback },
    );
    return result;
  }, []);

  return { isAvailable, isEnabled, setEnabled, authenticate, isChecking, supportedTypes };
}
