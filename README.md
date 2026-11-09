# KosKu – Kelola Kamar Kos

Aplikasi web untuk membantu pemilik kos mencatat kamar, memantau kamar kosong, dan menagih pembayaran tepat waktu. Data tersimpan di Firebase, jadi bisa dibuka dari HP maupun laptop.

**Demo:** https://kosku-7018b.web.app/

## Anggota Tim

| Nama | NPM | Peran |
|------|-----|-------|
| Zahra Ayu Azhari | 25312123 | Autentikasi, database, dan logika kamar |
| Elvina Yulia Sari| 25312109 | Tampilan, laporan, dan dokumentasi |

Universitas Teknokrat Indonesia

## Pembagian Tugas

### Zahra Ayu Azhari – Autentikasi, database, dan logika kamar
- Login, daftar, keluar, dan reset password dengan Firebase Authentication (`js/auth.js`, `js/firebase.js`, `js/firebase-config.js`)
- Penyimpanan data realtime di Firestore dan aturan keamanan per pemilik (`js/db.js`, `firestore.rules`)
- Kelola kamar: tambah, ubah, hapus, tandai terisi atau kosong (`js/app.js`)
- Pencatatan pembayaran ("Sudah bayar") dan pergeseran jatuh tempo
- Pengingat tagihan dan tombol kirim WhatsApp ke penghuni
- Fungsi bantu tanggal, rupiah, dan terbilang (`js/util.js`)

### Elvina Yulia Sari – Tampilan, laporan, dan dokumentasi
- Rancangan tampilan, tema terang dan gelap, serta tampilan responsif di HP (`index.html`, `css/style.css`)
- Halaman login dan kartu ringkasan (hunian, potensi pemasukan, deposit, laba bersih)
- Laporan 6 bulan terakhir dan ekspor pembayaran ke CSV
- Pencatatan pengeluaran dan kuitansi pembayaran yang bisa dicetak
- Pengujian aplikasi, `README.md`, dan penyusunan laporan tugas

## Fitur
- Login dan daftar akun pemilik kos (data tiap pemilik terpisah)
- Profil kos: nama, alamat, nama pemilik, dan nomor WhatsApp
- Catatan kamar: nomor, tipe, harga, fasilitas, penghuni, tanggal masuk, deposit, jatuh tempo, dan catatan
- Filter (semua, kosong, terisi, telat bayar), pencarian, dan pengurutan
- Ringkasan: total kamar, kamar kosong, tingkat hunian, potensi pemasukan, deposit ditahan, pemasukan, dan laba bersih bulan ini
- Pengingat tagihan dengan pesan WhatsApp otomatis
- Riwayat pembayaran dan kuitansi
- Pengeluaran, laporan 6 bulan, dan ekspor CSV
- Tombol salin info kamar kosong untuk dibagikan

## Teknologi
- HTML, CSS, dan JavaScript (ES Modules)
- Firebase Authentication, Cloud Firestore, dan Firebase Hosting

## Struktur Folder
```
kosku/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── app.js              # tampilan dan logika utama
    ├── auth.js             # login, daftar, reset password
    ├── db.js               # akses Firestore
    ├── firebase.js         # inisialisasi Firebase
    ├── firebase-config.js  # konfigurasi proyek Firebase
    └── util.js             # fungsi bantu
```

## Cara Menjalankan
1. Unduh atau clone repositori ini.
2. Buat proyek di [Firebase Console](https://console.firebase.google.com/).
3. Aktifkan **Authentication** (metode Email/Password) dan **Cloud Firestore**.
4. Isi `js/firebase-config.js` dengan konfigurasi web app dari proyek Firebase kamu.
5. Pasang aturan keamanan Firestore agar tiap pemilik hanya bisa mengakses data miliknya (`owners/{uid}`), lalu jalankan secara lokal atau deploy dengan `firebase deploy`.

## Alur Kerja Git
- Setiap anggota bekerja di branch sendiri, lalu digabung lewat Pull Request.
- Pesan commit singkat dan jelas, misalnya `feat: tambah laporan 6 bulan`.
- Kedua anggota melakukan commit dengan akun GitHub masing-masing.
