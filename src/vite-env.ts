/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESA_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
