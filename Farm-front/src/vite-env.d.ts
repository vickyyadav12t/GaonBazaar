/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** `live` = fetch real counts from the API; omit or any other value = marketing copy without fabricated metrics */
  readonly VITE_LANDING_STATS_MODE?: string;
}
