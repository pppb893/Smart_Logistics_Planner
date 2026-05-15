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
                     │                    Ingress                     │
                     ├────────────────────────────────────────────────┤
                     │          Service (NodePort / ClusterIP)        │
                     ├───────────────────────┬────────────────────────┤
                     │     Frontend Pods     │      Backend Pods      │
                     │    (React/Nginx)      │   (Node.js/Express)    │
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
│   ├── config/                 # การตั้งค่าต่างๆ (เช่น Database)
│   ├── controllers/            # ส่วนควบคุม Logic ของแอปพลิเคชัน
│   ├── routes/                 # จัดการ API Endpoints
│   ├── index.js                # Entry point หลักของ Backend
│   ├── package.json            # Node.js dependencies (Backend)
│   └── Dockerfile              # สำหรับสร้าง Backend image
├── Frontend/                   # React Vite Frontend
│   ├── public/                 # Static assets
│   ├── src/                    # โค้ดหลักของ Frontend (React Components, CSS)
│   ├── nginx.conf              # การตั้งค่า Nginx สำหรับ production
│   ├── package.json            # Node.js dependencies (Frontend)
│   └── Dockerfile              # สำหรับสร้าง Frontend image
├── k8s/                        # Kubernetes Manifests
│   ├── app/                    # Manifests สำหรับแอป (backend, frontend, mysql, ingress, monitoring)
│   └── jenkins/                # Manifests สำหรับการจัดการ Jenkins
├── terraform/                  # Infrastructure as Code (main.tf)
├── ansible/                    # Configuration Management (playbook.yml)
├── monitoring/                 # Monitoring Configuration (prometheus.yml)
├── Jenkinsfile                 # กำหนด CI/CD pipeline ทุก stage
├── docker-compose.yml          # สำหรับรันทุก service พร้อมกันในเครื่อง (DB, Backend, Frontend)
├── custom_dashboard.json       # Grafana Dashboard แบบกำหนดเอง
└── README.md                   # เอกสารโปรเจค
```

---

## ⚙️ สิ่งที่ต้องติดตั้งก่อน (Prerequisites)

ตรวจสอบให้แน่ใจว่าติดตั้งทุก tool ครบก่อนรันโปรเจค

| Tool | Version | หน้าที่ |
|------|---------|---------|
| Node.js | ≥ 20.x | รันแอปพลิเคชันและจัดการ Dependencies |
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

### 4. รันแอปพลิเคชันบน Kubernetes (เพื่อให้เข้าใช้งานผ่าน http://my-nginx.local)
หากต้องการทดสอบรันระบบบน Kubernetes (Local Cluster เช่น Minikube) ด้วยตัวเอง ก่อนที่ Jenkins จะเข้ามาทำหน้าที่อัปเดตอัตโนมัติ ให้ทำตามขั้นตอนดังนี้:

**ขั้นตอนที่ 1: การ Start Server และ Deploy ขึ้น Kubernetes**
1. สตาร์ท Minikube และเปิดใช้งาน Ingress Addon (จำเป็นสำหรับการเชื่อมต่อผ่าน `my-nginx.local`):
   ```bash
   minikube start
   minikube addons enable ingress
   ```
2. ทำการ Deploy ระบบทั้งหมด (Database, Backend, Frontend, Ingress, Monitoring) เข้าไปใน Kubernetes:
   ```bash
   kubectl apply -f k8s/app/
   ```
3. รอจนกว่า Pods ทั้งหมดจะอยู่ในสถานะ Running:
   ```bash
   kubectl get pods -n smart-logistics
   ```

**ขั้นตอนที่ 2: การตั้งค่า Host เพื่อเข้าถึงแอปพลิเคชัน (Map Host)**
ระบบใช้ Ingress โดยกำหนด Host เป็น `my-nginx.local` ดังนั้นคุณต้องชี้โดเมนนี้มาที่ Kubernetes ของคุณ:
1. ดู IP ของ Minikube ด้วยคำสั่ง:
   ```bash
   minikube ip
   ```
2. (สำหรับ Windows) เปิดโปรแกรม **Notepad** ด้วยสิทธิ์ Administrator
3. เปิดไฟล์ `C:\Windows\System32\drivers\etc\hosts`
4. นำ IP ที่ได้จากข้อ 1 มาเพิ่มบรรทัดใหม่ที่ท้ายไฟล์ (หรือใช้ `127.0.0.1` หากรัน K8s ผ่าน Docker Desktop):
   ```text
   192.168.49.2    my-nginx.local
   ```
5. บันทึกไฟล์ จากนั้นเปิดเบราว์เซอร์ไปที่ `http://my-nginx.local` เพื่อใช้งานแอปพลิเคชันได้ทันที

