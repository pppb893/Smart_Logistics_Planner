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
  metadata {
    name      = "mysql-pv-claim"
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
