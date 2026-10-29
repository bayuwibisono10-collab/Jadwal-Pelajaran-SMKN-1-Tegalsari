import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Layers, 
  Users, 
  Calendar, 
  Settings, 
  Sparkles, 
  Save,
  Clock,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  Table,
  Search,
  GraduationCap,
  Building2,
  X,
  KeyRound,
  CheckSquare,
  Square,
  CheckCheck,
  SlidersHorizontal
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, SchoolConfig, DayType, SlotType, StaffUser, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { DAYS_LIST, timeStringToMinutes, minutesToTimeString } from '../utils/timeHelper';
import { DEFAULT_STAFF_USERS, DEFAULT_SCHEDULE } from '../data/defaultData';
import { OriginalTableView } from './OriginalTableView';
import { ExcelImportTeacherModal } from './ExcelImportTeacherModal';
import { ExcelImportScheduleModal } from './ExcelImportScheduleModal';
import { ExcelImportClassModal } from './ExcelImportClassModal';
import { ExcelImportAllModal } from './ExcelImportAllModal';
import { StaffManagementTab } from './StaffManagementTab';

// 7 Jurusan SMKN 1 Tegalsari
export const SMKN1_DEPARTMENTS = [
  { code: 'TKR', name: 'Teknik Kendaraan Ringan', label: 'TKR (Teknik Kendaraan Ringan)' },
  { code: 'TSM', name: 'Teknik Sepeda Motor', label: 'TSM (Teknik Sepeda Motor)' },
  { code: 'TPL', name: 'Teknik Pengelasan', label: 'TPL (Teknik Pengelasan)' },
  { code: 'TKJ', name: 'Teknik Komputer dan Jaringan', label: 'TKJ (Teknik Komputer dan Jaringan)' },
  { code: 'AK', name: 'Akuntansi', label: 'AK (Akuntansi)' },
  { code: 'DPB', name: 'Desain Produksi Busana', label: 'DPB (Desain Produksi Busana)' },
  { code: 'KL', name: 'Kuliner', label: 'KL (Kuliner)' },
] as const;

export const normalizeDepartment = (dept?: string): string => {
  const d = (dept || '').trim().toUpperCase();
  if (d.includes('TKR') || d.includes('KENDARAAN')) return 'TKR (Teknik Kendaraan Ringan)';
  if (d.includes('TSM') || d.includes('MOTOR')) return 'TSM (Teknik Sepeda Motor)';
  if (d.includes('TPL') || d.includes('PENGELASAN') || d.includes('LAS')) return 'TPL (Teknik Pengelasan)';
  if (d.includes('TKJ') || d.includes('KOMPUTER') || d.includes('JARINGAN')) return 'TKJ (Teknik Komputer dan Jaringan)';
  if (d.includes('AK') || d.includes('AKUNTANSI')) return 'AK (Akuntansi)';
  if (d.includes('DPB') || d.includes('BUSANA')) return 'DPB (Desain Produksi Busana)';
  if (d.includes('KL') || d.includes('KULINER') || d.includes('BOGA')) return 'KL (Kuliner)';
  return 'KL (Kuliner)';
};

interface AdminPortalProps {
  schedule: ScheduleSlot[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleSlot[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  config: SchoolConfig;
  setConfig: React.Dispatch<React.SetStateAction<SchoolConfig>>;
  onResetDefault: () => void;
  onExitAdmin: () => void;
  onLogoutAdmin?: () => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  schedule,
  setSchedule,
  teachers,
  setTeachers,
  classes,
  setClasses,
  config,
  setConfig,
  onResetDefault,
  onExitAdmin,
  onLogoutAdmin,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
}) => {
  const [adminTab, setAdminTab] = useState<'matrix' | 'schedule' | 'teachers' | 'classes' | 'import-center' | 'settings' | 'backup' | 'staff'>('matrix');
  const [selectedDay, setSelectedDay] = useState<DayType>('SENIN');
  const [scheduleWeekFilter, setScheduleWeekFilter] = useState<WeekRotationType | 'ALL'>('ALL');
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Staff users state (Kurikulum, Piket, Operator)
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem('smkn1_staff_users_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STAFF_USERS;
  });

  // Teacher modal & Excel import state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isScheduleExcelOpen, setIsScheduleExcelOpen] = useState(false);
  const [isClassExcelOpen, setIsClassExcelOpen] = useState(false);
  const [isAllExcelOpen, setIsAllExcelOpen] = useState(false);

