import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || "",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "development",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "",
};

export const keycloak = new Keycloak(keycloakConfig);

export function isKeycloakConfigured(): boolean {
  return Boolean(
    keycloakConfig.url && keycloakConfig.realm && keycloakConfig.clientId
  );
}
