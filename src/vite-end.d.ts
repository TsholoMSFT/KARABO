/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT?: string
  readonly VITE_APP_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// lucide-react ships ESM icon modules without per-file type declarations.
// The shadcn/ui components deep-import them (e.g. lucide-react/dist/esm/icons/check).
// This wildcard declaration provides their types (the runtime .js files exist).
declare module 'lucide-react/dist/esm/icons/*'