  // Class modal & filter state
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editingClassOriginalId, setEditingClassOriginalId] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [classDeptFilter, setClassDeptFilter] = useState<string>('ALL');

  // Teacher edit tracking
  const [editingTeacherOriginalCode, setEditingTeacherOriginalCode] = useState<string | null>(null);

  // In-Modal Error States
  const [slotModalError, setSlotModalError] = useState<string | null>(null);
  const [teacherModalError, setTeacherModalError] = useState<string | null>(null);
  const [classModalError, setClassModalError] = useState<string | null>(null);

  // Success message notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom In-App Confirmation Dialog State (Reliable in iframes, no window.confirm!)
  interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // ================= Bulk Multi-Selection States =================
  // 1. Slots
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [isBulkEditSlotOpen, setIsBulkEditSlotOpen] = useState(false);
  const [bulkSlotType, setBulkSlotType] = useState<SlotType | 'KEEP'>('KEEP');
  const [bulkSlotTitle, setBulkSlotTitle] = useState('');
  const [bulkSlotShiftMinutes, setBulkSlotShiftMinutes] = useState<number>(0);
  const [bulkSlotActionType, setBulkSlotActionType] = useState(false);
  const [bulkSlotActionTitle, setBulkSlotActionTitle] = useState(false);
  const [bulkSlotActionShift, setBulkSlotActionShift] = useState(false);
  const [bulkSlotError, setBulkSlotError] = useState<string | null>(null);

  // 2. Teachers
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isBulkEditTeacherOpen, setIsBulkEditTeacherOpen] = useState(false);
  const [bulkTeacherSubject, setBulkTeacherSubject] = useState('');
  const [bulkTeacherColor, setBulkTeacherColor] = useState('#0284c7');
  const [bulkTeacherActionSubject, setBulkTeacherActionSubject] = useState(true);
  const [bulkTeacherActionColor, setBulkTeacherActionColor] = useState(false);
  const [bulkTeacherError, setBulkTeacherError] = useState<string | null>(null);

  // 3. Classes
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isBulkEditClassOpen, setIsBulkEditClassOpen] = useState(false);
  const [bulkClassDept, setBulkClassDept] = useState<string>(SMKN1_DEPARTMENTS[0].label);
  const [bulkClassGrade, setBulkClassGrade] = useState<'X' | 'XI' | 'XII'>('X');
  const [bulkClassRoom, setBulkClassRoom] = useState<string>('R.J1');
  const [bulkClassActionDept, setBulkClassActionDept] = useState(true);
  const [bulkClassActionGrade, setBulkClassActionGrade] = useState(false);
  const [bulkClassActionRoom, setBulkClassActionRoom] = useState(false);
  const [bulkClassError, setBulkClassError] = useState<string | null>(null);

  // 4. Auto-Generate Schedule State (Fitur Tambah Jadwal Otomatis Aman)
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [autoGenScope, setAutoGenScope] = useState<'CURRENT_DAY' | 'ALL_DAYS'>('CURRENT_DAY');
  const [autoGenClassScope, setAutoGenClassScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [autoGenSelectedClassIds, setAutoGenSelectedClassIds] = useState<string[]>([]);
  const [autoGenKeepExistingData, setAutoGenKeepExistingData] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Slot Bulk Handlers ---
  const toggleSelectSlot = (id: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllDaySlots = (items: ScheduleSlot[]) => {
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedSlotIds.includes(id));
    if (allSelected) {
      setSelectedSlotIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedSlotIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleClearSlotSelection = () => {
    setSelectedSlotIds([]);
  };

  const handleBulkDeleteSlots = () => {
    if (selectedSlotIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${selectedSlotIds.length} Slot Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedSlotIds.length} slot jadwal yang dipilih? Alokasi KBM di slot ini akan terhapus.`,
      confirmText: `Ya, Hapus (${selectedSlotIds.length})`,
      isDanger: true,
      onConfirm: () => {
        setSchedule((prev) => prev.filter((s) => !selectedSlotIds.includes(s.id)));
        showToast(`Berhasil menghapus ${selectedSlotIds.length} slot jadwal`);
        setSelectedSlotIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleBulkDeleteAllDaySlots = () => {
    const count = schedule.filter((s) => s.day === selectedDay).length;
    if (count === 0) {
      showToast(`Tidak ada slot jadwal pada hari ${selectedDay}`);
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Semua Slot Hari ${selectedDay}`,
      message: `Apakah Anda yakin ingin menghapus SEMUA slot jadwal (${count} slot) untuk hari ${selectedDay}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: `Ya, Kosongkan Slot ${selectedDay}`,
      isDanger: true,
      onConfirm: () => {
        setSchedule((prev) => prev.filter((s) => s.day !== selectedDay));
        showToast(`Semua slot hari ${selectedDay} berhasil dikosongkan`);
        setSelectedSlotIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleApplyBulkEditSlots = () => {
    if (selectedSlotIds.length === 0) return;
    if (!bulkSlotActionType && !bulkSlotActionTitle && !bulkSlotActionShift) {
      setBulkSlotError('Pilih minimal satu opsi perubahan untuk slot jadwal.');
      return;
    }

    setSchedule((prev) =>
      prev.map((s) => {
        if (!selectedSlotIds.includes(s.id)) return s;
        let updated = { ...s };
        if (bulkSlotActionType && bulkSlotType !== 'KEEP') {
          updated.type = bulkSlotType;
        }
        if (bulkSlotActionTitle) {
          updated.title = bulkSlotTitle.trim();
        }
        if (bulkSlotActionShift && bulkSlotShiftMinutes !== 0) {
          const startM = Math.max(0, timeStringToMinutes(s.timeStart) + bulkSlotShiftMinutes);
          const endM = Math.max(startM + 5, timeStringToMinutes(s.timeEnd) + bulkSlotShiftMinutes);
          updated.timeStart = minutesToTimeString(startM);
          updated.timeEnd = minutesToTimeString(endM);
        }
        return updated;
      })
    );

    showToast(`Berhasil memperbarui ${selectedSlotIds.length} slot jadwal`);
    setIsBulkEditSlotOpen(false);
    setSelectedSlotIds([]);
    setBulkSlotError(null);
  };

  // --- Teacher Bulk Handlers ---
  const toggleSelectTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTeachers = (items: Teacher[]) => {
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedTeacherIds.includes(id));
    if (allSelected) {
      setSelectedTeacherIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedTeacherIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleClearTeacherSelection = () => {
    setSelectedTeacherIds([]);
  };

  const handleBulkDeleteTeachers = () => {
    if (selectedTeacherIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${selectedTeacherIds.length} Guru Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedTeacherIds.length} data guru yang dipilih? Kode pengajar di jadwal akan tetap aman namun guru tidak lagi ada di master data.`,
      confirmText: `Ya, Hapus (${selectedTeacherIds.length})`,
      isDanger: true,
      onConfirm: () => {
        setTeachers((prev) => prev.filter((t) => !selectedTeacherIds.includes(t.id)));
        showToast(`Berhasil menghapus ${selectedTeacherIds.length} data guru`);
        setSelectedTeacherIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleBulkDeleteAllTeachers = () => {
    if (teachers.length === 0) {
      showToast('Tidak ada data guru untuk dihapus.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `Hapus SEMUA Data Guru (${teachers.length} Guru)`,
      message: `PERINGATAN: Anda akan menghapus SELURUH daftar guru (${teachers.length} orang). Apakah Anda yakin?`,
      confirmText: 'Ya, Hapus Semua Guru',
      isDanger: true,
      onConfirm: () => {
        setTeachers([]);
        showToast('Semua data guru berhasil dihapus');
        setSelectedTeacherIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleApplyBulkEditTeachers = () => {
    if (selectedTeacherIds.length === 0) return;
    if (!bulkTeacherActionSubject && !bulkTeacherActionColor) {
      setBulkTeacherError('Pilih minimal satu opsi perubahan (Mata Pelajaran atau Warna).');
      return;
    }
    if (bulkTeacherActionSubject && !bulkTeacherSubject.trim()) {
      setBulkTeacherError('Mata pelajaran tidak boleh kosong jika opsi mapel diaktifkan.');
      return;
    }

    setTeachers((prev) =>
      prev.map((t) => {
        if (!selectedTeacherIds.includes(t.id)) return t;
        return {
          ...t,
          subject: bulkTeacherActionSubject ? bulkTeacherSubject.trim() : t.subject,
          color: bulkTeacherActionColor ? bulkTeacherColor : t.color,
        };
      })
    );

    showToast(`Berhasil memperbarui data ${selectedTeacherIds.length} guru`);
    setIsBulkEditTeacherOpen(false);
    setSelectedTeacherIds([]);
    setBulkTeacherError(null);
  };

  // --- Class Bulk Handlers ---
  const toggleSelectClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredClasses = (items: SchoolClass[]) => {
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedClassIds.includes(id));
    if (allSelected) {
      setSelectedClassIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedClassIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleClearClassSelection = () => {
    setSelectedClassIds([]);
  };

  const handleBulkDeleteClasses = () => {
    if (selectedClassIds.length === 0) return;

    const remainingCount = classes.filter((c) => !selectedClassIds.includes(c.id)).length;
    if (remainingCount === 0) {
      showToast('Peringatan: Tidak dapat menghapus semua kelas sampai 0. Minimal harus ada 1 rombel kelas aktif.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${selectedClassIds.length} Kelas Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedClassIds.length} rombel kelas yang dipilih? Seluruh alokasi KBM di kelas ini akan dihapus dari sistem.`,
      confirmText: `Ya, Hapus (${selectedClassIds.length})`,
      isDanger: true,
      onConfirm: () => {
        setClasses((prev) => prev.filter((c) => !selectedClassIds.includes(c.id)));
        showToast(`Berhasil menghapus ${selectedClassIds.length} kelas`);
        setSelectedClassIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleBulkDeleteAllClasses = () => {
    if (classes.length <= 1) {
      showToast('Minimal harus ada 1 kelas aktif terdaftar di sistem.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Seluruh Kelas (Sisakan 1 Default)',
      message: `Apakah Anda yakin ingin menghapus seluruh rombel kelas (${classes.length - 1} kelas) dan hanya menyisakan 1 kelas default?`,
      confirmText: 'Ya, Kosongkan Kelas',
      isDanger: true,
      onConfirm: () => {
        const defaultClass = classes[0];
        setClasses([defaultClass]);
        showToast(`Rombel kelas berhasil dikosongkan. Tersisa 1 kelas: ${defaultClass.name}`);
        setSelectedClassIds([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleApplyBulkEditClasses = () => {
    if (selectedClassIds.length === 0) return;
    if (!bulkClassActionDept && !bulkClassActionGrade && !bulkClassActionRoom) {
      setBulkClassError('Pilih minimal satu opsi perubahan (Jurusan, Tingkat, atau Ruang Default).');
      return;
    }

    const normalizedDept = normalizeDepartment(bulkClassDept);

    setClasses((prev) =>
      prev.map((c) => {
        if (!selectedClassIds.includes(c.id)) return c;
        return {
          ...c,
          department: bulkClassActionDept ? normalizedDept : c.department,
          grade: bulkClassActionGrade ? bulkClassGrade : c.grade,
          roomDefault: bulkClassActionRoom ? bulkClassRoom.trim().toUpperCase() : c.roomDefault,
        };
      })
    );

    showToast(`Berhasil memperbarui data ${selectedClassIds.length} rombel kelas`);
    setIsBulkEditClassOpen(false);
    setSelectedClassIds([]);
    setBulkClassError(null);
  };

  // ================= Schedule CRUD =================
  const createEmptySlotClasses = () => {
    const initialClassMap: Record<string, { subject: string; teacherCode: string; room: string }> = {};
    classes.forEach((c) => {
      initialClassMap[c.id] = { subject: '', teacherCode: '', room: c.roomDefault || 'R.J1' };
    });
    return initialClassMap;
  };

  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => scheduleWeekFilter === 'ALL' || !s.weekType || s.weekType === 'ALL' || s.weekType === scheduleWeekFilter)
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  const handleOpenAddSlot = (dayToUse?: DayType) => {
    const targetDay = dayToUse || selectedDay;
    const existingDaySlots = schedule
      .filter((s) => s.day === targetDay)
      .filter((s) => scheduleWeekFilter === 'ALL' || !s.weekType || s.weekType === 'ALL' || s.weekType === scheduleWeekFilter)
      .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

    let nextPeriod = '1';
    let nextStart = '07:00';
    let nextEnd = '07:45';

    if (existingDaySlots.length > 0) {
      const lastSlot = existingDaySlots[existingDaySlots.length - 1];
      const parsed = parseInt(lastSlot.periodNumber?.toString() || '', 10);
      nextPeriod = isNaN(parsed) ? (existingDaySlots.length + 1).toString() : (parsed + 1).toString();
      nextStart = lastSlot.timeEnd;
      const endM = timeStringToMinutes(lastSlot.timeEnd) + 40;
      nextEnd = minutesToTimeString(endM);
    }

    setIsAddingSlot(true);
    setEditingSlot({
      id: '',
      day: targetDay,
      periodNumber: nextPeriod,
      timeStart: nextStart,
      timeEnd: nextEnd,
      type: 'REGULAR',
      weekType: scheduleWeekFilter !== 'ALL' ? scheduleWeekFilter : activeWeek,
      classes: createEmptySlotClasses(),
    });
  };

  const handleDeleteSlot = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Slot Jadwal KBM',
      message: 'Apakah Anda yakin ingin menghapus slot jadwal ini? Tindakan ini akan menghapus alokasi mapel dan pengajar pada jam tersebut.',
      confirmText: 'Ya, Hapus Slot',
      isDanger: true,
      onConfirm: () => {
        setSchedule((prev) => prev.filter((s) => s.id !== id));
        showToast('Slot jadwal berhasil dihapus');
        setConfirmDialog(null);
      },
    });
  };

  const handleSaveSlot = (slotData: ScheduleSlot) => {
    if (!slotData.timeStart || !slotData.timeEnd) {
      setSlotModalError('Waktu mulai dan selesai wajib diisi');
      return;
    }

    const startM = timeStringToMinutes(slotData.timeStart);
    const endM = timeStringToMinutes(slotData.timeEnd);
    if (isNaN(startM) || isNaN(endM) || startM >= endM) {
      setSlotModalError('Format waktu tidak valid atau waktu mulai harus lebih awal dari waktu selesai');
      return;
    }

    // Clash detection: check if there's an identical slot collision on the same day for the same week rotation
    const collidingSlot = schedule.find((s) => {
      if (s.id === slotData.id) return false;
      if (s.day !== slotData.day) return false;
      // Week overlap check: ALL overlaps with everything; identical weekTypes overlap
      const weekOverlaps = 
        !s.weekType || 
        s.weekType === 'ALL' || 
        !slotData.weekType || 
        slotData.weekType === 'ALL' || 
        s.weekType === slotData.weekType;
      if (!weekOverlaps) return false;

      // Time overlap check: start time before other end time AND end time after other start time
      const sStart = timeStringToMinutes(s.timeStart);
      const sEnd = timeStringToMinutes(s.timeEnd);
      const isOverlap = Math.max(startM, sStart) < Math.min(endM, sEnd);
      return isOverlap;
    });

    if (collidingSlot) {
      const weekLabel = collidingSlot.weekType === 'NORMADA_10_PRODUKTIF_11' 
        ? 'Pekan Normada 10 & Prod 11' 
        : collidingSlot.weekType === 'PRODUKTIF_10_NORMADA_11'
        ? 'Pekan Prod 10 & Normada 11'
        : 'Semua Pekan';
      setSlotModalError(`Bentrok jadwal terdeteksi: Terdapat slot lain pada hari ${collidingSlot.day} pukul ${collidingSlot.timeStart} - ${collidingSlot.timeEnd} (Jam Ke-${collidingSlot.periodNumber || '-'}, ${collidingSlot.type}, [${weekLabel}]). Pastikan waktu slot tidak bertabrakan pada siklus pekan yang sama.`);
      return;
    }

    if (isAddingSlot) {
      setSchedule((prev) => [...prev, { ...slotData, id: `slot-${Date.now()}` }]);
      showToast('Slot jadwal baru berhasil ditambahkan');
    } else {
      setSchedule((prev) => prev.map((s) => (s.id === slotData.id ? slotData : s)));
      showToast('Perubahan slot jadwal berhasil disimpan');
    }
    setEditingSlot(null);
    setIsAddingSlot(false);
    setSlotModalError(null);
  };

  // ================= Teacher CRUD =================
  const handleDeleteTeacher = (id: string, name?: string) => {
    const target = teachers.find((t) => t.id === id);
    const targetName = name || target?.name || 'Guru';
    const targetCode = target?.code || '';

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Guru',
      message: `Apakah Anda yakin ingin menghapus data guru "${targetName}" [${targetCode}]?`,
      confirmText: 'Ya, Hapus Guru',
      isDanger: true,
      onConfirm: () => {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        showToast(`Data guru "${targetName}" berhasil dihapus`);
        setConfirmDialog(null);
      },
    });
  };

  const handleSaveTeacher = (tData: Teacher) => {
    const cleanCode = (tData.code || '').trim().toUpperCase();
    const cleanName = (tData.name || '').trim();
    const cleanSubject = (tData.subject || '').trim();

    if (!cleanCode) {
      setTeacherModalError('Kode guru (misal: BIG3, MT7) tidak boleh kosong');
      return;
    }
    if (!cleanName) {
      setTeacherModalError('Nama lengkap guru tidak boleh kosong');
      return;
    }

    // Check duplicate code if adding or changed code
    const duplicate = teachers.find(
      (t) => t.code.toUpperCase() === cleanCode && (!editingTeacher || t.id !== editingTeacher.id)
    );
    if (duplicate) {
      setTeacherModalError(`Kode guru "${cleanCode}" sudah digunakan oleh ${duplicate.name}`);
      return;
    }

    if (isAddingTeacher) {
      setTeachers((prev) => [
        ...prev,
        {
          ...tData,
          id: `teacher-${Date.now()}`,
          code: cleanCode,
          name: cleanName,
          subject: cleanSubject || 'Mata Pelajaran',
        },
      ]);
      showToast(`Guru baru "${cleanName}" (${cleanCode}) berhasil didaftarkan`);
    } else {
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === tData.id
            ? {
                ...t,
                ...tData,
                code: cleanCode,
                name: cleanName,
                subject: cleanSubject || t.subject,
              }
            : t
        )
      );

      // Sync schedule slots if teacher code changed
      if (editingTeacherOriginalCode && editingTeacherOriginalCode !== cleanCode) {
        setSchedule((prev) =>
          prev.map((s) => {
            let changed = false;
            const updatedClasses = { ...s.classes };
            Object.keys(updatedClasses).forEach((cid) => {
              if (updatedClasses[cid]?.teacherCode?.toUpperCase() === editingTeacherOriginalCode) {
                updatedClasses[cid] = { ...updatedClasses[cid], teacherCode: cleanCode };
                changed = true;
              }
            });
            return changed ? { ...s, classes: updatedClasses } : s;
          })
        );
      }
      showToast(`Data guru "${cleanName}" (${cleanCode}) berhasil diperbarui`);
    }

    setEditingTeacher(null);
    setIsAddingTeacher(false);
    setEditingTeacherOriginalCode(null);
    setTeacherModalError(null);
  };

  // ================= Class CRUD =================
  const handleDeleteClass = (id: string, name: string) => {
    if (classes.length <= 1) {
      showToast('Tidak dapat menghapus! Minimal harus ada 1 rombel/kelas aktif terdaftar.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Rombongan Belajar (Kelas)',
      message: `Apakah Anda yakin ingin menghapus kelas "${name}"? Seluruh alokasi KBM untuk kelas ini akan disesuaikan.`,
      confirmText: 'Ya, Hapus Kelas',
      isDanger: true,
      onConfirm: () => {
        setClasses((prev) => prev.filter((c) => c.id !== id));
        showToast(`Kelas "${name}" berhasil dihapus`);
        setConfirmDialog(null);
      },
    });
  };

  const handleSaveClass = (classData: SchoolClass) => {
    const trimmedName = (classData.name || '').trim();
    if (!trimmedName) {
      setClassModalError('Nama rombel/kelas tidak boleh kosong!');
      return;
    }

    let finalId = (classData.id || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!finalId) {
      finalId = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    if (!finalId) {
      finalId = `cls_${Date.now()}`;
    }

    const normalizedDepartmentName = normalizeDepartment(classData.department);

    if (isAddingClass) {
      // Check if ID already exists and make unique if needed
      if (classes.some((c) => c.id.toLowerCase() === finalId.toLowerCase())) {
        finalId = `${finalId}_${Math.floor(Math.random() * 899 + 100)}`;
      }
      const newClass: SchoolClass = {
        id: finalId,
        name: trimmedName.toUpperCase(),
        department: normalizedDepartmentName,
        grade: classData.grade || 'X',
        roomDefault: classData.roomDefault?.trim().toUpperCase() || 'R.J1',
      };
      setClasses((prev) => [...prev, newClass]);
      showToast(`Kelas baru "${newClass.name}" berhasil ditambahkan`);
    } else {
      const targetId = editingClassOriginalId || classData.id;
      setClasses((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                name: trimmedName.toUpperCase(),
                department: normalizedDepartmentName || c.department,
                grade: classData.grade || c.grade,
                roomDefault: classData.roomDefault?.trim().toUpperCase() || c.roomDefault,
              }
            : c
        )
      );
      showToast(`Data kelas "${trimmedName.toUpperCase()}" berhasil diperbarui`);
    }

    setEditingClass(null);
    setIsAddingClass(false);
    setEditingClassOriginalId(null);
    setClassModalError(null);
  };

  const handleImportTeachers = (newTeachers: Teacher[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setTeachers(newTeachers);
      showToast(`${newTeachers.length} data guru berhasil diimpor (menggantikan data lama)`);
    } else {
      setTeachers((prev) => {
        const updated = [...prev];
        newTeachers.forEach((nt) => {
          const existingIdx = updated.findIndex((t) => t.code.toUpperCase() === nt.code.toUpperCase());
          if (existingIdx !== -1) {
            updated[existingIdx] = { 
              ...updated[existingIdx], 
              name: nt.name, 
              subject: nt.subject 
            };
          } else {
            updated.push(nt);
          }
        });
        return updated;
      });
      showToast(`${newTeachers.length} data guru berhasil digabungkan (Merge)`);
    }
  };

  // ================= Smart Non-Destructive Schedule Merge Helper =================
  const smartMergeSchedule = (
    currentSchedule: ScheduleSlot[],
    incomingSlots: ScheduleSlot[],
    mode: 'merge' | 'replace' | 'replace_day' = 'merge',
    targetClassIds?: string[]
  ): ScheduleSlot[] => {
    if (mode === 'replace') {
      return incomingSlots;
    }

    const dayOrder: Record<DayType, number> = {
      SENIN: 1,
      SELASA: 2,
      RABU: 3,
      KAMIS: 4,
      JUMAT: 5,
      SABTU: 6,
    };

    if (mode === 'replace_day') {
      const incomingDays = Array.from(new Set(incomingSlots.map((s) => s.day)));
      const kept = currentSchedule.filter((s) => !incomingDays.includes(s.day));
      const combined = [...kept, ...incomingSlots];
      combined.sort((a, b) => {
        const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dDiff !== 0) return dDiff;
        return timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart);
      });
      return combined;
    }

    // Default 'merge': Non-destructive smart merge (data lama dijamin tidak hilang)
    const result: ScheduleSlot[] = currentSchedule.map((s) => ({
      ...s,
      classes: { ...s.classes },
    }));

    incomingSlots.forEach((inc) => {
      // Find matching slot on the same day
      const existingIdx = result.findIndex((curr) => {
        if (curr.day !== inc.day) return false;
        // Priority 1: Match by period number if available
        if (
          curr.periodNumber &&
          inc.periodNumber &&
          String(curr.periodNumber).trim().toUpperCase() === String(inc.periodNumber).trim().toUpperCase()
        ) {
          return true;
        }
        // Priority 2: Match by start time proximity (< 12 mins)
        const diff = Math.abs(timeStringToMinutes(curr.timeStart) - timeStringToMinutes(inc.timeStart));
        return diff < 12;
      });

      if (existingIdx !== -1) {
        // Matched existing slot: Merge classes without destroying other classes' data!
        const existing = result[existingIdx];
        const mergedClasses = { ...existing.classes };

        Object.keys(inc.classes).forEach((cid) => {
          const incAsg = inc.classes[cid];
          const isTargetedClass = !targetClassIds || targetClassIds.includes(cid);

          if (isTargetedClass && incAsg) {
            // Only update if it has subject content or is explicitly targeted
            if (incAsg.subject && incAsg.subject.trim() !== '') {
              mergedClasses[cid] = incAsg;
            } else if (!mergedClasses[cid]) {
              mergedClasses[cid] = incAsg;
            }
          }
        });

        result[existingIdx] = {
          ...existing,
          periodNumber: existing.periodNumber || inc.periodNumber,
          type: inc.type !== 'REGULAR' ? inc.type : existing.type,
          title: inc.title || existing.title,
          classes: mergedClasses,
        };
      } else {
        // No matching slot: Add new slot, ensuring all school classes exist in classes map
        const completeClasses: Record<string, { subject: string; teacherCode: string; room: string }> = {};
        classes.forEach((c) => {
          completeClasses[c.id] = inc.classes[c.id] || { subject: '', teacherCode: '', room: c.roomDefault || 'R.J1' };
        });

        result.push({
          ...inc,
          id: inc.id || `slot-merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          classes: completeClasses,
        });
      }
    });

    // Sort chronologically
    result.sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      if (dDiff !== 0) return dDiff;
      return timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart);
    });

    return result;
  };

  const handleImportSchedule = (
    newSlots: ScheduleSlot[],
    mode: 'replace' | 'merge' | 'replace_day' = 'merge',
    targetClassIds?: string[]
  ) => {
    if (newSlots.length === 0) {
      showToast('Tidak ada data sesi jadwal untuk diimpor.');
      return;
    }

    if (mode === 'replace') {
      setConfirmDialog({
        isOpen: true,
        title: 'Konfirmasi Ganti Seluruh Jadwal',
        message: `PERINGATAN: Anda memilih untuk mengganti SELURUH data jadwal sekolah (${schedule.length} sesi lama akan dihapus). Apakah Anda yakin? Disarankan menggunakan mode "Gabungkan Cerdas" agar data kelas lain tidak hilang.`,
        confirmText: 'Ya, Ganti Seluruh Jadwal',
        isDanger: true,
        onConfirm: () => {
          setSchedule(newSlots);
          showToast(`${newSlots.length} sesi jadwal berhasil diimpor (menggantikan seluruh jadwal lama)`);
          setConfirmDialog(null);
        },
      });
      return;
    }

    const merged = smartMergeSchedule(schedule, newSlots, mode, targetClassIds);
    setSchedule(merged);
    showToast(`${newSlots.length} sesi jadwal berhasil digabungkan (seluruh data jadwal lama tetap aman).`);
  };

  // Handler for "⚡ Tambah Jadwal Otomatis" feature modal
  const handleExecuteAutoGenerateSchedule = () => {
    const targetDays: DayType[] =
      autoGenScope === 'CURRENT_DAY'
        ? [selectedDay]
        : ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

    const targetClassIds =
      autoGenClassScope === 'ALL'
        ? classes.map((c) => c.id)
        : autoGenSelectedClassIds.length > 0
        ? autoGenSelectedClassIds
        : classes.map((c) => c.id);

    // Build template slots from DEFAULT_SCHEDULE
    const templateSlots = DEFAULT_SCHEDULE.filter((s) => targetDays.includes(s.day));

    // Prepare incoming slots customized for the target classes
    const generatedSlots: ScheduleSlot[] = templateSlots.map((tmpl, idx) => {
      const generatedClassMap: Record<string, { subject: string; teacherCode: string; room: string }> = {};

      classes.forEach((c) => {
        const isTargeted = targetClassIds.includes(c.id);
        const tmplAsg = tmpl.classes['xk1'] || tmpl.classes['xk2'] || Object.values(tmpl.classes)[0];

        if (tmpl.type === 'UPACARA' || tmpl.type === 'ISTIGOSAH' || tmpl.type === 'BREAK' || tmpl.type === 'EKSTRAKURIKULER') {
          generatedClassMap[c.id] = {
            subject: tmpl.title || tmpl.type,
            teacherCode: '-',
            room: tmpl.type === 'UPACARA' ? 'LAPANGAN' : tmpl.type === 'ISTIGOSAH' ? 'MASJID' : '-',
          };
        } else if (tmpl.type === 'DINIYAH') {
          generatedClassMap[c.id] = {
            subject: 'DINIYAH KEAGAMAAN',
            teacherCode: 'DIN',
            room: c.roomDefault || 'R.J1',
          };
        } else if (isTargeted) {
          generatedClassMap[c.id] = {
            subject: tmplAsg?.subject || 'Mata Pelajaran',
            teacherCode: tmplAsg?.teacherCode || 'GURU',
            room: c.roomDefault || 'R.J1',
          };
        } else {
          generatedClassMap[c.id] = {
            subject: '',
            teacherCode: '',
            room: c.roomDefault || 'R.J1',
          };
        }
      });

      return {
        id: `auto-${tmpl.day.toLowerCase()}-${tmpl.periodNumber || idx}-${Date.now()}-${idx}`,
        day: tmpl.day,
        periodNumber: tmpl.periodNumber,
        timeStart: tmpl.timeStart,
        timeEnd: tmpl.timeEnd,
        type: tmpl.type,
        title: tmpl.title,
        classes: generatedClassMap,
      };
    });

    // Merge non-destructively!
    setSchedule((prevSchedule) => {
      const merged = prevSchedule.map((slot) => ({
        ...slot,
        classes: { ...slot.classes },
      }));

      generatedSlots.forEach((gen) => {
        const existingIdx = merged.findIndex((s) => {
          if (s.day !== gen.day) return false;
          if (gen.periodNumber && s.periodNumber && String(gen.periodNumber) === String(s.periodNumber)) {
            return true;
          }
          return Math.abs(timeStringToMinutes(s.timeStart) - timeStringToMinutes(gen.timeStart)) < 12;
        });

        if (existingIdx !== -1) {
          // Slot already exists on this day:
          const existingSlot = merged[existingIdx];
          const updatedClasses = { ...existingSlot.classes };

          targetClassIds.forEach((cid) => {
            if (autoGenKeepExistingData) {
              // Only fill if existing assignment is completely empty!
              if (!updatedClasses[cid] || !updatedClasses[cid].subject || updatedClasses[cid].subject.trim() === '') {
                updatedClasses[cid] = gen.classes[cid];
              }
            } else {
              // Overwrite only targeted class
              updatedClasses[cid] = gen.classes[cid];
            }
          });

          // Ensure special types stay accurate
          merged[existingIdx] = {
            ...existingSlot,
            periodNumber: existingSlot.periodNumber || gen.periodNumber,
            type: gen.type !== 'REGULAR' ? gen.type : existingSlot.type,
            title: gen.title || existingSlot.title,
            classes: updatedClasses,
          };
        } else {
          // Slot does not exist on this day yet: add it
          const completeClasses: Record<string, { subject: string; teacherCode: string; room: string }> = {};
          classes.forEach((c) => {
            completeClasses[c.id] = gen.classes[c.id] || { subject: '', teacherCode: '', room: c.roomDefault || 'R.J1' };
          });
          merged.push({
            ...gen,
            classes: completeClasses,
          });
        }
      });

      // Sort
      const dayOrder: Record<DayType, number> = {
        SENIN: 1,
        SELASA: 2,
        RABU: 3,
        KAMIS: 4,
        JUMAT: 5,
        SABTU: 6,
      };
      merged.sort((a, b) => {
        const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dDiff !== 0) return dDiff;
        return timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart);
      });

      return merged;
    });

    setIsAutoGenerateModalOpen(false);
    showToast(`Jadwal KBM otomatis berhasil ditambahkan. Seluruh data jadwal lama tetap aman tersimpan.`);
  };

  const handleImportClasses = (newClasses: SchoolClass[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setClasses(newClasses);
      showToast(`${newClasses.length} rombel kelas berhasil diimpor (menggantikan kelas lama)`);
    } else {
      setClasses((prev) => {
        const updated = [...prev];
        newClasses.forEach((nc) => {
          const existingIdx = updated.findIndex((c) => c.id === nc.id || c.name.toUpperCase() === nc.name.toUpperCase());
          if (existingIdx !== -1) {
            updated[existingIdx] = nc;
          } else {
            updated.push(nc);
          }
        });
        return updated;
      });
      showToast(`${newClasses.length} rombel kelas berhasil diperbarui/ditambahkan`);
    }
  };

  const handleImportAll = (payload: { schedule?: ScheduleSlot[]; teachers?: Teacher[]; classes?: SchoolClass[] }) => {
    const msgs: string[] = [];
    if (payload.classes && payload.classes.length > 0) {
      handleImportClasses(payload.classes, 'merge');
      msgs.push(`${payload.classes.length} kelas`);
    }
    if (payload.teachers && payload.teachers.length > 0) {
      handleImportTeachers(payload.teachers, 'merge');
      msgs.push(`${payload.teachers.length} guru`);
    }
    if (payload.schedule && payload.schedule.length > 0) {
      const merged = smartMergeSchedule(schedule, payload.schedule, 'merge');
      setSchedule(merged);
      msgs.push(`${payload.schedule.length} jadwal (digabungkan aman)`);
    }
    showToast(`Berhasil mengimpor: ${msgs.join(', ')}`);
  };

  // ================= Backup & Export =================
  const handleExportJSON = () => {
    const dataToExport = {
      config,
      classes,
      teachers,
      schedule,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-smkn1tegalsari-${Date.now()}.json`;
    a.click();
    showToast('File backup JSON berhasil diunduh');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.schedule && parsed.teachers && parsed.classes) {
          setSchedule(parsed.schedule);
          setTeachers(parsed.teachers);
          setClasses(parsed.classes);
          if (parsed.config) setConfig(parsed.config);
          showToast('Data jadwal berhasil diimpor!');
        } else {
          alert('Format file JSON tidak sesuai struktur jadwal.');
        }
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Portal Admin Kurikulum
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
              Sesi Aktif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola jadwal KBM, data pengajar, kelas 7 jurusan (TKR, TSM, TPL, TKJ, AK, DPB, KL), dan pengumuman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="Lihat tampilan jadwal publik (sesi login tetap tersimpan)"
          >
            ← Lihat Dashboard Publik
          </button>
          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              title="Keluar dan kunci sesi admin"
            >
              Keluar / Logout
            </button>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setAdminTab('matrix')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'matrix'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tabel Matriks Lengkap (10 Kuliner 1 & 2)</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
            Format Asli
          </span>
        </button>

        <button
          onClick={() => setAdminTab('schedule')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'schedule'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Kelola Jadwal Slot</span>
        </button>

        <button
          onClick={() => setAdminTab('teachers')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'teachers'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Data Guru & Kode</span>
        </button>

        <button
          onClick={() => setAdminTab('classes')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'classes'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Data Kelas</span>
        </button>

        <button
          onClick={() => setAdminTab('import-center')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'import-center'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pusat Impor Excel</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
            Menu Impor
          </span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'settings'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengumuman & Ticker</span>
        </button>

        <button
          onClick={() => setAdminTab('staff')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'staff'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
          <span>Akses Petugas</span>
          <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-full border border-purple-200">
            {staffUsers.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('backup')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            adminTab === 'backup'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>Backup & Reset Asli</span>
        </button>
      </div>

      {/* Main Admin Tab Content */}
      <div className="p-4 sm:p-6">

        {/* ================= TAB 0: TABEL MATRIKS LENGKAP PER KELAS ================= */}
        {adminTab === 'matrix' && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white p-5 rounded-3xl shadow-sm border border-emerald-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 rounded-xl bg-emerald-700/80 text-emerald-200">
                    <Table className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                    Tabel Matriks Lengkap per Kelas (Format Resmi SMKN 1 Tegalsari)
                  </h3>
                  <span className="text-xs bg-emerald-700 text-emerald-100 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500">
                    Mode Admin Aktif
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-1.5 max-w-2xl leading-relaxed">
                  Tampilan matriks bersandingan per kelas persis seperti di dashboard publik dan lembar fisik/foto jadwal SMKN 1 Tegalsari (seperti <strong>10 Kuliner 1</strong> & <strong>10 Kuliner 2</strong>). Anda dapat memilih pasangan kelas, memfilter hari, melakukan edit langsung per slot pada kolom aksi, atau mengimpor file Excel jadwal baru.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setIsScheduleExcelOpen(true)}
                  className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Impor Jadwal (Per Kelas / Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddSlot(selectedDay)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border border-emerald-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slot ({selectedDay})</span>
                </button>
              </div>
            </div>

            {/* Embedded Matrix Table with Admin capabilities */}
            <OriginalTableView
              schedule={schedule}
              teachers={teachers}
              classes={classes}
              currentDay="SENIN"
              filterDay={selectedDay}
              isAdmin={true}
              onEditSlot={(slot) => {
                setEditingSlot(slot);
                setIsAddingSlot(false);
              }}
              onDeleteSlot={handleDeleteSlot}
              onAddNewSlot={() => handleOpenAddSlot(selectedDay)}
              onOpenExcelImport={() => setIsScheduleExcelOpen(true)}
              activeWeek={scheduleWeekFilter !== 'ALL' ? scheduleWeekFilter : activeWeek}
              onToggleActiveWeek={(w) => {
                if (w) {
                  setScheduleWeekFilter(w);
                  if (onToggleActiveWeek) onToggleActiveWeek(w);
                } else {
                  setScheduleWeekFilter('ALL');
                }
              }}
              onSelectDay={(d) => setSelectedDay(d)}
            />
          </div>
        )}

        {/* ================= TAB 1: JADWAL SLOT ================= */}
        {adminTab === 'schedule' && (
          <div>
            {/* Day Selector & Add Slot Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1">Hari:</span>
                {DAYS_LIST.map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedSlotIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDay === day
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Select All Toggle */}
                {daySlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAllDaySlots(daySlots)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                    title={daySlots.every((s) => selectedSlotIds.includes(s.id)) ? 'Batalkan pilih semua' : 'Pilih semua slot hari ini'}
                  >
                    {daySlots.every((s) => selectedSlotIds.includes(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Pilih Semua ({daySlots.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAutoGenScope('CURRENT_DAY');
                    setAutoGenClassScope('ALL');
                    setAutoGenSelectedClassIds([]);
                    setAutoGenKeepExistingData(true);
                    setIsAutoGenerateModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  title="Tambah / lengkapi slot jadwal KBM secara otomatis tanpa menghapus data lama"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Tambah Jadwal Otomatis</span>
                </button>

                <button
                  onClick={() => setIsScheduleExcelOpen(true)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs border border-emerald-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Impor Jadwal (Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddSlot(selectedDay)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slot ({selectedDay})</span>
                </button>
              </div>
            </div>

            {/* Week Rotation Filter Bar */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-2xl mb-4 text-xs font-bold flex-wrap">
              <span className="text-slate-500 font-extrabold flex items-center gap-1 pl-1">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                Filter Siklus Pekan:
              </span>
              <button
                type="button"
                onClick={() => {
                  setScheduleWeekFilter('ALL');
                }}
                className={`px-3 py-1 rounded-xl transition-all ${
                  scheduleWeekFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua Pekan ({schedule.filter((s) => s.day === selectedDay).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduleWeekFilter('NORMADA_10_PRODUKTIF_11');
                  if (onToggleActiveWeek) onToggleActiveWeek('NORMADA_10_PRODUKTIF_11');
                }}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                  scheduleWeekFilter === 'NORMADA_10_PRODUKTIF_11'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Pekan Normada 10 & Produktif 11</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduleWeekFilter('PRODUKTIF_10_NORMADA_11');
                  if (onToggleActiveWeek) onToggleActiveWeek('PRODUKTIF_10_NORMADA_11');
                }}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                  scheduleWeekFilter === 'PRODUKTIF_10_NORMADA_11'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-900 hover:bg-amber-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Pekan Produktif 10 & Normada 11</span>
              </button>
            </div>

            {/* List of slots for this day */}
            {daySlots.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Belum ada slot jadwal untuk hari {selectedDay}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Klik "Tambah Slot ({selectedDay})" atau gunakan "Impor Jadwal (Excel)" untuk memuat jadwal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {daySlots.map((slot) => {
                  const isBreak = slot.type === 'BREAK';
                  const isSpecial = slot.type !== 'REGULAR' && !isBreak;
                  const isSelected = selectedSlotIds.includes(slot.id);

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' 
                          : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSelectSlot(slot.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 transition-colors shrink-0"
                          title="Pilih slot ini"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div className="text-center w-16 shrink-0">
                          <span className="font-mono text-sm font-bold text-slate-900 block">
                            {slot.periodNumber ? `Jam ${slot.periodNumber}` : '-'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {slot.timeStart} - {slot.timeEnd}
                          </span>
                        </div>

                        <div className="border-l border-slate-200 pl-4">
                          {isBreak ? (
                            <span className="font-bold text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              {slot.title || 'ISTIRAHAT'}
                            </span>
                          ) : isSpecial ? (
                            <span className="font-bold text-xs text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                              {slot.title || slot.type}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-4 text-xs">
                              {classes.map((c) => {
                                const asg = slot.classes[c.id];
                                if (!asg) return null;
                                return (
                                  <div key={c.id}>
                                    <strong className="text-slate-800">{c.name}:</strong>{' '}
                                    <span className="font-bold text-emerald-800">{asg.subject || '-'}</span>{' '}
                                    <span className="font-mono text-slate-500">[{asg.teacherCode || '-'}]</span>{' '}
                                    <span className="text-slate-400">({asg.room})</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Week Rotation Badge */}
                          <div className="mt-1">
                            {slot.weekType && slot.weekType !== 'ALL' ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                                slot.weekType === 'NORMADA_10_PRODUKTIF_11'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                <span>🔄</span>
                                <span>{slot.weekType === 'NORMADA_10_PRODUKTIF_11' ? 'Pekan Normada 10 & Produktif 11' : 'Pekan Produktif 10 & Normada 11'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md font-medium">
                                Semua Pekan (Umum)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            setIsAddingSlot(false);
                            setSlotModalError(null);
                            setEditingSlot(JSON.parse(JSON.stringify(slot)));
                          }}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          title="Hapus Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating / Sticky Bulk Action Bar for Slots */}
            {selectedSlotIds.length > 0 && (
              <div className="sticky bottom-4 z-30 mt-4 p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-slate-800 animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    {selectedSlotIds.length}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedSlotIds.length} slot dipilih ({selectedDay})
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSlotSelection}
                    className="text-[11px] text-slate-400 hover:text-white underline ml-2"
                  >
                    Batal Pilihan
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkSlotType('KEEP');
                      setBulkSlotTitle('');
                      setBulkSlotShiftMinutes(0);
                      setBulkSlotActionType(false);
                      setBulkSlotActionTitle(false);
                      setBulkSlotActionShift(false);
                      setBulkSlotError(null);
                      setIsBulkEditSlotOpen(true);
                    }}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Edit Massal ({selectedSlotIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDeleteSlots}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedSlotIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDeleteAllDaySlots}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-900/40"
                    title="Kosongkan seluruh jadwal pada hari yang aktif"
                  >
                    Kosongkan Hari Ini
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GURU ================= */}
        {adminTab === 'teachers' && (() => {
          const allTeachersSelected = teachers.length > 0 && teachers.every((t) => selectedTeacherIds.includes(t.id));

          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Master Data Guru</h3>
                  <p className="text-xs text-slate-500">Daftar kode guru resmi di jadwal SMKN 1 Tegalsari (Format: Kode, Nama, Mapel - Tanpa No HP).</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All Teachers */}
                  {teachers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllTeachers(teachers)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                      title={allTeachersSelected ? 'Batalkan pilih semua guru' : 'Pilih semua guru'}
                    >
                      {allTeachersSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Pilih Semua ({teachers.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsExcelModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs border border-emerald-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Impor Excel (Tanpa No HP)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAddingTeacher(true);
                      setEditingTeacherOriginalCode(null);
                      setTeacherModalError(null);
                      setEditingTeacher({
                        id: '',
                        code: '',
                        name: '',
                        subject: '',
                        color: '#0284c7',
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Guru Manual</span>
                  </button>
                </div>
              </div>

              {teachers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Belum ada data guru terdaftar</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan "Impor Excel (Tanpa No HP)" atau tambah guru manual untuk mengisi master data pengajar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teachers.map((t) => {
                    const isSelected = selectedTeacherIds.includes(t.id);

                    return (
                      <div 
                        key={t.id} 
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleSelectTeacher(t.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-700 transition-colors shrink-0"
                            title="Pilih guru ini"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>

                          <span className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {t.code}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                            <p className="text-[11px] text-emerald-700 font-semibold">{t.subject}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setIsAddingTeacher(false);
                              setEditingTeacherOriginalCode(t.code);
                              setTeacherModalError(null);
                              setEditingTeacher({ ...t });
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                            title="Edit Data Guru"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating / Sticky Bulk Action Bar for Teachers */}
              {selectedTeacherIds.length > 0 && (
                <div className="sticky bottom-4 z-30 mt-6 p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-slate-800 animate-in slide-in-from-bottom duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {selectedTeacherIds.length}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {selectedTeacherIds.length} guru dipilih
                    </span>
                    <button
                      type="button"
                      onClick={handleClearTeacherSelection}
                      className="text-[11px] text-slate-400 hover:text-white underline ml-2"
                    >
                      Batal Pilihan
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkTeacherSubject('');
                        setBulkTeacherActionSubject(true);
                        setBulkTeacherActionColor(false);
                        setBulkTeacherError(null);
                        setIsBulkEditTeacherOpen(true);
                      }}
                      className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Edit Massal ({selectedTeacherIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDeleteTeachers}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Terpilih ({selectedTeacherIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDeleteAllTeachers}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-900/40"
                      title="Hapus seluruh master guru"
                    >
                      Hapus Semua Guru
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB 3: KELAS ================= */}
        {adminTab === 'classes' && (() => {
          const filteredClasses = classes.filter((c) => {
            const q = classSearchQuery.toLowerCase();
            const matchesSearch =
              !q ||
              c.name.toLowerCase().includes(q) ||
              c.department.toLowerCase().includes(q) ||
              (c.roomDefault && c.roomDefault.toLowerCase().includes(q)) ||
              c.id.toLowerCase().includes(q);
            const matchesGrade = classGradeFilter === 'ALL' || c.grade === classGradeFilter;
            const normalizedDept = normalizeDepartment(c.department);
            const matchesDept =
              classDeptFilter === 'ALL' ||
              normalizedDept.includes(classDeptFilter) ||
              c.department.toUpperCase().includes(classDeptFilter);
            return matchesSearch && matchesGrade && matchesDept;
          });

          const countX = classes.filter((c) => c.grade === 'X').length;
          const countXI = classes.filter((c) => c.grade === 'XI').length;
          const countXII = classes.filter((c) => c.grade === 'XII').length;

          // Quick preset suggestions for the 7 official departments that don't exist yet
          const QUICK_CLASS_PRESETS: { name: string; dept: string; grade: 'X' | 'XI' | 'XII'; room: string }[] = [
            { name: 'X TKR 1', dept: 'TKR (Teknik Kendaraan Ringan)', grade: 'X' as const, room: 'BENGKEL TKR' },
            { name: 'X TSM 1', dept: 'TSM (Teknik Sepeda Motor)', grade: 'X' as const, room: 'BENGKEL TSM' },
            { name: 'X TPL 1', dept: 'TPL (Teknik Pengelasan)', grade: 'X' as const, room: 'BENGKEL TPL' },
            { name: 'X TKJ 1', dept: 'TKJ (Teknik Komputer dan Jaringan)', grade: 'X' as const, room: 'LAB TKJ' },
            { name: 'X AK 1', dept: 'AK (Akuntansi)', grade: 'X' as const, room: 'LAB AK' },
            { name: 'X DPB 1', dept: 'DPB (Desain Produksi Busana)', grade: 'X' as const, room: 'LAB DPB' },
            { name: 'X KL 1', dept: 'KL (Kuliner)', grade: 'X' as const, room: 'R.J1' },
            { name: 'X KL 2', dept: 'KL (Kuliner)', grade: 'X' as const, room: 'R.J2' },
          ].filter((p) => !classes.some((c) => c.name.toUpperCase() === p.name.toUpperCase()));

          return (
            <div className="space-y-5">
              {/* Header & Main Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <Layers className="w-4 h-4 text-emerald-700" />
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Data Rombongan Belajar (Rombel) SMKN 1 Tegalsari
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola rombel untuk 7 jurusan: <strong>TKR</strong>, <strong>TSM</strong>, <strong>TPL</strong>, <strong>TKJ</strong>, <strong>AK</strong>, <strong>DPB</strong>, dan <strong>KL</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All Toggle for filtered classes */}
                  {filteredClasses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllFilteredClasses(filteredClasses)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                      title={filteredClasses.every((c) => selectedClassIds.includes(c.id)) ? 'Batalkan pilih semua kelas' : 'Pilih semua rombel kelas ini'}
                    >
                      {filteredClasses.every((c) => selectedClassIds.includes(c.id)) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Pilih Semua ({filteredClasses.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsClassExcelOpen(true)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs border border-emerald-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Impor Kelas (Excel)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAddingClass(true);
                      setEditingClassOriginalId(null);
                      setClassModalError(null);
                      setEditingClass({
                        id: '',
                        name: '',
                        department: 'KL (Kuliner)',
                        grade: 'X',
                        roomDefault: 'R.J1',
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Kelas Baru</span>
                  </button>
                </div>
              </div>

              {/* Statistics & Filter Controls */}
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                      placeholder="Cari nama kelas, jurusan (TKR, TSM, TPL, TKJ, AK, DPB, KL), atau ruang..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {classSearchQuery && (
                      <button
                        onClick={() => setClassSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Grade Filter Pills */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto text-[11px] font-bold">
                    <button
                      onClick={() => setClassGradeFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        classGradeFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({classes.length})
                    </button>
                    <button
                      onClick={() => setClassGradeFilter('X')}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        classGradeFilter === 'X'
                          ? 'bg-emerald-700 text-white'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      Kelas X ({countX})
                    </button>
                    <button
                      onClick={() => setClassGradeFilter('XI')}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        classGradeFilter === 'XI'
                          ? 'bg-sky-700 text-white'
                          : 'text-slate-600 hover:text-sky-700'
                      }`}
                    >
                      Kelas XI ({countXI})
                    </button>
                    <button
                      onClick={() => setClassGradeFilter('XII')}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        classGradeFilter === 'XII'
                          ? 'bg-purple-700 text-white'
                          : 'text-slate-600 hover:text-purple-700'
                      }`}
                    >
                      Kelas XII ({countXII})
                    </button>
                  </div>
                </div>

                {/* 7 Jurusan Filter Chips */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/80 overflow-x-auto text-[11px] font-bold">
                  <span className="text-slate-500 font-bold shrink-0 text-[10px] uppercase tracking-wider mr-1">
                    Jurusan:
                  </span>
                  <button
                    onClick={() => setClassDeptFilter('ALL')}
                    className={`px-2 py-0.5 rounded-lg border transition-colors whitespace-nowrap ${
                      classDeptFilter === 'ALL'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Semua Jurusan
                  </button>
                  {SMKN1_DEPARTMENTS.map((dept) => {
                    const countInDept = classes.filter((c) =>
                      normalizeDepartment(c.department).includes(dept.code)
                    ).length;
                    return (
                      <button
                        key={dept.code}
                        onClick={() => setClassDeptFilter(dept.code)}
                        className={`px-2.5 py-0.5 rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1 ${
                          classDeptFilter === dept.code
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs font-extrabold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                        title={dept.name}
                      >
                        <span>{dept.code}</span>
                        {countInDept > 0 && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
                              classDeptFilter === dept.code
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {countInDept}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Template Suggestions */}
              {QUICK_CLASS_PRESETS.length > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rekomendasi Rombel 7 Jurusan SMKN 1 Tegalsari (Klik untuk langsung buat):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CLASS_PRESETS.slice(0, 8).map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setIsAddingClass(true);
                          setEditingClassOriginalId(null);
                          setClassModalError(null);
                          setEditingClass({
                            id: preset.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                            name: preset.name,
                            department: preset.dept,
                            grade: preset.grade,
                            roomDefault: preset.room,
                          });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:scale-102 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>{preset.name}</span>
                        <span className="text-[10px] text-emerald-600 font-normal">({preset.dept})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Cards Grid */}
              {filteredClasses.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Tidak ada rombel kelas yang cocok</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba sesuaikan kata kunci pencarian atau tambah kelas baru.
                  </p>
                  <button
                    onClick={() => {
                      setIsAddingClass(true);
                      setEditingClass({
                        id: '',
                        name: classSearchQuery.toUpperCase() || 'X KL 3',
                        department: 'KL (Kuliner)',
                        grade: 'X',
                        roomDefault: 'R.J3',
                      });
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kelas Ini</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClasses.map((c) => {
                    const gradeColor =
                      c.grade === 'X'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : c.grade === 'XI'
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300';
                    const isSelected = selectedClassIds.includes(c.id);

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => toggleSelectClass(c.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-emerald-700 transition-colors"
                                title="Pilih kelas ini"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </button>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${gradeColor}`}
                              >
                                TINGKAT {c.grade}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              ID: {c.id}
                            </span>
                          </div>

                          {/* Class Name */}
                          <h4 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                            {c.name}
                          </h4>

                          {/* Details */}
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold">{c.department}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Default Ruang: <strong className="text-slate-800">{c.roomDefault || '-'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Aktif di Matriks
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setIsAddingClass(false);
                                setEditingClassOriginalId(c.id);
                                setClassModalError(null);
                                setEditingClass({ ...c, department: normalizeDepartment(c.department) });
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 hover:border-emerald-300"
                              title="Edit Data Rombel"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClass(c.id, c.name)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 hover:border-rose-200"
                              title="Hapus Rombel"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating / Sticky Bulk Action Bar for Classes */}
              {selectedClassIds.length > 0 && (
                <div className="sticky bottom-4 z-30 mt-6 p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-slate-800 animate-in slide-in-from-bottom duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {selectedClassIds.length}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {selectedClassIds.length} rombel kelas dipilih
                    </span>
                    <button
                      type="button"
                      onClick={handleClearClassSelection}
                      className="text-[11px] text-slate-400 hover:text-white underline ml-2"
                    >
                      Batal Pilihan
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkClassDept(SMKN1_DEPARTMENTS[0].label);
                        setBulkClassGrade('X');
                        setBulkClassRoom('R.J1');
                        setBulkClassActionDept(true);
                        setBulkClassActionGrade(false);
                        setBulkClassActionRoom(false);
                        setBulkClassError(null);
                        setIsBulkEditClassOpen(true);
                      }}
                      className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Edit Massal ({selectedClassIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDeleteClasses}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Terpilih ({selectedClassIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDeleteAllClasses}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-900/40"
                      title="Kosongkan rombel kelas"
                    >
                      Kosongkan Rombel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB: PUSAT IMPOR EXCEL ================= */}
        {adminTab === 'import-center' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-3xl border border-emerald-700 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-white">
                    Pusat Impor Data Excel SMKN 1 Tegalsari
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Sistem impor data spreadsheet terintegrasi untuk memperbarui jadwal matriks per kelas, master guru, dan rombel.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Impor Jadwal Matriks */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Calendar className="w-5 h-5 text-emerald-700" />
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Excel / CSV
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    1. Impor Jadwal Pelajaran
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Impor jadwal pelajaran untuk kelas yang dipilih langsung dari file Excel atau salinan teks. Mendukung format Upacara, Istirahat, Diniyah, dan Istigosah.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setIsScheduleExcelOpen(true)}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Buka Impor Jadwal</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Impor Guru (Tanpa No HP) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Users className="w-5 h-5 text-emerald-700" />
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Tanpa No HP
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    2. Impor Data Guru (Kode & Mapel)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Impor daftar kode guru (BIG3, MT7, dsb.), nama pengajar, dan mata pelajaran tanpa membutuhkan nomor HP.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setIsExcelModalOpen(true)}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Buka Impor Guru</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Impor Rombel Kelas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Layers className="w-5 h-5 text-emerald-700" />
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Rombel Kelas
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    3. Impor Data Rombel Kelas
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tambah atau perbarui daftar rombongan belajar (X Kuliner 1, X Kuliner 2, XI Kuliner, X TKJ, dll.) beserta ruang default.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setIsClassExcelOpen(true)}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Buka Impor Kelas</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdminTab('classes');
                      setIsAddingClass(true);
                      setEditingClass({
                        id: '',
                        name: '',
                        department: 'KL (Kuliner)',
                        grade: 'X',
                        roomDefault: 'R.J1',
                      });
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-slate-200"
                    title="Tambah Kelas Manual"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manual</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Paket Master Multi-Sheet */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
                      <Sparkles className="w-5 h-5 text-teal-700" />
                    </span>
                    <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      Multi-Sheet Excel
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    4. Impor Paket Master Lengkap (All-in-One)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Unggah 1 file Excel master yang sudah berisi 3 lembar kerja sekaligus: sheet Jadwal, sheet Guru, dan sheet Kelas.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setIsAllExcelOpen(true)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Buka Impor Paket Master</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 4: PENGUMUMAN & SETTINGS ================= */}
        {adminTab === 'settings' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                value={config.schoolName}
                onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Ajaran & Semester
              </label>
              <input
                type="text"
                value={config.academicYear}
                onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Sekolah (Resmi)
              </label>
              <textarea
                rows={2}
                value={config.schoolAddress || 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi'}
                onChange={(e) => setConfig({ ...config, schoolAddress: e.target.value })}
                placeholder="Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 font-medium"
              />
            </div>

            {/* Active Rotating Week Setting */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
              <label className="block text-xs font-black text-emerald-950 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                Siklus Pekan KBM Aktif Saat Ini
              </label>
              <p className="text-[11px] text-emerald-800 mb-3">
                Menentukan jadwal KBM kelas 10 dan kelas 11 yang aktif dan tampil pada seluruh dashboard dan Mode TV.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  (config.activeWeek || activeWeek) === 'NORMADA_10_PRODUKTIF_11'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="activeWeekRadio"
                      checked={(config.activeWeek || activeWeek) === 'NORMADA_10_PRODUKTIF_11'}
                      onChange={() => {
                        setConfig({ ...config, activeWeek: 'NORMADA_10_PRODUKTIF_11' });
                        if (onToggleActiveWeek) onToggleActiveWeek('NORMADA_10_PRODUKTIF_11');
                        showToast('Pekan Normada 10 & Produktif 11 diaktifkan');
                      }}
                      className="text-emerald-600"
                    />
                    <span className="font-bold text-xs">Pekan Normada 10 & Produktif 11</span>
                  </div>
                  <span className={`text-[10px] pl-5 ${
                    (config.activeWeek || activeWeek) === 'NORMADA_10_PRODUKTIF_11' ? 'text-emerald-100' : 'text-slate-500'
                  }`}>
                    • Kelas 10: Teori Normada / Umum<br />
                    • Kelas 11: Praktik Produktif Kejuruan
                  </span>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  (config.activeWeek || activeWeek) === 'PRODUKTIF_10_NORMADA_11'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-amber-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="activeWeekRadio"
                      checked={(config.activeWeek || activeWeek) === 'PRODUKTIF_10_NORMADA_11'}
                      onChange={() => {
                        setConfig({ ...config, activeWeek: 'PRODUKTIF_10_NORMADA_11' });
                        if (onToggleActiveWeek) onToggleActiveWeek('PRODUKTIF_10_NORMADA_11');
                        showToast('Pekan Produktif 10 & Normada 11 diaktifkan');
                      }}
                      className="text-amber-600"
                    />
                    <span className="font-bold text-xs">Pekan Produktif 10 & Normada 11</span>
                  </div>
                  <span className={`text-[10px] pl-5 ${
                    (config.activeWeek || activeWeek) === 'PRODUKTIF_10_NORMADA_11' ? 'text-amber-100' : 'text-slate-500'
                  }`}>
                    • Kelas 10: Praktik Produktif Kejuruan<br />
                    • Kelas 11: Teori Normada / Umum
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Berjalan / Pengumuman (Running Text Header & TV Mode)
              </label>
              <textarea
                rows={3}
                value={config.runningAnnouncement}
                onChange={(e) => setConfig({ ...config, runningAnnouncement: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => showToast('Pengaturan berhasil disimpan')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BACKUP & RESET ================= */}
        {adminTab === 'backup' && (
          <div className="max-w-2xl space-y-6">
            {/* Reset to Image Default */}
            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-rose-900">
                    Reset ke Jadwal Standar SMKN 1 Tegalsari (Sesuai Foto)
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    Kembalikan seluruh jadwal hari Senin hingga Jumat (X Kuliner 1 & 2) persis seperti pada foto yang diunggah. Semua modifikasi manual akan dikembalikan ke data awal.
                  </p>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Reset ke Jadwal Standar Foto Asli',
                        message: 'Apakah Anda yakin ingin mereset seluruh data jadwal kembali sesuai foto asli SMKN 1 Tegalsari? Seluruh perubahan manual akan dikembalikan ke data awal.',
                        confirmText: 'Ya, Reset Jadwal',
                        isDanger: true,
                        onConfirm: () => {
                          onResetDefault();
                          showToast('Jadwal berhasil direset ke standar foto');
                          setConfirmDialog(null);
                        },
                      });
                    }}
                    className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Data Jadwal Asli</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Export & Import */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                Ekspor & Impor Data (JSON Backup)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Simpan cadangan data jadwal atau pulihkan dari file JSON yang telah diunduh sebelumnya.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh File Cadangan (JSON)</span>
                </button>

                <label className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Pulihkan dari File JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: AKSES PETUGAS (KURIKULUM, PIKET, OPERATOR) ================= */}
        {adminTab === 'staff' && (
          <StaffManagementTab
            staffUsers={staffUsers}
            setStaffUsers={setStaffUsers}
            showToast={showToast}
          />
        )}

      </div>

      {/* Modal: Edit / Add Schedule Slot */}
      {(editingSlot || isAddingSlot) && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-extrabold text-slate-900 text-base">
                {isAddingSlot ? 'Tambah Slot Jadwal' : 'Edit Slot Jadwal'} ({editingSlot.day})
              </h4>
              <button
                onClick={() => {
                  setEditingSlot(null);
                  setIsAddingSlot(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {slotModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">{slotModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke-</label>
                  <input
                    type="text"
                    value={editingSlot.periodNumber || ''}
                    onChange={(e) => setEditingSlot({ ...editingSlot, periodNumber: e.target.value })}
                    placeholder="Contoh: 1, 2, EKS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Slot</label>
                  <select
                    value={editingSlot.type}
                    onChange={(e) => setEditingSlot({ ...editingSlot, type: e.target.value as SlotType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="REGULAR">Reguler (Kelas)</option>
                    <option value="BREAK">Istirahat</option>
                    <option value="UPACARA">Upacara Bendera</option>
                    <option value="ISTIGOSAH">Istigosah</option>
                    <option value="DINIYAH">Diniyah</option>
                    <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                  </select>
                </div>
              </div>

              {/* Week Rotation Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Berlaku Pada Siklus Pekan</label>
                <select
                  value={editingSlot.weekType || 'ALL'}
                  onChange={(e) => setEditingSlot({ ...editingSlot, weekType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="ALL">Semua Pekan (Umum / Berlaku Setiap Minggu)</option>
                  <option value="NORMADA_10_PRODUKTIF_11">Pekan Normada 10 & Produktif 11</option>
                  <option value="PRODUKTIF_10_NORMADA_11">Pekan Produktif 10 & Normada 11</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai (HH:mm)</label>
                  <input
                    type="text"
                    value={editingSlot.timeStart}
                    onChange={(e) => setEditingSlot({ ...editingSlot, timeStart: e.target.value })}
                    placeholder="07:20"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai (HH:mm)</label>
                  <input
                    type="text"
                    value={editingSlot.timeEnd}
                    onChange={(e) => setEditingSlot({ ...editingSlot, timeEnd: e.target.value })}
                    placeholder="07:55"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Per-class assignments */}
              {editingSlot.type === 'REGULAR' || editingSlot.type === 'DINIYAH' ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h5 className="font-extrabold text-slate-800">Penugasan Kelas & Pengajar:</h5>
                  
                  {classes.map((cls) => {
                    const asg = editingSlot.classes[cls.id] || { subject: '', teacherCode: '', room: cls.roomDefault || 'R.J1' };
                    return (
                      <div key={cls.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <span className="font-black text-slate-900 block">{cls.name}</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mapel</label>
                            <input
                              type="text"
                              value={asg.subject}
                              onChange={(e) => {
                                const newClasses = { ...editingSlot.classes };
                                newClasses[cls.id] = { ...asg, subject: e.target.value };
                                setEditingSlot({ ...editingSlot, classes: newClasses });
                              }}
                              placeholder="BAHASA INGGRIS"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kode Guru</label>
                            <input
                              type="text"
                              value={asg.teacherCode}
                              onChange={(e) => {
                                const newClasses = { ...editingSlot.classes };
                                newClasses[cls.id] = { ...asg, teacherCode: e.target.value.toUpperCase() };
                                setEditingSlot({ ...editingSlot, classes: newClasses });
                              }}
                              placeholder="BIG3"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ruang</label>
                            <input
                              type="text"
                              value={asg.room}
                              onChange={(e) => {
                                const newClasses = { ...editingSlot.classes };
                                newClasses[cls.id] = { ...asg, room: e.target.value.toUpperCase() };
                                setEditingSlot({ ...editingSlot, classes: newClasses });
                              }}
                              placeholder="R.J1"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Sesi (Jika Istirahat/Upacara)</label>
                  <input
                    type="text"
                    value={editingSlot.title || ''}
                    onChange={(e) => setEditingSlot({ ...editingSlot, title: e.target.value })}
                    placeholder="Contoh: ISTIRAHAT & SHOLAT DHUHUR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlot(null);
                    setIsAddingSlot(false);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSlot(editingSlot)}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Teacher */}
      {(editingTeacher || isAddingTeacher) && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-extrabold text-slate-900 text-base">
                {isAddingTeacher ? 'Tambah Data Guru' : 'Edit Data Guru'}
              </h4>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {teacherModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">{teacherModalError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Guru (Contoh: BIG3, MT7)</label>
                <input
                  type="text"
                  value={editingTeacher.code}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  placeholder="BIG3"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Guru (Gelar)</label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Bayu Wibisono, S.Pd."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={editingTeacher.subject}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Bahasa Inggris"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsAddingTeacher(false);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTeacher(editingTeacher)}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Guru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Class (Rombel) */}
      {(editingClass || isAddingClass) && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Layers className="w-4 h-4 text-emerald-700" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {isAddingClass ? 'Tambah Rombongan Belajar (Kelas Baru)' : 'Edit Data Kelas (Rombel)'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    SMKN 1 Tegalsari • Sistem Terpadu Jadwal & Matriks
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingClass(null);
                  setIsAddingClass(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {classModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">{classModalError}</span>
                </div>
              )}

              {/* Nama Kelas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => {
                    const newName = e.target.value.toUpperCase();
                    let updated = { ...editingClass, name: newName };

                    // Smart auto-detection for Grade and Department if adding new class
                    if (isAddingClass) {
                      if (newName.startsWith('XI ') || newName.startsWith('XI-')) {
                        updated.grade = 'XI';
                      } else if (newName.startsWith('XII ') || newName.startsWith('XII-')) {
                        updated.grade = 'XII';
                      } else if (newName.startsWith('X ') || newName.startsWith('X-')) {
                        updated.grade = 'X';
                      }

                      // Auto-detect 7 official departments
                      if (newName.includes('TKR') || newName.includes('KENDARAAN')) {
                        updated.department = 'TKR (Teknik Kendaraan Ringan)';
                      } else if (newName.includes('TSM') || newName.includes('MOTOR')) {
                        updated.department = 'TSM (Teknik Sepeda Motor)';
                      } else if (newName.includes('TPL') || newName.includes('LAS') || newName.includes('PENGELASAN')) {
                        updated.department = 'TPL (Teknik Pengelasan)';
                      } else if (newName.includes('TKJ') || newName.includes('KOMPUTER') || newName.includes('JARINGAN')) {
                        updated.department = 'TKJ (Teknik Komputer dan Jaringan)';
                      } else if (newName.includes('AK') || newName.includes('AKUNTANSI')) {
                        updated.department = 'AK (Akuntansi)';
                      } else if (newName.includes('DPB') || newName.includes('BUSANA')) {
                        updated.department = 'DPB (Desain Produksi Busana)';
                      } else if (newName.includes('KL') || newName.includes('KULINER') || newName.includes('BOGA')) {
                        updated.department = 'KL (Kuliner)';
                      }

                      // Auto generate clean ID slug
                      updated.id = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    }

                    setEditingClass(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Contoh: X TKR 1, X TSM 1, atau X KL 1"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Contoh: <strong>X TKR 1</strong>, <strong>X TSM 1</strong>, <strong>X TPL 1</strong>, <strong>X TKJ 1</strong>, <strong>X AK 1</strong>, <strong>X DPB 1</strong>, <strong>X KL 1</strong>
                </p>
              </div>

              {/* Tingkat Kelas (Grade) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat / Jenjang Kelas <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['X', 'XI', 'XII'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditingClass({ ...editingClass, grade: g })}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex flex-col items-center justify-center ${
                        editingClass.grade === g
                          ? g === 'X'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : g === 'XI'
                            ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                            : 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-black">Kelas {g}</span>
                      <span className="text-[9px] opacity-80">
                        {g === 'X' ? 'Tingkat 10' : g === 'XI' ? 'Tingkat 11' : 'Tingkat 12'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jurusan / Keahlian */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Jurusan / Keahlian (7 Jurusan SMKN 1 Tegalsari) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Hanya 7 Jurusan
                  </span>
                </div>
                
                <select
                  value={normalizeDepartment(editingClass.department)}
                  onChange={(e) => {
                    setEditingClass({ ...editingClass, department: e.target.value });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs cursor-pointer shadow-2xs"
                >
                  {SMKN1_DEPARTMENTS.map((dept) => (
                    <option key={dept.code} value={dept.label} className="font-semibold py-1">
                      {dept.label}
                    </option>
                  ))}
                </select>

                {/* Quick Selection Buttons for 7 Jurusan */}
                <div className="mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                    Pilih cepat jurusan:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {SMKN1_DEPARTMENTS.map((dept) => {
                      const isSelected = normalizeDepartment(editingClass.department) === dept.label;
                      return (
                        <button
                          key={dept.code}
                          type="button"
                          onClick={() => setEditingClass({ ...editingClass, department: dept.label })}
                          className={`py-1 px-1 rounded-lg text-center transition-all border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs font-black'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-[11px] font-bold'
                          }`}
                          title={dept.name}
                        >
                          <div className="text-xs font-black">{dept.code}</div>
                          <div className="text-[8px] truncate leading-tight opacity-90">{dept.name.split(' ')[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ruang Default & ID Sistem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ruang Kelas Default
                  </label>
                  <input
                    type="text"
                    value={editingClass.roomDefault || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, roomDefault: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Contoh: R.J1 atau BENGKEL 1"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode ID Sistem (Unik)
                  </label>
                  <input
                    type="text"
                    value={editingClass.id}
                    onChange={(e) =>
                      setEditingClass({
                        ...editingClass,
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Contoh: xk1, xk2, xk3"
                  />
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Keterangan:</span> Kelas yang didaftarkan akan otomatis muncul pada seleksi tabel matriks (berdampingan), portal jadwal harian, penugasan guru, dan impor file Excel.
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass(null);
                    setIsAddingClass(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveClass(editingClass)}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Kelas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT MASSAL SLOT JADWAL ================= */}
      {isBulkEditSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight">Edit Massal Slot Jadwal</h4>
                  <p className="text-[11px] text-emerald-200">{selectedSlotIds.length} slot dipilih ({selectedDay})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkEditSlotOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {bulkSlotError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bulkSlotError}</span>
                </div>
              )}

              {/* Option 1: Ubah Tipe Slot */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSlotActionType}
                    onChange={(e) => setBulkSlotActionType(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Tipe Slot KBM</span>
                </label>
                {bulkSlotActionType && (
                  <select
                    value={bulkSlotType}
                    onChange={(e) => setBulkSlotType(e.target.value as any)}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="REGULAR">Reguler (Kelas KBM Normal)</option>
                    <option value="BREAK">Istirahat</option>
                    <option value="UPACARA">Upacara Bendera</option>
                    <option value="ISTIGOSAH">Istigosah</option>
                    <option value="DINIYAH">Diniyah</option>
                    <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                  </select>
                )}
              </div>

              {/* Option 2: Ubah Judul / Keterangan */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSlotActionTitle}
                    onChange={(e) => setBulkSlotActionTitle(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Keterangan / Judul Khusus</span>
                </label>
                {bulkSlotActionTitle && (
                  <input
                    type="text"
                    value={bulkSlotTitle}
                    onChange={(e) => setBulkSlotTitle(e.target.value)}
                    placeholder="Contoh: ISTIRAHAT SHALAT DHUHUR"
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Option 3: Geser Waktu (Shift Minutes) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSlotActionShift}
                    onChange={(e) => setBulkSlotActionShift(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Geser Waktu Mulai & Selesai Bersamaan</span>
                </label>
                {bulkSlotActionShift && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={bulkSlotShiftMinutes}
                        onChange={(e) => setBulkSlotShiftMinutes(parseInt(e.target.value, 10) || 0)}
                        placeholder="Contoh: 10 atau -10"
                        className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                      />
                      <span className="font-bold text-slate-600">Menit ({bulkSlotShiftMinutes >= 0 ? `+${bulkSlotShiftMinutes}` : bulkSlotShiftMinutes} mnt)</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[-15, -10, -5, 5, 10, 15, 30].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBulkSlotShiftMinutes(m)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${
                            bulkSlotShiftMinutes === m
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m > 0 ? `+${m}` : m} mnt
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEditSlotOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEditSlots}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ({selectedSlotIds.length} Slot)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT MASSAL GURU ================= */}
      {isBulkEditTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight">Edit Massal Data Guru</h4>
                  <p className="text-[11px] text-emerald-200">{selectedTeacherIds.length} guru dipilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkEditTeacherOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {bulkTeacherError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bulkTeacherError}</span>
                </div>
              )}

              {/* Option 1: Ubah Mata Pelajaran */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkTeacherActionSubject}
                    onChange={(e) => setBulkTeacherActionSubject(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Mata Pelajaran Pengampu</span>
                </label>
                {bulkTeacherActionSubject && (
                  <input
                    type="text"
                    value={bulkTeacherSubject}
                    onChange={(e) => setBulkTeacherSubject(e.target.value)}
                    placeholder="Contoh: Produktif Otomotif, Matematika, dll"
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Option 2: Ubah Warna Label */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkTeacherActionColor}
                    onChange={(e) => setBulkTeacherActionColor(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Warna Label Identitas</span>
                </label>
                {bulkTeacherActionColor && (
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="color"
                      value={bulkTeacherColor}
                      onChange={(e) => setBulkTeacherColor(e.target.value)}
                      className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-700">{bulkTeacherColor}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEditTeacherOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEditTeachers}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ({selectedTeacherIds.length} Guru)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT MASSAL KELAS ================= */}
      {isBulkEditClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight">Edit Massal Rombel Kelas</h4>
                  <p className="text-[11px] text-emerald-200">{selectedClassIds.length} rombel kelas dipilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkEditClassOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {bulkClassError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bulkClassError}</span>
                </div>
              )}

              {/* Option 1: Ubah Jurusan (7 Jurusan SMKN 1 Tegalsari) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkClassActionDept}
                    onChange={(e) => setBulkClassActionDept(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Jurusan (7 Jurusan SMKN 1 Tegalsari)</span>
                </label>
                {bulkClassActionDept && (
                  <select
                    value={bulkClassDept}
                    onChange={(e) => setBulkClassDept(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    {SMKN1_DEPARTMENTS.map((dept) => (
                      <option key={dept.code} value={dept.label}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Option 2: Ubah Tingkat (Grade) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkClassActionGrade}
                    onChange={(e) => setBulkClassActionGrade(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Tingkat Kelas</span>
                </label>
                {bulkClassActionGrade && (
                  <div className="flex gap-2 mt-1.5">
                    {(['X', 'XI', 'XII'] as const).map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => setBulkClassGrade(gr)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all border ${
                          bulkClassGrade === gr
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Kelas {gr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 3: Ubah Default Ruang */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkClassActionRoom}
                    onChange={(e) => setBulkClassActionRoom(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ubah Default Ruang Kelas</span>
                </label>
                {bulkClassActionRoom && (
                  <input
                    type="text"
                    value={bulkClassRoom}
                    onChange={(e) => setBulkClassRoom(e.target.value.toUpperCase())}
                    placeholder="Contoh: R.J1, LAB TKJ, BENGKEL TKR"
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEditClassOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEditClasses}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ({selectedClassIds.length} Kelas)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExcelImportTeacherModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportTeachers={handleImportTeachers}
      />

      {/* Excel Schedule Matrix Import Modal */}
      <ExcelImportScheduleModal
        isOpen={isScheduleExcelOpen}
        onClose={() => setIsScheduleExcelOpen(false)}
        classes={classes}
        onImportSchedule={handleImportSchedule}
      />

      {/* Excel Class Import Modal */}
      <ExcelImportClassModal
        isOpen={isClassExcelOpen}
        onClose={() => setIsClassExcelOpen(false)}
        onImportClasses={handleImportClasses}
      />

      {/* Excel Master Multi-Sheet All-In-One Import Modal */}
      <ExcelImportAllModal
        isOpen={isAllExcelOpen}
        onClose={() => setIsAllExcelOpen(false)}
        classes={classes}
        onImportAll={handleImportAll}
      />

      {/* Modal Tambah Jadwal Otomatis (Non-Destruktif & Data Lama Dijamin Aman) */}
      {isAutoGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Sparkles className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Jadwal Otomatis</h3>
                  <p className="text-xs text-slate-500 font-medium">Lengkapi KBM SMKN 1 Tegalsari (Data Lama Aman)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
              {/* Security info banner */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
                <div className="p-1 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-emerald-950 text-xs">Perlindungan Data Lama Aktif</p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    Fitur ini <strong>tidak akan menghapus jadwal lama</strong> Anda. Alokasi mata pelajaran, guru, dan rombel lain yang sudah ada akan tetap utuh dipertahankan.
                  </p>
                </div>
              </div>

              {/* Day Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Pilih Hari yang Ingin Ditambahkan / Dilengkapi:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAutoGenScope('CURRENT_DAY')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      autoGenScope === 'CURRENT_DAY'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 font-bold text-emerald-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Hari {selectedDay} Saja</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        autoGenScope === 'CURRENT_DAY' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {autoGenScope === 'CURRENT_DAY' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Hanya hari yang aktif di tab</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoGenScope('ALL_DAYS')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      autoGenScope === 'ALL_DAYS'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 font-bold text-emerald-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Semua Hari (Senin-Jumat)</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        autoGenScope === 'ALL_DAYS' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {autoGenScope === 'ALL_DAYS' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Lengkapi 5 hari KBM</p>
                  </button>
                </div>
              </div>

              {/* Class Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  2. Pilih Cakupan Kelas / Rombel:
                </label>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setAutoGenClassScope('ALL')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      autoGenClassScope === 'ALL'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 font-bold text-emerald-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Semua Rombel</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        autoGenClassScope === 'ALL' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {autoGenClassScope === 'ALL' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Seluruh {classes.length} kelas terdaftar</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoGenClassScope('SELECTED');
                      if (autoGenSelectedClassIds.length === 0 && classes.length > 0) {
                        setAutoGenSelectedClassIds([classes[0].id]);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      autoGenClassScope === 'SELECTED'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 font-bold text-emerald-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Rombel Tertentu</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        autoGenClassScope === 'SELECTED' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {autoGenClassScope === 'SELECTED' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Pilih kelas spesifik</p>
                  </button>
                </div>

                {autoGenClassScope === 'SELECTED' && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700">
                        Pilih Kelas ({autoGenSelectedClassIds.length} dipilih)
                      </span>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setAutoGenSelectedClassIds(classes.map((c) => c.id))}
                          className="text-emerald-700 hover:underline font-bold"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setAutoGenSelectedClassIds([])}
                          className="text-slate-500 hover:underline"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {classes.map((c) => {
                        const isChecked = autoGenSelectedClassIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAutoGenSelectedClassIds((prev) => [...prev, c.id]);
                                  } else {
                                    setAutoGenSelectedClassIds((prev) => prev.filter((id) => id !== c.id));
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                              />
                              <span>{c.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                              {c.roomDefault || 'R.J1'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Non-Destructive Protection Checkbox */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenKeepExistingData}
                    onChange={(e) => setAutoGenKeepExistingData(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Pertahankan Data Lama (Sangat Direkomendasikan)
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                      Hanya mengisi slot atau jam yang masih kosong. Jadwal lama yang sudah ada tidak akan hilang atau tertimpa.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (autoGenClassScope === 'SELECTED' && autoGenSelectedClassIds.length === 0) {
                    showToast('Pilih minimal 1 kelas untuk ditambahkan jadwalnya.');
                    return;
                  }
                  handleExecuteAutoGenerateSchedule();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Jalankan Tambah Otomatis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global In-App Confirmation Modal (No window.confirm or alert!) */}
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
                <p className="text-xs text-slate-500">Konfirmasi Admin</p>
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
