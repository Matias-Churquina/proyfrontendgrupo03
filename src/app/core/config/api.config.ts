const backendUrl = 'http://localhost:3000';

export const API_CONFIG = {
  backendUrl,
  apiBaseUrl: `${backendUrl}/api`,
  socketUrl: backendUrl
} as const;
