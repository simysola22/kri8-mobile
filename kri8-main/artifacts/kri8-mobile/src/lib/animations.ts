import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// ── Spring presets ────────────────────────────────────────────

/** Standard UI spring — snappy but not bouncy. */
export const SPRING_STANDARD: WithSpringConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

/** Gentle spring — for cards, modals, large elements. */
export const SPRING_GENTLE: WithSpringConfig = {
  damping: 24,
  stiffness: 180,
  mass: 1.0,
};

/** Bouncy spring — for FAB, success animations. */
export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 12,
  stiffness: 350,
  mass: 0.6,
};

// ── Timing presets ────────────────────────────────────────────

export const TIMING_FAST: WithTimingConfig = {
  duration: 150,
  easing: Easing.out(Easing.quad),
};

export const TIMING_STANDARD: WithTimingConfig = {
  duration: 250,
  easing: Easing.out(Easing.cubic),
};

export const TIMING_SLOW: WithTimingConfig = {
  duration: 400,
  easing: Easing.inOut(Easing.cubic),
};

// ── Animation helpers ─────────────────────────────────────────

/** Fade in from 0 → 1 */
export function fadeIn(delay = 0) {
  return withDelay(delay, withTiming(1, TIMING_STANDARD));
}

/** Fade out from current → 0 */
export function fadeOut() {
  return withTiming(0, TIMING_FAST);
}

/** Slide up with spring */
export function slideUp(to = 0) {
  return withSpring(to, SPRING_STANDARD);
}

/** Scale in — card / modal entrance */
export function scaleIn() {
  return withSpring(1, SPRING_GENTLE);
}

/** Pulse animation — e.g. for recording indicator */
export function pulse() {
  return withSequence(
    withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.sine) }),
    withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.sine) }),
  );
}

/** Bounce on press — tap feedback */
export function pressIn() {
  return withTiming(0.95, TIMING_FAST);
}

export function pressOut() {
  return withSpring(1, SPRING_BOUNCY);
}
