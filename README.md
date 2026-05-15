# 🚀 Smart Logistics Planner — ENG23 3074

> ระบบวางแผนโลจิสติกส์อัจฉริยะที่มาพร้อมกับแผนที่ Interactive และระบบจัดการเส้นทางขนส่งแบบ Real-time  
> **Smart Logistics Planner:** Full-stack Web Application สำหรับบริหารจัดการการขนส่งสินค้า ติดตามสถานะ และวางแผนเส้นทางผ่าน Mapbox

---

## 👥 สมาชิกในกลุ่ม

| รหัสนักศึกษา | ชื่อ-นามสกุล | ความรับผิดชอบ |
|-------------|-------------|---------------|
| B6611613 | นายณัฐทักษ์ดนัย แหยงกระโทก | Jenkins, Docker |
| B6630447 | นายจตุรวิชญ์ รวีวงศาวัฒน์ | Git, App Development |
| B6643256 | นายพชรพงษ์ พูลพิพัฒน์ | Terraform, Ansible |
| B6643829 | นายนพรุจ อสัมภินพงศ์ | Kubernetes, Monitoring |

---

## 📌 ภาพรวมโปรเจค

### แอปพลิเคชัน
- **ชื่อ:** Smart Logistics Planner
- **ประเภท:** Full-stack Web Application
- **ภาษา / Framework:** React (Vite), Node.js (Express), MySQL
- **คำอธิบาย:** ระบบช่วยวางแผนการขนส่งสินค้า จัดการเส้นทาง และติดตามสถานะการจัดส่งแบบ Real-time โดยใช้เทคโนโลยี Mapbox สำหรับการแสดงผลแผนที่

### Architecture Diagram
**1. Application Architecture (ระบบการทำงานหลัก)**
```text
                          ┌─────────────────┐
                          │   Mapbox API    │
                          └────────▲────────┘
                                   │ Map Data
┌──────────────┐          ┌────────┴────────┐          ┌─────────────────┐
│              │   HTTP   │                 │   REST   │                 │
│ User Browser ├─────────▶│    Frontend     ├─────────▶│     Backend     │
│              │          │  (React/Vite)   │   API    │(Node.js/Express)│
└──────────────┘          └─────────────────┘          └────────┬────────┘
                                                                │
                          ┌─────────────────┐                   │
                          │ OpenWeather API │◀──────────────────┤
                          └─────────────────┘     Weather       │ SQL
                                                   Data         │
                                                       ┌────────▼────────┐
                                                       │                 │
                                                       │ MySQL Database  │
                                                       │                 │
                                                       └─────────────────┘
```

**2. Deployment & CI/CD Pipeline (ระบบ CI/CD และ Infrastructure)**
```text
 Developer
     │
     ▼ git push
  GitHub ──── webhook ────▶ Jenkins CI/CD Pipeline
                                 │
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
                  Build        Test      Docker Build
                                             │
                                             ▼
                                        Docker Hub
                                    - backend image
                                    - frontend image
                                             │
                                     ┌───────┴───────┐
                                     ▼               ▼
                                 Terraform        Ansible
                             (Infrastructure)  (Configuration)
                                     │               │
                                     └───────┬───────┘
                                             ▼
                                    Kubernetes Cluster
                     ┌────────────────────────────────────────────────┐
                     │          Service (NodePort / ClusterIP)        │
                     ├───────────────────────┬────────────────────────┤
                     │     Frontend Pods     │      Backend Pods      │
                     │       (React)         │       (Node.js)        │
                     ├───────────────────────┴────────────────────────┤
                     │                 MySQL Database                 │
                     └───────────────────────┬────────────────────────┘
                                             │
                               ┌─────────────┴──────────────┐
                               ▼                            ▼
                           Prometheus ───────────────▶   Grafana
                        (Scrape /metrics)              (Dashboard)
```

---

## 📁 โครงสร้าง Repository

