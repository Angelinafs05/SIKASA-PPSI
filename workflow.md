# SIKASA — Workflow Documentation

Dokumen ini berisi gambaran alur kerja sistem **SIKASA** dalam bentuk diagram.

---

## 1. Arsitektur Sistem

```mermaid
graph TD
    subgraph Client ["🌐 Frontend (React + Vite)"]
        Browser["Browser User"]
        Pages["Pages (JSX)"]
        Context["Auth Context"]
        Axios["api.js (Axios)"]
    end

    subgraph Server ["⚙️ Backend (PHP Native)"]
        Router["index.php (Router)"]
        Auth["auth.php (JWT Middleware)"]
        Controllers["Controllers/"]
        Helpers["Helpers & Config"]
    end

    subgraph Data ["🗄️ Data Layer"]
        MySQL[("MySQL Database")]
        Uploads["uploads/ (File Storage)"]
    end

    Browser --> Pages
    Pages --> Context
    Context --> Axios
    Axios -- "HTTP + Bearer Token" --> Router
    Router --> Auth
    Auth -- "Valid ✅" --> Controllers
    Auth -- "Denied ❌" --> Browser
    Controllers --> Helpers
    Controllers --> MySQL
    Controllers --> Uploads
    MySQL --> Controllers
    Controllers -- "JSON Response" --> Axios
    Axios --> Pages
```

---

## 2. Alur Autentikasi (JWT)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant API as Backend (PHP)
    participant DB as Database

    User->>FE: Isi form Login
    FE->>API: POST /api/login {username, password}
    API->>DB: SELECT user WHERE username = ?
    DB-->>API: Data User

    alt Password Cocok
        API-->>FE: 200 OK + JWT Token
        FE->>FE: Simpan token di localStorage
        FE->>User: Redirect ke Dashboard (sesuai role)
    else Password Salah
        API-->>FE: 401 Unauthorized
        FE->>User: Tampilkan pesan error
    end

    User->>FE: Akses halaman protected
    FE->>API: GET /api/data + Header: "Authorization: Bearer <token>"
    API->>API: Validasi & decode JWT
    alt Token Valid
        API-->>FE: 200 OK + Data JSON
    else Token Expired / Invalid
        API-->>FE: 401 Unauthorized
        FE->>User: Redirect ke Login
    end
```

---

## 3. Workflow Per Peran (Role)

```mermaid
graph TD
    Login["🔐 Login"]
    Login --> RoleCheck{Cek Role}

    RoleCheck -->|admin| AdminDash["📊 Admin Dashboard"]
    RoleCheck -->|pelatih| PelatihDash["🏋️ Pelatih Dashboard"]
    RoleCheck -->|siswa| SiswaDash["🎒 Siswa Dashboard"]
    RoleCheck -->|pendamping| GuruDash["👨‍🏫 Guru Dashboard"]
    RoleCheck -->|orang_tua| OrtaDash["👪 Orang Tua Dashboard"]
    RoleCheck -->|kepala_sekolah| KepalaSekolahDash["🏫 Kepala Sekolah"]

    AdminDash --> A1["Kelola Kelas"]
    AdminDash --> A2["Kelola Ekskul"]
    AdminDash --> A3["Kelola Siswa / Guru / Pelatih"]
    AdminDash --> A4["Persetujuan Pendaftaran"]
    AdminDash --> A5["Honor Pelatih"]
    AdminDash --> A6["Monitoring Absensi & Nilai"]
    AdminDash --> A7["Data Orang Tua"]

    PelatihDash --> P1["Lihat Daftar Siswa Ekskul"]
    PelatihDash --> P2["Input Absensi Pertemuan"]
    PelatihDash --> P3["Input Nilai Siswa"]
    PelatihDash --> P4["Lihat Riwayat Honor"]

    SiswaDash --> S1["Daftar Ekskul"]
    SiswaDash --> S2["Ajukan Izin Absen"]
    SiswaDash --> S3["Lihat Kehadiran"]
    SiswaDash --> S4["Lihat Info Lomba"]

    GuruDash --> G1["Monitor Absensi"]
    GuruDash --> G2["Bantu Input Nilai"]

    OrtaDash --> O1["Lihat Absensi Anak"]
    OrtaDash --> O2["Lihat Nilai Anak"]
    OrtaDash --> O3["Lihat Lomba Anak"]
    OrtaDash --> O4["Ajukan Pengunduran Diri Ekskul"]

    KepalaSekolahDash --> K1["Monitoring Absensi Global"]
    KepalaSekolahDash --> K2["Laporan Honor Pelatih"]
    KepalaSekolahDash --> K3["Data Lomba Siswa"]
