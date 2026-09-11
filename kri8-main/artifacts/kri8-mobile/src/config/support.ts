const configuredEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
const configuredUrl = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim();

export const SUPPORT_CONFIG = {
  email: configuredEmail || null,
  url: configuredUrl || null,
} as const;