```
Smart_Logistics_Planner/
├── Backend/                    # Node.js Express Backend
│   ├── index.js                # Entry point หลักของ Backend
│   ├── package.json            # Node.js dependencies (Backend)
│   └── Dockerfile              # สำหรับสร้าง Backend image
├── Frontend/                   # React Vite Frontend
│   ├── src/                    # โค้ดหลักของ Frontend (React)
│   ├── package.json            # Node.js dependencies (Frontend)
│   └── Dockerfile              # สำหรับสร้าง Frontend image
├── Jenkinsfile                 # กำหนด CI/CD pipeline ทุก stage
├── docker-compose.yml          # สำหรับรันทุก service พร้อมกัน (DB, Backend, Frontend)
├── terraform/                  # Infrastructure as Code
├── ansible/                    # Configuration Management
├── k8s/                        # Kubernetes Manifests
└── README.md
```

---

## ⚙️ สิ่งที่ต้องติดตั้งก่อน (Prerequisites)

ตรวจสอบให้แน่ใจว่าติดตั้งทุก tool ครบก่อนรันโปรเจค

| Tool | Version | หน้าที่ |
|------|---------|---------|
| Git | ≥ 2.x | จัดการ source code |
| Docker | ≥ 24.x | สร้างและรัน container |
| Jenkins | ≥ 2.4xx | ระบบ CI/CD automation |
| Terraform | ≥ 1.x | Provision infrastructure |
| Ansible | ≥ 2.15 | Configure environment |
| kubectl | ≥ 1.28 | สั่งงาน Kubernetes cluster |
| Minikube / K3s | latest | Kubernetes แบบ local |
| Prometheus | ≥ 2.x | เก็บ metrics |
| Grafana | ≥ 10.x | แสดง dashboard |

---

## 🏃 วิธีรันโปรเจค (Quick Start)

### 1. Clone Repository
```bash
git clone https://github.com/pppb893/Smart_Logistics_Planner.git
cd Smart_Logistics_Planner
```

### 2. รันแอปบนเครื่องโดยตรง (Manual Run)

**Backend:**
```bash
cd Backend
npm install
npm run dev
# Backend รันที่ http://localhost:5000 (ถูก map ไปที่ 5001 ใน docker)
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
# Frontend รันที่ http://localhost:5173
```

### 3. Build และรันด้วย Docker (Recommended)
รันทุกอย่าง (Database, Backend, Frontend) ด้วยคำสั่งเดียว:
```bash
docker-compose up --build
```
หรือ Build ทีละตัว:
```bash
# Backend
docker build -t [username]/backend:latest ./Backend
# Frontend
docker build -t [username]/frontend:latest ./Frontend
```

---

## 🔄 CI/CD Pipeline (Jenkins)

### ลำดับการทำงานของ Pipeline

```
Checkout ──▶ Build ──▶ Test ──▶ Docker Build ──▶ Push to Hub ──▶ Deploy
```

| Stage | คำอธิบาย |
|-------|----------|
| **Checkout** | ดึงโค้ดล่าสุดจาก GitHub |
| **Build** | ติดตั้ง dependencies |
| **Test** | รัน unit test |
| **Docker Build** | สร้าง Docker image |
| **Push to Hub** | อัปโหลด image ขึ้น Docker Hub |
| **Deploy** | รัน Terraform + Ansible แล้ว apply Kubernetes manifests |

### วิธีตั้งค่า Jenkins
1. ติดตั้ง Jenkins และเปิดที่ `http://localhost:8080`
2. ติดตั้ง plugin: **Git**, **Pipeline**, **Docker Pipeline**
3. เพิ่ม credentials สำหรับ Docker Hub (ชื่อ `dockerhub-credentials`)
4. สร้าง Pipeline job ใหม่ และชี้ไปที่ repository นี้
5. ตั้งค่า Webhook ใน GitHub:
   - ไปที่ **Settings → Webhooks → Add webhook**
   - Payload URL: `http://[jenkins-host]:8080/github-webhook/`
   - Content type: `application/json`
   - ติ๊ก trigger: **Just the push event**

---

## 🏗️ Infrastructure as Code

