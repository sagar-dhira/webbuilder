/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ROOT_DOMAIN: string;
  readonly VITE_ETL_API_URL: string;
  readonly VITE_ETL_TENANT_NAME: string;
  readonly VITE_ETL_DEFAULT_BODY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