*(หมายเหตุ: หลังจากระบบถูก Start แล้ว การ Push โค้ดขึ้น `main` จะเป็นการทริกเกอร์ให้ Jenkins ทำการ Build และ **Update** Server บน K8s นี้โดยอัตโนมัติ)*

---

## 🔄 CI/CD Pipeline (Jenkins)

### ลำดับการทำงานของ Pipeline

โปรเจคนี้ใช้ Jenkins แบบ Dynamic Agents บน Kubernetes โดยแบ่งออกเป็น 7 Stages:
```text
Checkout ──▶ Install Dependencies ──▶ Lint & Test ──▶ Docker Build ──▶ Docker Push ──▶ Provision & Configure ──▶ Deploy to K8s
```

| Stage | คำอธิบาย |
|-------|----------|
| **Checkout** | ดึงโค้ดล่าสุดจาก GitHub repository |
| **Install Dependencies** | ใช้ Node.js container รัน `npm install` ให้ทั้ง Backend และ Frontend |
| **Lint & Test** | รันคำสั่งตรวจสอบคุณภาพโค้ดของ Frontend (`npm run lint`) |
| **Docker Build** | สร้างไฟล์ `.env` และ Inject API Keys ก่อน Build Docker Image |
| **Docker Push** | ล็อกอินและอัปโหลด Image ขึ้น Docker Hub พร้อมแท็กเวอร์ชัน `BUILD_NUMBER` |
| **Provision & Configure** | รัน `terraform apply` (ส่งผ่าน API keys) และ `ansible-playbook` |
| **Deploy to K8s** | อัปเดต Image Tag ใน Manifests อัตโนมัติ, Apply ไฟล์ K8s ทั้งหมด และสั่ง Rollout Restart |

### วิธีตั้งค่า Jenkins
1. ติดตั้ง Jenkins ภายใน Kubernetes หรือเซิร์ฟเวอร์ที่รองรับการรัน Kubernetes Pod Agents ได้
2. ติดตั้ง Plugins: **Kubernetes Plugin**, **Git**, **Pipeline**, **Docker Pipeline**
3. **เพิ่ม Credentials ใน Jenkins** ให้ครบถ้วน เพื่อให้ Pipeline นำไปใช้งานได้:
   - `docker-hub-credentials` (ประเภท Username with password)
   - `MAPBOX_TOKEN` (ประเภท Secret text) 
   - `OPENWEATHER_KEY` (ประเภท Secret text) 
4. สร้าง Pipeline Job ใหม่ และชี้พอยต์มาที่ Repository นี้
5. ตั้งค่า Webhook ใน GitHub:
   - ไปที่ **Settings → Webhooks → Add webhook**
   - Payload URL: `http://[jenkins-host]/github-webhook/`
   - Content type: `application/json`
   - ติ๊ก trigger: **Just the push event**

---

## 🏗️ Infrastructure as Code

### Terraform — Provision Infrastructure
```bash
cd terraform
terraform init
terraform apply -var="mapbox_token=YOUR_TOKEN" -var="openweather_key=YOUR_KEY"
```
> **สิ่งที่ Terraform สร้างในโปรเจคนี้:** 
> 1. สร้าง Namespace `smart-logistics` ใน Kubernetes
> 2. สร้าง Persistent Volume Claim (PVC) ชื่อ `mysql-pvc` สำหรับจัดเก็บข้อมูล Database
> 3. สร้าง K8s Secret ชื่อ `app-secrets` เพื่อจัดเก็บ `MAPBOX_TOKEN` และ `OPENWEATHER_KEY` อย่างปลอดภัย

### Ansible — Configure Environment
```bash
cd ansible
ansible-playbook playbook.yml
```
> **สิ่งที่ Ansible ทำในโปรเจคนี้:** ตรวจสอบความพร้อมของ Kubernetes Cluster (`cluster-info`) และเช็คว่า Namespace ถูกเตรียมพร้อมแล้วหรือไม่ ก่อนจะเริ่มทำการ Deploy

