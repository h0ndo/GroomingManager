locals {
  app_roles = {
    admin = {
      description = "Administrator:in der Kundeninstanz mit Rechten zur Nutzer- und Stammdatenverwaltung."
    }
    groomer = {
      description = "Groomer mit Zugriff auf operative Arbeitsbereiche, Termine, Tierprofile und Kundenkontext."
    }
    kunde = {
      description = "Kund:in mit Zugriff auf das Kundenportal und eigene Daten/Vorgänge."
    }
  }

  create_initial_admin = var.initial_admin_email != "" && var.initial_admin_password != ""

  test_users = var.test_users_enabled ? {
    admin = {
      username   = var.test_admin_email
      email      = var.test_admin_email
      first_name = "Test"
      last_name  = "Admin"
      password   = var.test_admin_password
      group      = "admin"
    }
    groomer = {
      username   = var.test_groomer_email
      email      = var.test_groomer_email
      first_name = "Test"
      last_name  = "Groomer"
      password   = var.test_groomer_password
      group      = "groomer"
    }
    kunde = {
      username   = var.test_kunde_email
      email      = var.test_kunde_email
      first_name = "Test"
      last_name  = "Kunde"
      password   = var.test_kunde_password
      group      = "kunde"
    }
  } : {}

  test_user_group_ids = {
    admin   = keycloak_group.admins.id
    groomer = keycloak_group.groomers.id
    kunde   = keycloak_group.kunden.id
  }
}

resource "keycloak_realm" "app" {
  realm        = var.realm
  display_name = "GroomingManager"
  enabled      = true

  registration_allowed           = var.registration_allowed
  registration_email_as_username = true
  reset_password_allowed         = true
  remember_me                    = true
  login_with_email_allowed       = true
  duplicate_emails_allowed       = false
  verify_email                   = true
  ssl_required                   = "external"
}

resource "keycloak_openid_client" "app" {
  realm_id  = keycloak_realm.app.id
  client_id = var.oidc_client_id
  name      = "GroomingManager App"
  enabled   = true

  access_type                  = "PUBLIC"
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  valid_redirect_uris = [
    var.app_url,
    "${var.app_url}/*"
  ]

  web_origins = [
    var.app_url
  ]
}

resource "keycloak_role" "app_roles" {
  for_each = local.app_roles

  realm_id    = keycloak_realm.app.id
  name        = each.key
  description = each.value.description
}

resource "keycloak_group" "admins" {
  realm_id = keycloak_realm.app.id
  name     = "Admins"
}

resource "keycloak_group" "groomers" {
  realm_id = keycloak_realm.app.id
  name     = "Groomer"
}

resource "keycloak_group" "kunden" {
  realm_id = keycloak_realm.app.id
  name     = "Kund:innen"
}

resource "keycloak_group_roles" "admins_roles" {
  realm_id = keycloak_realm.app.id
  group_id = keycloak_group.admins.id

  role_ids = [
    keycloak_role.app_roles["admin"].id
  ]
}

resource "keycloak_group_roles" "groomers_roles" {
  realm_id = keycloak_realm.app.id
  group_id = keycloak_group.groomers.id

  role_ids = [
    keycloak_role.app_roles["groomer"].id
  ]
}

resource "keycloak_group_roles" "kunden_roles" {
  realm_id = keycloak_realm.app.id
  group_id = keycloak_group.kunden.id

  role_ids = [
    keycloak_role.app_roles["kunde"].id
  ]
}

resource "keycloak_user" "initial_admin" {
  count = local.create_initial_admin ? 1 : 0

  realm_id   = keycloak_realm.app.id
  username   = var.initial_admin_email
  email      = var.initial_admin_email
  first_name = var.initial_admin_first_name
  last_name  = var.initial_admin_last_name
  enabled    = true

  email_verified = true

  initial_password {
    value     = var.initial_admin_password
    temporary = true
  }
}

resource "keycloak_user_groups" "initial_admin_groups" {
  count = local.create_initial_admin ? 1 : 0

  realm_id = keycloak_realm.app.id
  user_id  = keycloak_user.initial_admin[0].id

  group_ids = [
    keycloak_group.admins.id
  ]
}

resource "keycloak_user" "test_users" {
  for_each = local.test_users

  realm_id   = keycloak_realm.app.id
  username   = each.value.username
  email      = each.value.email
  first_name = each.value.first_name
  last_name  = each.value.last_name
  enabled    = true

  email_verified = true

  initial_password {
    value     = each.value.password
    temporary = false
  }
}

resource "keycloak_user_groups" "test_user_groups" {
  for_each = local.test_users

  realm_id = keycloak_realm.app.id
  user_id  = keycloak_user.test_users[each.key].id

  group_ids = [local.test_user_group_ids[each.value.group]]
}
