/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_SCENE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
