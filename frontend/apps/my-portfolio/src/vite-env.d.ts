/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DAILY_FOCUS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
