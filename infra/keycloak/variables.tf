variable "keycloak_url" {
  description = "Public Keycloak base URL, including /auth when Keycloak is served below that path. Example: https://kunde.example.de/auth"
  type        = string
}

variable "keycloak_admin_username" {
  description = "Keycloak master realm admin username. Usually KEYCLOAK_ADMIN from deploy/.env."
  type        = string
  sensitive   = true
}

variable "keycloak_admin_password" {
  description = "Keycloak master realm admin password. Usually KEYCLOAK_ADMIN_PASSWORD from deploy/.env."
  type        = string
  sensitive   = true
}

variable "realm" {
  description = "Customer realm name. One realm per customer instance."
  type        = string
  default     = "grooming-manager"
}

variable "app_url" {
  description = "Public app URL without trailing slash. Example: https://kunde.example.de"
  type        = string
}

variable "oidc_client_id" {
  description = "OIDC client id used by the GroomingManager app."
  type        = string
  default     = "grooming-manager-app"
}

variable "oidc_client_secret" {
  description = "Deprecated: the Angular SPA uses a public OIDC client with Authorization Code + PKCE and no client secret. Kept only for compatibility with old tfvars files."
  type        = string
  default     = ""
  sensitive   = true
}

variable "registration_allowed" {
  description = "Deprecated: Keycloak self-registration is intentionally disabled. Users are created by admins or application workflows."
  type        = bool
  default     = false
}

variable "initial_admin_email" {
  description = "Optional initial application admin user email in Keycloak. Leave empty to create no user."
  type        = string
  default     = ""
}

variable "initial_admin_password" {
  description = "Initial password for the optional initial admin user."
  type        = string
  default     = ""
  sensitive   = true
}

variable "initial_admin_first_name" {
  description = "First name for the optional initial admin user."
  type        = string
  default     = "Admin"
}

variable "initial_admin_last_name" {
  description = "Last name for the optional initial admin user."
  type        = string
  default     = ""
}

variable "test_users_enabled" {
  description = "Create simple local/dev Playwright test users in Keycloak. Keep false for production customer instances."
  type        = bool
  default     = false
}

variable "test_admin_email" {
  description = "Email/username for the local Playwright admin test user."
  type        = string
  default     = "admin@example.de"
}

variable "test_admin_password" {
  description = "Password for the local Playwright admin test user. Use only in local/dev/test environments."
  type        = string
  default     = "123"
  sensitive   = true
}

variable "test_fuehrungskraft_email" {
  description = "Email/username for the local Playwright leadership test user."
  type        = string
  default     = "fuehrungskraft@example.de"
}

variable "test_fuehrungskraft_password" {
  description = "Password for the local Playwright leadership test user. Use only in local/dev/test environments."
  type        = string
  default     = "123"
  sensitive   = true
}

variable "test_angestellter_email" {
  description = "Email/username for the local Playwright employee test user."
  type        = string
  default     = "angestellter@example.de"
}

variable "test_angestellter_password" {
  description = "Password for the local Playwright employee test user. Use only in local/dev/test environments."
  type        = string
  default     = "123"
  sensitive   = true
}

variable "test_kunde_email" {
  description = "Email/username for the local Playwright kunde test user."
  type        = string
  default     = "kunde@example.de"
}

variable "test_kunde_password" {
  description = "Password for the local Playwright kunde test user. Use only in local/dev/test environments."
  type        = string
  default     = "123"
  sensitive   = true
}
