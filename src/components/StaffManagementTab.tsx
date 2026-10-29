import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Edit3, 
  KeyRound, 
  Search, 
  Lock, 
  User, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Shield,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  AlertTriangle,
  CheckSquare,
  Square,
  CheckCheck,
  SlidersHorizontal
} from 'lucide-react';
import { StaffUser, StaffRole } from '../types/schedule';
import { DEFAULT_STAFF_USERS } from '../data/defaultData';

interface StaffManagementTabProps {
  staffUsers: StaffUser[];
  setStaffUsers: React.Dispatch<React.SetStateAction<StaffUser[]>>;
  showToast: (msg: string) => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
  staffUsers,
  setStaffUsers,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | StaffRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Confirmation Modal (In-App)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Multi-Selection State for Bulk Actions
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<StaffRole | 'KEEP'>('KEEP');
  const [bulkStatus, setBulkStatus] = useState<'ACTIVE' | 'INACTIVE' | 'KEEP'>('KEEP');
  const [bulkNotesPrefix, setBulkNotesPrefix] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('kurikulum');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Visible password tracking in table (staffId -> boolean)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('kurikulum');
    setFormIsActive(true);
    setFormNotes('');
    setFormShowPassword(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormUsername(staff.username);
    setFormPassword(staff.password);
    setFormRole(staff.role);
    setFormIsActive(staff.isActive);
    setFormNotes(staff.notes || '');
    setFormShowPassword(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = (staff: StaffUser) => {
    // Prevent deleting all kurikulum accounts
    const kurikulumCount = staffUsers.filter((s) => s.role === 'kurikulum').length;
    if (staff.role === 'kurikulum' && kurikulumCount <= 1) {
      showToast('Peringatan: Tidak dapat menghapus akun Kurikulum terakhir.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Akses Petugas',
      message: `Apakah Anda yakin ingin menghapus akses petugas "${staff.name}" (${staff.username})? Petugas ini tidak akan dapat lagi masuk ke sistem.`,
      confirmText: 'Ya, Hapus Petugas',
      isDanger: true,
      onConfirm: () => {
        setStaffUsers((prev) => {
          const updated = prev.filter((s) => s.id !== staff.id);
          localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
          return updated;
        });
        showToast(`Akses petugas ${staff.name} berhasil dihapus`);
        setConfirmDialog(null);
      },
    });
  };

  const handleToggleStatus = (staff: StaffUser) => {
    if (staff.role === 'kurikulum' && staff.isActive) {
      const activeKurikulumCount = staffUsers.filter((s) => s.role === 'kurikulum' && s.isActive).length;
      if (activeKurikulumCount <= 1) {
        showToast('Peringatan: Minimal harus ada 1 akun Kurikulum yang aktif.');
        return;
      }
    }

    setStaffUsers((prev) => {
      const updated = prev.map((s) => (s.id === staff.id ? { ...s, isActive: !s.isActive } : s));
      localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
      return updated;
    });
    showToast(`Status petugas ${staff.name} diubah menjadi ${!staff.isActive ? 'Aktif' : 'Nonaktif'}`);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPass = formPassword.trim();
    const cleanName = formName.trim();

    if (!cleanName) {
      setFormError('Nama lengkap petugas tidak boleh kosong');
      return;
    }

    if (!cleanUser) {
      setFormError('Username tidak boleh kosong');
      return;
    }

    // Check duplicate username
    const duplicate = staffUsers.find(
      (s) => s.username.toLowerCase() === cleanUser && (!editingStaff || s.id !== editingStaff.id)
    );
    if (duplicate) {
      setFormError(`Username "${cleanUser}" sudah digunakan oleh petugas lain.`);
      return;
    }

    if (cleanPass.length < 4) {
      setFormError('Password minimal 4 karakter untuk alasan keamanan.');
      return;
    }

    if (editingStaff) {
      // Edit existing
      setStaffUsers((prev) => {
        const updated = prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: cleanName,
                username: cleanUser,
                password: cleanPass,
                role: formRole,
                isActive: formIsActive,
                notes: formNotes.trim(),
              }
            : s
        );
        localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
        return updated;
      });
      showToast(`Data akses petugas "${cleanName}" berhasil diperbarui`);
    } else {
      // Create new
      const newStaff: StaffUser = {
        id: `staff-${Date.now()}`,
        name: cleanName,
        username: cleanUser,
        password: cleanPass,
        role: formRole,
        isActive: formIsActive,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setStaffUsers((prev) => {
        const updated = [...prev, newStaff];
        localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
        return updated;
      });
      showToast(`Petugas baru "${cleanName}" (${cleanUser}) berhasil ditambahkan`);
    }

    setIsModalOpen(false);
  };

  const handleResetToDefaultStaff = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Akun Petugas Default',
      message: 'Apakah Anda yakin ingin mengembalikan seluruh daftar petugas ke akun bawaan sekolah (Kurikulum, Guru Piket, Operator TU)?',
      confirmText: 'Ya, Reset Akun Petugas',
      isDanger: true,
      onConfirm: () => {
        setStaffUsers(DEFAULT_STAFF_USERS);
        localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(DEFAULT_STAFF_USERS));
        setSelectedStaffIds([]);
        showToast('Daftar petugas berhasil direset ke akun default');
        setConfirmDialog(null);
      },
    });
  };

  // ================= Bulk Selection Handlers =================
  const toggleSelectStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredStaff = (items: StaffUser[]) => {
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.every((id) => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleClearStaffSelection = () => {
    setSelectedStaffIds([]);
  };

  const handleBulkDeleteStaff = () => {
    if (selectedStaffIds.length === 0) return;

    // Check if deleting would leave zero kurikulum accounts
    const remainingKurikulum = staffUsers.filter(
      (s) => s.role === 'kurikulum' && !selectedStaffIds.includes(s.id)
    ).length;

    if (remainingKurikulum === 0) {
      showToast('Peringatan: Tidak dapat menghapus semua akun Kurikulum. Minimal harus ada 1 akun Kurikulum aktif.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${selectedStaffIds.length} Petugas Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedStaffIds.length} akun petugas yang dipilih? Akun-akun ini tidak akan dapat login lagi ke sistem.`,
      confirmText: `Ya, Hapus (${selectedStaffIds.length})`,
      isDanger: true,
      onConfirm: () => {
        setStaffUsers((prev) => {
          const updated = prev.filter((s) => !selectedStaffIds.includes(s.id));
          localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
          return updated;
        });
        showToast(`Berhasil menghapus ${selectedStaffIds.length} akun petugas`);
        setSelectedStaffIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleBulkToggleStatus = (newActiveStatus: boolean) => {
    if (selectedStaffIds.length === 0) return;

    if (!newActiveStatus) {
      // Check if deactivating will deactivate all kurikulum
      const remainingActiveKurikulum = staffUsers.filter(
        (s) => s.role === 'kurikulum' && s.isActive && !selectedStaffIds.includes(s.id)
      ).length;
      if (remainingActiveKurikulum === 0) {
        showToast('Peringatan: Tidak dapat menonaktifkan seluruh akun Kurikulum. Minimal harus ada 1 akun Kurikulum aktif.');
        return;
      }
    }

    setStaffUsers((prev) => {
      const updated = prev.map((s) =>
        selectedStaffIds.includes(s.id) ? { ...s, isActive: newActiveStatus } : s
      );
      localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
      return updated;
    });
    showToast(`Status ${selectedStaffIds.length} petugas diubah menjadi ${newActiveStatus ? 'Aktif' : 'Nonaktif'}`);
  };

  const handleOpenBulkEdit = () => {
    setBulkRole('KEEP');
    setBulkStatus('KEEP');
    setBulkNotesPrefix('');
    setBulkError(null);
    setIsBulkEditModalOpen(true);
  };

  const handleApplyBulkEdit = () => {
    if (selectedStaffIds.length === 0) return;

    if (bulkRole === 'KEEP' && bulkStatus === 'KEEP' && !bulkNotesPrefix.trim()) {
      setBulkError('Pilih minimal satu perubahan (Peran, Status, atau Catatan).');
      return;
    }

    // Check kurikulum safety
    if (bulkStatus === 'INACTIVE') {
      const remainingActiveKurikulum = staffUsers.filter(
        (s) => s.role === 'kurikulum' && s.isActive && !selectedStaffIds.includes(s.id)
      ).length;
      if (remainingActiveKurikulum === 0) {
        setBulkError('Peringatan: Tidak dapat menonaktifkan semua akun Kurikulum.');
        return;
      }
    }

    if (bulkRole !== 'KEEP' && bulkRole !== 'kurikulum') {
      const remainingKurikulum = staffUsers.filter(
        (s) => s.role === 'kurikulum' && !selectedStaffIds.includes(s.id)
      ).length;
      if (remainingKurikulum === 0) {
        setBulkError('Peringatan: Minimal harus ada 1 petugas berperan Kurikulum.');
        return;
      }
    }

    setStaffUsers((prev) => {
      const updated = prev.map((s) => {
        if (!selectedStaffIds.includes(s.id)) return s;
        return {
          ...s,
          role: bulkRole === 'KEEP' ? s.role : bulkRole,
          isActive: bulkStatus === 'KEEP' ? s.isActive : bulkStatus === 'ACTIVE',
          notes: bulkNotesPrefix.trim() 
            ? `${bulkNotesPrefix.trim()} | ${s.notes || ''}`.trim() 
            : s.notes,
        };
      });
      localStorage.setItem('smkn1_staff_users_v1', JSON.stringify(updated));
      return updated;
    });

    showToast(`Berhasil memperbarui massal ${selectedStaffIds.length} petugas`);
    setIsBulkEditModalOpen(false);
  };

  // Filtered staff list
  const filteredStaff = staffUsers.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      s.name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q));

    const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isActive) ||
      (statusFilter === 'INACTIVE' && !s.isActive);

    return matchQuery && matchRole && matchStatus;
  });

  const countKurikulum = staffUsers.filter((s) => s.role === 'kurikulum').length;
  const countPiket = staffUsers.filter((s) => s.role === 'piket').length;
  const countOperator = staffUsers.filter((s) => s.role === 'operator').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Description */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
              Hak Akses & Keamanan Sistem
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">
            Manajemen Akses Petugas Sekolah
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Atur akun dan kata sandi login untuk <strong>Kurikulum</strong> (superadmin jadwal), <strong>Guru Piket</strong> (monitoring KBM harian), dan <strong>Operator</strong> (data kelas 7 jurusan & cetak).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaultStaff}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
            title="Reset ke akun default sekolah"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akses Petugas</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Total Petugas</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{staffUsers.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Akun terdaftar</div>
        </div>

        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-2xs bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold">Kurikulum</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{countKurikulum}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Akses Penuh / Superadmin</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold">Guru Piket</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{countPiket}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Pantau KBM & Izin</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold">Operator TU</span>
            <Laptop className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{countOperator}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Data Kelas & Cetak</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama petugas, username, atau keterangan..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Peran:</span>
          {(['ALL', 'kurikulum', 'piket', 'operator'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-slate-900 text-white font-black shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold'
              }`}
            >
              {r === 'ALL' ? 'Semua Peran' : r === 'kurikulum' ? 'Kurikulum' : r === 'piket' ? 'Guru Piket' : 'Operator'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'ALL' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nonaktif
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={() => handleSelectAllFilteredStaff(filteredStaff)}
                    className="p-1 rounded-md text-slate-500 hover:text-emerald-700 transition-colors"
                    title={filteredStaff.length > 0 && filteredStaff.every((s) => selectedStaffIds.includes(s.id)) ? 'Batalkan pilih semua' : 'Pilih semua di daftar ini'}
                  >
                    {filteredStaff.length > 0 && filteredStaff.every((s) => selectedStaffIds.includes(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                    ) : selectedStaffIds.length > 0 ? (
                      <div className="w-4 h-4 rounded-sm border-2 border-emerald-600 bg-emerald-100 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-emerald-700 rounded" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Nama Petugas & Catatan</th>
                <th className="py-3.5 px-4">Peran / Role</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Hak Akses Sistem</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada data petugas yang cocok</p>
                    <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau filter peran.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isPasswordRevealed = !!revealedPasswords[staff.id];
                  const isSelected = selectedStaffIds.includes(staff.id);

                  return (
                    <tr 
                      key={staff.id} 
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectStaff(staff.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Name & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            staff.role === 'kurikulum' 
                              ? 'bg-purple-100 text-purple-700' 
                              : staff.role === 'piket' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {staff.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{staff.name}</span>
                              {!staff.isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-700 font-bold">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {staff.notes || 'Petugas resmi SMKN 1 Tegalsari'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {staff.role === 'kurikulum' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold border border-purple-200">
                            <Shield className="w-3 h-3 text-purple-600" />
                            <span>Kurikulum</span>
                          </span>
                        )}
                        {staff.role === 'piket' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>Guru Piket</span>
                          </span>
                        )}
                        {staff.role === 'operator' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-200">
                            <Laptop className="w-3 h-3 text-amber-600" />
                            <span>Operator TU</span>
                          </span>
                        )}
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4">
                        <code className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {staff.username}
                        </code>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-slate-700 text-xs">
                            {isPasswordRevealed ? staff.password : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(staff.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                            title={isPasswordRevealed ? 'Sembunyikan password' : 'Intip password'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Permissions Description */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {staff.role === 'kurikulum' && (
                            <span className="text-purple-900 font-medium">
                              Jadwal, Guru, Kelas 7 Jurusan, Backup & Pengaturan
                            </span>
                          )}
                          {staff.role === 'piket' && (
                            <span className="text-emerald-900 font-medium">
                              Monitoring KBM Live, Status Ruangan & Bel Sekolah
                            </span>
                          )}
                          {staff.role === 'operator' && (
                            <span className="text-amber-900 font-medium">
                              Kelola Data Kelas, Data Guru & Cetak Matriks
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all border ${
                            staff.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                          }`}
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {staff.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                            title="Edit Akses Petugas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                            title="Hapus Akses Petugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Floating / Sticky Bulk Action Bar for Staff */}
        {selectedStaffIds.length > 0 && (
          <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                {selectedStaffIds.length}
              </span>
              <span className="text-xs font-bold text-slate-200">
                {selectedStaffIds.length} petugas dipilih
              </span>
              <button
                type="button"
                onClick={handleClearStaffSelection}
                className="text-[11px] text-slate-400 hover:text-white underline ml-2"
              >
                Batalkan Pilihan
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleBulkToggleStatus(true)}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                title="Aktifkan semua petugas yang dipilih"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aktifkan Semua</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkToggleStatus(false)}
                className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                title="Nonaktifkan semua petugas yang dipilih"
              >
                <X className="w-3.5 h-3.5" />
                <span>Nonaktifkan Semua</span>
              </button>

              <button
                type="button"
                onClick={handleOpenBulkEdit}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Ubah peran atau data bersamaan"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit Massal ({selectedStaffIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDeleteStaff}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Hapus semua petugas terpilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedStaffIds.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Massal Petugas */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 to-sky-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <SlidersHorizontal className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight">Edit Massal Petugas</h4>
                  <p className="text-[11px] text-sky-200">{selectedStaffIds.length} petugas terpilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkEditModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Ubah Peran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubah Peran / Role Petugas
                </label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="KEEP">-- Tetap Sama (Tidak Berubah) --</option>
                  <option value="kurikulum">Kurikulum (Superadmin Akses Penuh)</option>
                  <option value="piket">Guru Piket (Monitoring & Bel)</option>
                  <option value="operator">Operator TU (Kelola Data & Matriks)</option>
                </select>
              </div>

              {/* Ubah Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubah Status Akun
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="KEEP">-- Tetap Sama (Tidak Berubah) --</option>
                  <option value="ACTIVE">Aktif (Dapat Login)</option>
                  <option value="INACTIVE">Nonaktif (Dilarang Login)</option>
                </select>
              </div>

              {/* Tambah Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tambahkan Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={bulkNotesPrefix}
                  onChange={(e) => setBulkNotesPrefix(e.target.value)}
                  placeholder="Contoh: Petugas Semester Genap 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEdit}
                  className="flex-1 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan Massal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Petugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <KeyRound className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight">
                    {editingStaff ? 'Edit Akses Petugas' : 'Tambah Akses Petugas Baru'}
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    SMKN 1 Tegalsari • Sistem Kontrol Akses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap Petugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Petugas / Jabatan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Drs. Sugeng Riyanto / Tim Piket Hari Rabu"
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Peran / Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Peran & Hak Akses <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('kurikulum')}
                    className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formRole === 'kurikulum'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold">Kurikulum</span>
                      {formRole === 'kurikulum' && <Check className="w-3 h-3 text-purple-600" />}
                    </div>
                    <div className="text-[9px] text-slate-500">Superadmin</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('piket')}
                    className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formRole === 'piket'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold">Guru Piket</span>
                      {formRole === 'piket' && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-[9px] text-slate-500">Pantau KBM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('operator')}
                    className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formRole === 'operator'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold">Operator</span>
                      {formRole === 'operator' && <Check className="w-3 h-3 text-amber-600" />}
                    </div>
                    <div className="text-[9px] text-slate-500">Data & Cetak</div>
                  </button>
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Username (tanpa spasi)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password / PIN <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={formShowPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-mono font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormShowPassword(!formShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {formShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan / Keterangan Tugas (Opsional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Bertugas setiap hari Senin & Kamis di ruang piket"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Status Aktif Switch */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Aktifkan akun ini (dapat langsung digunakan login)
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
                >
                  {editingStaff ? 'Simpan Perubahan' : 'Tambahkan Petugas'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* In-App Confirmation Modal (No window.confirm or alert!) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmDialog.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {confirmDialog.isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-500">Konfirmasi Keamanan Petugas</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmDialog.message}
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                {confirmDialog.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                  confirmDialog.isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                    : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
                }`}
              >
                {confirmDialog.confirmText || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
