import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Edit2, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  X,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { userService } from '@/services/userService';
import { useNotification } from '@/context/NotificationContext';
import ConfirmModal from '@/components/popups/ConfirmModal';
import Loader from '@/components/commons/Loader';
import Pagination from '@/components/elements/Pagination';

export default function UserManagement() {
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [message, setMessage] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'analyst',
  });
  const [modalSaving, setModalSaving] = useState(false);

  // Bersihkan cache dummy data lama dari localStorage jika pernah tersimpan
  useEffect(() => {
    localStorage.removeItem('flowgis_admin_users');
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(search, roleFilter);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users from database:', err);
      notify.error(err.response?.data?.message || err.message || 'Gagal memuat data pengguna dari database');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'analyst',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role || 'analyst',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const isEdit = !!editingUser;
    const targetName = formData.name;

    // Tutup dialog form agar layar bebas dan loader fokus di depan
    setIsModalOpen(false);
    setActionLoading({
      message: isEdit ? 'Memperbarui Akun Pengguna...' : 'Menambahkan Pengguna Baru...',
      subtitle: `Menyimpan data "${targetName}" ke sistem...`,
      stages: [
        { time: 0, text: 'Memvalidasi kredensial & hak akses role...' },
        { time: 2, text: 'Menyimpan entitas pengguna ke database...' },
      ],
    });
    setModalSaving(true);
    setMessage(null);

    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formData);
        notify.success(`Data pengguna "${targetName}" berhasil diperbarui!`);
      } else {
        await userService.createUser(formData);
        notify.success(`Pengguna baru "${targetName}" berhasil ditambahkan!`);
      }
      handleCloseModal();
      await fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      const validationErrors = err.response?.data?.errors;
      const errMsg = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : (err.response?.data?.message || err.message || 'Gagal menyimpan data pengguna ke database');
      notify.error(errMsg);
      // Buka kembali modal jika terjadi error agar pengguna dapat memperbaiki data input
      setIsModalOpen(true);
    } finally {
      setModalSaving(false);
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'analyst' : 'admin';
    const confirmMsg = user.role === 'admin' 
      ? `Apakah Anda ingin mengubah peran ${user.name} menjadi Pengguna Biasa / Analis?`
      : `Apakah Anda ingin mengangkat ${user.name} menjadi Administrator FlowGIS?`;

    if (window.confirm(confirmMsg)) {
      setActionLoading({
        message: 'Mengubah Peran Pengguna...',
        subtitle: `Memperbarui hak akses "${user.name}" menjadi ${nextRole}...`,
        stages: [
          { time: 0, text: 'Memperbarui role akses pengguna di database...' },
        ],
      });
      try {
        await userService.toggleRole(user.id, nextRole);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
        );
        notify.success(`Peran ${user.name} berhasil diubah menjadi "${nextRole}"!`);
      } catch (err) {
        console.error('Error changing role:', err);
        notify.error('Gagal mengubah peran pengguna');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!confirmDeleteTarget) return;
    const target = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    setIsDeleting(true);
    setActionLoading({
      message: 'Menghapus Akun Pengguna...',
      subtitle: `Menghapus akun "${target.name}" dari sistem...`,
      stages: [
        { time: 0, text: 'Memproses permintaan penghapusan akun...' },
        { time: 2, text: 'Menghapus data pengguna dari database...' },
      ],
    });
    try {
      const res = await userService.deleteUser(target.id);
      if (res?.status === 'error') {
        notify.error(res.message);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      notify.success(`Pengguna "${target.name}" berhasil dihapus.`);
    } catch (err) {
      console.error('Error deleting user:', err);
      notify.error('Gagal menghapus pengguna');
    } finally {
      setIsDeleting(false);
      setActionLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  // Reset ke halaman 1 jika filter pencarian atau role berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Jaga agar halaman tidak out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const analystCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Pengguna Terdaftar</p>
              <h4 className="text-xl font-bold text-gray-800">{users.length}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Administrator</p>
              <h4 className="text-xl font-bold text-purple-900">{adminCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Analis & Pengguna Biasa</p>
              <h4 className="text-xl font-bold text-sky-900">{analystCount}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm bg-white">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Manajemen Akun & Hak Akses Pengguna
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Kelola role administrator dan akses analitik seluruh staf serta pengguna terdaftar.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleOpenAddModal}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 h-8 px-3"
            >
              <UserPlus className="w-3.5 h-3.5" /> Tambah Pengguna
            </Button>
          </div>
        </CardHeader>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 border-y border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="analyst">Analyst</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Alert Notification */}
        {message && (
          <div className="mx-6 mt-3">
            <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs">Memuat daftar pengguna...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Tidak ada pengguna ditemukan.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="p-3.5">Nama Pengguna</th>
                  <th className="p-3.5">Kontak & Email</th>
                  <th className="p-3.5">Peran (Role) Saat Ini</th>
                  <th className="p-3.5">Terdaftar Sejak</th>
                  <th className="p-3.5 text-center">Ganti Role & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedUsers.map((item) => {
                  const isAdmin = item.role === 'admin';
                  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-medium text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-teal-100 text-teal-700 border border-teal-200'
                          }`}>
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID #{item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-600">
                        <div className="flex items-center gap-1.5 text-gray-800">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{item.email}</span>
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isAdmin 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {isAdmin ? <Shield className="w-3 h-3 text-purple-600" /> : <UserIcon className="w-3 h-3 text-sky-600" />}
                          {isAdmin ? 'Administrator' : ucfirst(item.role || 'Analyst')}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-mono text-[11px]">{dateStr}</td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol Ubah Role */}
                          <button
                            onClick={() => handleToggleRole(item)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                              isAdmin
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300'
                            }`}
                            title={isAdmin ? 'Ubah menjadi pengguna biasa' : 'Jadikan admin'}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {isAdmin ? 'Jadikan User Biasa' : 'Jadikan Admin'}
                          </button>

                          {/* Tombol Edit */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => setConfirmDeleteTarget({ id: item.id, name: item.name })}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={users.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      </Card>

      {/* Modal Tambah / Edit Pengguna */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah Connor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Telepon (Opsional)</label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Masuk'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    tabIndex="-1"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500 hover:text-teal-600 transition-colors" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500 hover:text-teal-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Peran Akses (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="analyst">Analyst (Pengguna Biasa Analitik)</option>
                  <option value="admin">Administrator (Akses Penuh Manajemen)</option>
                  <option value="user">User (Tampilan Publik)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1 text-xs justify-center"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={modalSaving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold justify-center"
                >
                  {modalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal untuk Hapus Pengguna */}
      <ConfirmModal
        isOpen={!!confirmDeleteTarget}
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmDeleteUser}
        isLoading={isDeleting}
        title="Hapus Pengguna?"
        message={`Apakah Anda yakin ingin menghapus akun pengguna "${confirmDeleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Pengguna"
        cancelText="Batal"
      />

      {/* Loader Operasi CRUD User Management */}
      {actionLoading && (
        <Loader
          message={actionLoading.message}
          subtitle={actionLoading.subtitle}
          stages={actionLoading.stages}
        />
      )}
    </div>
  );
}

function ucfirst(str = '') {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