### Terraform — Provision Infrastructure
```bash
cd terraform
terraform init      # ดาวน์โหลด provider plugins
terraform plan      # ตรวจสอบว่าจะสร้างอะไรบ้าง
terraform apply     # สร้าง resource จริง
```
> **สิ่งที่ Terraform สร้าง:** [อธิบาย เช่น Docker network, Kubernetes namespace, local directory]

### Ansible — Configure Environment
```bash
cd ansible
ansible-playbook -i inventory playbook.yml
```
> **สิ่งที่ Ansible ทำ:** [อธิบาย เช่น ติดตั้ง kubectl, copy kubeconfig, ตั้งค่า environment variable]

> ⚠️ **หมายเหตุ:** ใน pipeline จริง Jenkins จะเรียก Terraform และ Ansible อัตโนมัติในขั้นตอน Deploy ไม่ต้องรันด้วยมือ

---

## ☸️ Kubernetes Deployment

### Apply Manifests ด้วยตัวเอง
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### ตรวจสอบสถานะ
```bash
kubectl get pods -n [namespace]
kubectl get svc  -n [namespace]
```

### ผลลัพธ์ที่ควรจะได้
```
NAME                        READY   STATUS    RESTARTS   AGE
smart-logistics-backend-xxxxxxxxx-xxxxx  1/1     Running   0          2m
smart-logistics-backend-xxxxxxxxx-yyyyy  1/1     Running   0          2m

NAME                  TYPE       CLUSTER-IP     PORT(S)          AGE
smart-logistics-svc   NodePort   10.96.xx.xxx   5000:30080/TCP   2m
```

### เข้าถึงแอปพลิเคชัน
- **Frontend (Development):** `http://localhost:5173`
- **Backend API:** `http://localhost:5001` (หรือ `5000` ถ้ารันตรงโดยไม่ผ่าน Docker)
- **Kubernetes (NodePort):** `http://localhost:30080` (เมื่อ Deploy บน Cluster)

---

## 📊 Monitoring

### Prometheus — เก็บ Metrics
- ไฟล์ config: `monitoring/prometheus.yml`
- Scrape ทุก **15 วินาที**
- Target endpoint: `http://[app-host]:[port]/metrics`

รัน Prometheus:
```bash
prometheus --config.file=monitoring/prometheus.yml
# เปิด UI ที่ http://localhost:9090
```

### Grafana — แสดง Dashboard
- ไฟล์ dashboard: `monitoring/grafana-dashboard.json`
- Data source: Prometheus (`http://localhost:9090`)

วิธี import dashboard:
1. เปิด Grafana ที่ `http://localhost:3000`
2. ไปที่ **Dashboards → Import**
3. อัปโหลดไฟล์ `grafana-dashboard.json`

### Panels ใน Dashboard

| Panel | Metric (PromQL) | แสดงข้อมูลอะไร |
|-------|-----------------|----------------|
| Request Rate | `rate(http_requests_total[1m])` | จำนวน request ต่อวินาที |
| Error Rate | `rate(http_requests_total{status=~"5.."}[1m])` | จำนวน error 5xx ต่อวินาที |
| Latency (p95) | `histogram_quantile(0.95, ...)` | response time ที่ percentile 95 |
| Pod Health | `up{job="backend"}` | service ขึ้นหรือล่ม (1/0) |

---

## 🌿 Branching Strategy

```
main        ──── โค้ดที่พร้อม production, protected branch
dev         ──── รวมโค้ดก่อน merge ขึ้น main
feature/*   ──── พัฒนา feature แต่ละอัน (เช่น feature/add-login)
```

| Branch | Protected | คำอธิบาย |
|--------|-----------|----------|
| `main` | ✅ | trigger pipeline อัตโนมัติเมื่อ merge |
| `dev` | ✅ | ทดสอบก่อน merge ขึ้น main |
| `feature/*` | ❌ | พัฒนาแยกกันแล้วค่อย merge เข้า dev |

---

