export function isDesktopApp() {
  return Boolean(import.meta.env.TAURI_ENV_PLATFORM);
}

export function getDefaultServerUrl() {
  const fromEnv = import.meta.env.VITE_DESKTOP_SERVER || import.meta.env.VITE_API_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/api\/?$/, '');
  }
  return 'http://187.124.23.65:4000';
}

export function getDesktopApiUrl() {
  const server = getDefaultServerUrl();
  return `${server.replace(/\/+$/, '')}/api`;
}

export function getDesktopImgBase() {
  return getDefaultServerUrl().replace(/\/+$/, '');
}
