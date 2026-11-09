import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTahunAjaran from './pages/admin/AdminTahunAjaran';
import EkskulList from './pages/admin/EkskulList';
import SiswaList from './pages/admin/SiswaList';
import PelatihList from './pages/admin/PelatihList';
import GuruList from './pages/admin/GuruList';
import KelasList from './pages/admin/KelasList';
import AdminPersetujuan from './pages/admin/AdminPersetujuan';
import AdminAbsensi from './pages/admin/AdminAbsensi';
import AdminRekapAbsensi from './pages/admin/AdminRekapAbsensi';
import AdminLaporanAbsensi from './pages/admin/AdminLaporanAbsensi';
import AdminIzin from './pages/admin/AdminIzin';
import AdminNilai from './pages/admin/AdminNilai';
import AdminRekapNilai from './pages/admin/AdminRekapNilai';
import AdminLaporanNilai from './pages/admin/AdminLaporanNilai';
import Monitoring from './pages/admin/Monitoring';

// Pelatih Pages
import PelatihDashboard from './pages/pelatih/PelatihDashboard';
import PelatihSiswa from './pages/pelatih/PelatihSiswa';
import PelatihAbsensi from './pages/pelatih/PelatihAbsensi';
import PelatihBobotNilai from './pages/pelatih/PelatihBobotNilai';
import PelatihNilai from './pages/pelatih/PelatihNilai';
import PelatihProfil from './pages/pelatih/PelatihProfil';
import PelatihJadwal from './pages/pelatih/PelatihJadwal';
import PelatihPerkembanganNilai from './pages/pelatih/PelatihPerkembanganNilai';

// Guru Pendamping Pages
import GuruDashboard from './pages/pelatih/GuruDashboard';
import GuruAbsensi from './pages/pelatih/GuruAbsensi';
import GuruNilai from './pages/pelatih/GuruNilai';
import GuruProfil from './pages/pelatih/GuruProfil';

// Siswa Pages
import SiswaDashboard from './pages/siswa/SiswaDashboard';
import SiswaEkskul from './pages/siswa/SiswaEkskul';
import SiswaDaftarForm from './pages/siswa/SiswaDaftarForm';
import SiswaJadwal from './pages/siswa/SiswaJadwal';
import SiswaIzinIndex from './pages/siswa/SiswaIzinIndex';
import SiswaIzinForm from './pages/siswa/SiswaIzinForm';
import SiswaKehadiran from './pages/siswa/SiswaKehadiran';
import SiswaNilai from './pages/siswa/SiswaNilai';
import SiswaProfil from './pages/siswa/SiswaProfil';

// Kepala Sekolah Pages
import KepalaSekolahDashboard from './pages/kepala_sekolah/KepalaSekolahDashboard';
import KepalaSekolahProfil from './pages/kepala_sekolah/KepalaSekolahProfil';

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="tahun-ajaran" element={<AdminTahunAjaran />} />
        {/* Master Data */}
        <Route path="siswa" element={<SiswaList />} />
        <Route path="kelas" element={<KelasList />} />
        <Route path="ekskul" element={<EkskulList />} />
        <Route path="pelatih" element={<PelatihList />} />
        <Route path="guru" element={<GuruList />} />
        {/* Pendaftaran Ekstrakurikuler */}
        <Route path="persetujuan" element={<AdminPersetujuan />} />
        {/* Absensi */}
        <Route path="absensi" element={<AdminAbsensi />} />
        <Route path="rekap-absensi" element={<AdminRekapAbsensi />} />
        <Route path="laporan-absensi" element={<AdminLaporanAbsensi />} />
        {/* Izin */}
        <Route path="izin" element={<AdminIzin />} />
        {/* Penilaian */}
        <Route path="nilai" element={<AdminNilai />} />
        <Route path="rekap-nilai" element={<AdminRekapNilai />} />
        <Route path="laporan-nilai" element={<AdminLaporanNilai />} />
        {/* Monitoring */}
        <Route path="monitoring" element={<Monitoring />} />
      </Route>

      {/* Pelatih Routes */}
      <Route
        path="/pelatih/*"
        element={
          <ProtectedRoute roles={['pelatih']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PelatihDashboard />} />
        <Route path="ekskul" element={<PelatihSiswa />} />
        <Route path="jadwal" element={<PelatihJadwal />} />
        <Route path="siswa" element={<PelatihSiswa />} />
        <Route path="absensi" element={<PelatihAbsensi />} />
        <Route path="bobot-nilai" element={<PelatihBobotNilai />} />
        <Route path="nilai" element={<PelatihNilai />} />
        <Route path="monitoring-nilai" element={<PelatihPerkembanganNilai />} />
        <Route path="profil" element={<PelatihProfil />} />
      </Route>

      {/* Guru Pendamping Routes */}
      <Route
        path="/pendamping/*"
        element={
          <ProtectedRoute roles={['pendamping']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<GuruDashboard />} />
        <Route path="ekskul" element={<Navigate to="/pendamping" replace />} />
        <Route path="absensi" element={<GuruAbsensi />} />
        <Route path="rekap-absensi" element={<AdminRekapAbsensi />} />
        <Route path="izin" element={<AdminIzin />} />
        <Route path="nilai" element={<GuruNilai />} />
        <Route path="profil" element={<GuruProfil />} />
      </Route>

      {/* Siswa Routes */}
      <Route
        path="/siswa/*"
        element={
          <ProtectedRoute roles={['siswa']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SiswaDashboard />} />
        <Route path="ekskul" element={<SiswaEkskul />} />
        <Route path="daftar/:id" element={<SiswaDaftarForm />} />
        <Route path="jadwal" element={<SiswaJadwal />} />
        <Route path="izin" element={<SiswaIzinIndex />} />
        <Route path="izin/:id" element={<SiswaIzinForm />} />
        <Route path="kehadiran" element={<SiswaKehadiran />} />
        <Route path="nilai" element={<SiswaNilai />} />
        <Route path="profil" element={<SiswaProfil />} />
      </Route>

      {/* Kepala Sekolah Routes */}
      <Route
        path="/kepala_sekolah/*"
        element={
          <ProtectedRoute roles={['kepala_sekolah']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<KepalaSekolahDashboard />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="monitoring-siswa" element={<SiswaList />} />
        <Route path="absensi" element={<AdminAbsensi />} />
        <Route path="nilai" element={<AdminNilai />} />
        <Route path="laporan-absensi" element={<AdminLaporanAbsensi />} />
        <Route path="laporan-nilai" element={<AdminLaporanNilai />} />
        <Route path="profil" element={<KepalaSekolahProfil />} />
      </Route>

      {/* Root redirection */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
