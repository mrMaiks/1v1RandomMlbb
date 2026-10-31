/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HEROES_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}