output "realm" {
  description = "Configured Keycloak realm."
  value       = keycloak_realm.app.realm
}

output "issuer_url" {
  description = "OIDC issuer URL for the app."
  value       = "${var.keycloak_url}/realms/${keycloak_realm.app.realm}"
}

output "client_id" {
  description = "OIDC client id for the app."
  value       = keycloak_openid_client.app.client_id
}

output "roles" {
  description = "Realm roles created for GroomingManager."
  value       = keys(local.app_roles)
}
