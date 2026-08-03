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
}

export function useBiometric(): UseBiometricResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const available = await BiometricService.isBiometricAvailable();
      if (mounted) {
        setIsAvailable(available);
        setIsEnabledState(BiometricService.isBiometricEnabled());
        setIsChecking(false);
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

  return { isAvailable, isEnabled, setEnabled, authenticate, isChecking };
}
