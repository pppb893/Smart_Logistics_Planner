provider "kubernetes" {
  config_path = "~/.kube/config" # ใช้ context ปัจจุบันในเครื่อง
}

# 1. สร้าง Namespace สำหรับโปรเจค
resource "kubernetes_namespace" "logistics_ns" {
  metadata {
    name = "smart-logistics"
  }
}

# 2. ตัวอย่างการจัดการ Persistent Volume Claim ผ่าน Terraform (IaC)
resource "kubernetes_persistent_volume_claim" "mysql_pvc" {
  metadata {
    name      = "mysql-pv-claim"
    namespace = kubernetes_namespace.logistics_ns.metadata[0].name
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
