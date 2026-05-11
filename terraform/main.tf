terraform {
  backend "kubernetes" {
    secret_suffix = "state"
    namespace     = "jenkins"
    # ใช้ In-cluster auth อัตโนมัติ
  }
}

provider "kubernetes" {
  # Leave empty for in-cluster auth
}

# 1. สร้าง Namespace สำหรับโปรเจค
resource "kubernetes_namespace_v1" "logistics_ns" {
  metadata {
    name = "smart-logistics"
  }
}

# 2. จัดการ Persistent Volume Claim ผ่าน Terraform (IaC)
resource "kubernetes_persistent_volume_claim_v1" "mysql_pvc" {
  wait_until_bound = false
  metadata {
    name      = "mysql-pvc"
    namespace = kubernetes_namespace_v1.logistics_ns.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }
}

# 3. สร้าง Secret สำหรับ API Keys
resource "kubernetes_secret_v1" "app_secrets" {
  metadata {
    name      = "app-secrets"
    namespace = kubernetes_namespace_v1.logistics_ns.metadata[0].name
  }

  data = {
    MAPBOX_TOKEN    = var.mapbox_token
    OPENWEATHER_KEY = var.openweather_key
  }

  type = "Opaque"
}

variable "mapbox_token" {
  type      = string
  sensitive = true
}

variable "openweather_key" {
  type      = string
  sensitive = true
}