> ⚠️ **หมายเหตุ:** ใน Pipeline จริง Jenkins จะรัน Terraform และ Ansible ให้อัตโนมัติโดยรับค่า API Keys จาก Jenkins Credentials

---

## ☸️ Kubernetes Deployment

### Apply Manifests ด้วยตัวเอง (Manual Deploy)
หากไม่ใช้ Jenkins คุณสามารถ Deploy ทุกอย่างได้ด้วยคำสั่งเดียว:
```bash
kubectl apply -f k8s/app/
```
*(คำสั่งนี้จะ Deploy ทั้ง Database, Backend, Frontend, Ingress และ Monitoring เข้าไปพร้อมกัน)*

### ตรวจสอบสถานะ
```bash
kubectl get pods -n smart-logistics
kubectl get svc -n smart-logistics
kubectl get ingress -n smart-logistics
```

### ผลลัพธ์ที่ควรจะได้
```text
NAME                            READY   STATUS    RESTARTS   AGE
pod/backend-xxxxxxxxxx-xxxxx    1/1     Running   0          2m
pod/frontend-xxxxxxxxxx-yyyyy   1/1     Running   0          2m
pod/mysql-xxxxxxxxxx-zzzzz      1/1     Running   0          2m

NAME               TYPE        CLUSTER-IP      PORT(S)    AGE
service/backend    ClusterIP   10.96.xx.xxx    5000/TCP   2m
service/frontend   ClusterIP   10.96.xx.yyy    80/TCP     2m
service/mysql      ClusterIP   10.96.xx.zzz    3306/TCP   2m

NAME                  CLASS   HOSTS   ADDRESS        PORTS   AGE
ingress/app-ingress   nginx   *       192.168.49.2   80      2m
```

### เข้าถึงแอปพลิเคชัน
- **รันบนเครื่องโดยตรง / Docker Compose:**
  - **Frontend:** `http://localhost:5173`
  - **Backend API:** `http://localhost:5001` (หรือ `5000` ถ้ารันตรง)
- **รันบน Kubernetes (ผ่าน Ingress):**
  - **Frontend:** `http://my-nginx.local`
  - **Backend API:** `http://my-nginx.local/api`

---

## 📊 Monitoring

ระบบ Monitoring ถูก Deploy อัตโนมัติบน Kubernetes ผ่านไฟล์ `k8s/app/monitoring.yaml` ซึ่งจะจัดการให้ทั้ง Prometheus และ Grafana ทำงานเชื่อมต่อกันโดยสมบูรณ์

### Prometheus — เก็บ Metrics
- **ConfigMap:** จัดการการตั้งค่าผ่าน `prometheus-config` ใน K8s
- **Scrape Interval:** ดึงข้อมูลทุก **15 วินาที**
- **Target:** ดึงข้อมูลจาก Service `backend:5000` อัตโนมัติ
- **การเข้าถึง UI (NodePort):**
  รันคำสั่ง `minikube service prometheus -n smart-logistics` เพื่อเปิดหน้าเว็บ (หรือเช็คผ่าน IP ของ Node และ Port ของ Kubernetes)

### Grafana — แสดง Dashboard
ระบบจะทำการเชื่อมต่อ Data Source (Prometheus) และ Import Dashboard ให้แบบ **อัตโนมัติ** ผ่าน ConfigMap (`grafana-custom-dashboard`) ไม่ต้องอัปโหลดไฟล์ด้วยตัวเอง!
- **การเข้าถึง UI (NodePort):**
  รันคำสั่ง `minikube service grafana -n smart-logistics` เพื่อเปิดหน้าเว็บ

### Panels ใน Dashboard (Auto-generated)
Dashboard **"Backend Live Metrics"** จะมีกราฟที่ถูกเตรียมไว้ให้แล้วดังนี้:

| Panel | Metric (PromQL) | แสดงข้อมูลอะไร |
|-------|-----------------|----------------|
| CPU Usage | `rate(process_cpu_user_seconds_total{job="backend"}[1m])` | อัตราการใช้งาน CPU ของ Backend |
| Memory Usage | `process_resident_memory_bytes{job="backend"}` | ปริมาณหน่วยความจำ (RAM) ที่ Backend ใช้งานอยู่ |
| HTTP Requests | `rate(http_requests_total{job="backend"}[1m])` | จำนวน Request ที่เข้ามายัง Backend ต่อวินาที |

---

## 🌿 Branching Strategy