```

---

## 4. Alur Pendaftaran Ekskul (Contoh Workflow Data)

```mermaid
sequenceDiagram
    actor Siswa
    actor Admin
    participant FE as Frontend
    participant API as Backend
    participant DB as Database

    Siswa->>FE: Buka halaman Ekskul
    FE->>API: GET /api/siswa/ekskul
    API->>DB: SELECT ekskul yang tersedia
    DB-->>API: List Ekskul
    API-->>FE: JSON Ekskul
    FE->>Siswa: Tampilkan daftar ekskul

    Siswa->>FE: Klik "Daftar" pada ekskul
    FE->>API: POST /api/siswa/daftar {ekskul_id}
    API->>DB: INSERT pendaftaran (status: pending)
    DB-->>API: OK
    API-->>FE: "Pendaftaran berhasil, menunggu persetujuan"
    FE->>Siswa: Notifikasi berhasil

    Admin->>FE: Buka halaman Persetujuan
    FE->>API: GET /api/admin/pendaftaran
    API->>DB: SELECT pendaftaran WHERE status = pending
    DB-->>API: List Pendaftaran
    FE->>Admin: Tampilkan daftar pending

    Admin->>FE: Klik "Setujui"
    FE->>API: POST /api/admin/pendaftaran/{id}/approve
    API->>DB: UPDATE status = approved
    DB-->>API: OK
    API-->>FE: "Pendaftaran disetujui"
    FE->>Admin: Update tampilan
```

---

## 5. Alur Honor Pelatih

```mermaid
flowchart LR
    A["Admin buka\nhalaman Honor"] --> B["GET /api/admin/honor\n(Lihat semua riwayat)"]
    B --> C["Klik 'Tambah Honor'"]
    C --> D["Isi Form:\nPelatih, Bulan, Nominal,\nBukti Transfer (file)"]
    D --> E["POST /api/admin/honor\nmultipart/form-data"]
    E --> F{"Validasi Backend"}
    F -- "Valid ✅" --> G["INSERT riwayat_honor\nSimpan file bukti transfer"]
    F -- "Duplikat ❌" --> H["Error: Data bulan ini\nsudah ada"]
    G --> I["Pelatih buka halaman Honor"]
    I --> J["GET /api/pelatih/honor\n(Filter by pelatih_id)"]
    J --> K["Pelatih lihat\nriwayat pembayaran"]
```

---

## 6. Alur Pengembangan Fitur Baru

```mermaid
flowchart TD
    Start["💡 Ide Fitur Baru"] --> DB["1️⃣ Buat/Ubah Tabel\ndi MySQL"]
    DB --> Controller["2️⃣ Buat Controller\nbackend/controllers/NewController.php"]
    Controller --> Route["3️⃣ Daftarkan Endpoint\ndi backend/index.php"]
    Route --> Page["4️⃣ Buat Halaman\nfrontend/src/pages/NewPage.jsx"]
    Page --> AppRoute["5️⃣ Daftarkan Route\ndi frontend/src/App.jsx"]
    AppRoute --> Test["6️⃣ Test di Browser\nlocalhost:5173"]
    Test --> Done["✅ Fitur Siap"]
```

---

## 7. Peta Endpoint API

| Peran | Endpoint | Method | Fungsi |
|---|---|---|---|
| Public | `/api/login` | POST | Login & dapat JWT Token |
| Admin | `/api/admin/dashboard` | GET | Data statistik dashboard |
| Admin | `/api/admin/siswa` | GET/POST | CRUD data siswa |
| Admin | `/api/admin/ekskul` | GET/POST/PUT/DELETE | Kelola ekskul |
| Admin | `/api/admin/pendaftaran/{id}/approve` | POST | Setujui pendaftaran |
| Admin | `/api/admin/honor` | GET/POST | Kelola honor pelatih |
| Admin | `/api/admin/monitoring` | GET | Rekapitulasi absensi global |
| Pelatih | `/api/pelatih/dashboard` | GET | Dashboard pelatih |
| Pelatih | `/api/pelatih/absensi` | GET/POST | Input & lihat absensi |
| Pelatih | `/api/pelatih/nilai` | GET/POST | Input & lihat nilai |
| Pelatih | `/api/pelatih/honor` | GET | Riwayat honor |
| Siswa | `/api/siswa/dashboard` | GET | Dashboard siswa |
| Siswa | `/api/siswa/daftar` | POST | Daftar ekskul |
| Siswa | `/api/siswa/izin` | POST | Ajukan izin absen |
| Siswa | `/api/siswa/kehadiran` | GET | Lihat history kehadiran |
| Orang Tua | `/api/parent/children` | GET | Lihat data anak |
| Orang Tua | `/api/parent/child/{id}/absensi` | GET | Absensi anak |
