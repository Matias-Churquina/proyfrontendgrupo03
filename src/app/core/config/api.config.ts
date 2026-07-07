const backendUrl = 'https://proybackendgrupo03-1.onrender.com';

export const API_CONFIG = {
  backendUrl,
  apiBaseUrl: `${backendUrl}/api`,
  socketUrl: backendUrl
} as const;