โปรเจคนี้ใช้การแบ่ง Branch ตามชื่อนักพัฒนาและรวมโค้ดที่พร้อมใช้งานเข้าสู่ `main`

```text
main        ──── โค้ด Production ที่เชื่อมต่อกับ CI/CD Pipeline
jia         
sam         
```

| Branch | Protected | คำอธิบาย |
|--------|-----------|----------|
| `main` | ✅ | Branch หลักของโปรเจค จะ Trigger Jenkins Pipeline อัตโนมัติเมื่อมีการ Push/Merge |
| `jia`, `sam` | ❌ | Branch ประจำตัวของนักพัฒนาแต่ละคน ใช้สำหรับเขียนโค้ดและทดสอบให้มั่นใจก่อนนำไปรวมกับ `main` |

---

## 🧪 API Endpoints

| โหมด | Method | Endpoint | คำอธิบาย |
|------|--------|----------|----------|
| **System** | `GET` | `/` | Health check — ตรวจสอบสถานะการทำงานของแอปพลิเคชัน |
| **System** | `GET` | `/metrics` | Prometheus metrics endpoint (สำหรับ Grafana) |
| **Auth** | `POST` | `/api/auth/register` | ลงทะเบียนผู้ใช้งานใหม่ |
| **Auth** | `POST` | `/api/auth/login` | เข้าสู่ระบบและรับ JWT Token |
| **Shipments**| `GET` | `/api/shipments` | [Auth] ดึงรายการขนส่งทั้งหมดของผู้ใช้ |
| **Shipments**| `POST` | `/api/shipments` | [Auth] สร้างและบันทึกเส้นทางการขนส่งใหม่ |
| **Shipments**| `PATCH` | `/api/shipments/:id/toggle` | [Auth] เปิด/ปิด การแสดงผลเส้นทางบนแผนที่ |
| **Shipments**| `DELETE` | `/api/shipments/:id` | [Auth] ลบประวัติการขนส่ง |
| **Routing** | `POST` | `/api/routes/recommend` | ประมวลผลและแนะนำเส้นทาง (ใช้ Mapbox API) |
| **Weather** | `GET` | `/api/routes/weather` | ดึงข้อมูลสภาพอากาศปัจจุบัน ณ พิกัดที่ระบุ (OpenWeather) |
| **Weather** | `GET` | `/api/routes/forecast` | พยากรณ์สภาพอากาศล่วงหน้าตามเวลาการเดินทาง (OpenWeather) |

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

**1. Pods ค้างอยู่ที่ `Pending` หรือ `CrashLoopBackOff`**
- **สาเหตุ:** อาจเกิดจากทรัพยากร (CPU/Memory) ใน Cluster ไม่พอ, ดึง Image จาก Docker Hub ไม่ได้, หรือคอนฟิกผิดพลาด
- **วิธีตรวจสอบ:**
  ```bash
  kubectl describe pod <pod-name> -n smart-logistics
  kubectl logs <pod-name> -n smart-logistics
  ```

**2. Jenkins Pipeline ล้มเหลวที่ขั้นตอน Docker Build**
- **สาเหตุ:** โปรเจคนี้รัน Jenkins Agent ภายใน Kubernetes และใช้ Docker-in-Docker (`dind`) หาก Container `dind` ล่มหรือเชื่อมต่อไม่ได้ การ Build จะล้มเหลว
- **วิธีตรวจสอบ:** ดู Log ของ Docker daemon ภายใน Jenkins Agent Pod
  ```bash
  kubectl logs <jenkins-agent-pod> -c dind -n jenkins
  ```

**3. Prometheus แสดงสถานะ Target (Backend) เป็น DOWN**
- **สาเหตุ:** Prometheus ดึง Metrics ผ่าน DNS `backend:5000` ไม่ได้ อาจเป็นเพราะ Backend ล่ม หรือตั้งค่า Service ผิดพลาด
- **วิธีตรวจสอบ:**
  ```bash
  # 1. ตรวจสอบว่า Backend Service ชี้ไปที่ Pods ได้ถูกต้อง (มี IP ปรากฏ)
  kubectl get endpoints backend -n smart-logistics
  
  # 2. จำลองการเชื่อมต่อ /metrics ด้วยตัวเองผ่าน Port Forwarding
  kubectl port-forward svc/backend 5000:5000 -n smart-logistics
  # เปิด Terminal ใหม่แล้วรัน:
  curl http://localhost:5000/metrics
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

