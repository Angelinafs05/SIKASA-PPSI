import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import EkskulList from './pages/admin/EkskulList';
import SiswaList from './pages/admin/SiswaList';
import PelatihList from './pages/admin/PelatihList';
import GuruList from './pages/admin/GuruList';
import LombaList from './pages/admin/LombaList';
import Monitoring from './pages/admin/Monitoring';
import KelasList from './pages/admin/KelasList';
import PelatihDashboard from './pages/pelatih/PelatihDashboard';
import GuruDashboard from './pages/pelatih/GuruDashboard';
import GuruAbsensi from './pages/pelatih/GuruAbsensi';
import PelatihSiswa from './pages/pelatih/PelatihSiswa';
import PelatihNilai from './pages/pelatih/PelatihNilai';
import PelatihProfil from './pages/pelatih/PelatihProfil';
import PelatihAbsensi from './pages/pelatih/PelatihAbsensi';
import SiswaDashboard from './pages/siswa/SiswaDashboard';
import SiswaEkskul from './pages/siswa/SiswaEkskul';
import SiswaDaftarForm from './pages/siswa/SiswaDaftarForm';
import SiswaIzinForm from './pages/siswa/SiswaIzinForm';
import SiswaLomba from './pages/siswa/SiswaLomba';
import AdminPersetujuan from './pages/admin/AdminPersetujuan';
import SiswaProfil from './pages/siswa/SiswaProfil';
import SiswaKehadiran from './pages/siswa/SiswaKehadiran';
import GuruNilai from './pages/pelatih/GuruNilai';
import AdminHonor from './pages/admin/AdminHonor';
import PelatihHonor from './pages/pelatih/PelatihHonor';
import AdminParent from './pages/admin/AdminParent';
import ParentDashboard from './pages/orang_tua/ParentDashboard';
import ParentProfile from './pages/orang_tua/ParentProfile';
import KepalaSekolahDashboard from './pages/kepala_sekolah/KepalaSekolahDashboard';

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
        <Route path="kelas" element={<KelasList />} />
        <Route path="ekskul" element={<EkskulList />} />
        <Route path="siswa" element={<SiswaList />} />
        <Route path="pelatih" element={<PelatihList />} />
        <Route path="guru" element={<GuruList />} />
        <Route path="lomba" element={<LombaList />} />
        <Route path="honor" element={<AdminHonor />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="persetujuan" element={<AdminPersetujuan />} />
        <Route path="orang-tua" element={<AdminParent />} />
        <Route path="riwayat" element={<div>Riwayat (In Progress)</div>} />
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
        <Route path="siswa" element={<PelatihSiswa />} />
        <Route path="absensi" element={<PelatihAbsensi />} />
        <Route path="nilai" element={<PelatihNilai />} />
        <Route path="honor" element={<PelatihHonor />} />
        <Route path="profil" element={<PelatihProfil />} />
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
        <Route path="lomba" element={<SiswaLomba />} />
        <Route path="daftar/:id" element={<SiswaDaftarForm />} />
        <Route path="izin/:id" element={<SiswaIzinForm />} />
        <Route path="kehadiran" element={<SiswaKehadiran />} />
        <Route path="profil" element={<SiswaProfil />} />
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
        <Route path="absensi" element={<GuruAbsensi />} />
        <Route path="nilai" element={<GuruNilai />} />
      </Route>

      {/* Orang Tua Routes */}
      <Route
        path="/orang_tua/*"
        element={
          <ProtectedRoute roles={['orang_tua']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="profil" element={<ParentProfile />} />
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
        <Route path="absensi" element={<Monitoring />} />
        <Route path="lomba" element={<LombaList />} />
        <Route path="honor" element={<AdminHonor />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="pelatih" element={<PelatihList />} />
      </Route>

      {/* Root redirection */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