## 🧪 API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/` | Health check — ตรวจว่าแอปยังรันอยู่ |
| `GET` | `/metrics` | Prometheus metrics endpoint |
| `POST` | `/api/auth/register` | ลงชื่อเข้าใช้ / สมัครสมาชิก |
| `GET` | `/api/shipments` | ดึงรายการการขนส่งทั้งหมด |
| `POST` | `/api/routes` | สร้างเส้นทางการขนส่งใหม่ |

---

## 🐛 ปัญหาที่พบบ่อย (Troubleshooting)

### 🛠️ ปัญหาด้านการพัฒนาและการตั้งค่า (Development)

**1. แก้ไขโค้ด Backend แล้ว แต่ใน Docker ไม่เปลี่ยน**
- **สาเหตุ:** Docker ใช้ Cache เดิมของ Image
- **วิธีแก้:** ต้องทำการ Rebuild backend เสมอเมื่อมีการแก้ไขโค้ดหรือไฟล์ `.env`:
  ```bash
  docker compose up -d --build backend
  ```

**2. แผนที่ไม่ขึ้น หรือฟีเจอร์สภาพอากาศใช้งานไม่ได้**
- **สาเหตุ:** ลืมตั้งค่า API Tokens ในไฟล์ `.env`
- **วิธีแก้:** 
  - ตรวจสอบ `Frontend/.env` ว่ามี `VITE_MAPBOX_ACCESS_TOKEN`
  - ตรวจสอบ `Backend/.env` ว่ามี `OPENWEATHER_API_KEY`

**3. Error `ER_OUT_OF_SORTMEMORY` เมื่อดึงรายการขนส่ง**
- **สาเหตุ:** ข้อมูลเส้นทาง (Geometry JSON) มีขนาดใหญ่เกินไปสำหรับการทำ `ORDER BY` ใน MySQL
- **วิธีแก้:** ลบคำสั่ง `ORDER BY` ใน Query ของ Shipment Controller หรือเพิ่มค่า `sort_buffer_size` ใน MySQL config

**4. ข้อมูลหายไปเมื่อ Refresh หน้าจอ**
- **สาเหตุ:** แอปพลิเคชันยังไม่ได้โหลดข้อมูลจาก Database หลังจาก Refresh
- **วิธีแก้:** ระบบปัจจุบันใช้ JWT และจะโหลดข้อมูล `shipments` อัตโนมัติจาก DB เมื่อ User ทำการ Login สำเร็จ (ข้อมูลถูกเก็บถาวรใน MySQL)

**5. เส้นทางขึ้นคำเตือนพายุ (Storm Warning) ทั้งที่ไม่มีพายุ**
- **สาเหตุ:** อาจมีการเปิดฟีเจอร์จำลองพายุ (Simulation) ค้างไว้ในโค้ด
- **วิธีแก้:** ตรวจสอบและปิดส่วนของ Static Storm Check ใน `shipmentController.js` เพื่อให้ระบบใช้ข้อมูลจาก OpenWeatherMap จริงๆ

### ☸️ ปัญหาด้าน Infrastructure & K8s

**Pods ค้างอยู่ที่ `Pending` ไม่ยอม Running**
```bash
kubectl describe pod [pod-name] -n [namespace]
# ดูที่ Events: อาจเกิดจาก resource ไม่พอ หรือ image pull error
```

**Jenkins pipeline ล้มเหลวตอน Docker Build**
```bash
# ตรวจว่า Docker daemon รันอยู่
sudo systemctl start docker
# เพิ่ม jenkins user เข้า docker group
sudo usermod -aG docker jenkins
```

**Prometheus แสดง target เป็น DOWN**
```bash
# ตรวจว่าแอปเปิด /metrics ได้จริง
curl http://localhost:5001/metrics  # สำหรับ Docker
# หรือ
curl http://localhost:5000/metrics  # สำหรับรันตรง
# ตรวจ prometheus.yml ว่า host:port ตรงกับแอปจริง
```

---

## 📚 เอกสารอ้างอิง

- [Jenkinsfile Declarative Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [Ansible Documentation](https://docs.ansible.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown Syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

