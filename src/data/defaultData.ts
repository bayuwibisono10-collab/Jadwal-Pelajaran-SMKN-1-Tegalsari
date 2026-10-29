import { SchoolClass, Teacher, ScheduleSlot, SchoolConfig, StaffUser } from '../types/schedule';

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'SMKN 1 TEGALSARI',
  schoolSubtitle: 'Jadwal Pelajaran Semester Ganjil Tahun Ajaran 2026/2027',
  schoolAddress: 'Jl. KH. Abdul Majid No.09, Krajan 2, Tegalsari, Kec. Tegalsari, Kabupaten Banyuwangi',
  academicYear: '2026/2027',
  runningAnnouncement: 'Selamat Datang di Portal Jadwal Real-Time SMKN 1 Tegalsari • SEMAKASARI • Tetap Semangat, Disiplin, dan Berprestasi! • SMK BISA - SMK HEBAT • Sholat Dhuhur Berjamaah di Masjid Sekolah.',
  bellAudioEnabled: true,
  tvRefreshIntervalSeconds: 15,
  activeWeek: 'NORMADA_10_PRODUKTIF_11',
};

export const DEFAULT_CLASSES: SchoolClass[] = [
  { id: 'xk1', name: 'X KULINER 1', department: 'Kuliner', grade: 'X', roomDefault: 'R.J1' },
  { id: 'xk2', name: 'X KULINER 2', department: 'Kuliner', grade: 'X', roomDefault: 'R.J2' },
  { id: 'xik1', name: 'XI KULINER 1', department: 'Kuliner', grade: 'XI', roomDefault: 'R.J3' },
  { id: 'xik2', name: 'XI KULINER 2', department: 'Kuliner', grade: 'XI', roomDefault: 'R.J4' },
];

export const DEFAULT_TEACHERS: Teacher[] = [
  { id: 't1', code: 'BIG3', name: 'Bayu Wibisono, S.Pd.', subject: 'Bahasa Inggris', phone: '0812-3456-7890', color: '#0284c7' },
  { id: 't2', code: 'OR3', name: 'Wahyu Santoso, S.Pd.', subject: 'PJOK (Pendidikan Jasmani & Olahraga)', phone: '0813-9876-5432', color: '#16a34a' },
  { id: 't3', code: 'BIN7', name: 'Nurul Hidayati, S.Pd.', subject: 'Bahasa Indonesia', phone: '0821-4455-6677', color: '#d97706' },
  { id: 't4', code: 'KN3', name: 'Bambang Prasetyo, M.Pd.', subject: 'Pendidikan Pancasila', phone: '0852-1122-3344', color: '#dc2626' },
  { id: 't5', code: 'SJ1', name: 'Eko Sulistyo, S.Pd.', subject: 'Sejarah Indonesia', phone: '0857-9988-7766', color: '#9333ea' },
  { id: 't6', code: 'MT7', name: 'Dian Kusumawati, S.Pd.', subject: 'Matematika', phone: '0819-3322-1100', color: '#2563eb' },
  { id: 't7', code: 'PAI1', name: 'Ahmad Fauzi, S.Ag., M.Pd.I', subject: 'Pendidikan Agama & Budi Pekerti', phone: '0822-7788-9900', color: '#059669' },
  { id: 't8', code: 'SB2', name: 'Retno Wulandari, S.Sn.', subject: 'Seni Budaya', phone: '0815-6677-8899', color: '#db2777' },
  { id: 't9', code: 'BK6', name: 'Siti Rahmawati, S.Psi.', subject: 'Bimbingan Konseling', phone: '0878-1234-5678', color: '#4f46e5' },
  { id: 't10', code: 'BJ6', name: 'Slamet Widodo, S.Pd.', subject: 'Bahasa Jawa', phone: '0838-5544-3322', color: '#ca8a04' },
  { id: 't11', code: 'DIN', name: 'Ustadz M. Maksum, S.Pd.I', subject: 'Diniyah & Keagamaan', phone: '0823-8899-0011', color: '#e11d48' },
  { id: 't12', code: 'PROD1', name: 'Chef Siti Aminah, S.Pd.', subject: 'Pengolahan Pastry & Bakery (Produktif)', phone: '0812-7711-2233', color: '#0d9488' },
  { id: 't13', code: 'PROD2', name: 'Chef Didik Prasetyo, S.Pd.', subject: 'Tata Hidang & Makanan Kontinental (Produktif)', phone: '0813-8822-4455', color: '#e11d48' },
  { id: 't14', code: 'PROD3', name: 'Chef Rina Wati, S.Pd.', subject: 'Dasar-dasar Kuliner & Sanitasi (Produktif)', phone: '0821-9933-5566', color: '#b45309' },
];

const BASE_SCHEDULE_RAW: ScheduleSlot[] = [
  // ==================== SENIN ====================
  {
    id: 'senin-1',
    day: 'SENIN',
    periodNumber: 1,
    timeStart: '06:45',
    timeEnd: '07:20',
    type: 'UPACARA',
    title: 'UPACARA BENDERA',
    classes: {
      xk1: { subject: 'UPACARA', teacherCode: '-', room: 'LAPANGAN' },
      xk2: { subject: 'UPACARA', teacherCode: '-', room: 'LAPANGAN' },
    },
  },
  {
    id: 'senin-2',
    day: 'SENIN',
    periodNumber: 2,
    timeStart: '07:20',
    timeEnd: '07:55',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'R.J2' },
    },
  },
  {
    id: 'senin-3',
    day: 'SENIN',
    periodNumber: 3,
    timeStart: '07:55',
    timeEnd: '08:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'R.J2' },
    },
  },
  {
    id: 'senin-4',
    day: 'SENIN',
    periodNumber: 4,
    timeStart: '08:30',
    timeEnd: '09:05',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'senin-break1',
    day: 'SENIN',
    timeStart: '09:05',
    timeEnd: '09:40',
    type: 'BREAK',
    title: 'ISTIRAHAT 1',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'senin-5',
    day: 'SENIN',
    periodNumber: 5,
    timeStart: '09:40',
    timeEnd: '10:15',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'senin-6',
    day: 'SENIN',
    periodNumber: 6,
    timeStart: '10:15',
    timeEnd: '10:50',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'senin-7',
    day: 'SENIN',
    periodNumber: 7,
    timeStart: '10:50',
    timeEnd: '11:25',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J1' },
      xk2: { subject: 'SEJARAH INDONESIA', teacherCode: 'SJ1', room: 'R.J2' },
    },
  },
  {
    id: 'senin-break2',
    day: 'SENIN',
    timeStart: '11:25',
    timeEnd: '12:25',
    type: 'BREAK',
    title: 'ISTIRAHAT & SHOLAT DHUHUR',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'senin-8',
    day: 'SENIN',
    periodNumber: 8,
    timeStart: '12:25',
    timeEnd: '13:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J1' },
      xk2: { subject: 'SEJARAH INDONESIA', teacherCode: 'SJ1', room: 'R.J2' },
    },
  },
  {
    id: 'senin-9',
    day: 'SENIN',
    periodNumber: 9,
    timeStart: '13:00',
    timeEnd: '13:35',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },
  {
    id: 'senin-10',
    day: 'SENIN',
    periodNumber: 10,
    timeStart: '13:35',
    timeEnd: '14:10',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },
  {
    id: 'senin-11',
    day: 'SENIN',
    periodNumber: 11,
    timeStart: '14:10',
    timeEnd: '14:45',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },

  // ==================== SELASA ====================
  {
    id: 'selasa-1',
    day: 'SELASA',
    periodNumber: 1,
    timeStart: '06:45',
    timeEnd: '07:20',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
    },
  },
  {
    id: 'selasa-2',
    day: 'SELASA',
    periodNumber: 2,
    timeStart: '07:20',
    timeEnd: '07:55',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
    },
  },
  {
    id: 'selasa-3',
    day: 'SELASA',
    periodNumber: 3,
    timeStart: '07:55',
    timeEnd: '08:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
    },
  },
  {
    id: 'selasa-4',
    day: 'SELASA',
    periodNumber: 4,
    timeStart: '08:30',
    timeEnd: '09:05',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
    },
  },
  {
    id: 'selasa-break1',
    day: 'SELASA',
    timeStart: '09:05',
    timeEnd: '09:40',
    type: 'BREAK',
    title: 'ISTIRAHAT 1',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'selasa-5',
    day: 'SELASA',
    periodNumber: 5,
    timeStart: '09:40',
    timeEnd: '10:15',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-6',
    day: 'SELASA',
    periodNumber: 6,
    timeStart: '10:15',
    timeEnd: '10:50',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-7',
    day: 'SELASA',
    periodNumber: 7,
    timeStart: '10:50',
    timeEnd: '11:25',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SEJARAH INDONESIA', teacherCode: 'SJ1', room: 'R.J1' },
      xk2: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-break2',
    day: 'SELASA',
    timeStart: '11:25',
    timeEnd: '12:25',
    type: 'BREAK',
    title: 'ISTIRAHAT & SHOLAT DHUHUR',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'selasa-8',
    day: 'SELASA',
    periodNumber: 8,
    timeStart: '12:25',
    timeEnd: '13:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SEJARAH INDONESIA', teacherCode: 'SJ1', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-9',
    day: 'SELASA',
    periodNumber: 9,
    timeStart: '13:00',
    timeEnd: '13:35',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-10',
    day: 'SELASA',
    periodNumber: 10,
    timeStart: '13:35',
    timeEnd: '14:10',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BIMBINGAN KONSELING', teacherCode: 'BK6', room: 'R.J2' },
    },
  },
  {
    id: 'selasa-11',
    day: 'SELASA',
    periodNumber: 11,
    timeStart: '14:10',
    timeEnd: '14:45',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J1' },
      xk2: { subject: 'BIMBINGAN KONSELING', teacherCode: 'BK6', room: 'R.J2' },
    },
  },

  // ==================== RABU ====================
  {
    id: 'rabu-1',
    day: 'RABU',
    periodNumber: 1,
    timeStart: '06:45',
    timeEnd: '07:20',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J1' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-2',
    day: 'RABU',
    periodNumber: 2,
    timeStart: '07:20',
    timeEnd: '07:55',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J1' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-3',
    day: 'RABU',
    periodNumber: 3,
    timeStart: '07:55',
    timeEnd: '08:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J1' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-4',
    day: 'RABU',
    periodNumber: 4,
    timeStart: '08:30',
    timeEnd: '09:05',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J1' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-break1',
    day: 'RABU',
    timeStart: '09:05',
    timeEnd: '09:40',
    type: 'BREAK',
    title: 'ISTIRAHAT 1',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'rabu-5',
    day: 'RABU',
    periodNumber: 5,
    timeStart: '09:40',
    timeEnd: '10:15',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-6',
    day: 'RABU',
    periodNumber: 6,
    timeStart: '10:15',
    timeEnd: '10:50',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-7',
    day: 'RABU',
    periodNumber: 7,
    timeStart: '10:50',
    timeEnd: '11:25',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-break2',
    day: 'RABU',
    timeStart: '11:25',
    timeEnd: '12:25',
    type: 'BREAK',
    title: 'ISTIRAHAT & SHOLAT DHUHUR',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'rabu-8',
    day: 'RABU',
    periodNumber: 8,
    timeStart: '12:25',
    timeEnd: '13:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J1' },
      xk2: { subject: 'PENDIDIKAN PANCASILA', teacherCode: 'KN3', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-9',
    day: 'RABU',
    periodNumber: 9,
    timeStart: '13:00',
    timeEnd: '13:35',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-10',
    day: 'RABU',
    periodNumber: 10,
    timeStart: '13:35',
    timeEnd: '14:10',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },
  {
    id: 'rabu-11',
    day: 'RABU',
    periodNumber: 11,
    timeStart: '14:10',
    timeEnd: '14:45',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA INGGRIS', teacherCode: 'BIG3', room: 'R.J1' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },

  // ==================== KAMIS ====================
  {
    id: 'kamis-1',
    day: 'KAMIS',
    periodNumber: 1,
    timeStart: '06:45',
    timeEnd: '07:20',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-2',
    day: 'KAMIS',
    periodNumber: 2,
    timeStart: '07:20',
    timeEnd: '07:55',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-3',
    day: 'KAMIS',
    periodNumber: 3,
    timeStart: '07:55',
    timeEnd: '08:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'BAHASA INDONESIA', teacherCode: 'BIN7', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-4',
    day: 'KAMIS',
    periodNumber: 4,
    timeStart: '08:30',
    timeEnd: '09:05',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J1' },
      xk2: { subject: 'BAHASA JAWA', teacherCode: 'BJ6', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-break1',
    day: 'KAMIS',
    timeStart: '09:05',
    timeEnd: '09:40',
    type: 'BREAK',
    title: 'ISTIRAHAT 1',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'kamis-5',
    day: 'KAMIS',
    periodNumber: 5,
    timeStart: '09:40',
    timeEnd: '10:15',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BIMBINGAN KONSELING', teacherCode: 'BK6', room: 'R.J1' },
      xk2: { subject: 'BAHASA JAWA', teacherCode: 'BJ6', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-6',
    day: 'KAMIS',
    periodNumber: 6,
    timeStart: '10:15',
    timeEnd: '10:50',
    type: 'DINIYAH',
    title: 'DINIYAH',
    classes: {
      xk1: { subject: 'DINIYAH', teacherCode: 'DIN', room: 'R.J1' },
      xk2: { subject: 'DINIYAH', teacherCode: 'DIN', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-7',
    day: 'KAMIS',
    periodNumber: 7,
    timeStart: '10:50',
    timeEnd: '11:25',
    type: 'DINIYAH',
    title: 'DINIYAH',
    classes: {
      xk1: { subject: 'DINIYAH', teacherCode: 'DIN', room: 'R.J1' },
      xk2: { subject: 'DINIYAH', teacherCode: 'DIN', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-break2',
    day: 'KAMIS',
    timeStart: '11:25',
    timeEnd: '12:25',
    type: 'BREAK',
    title: 'ISTIRAHAT & SHOLAT DHUHUR',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'kamis-8',
    day: 'KAMIS',
    periodNumber: 8,
    timeStart: '12:25',
    timeEnd: '13:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA JAWA', teacherCode: 'BJ6', room: 'R.J1' },
      xk2: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-9',
    day: 'KAMIS',
    periodNumber: 9,
    timeStart: '13:00',
    timeEnd: '13:35',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BAHASA JAWA', teacherCode: 'BJ6', room: 'R.J1' },
      xk2: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-10',
    day: 'KAMIS',
    periodNumber: 10,
    timeStart: '13:35',
    timeEnd: '14:10',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'R.J1' },
      xk2: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J2' },
    },
  },
  {
    id: 'kamis-11',
    day: 'KAMIS',
    periodNumber: 11,
    timeStart: '14:10',
    timeEnd: '14:45',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'R.J1' },
      xk2: { subject: 'SENI BUDAYA', teacherCode: 'SB2', room: 'R.J2' },
    },
  },

  // ==================== JUMAT ====================
  {
    id: 'jumat-istigosah',
    day: 'JUMAT',
    timeStart: '06:45',
    timeEnd: '07:30',
    type: 'ISTIGOSAH',
    title: 'ISTIGOSAH BERSAMA',
    classes: {
      xk1: { subject: 'ISTIGOSAH', teacherCode: '-', room: 'MASJID / LAPANGAN' },
      xk2: { subject: 'ISTIGOSAH', teacherCode: '-', room: 'MASJID / LAPANGAN' },
    },
  },
  {
    id: 'jumat-1',
    day: 'JUMAT',
    periodNumber: 1,
    timeStart: '07:30',
    timeEnd: '08:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'jumat-2',
    day: 'JUMAT',
    periodNumber: 2,
    timeStart: '08:00',
    timeEnd: '08:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
      xk2: { subject: 'PEND. AGAMA & BUDI PEKERTI', teacherCode: 'PAI1', room: 'R.J2' },
    },
  },
  {
    id: 'jumat-3',
    day: 'JUMAT',
    periodNumber: 3,
    timeStart: '08:30',
    timeEnd: '09:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },
  {
    id: 'jumat-break',
    day: 'JUMAT',
    timeStart: '09:00',
    timeEnd: '09:30',
    type: 'BREAK',
    title: 'ISTIRAHAT',
    classes: {
      xk1: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
      xk2: { subject: 'ISTIRAHAT', teacherCode: '-', room: '-' },
    },
  },
  {
    id: 'jumat-4',
    day: 'JUMAT',
    periodNumber: 4,
    timeStart: '09:30',
    timeEnd: '10:00',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'PJOK', teacherCode: 'OR3', room: 'LAPANGAN' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },
  {
    id: 'jumat-5',
    day: 'JUMAT',
    periodNumber: 5,
    timeStart: '10:00',
    timeEnd: '10:30',
    type: 'REGULAR',
    classes: {
      xk1: { subject: 'BIMBINGAN KONSELING', teacherCode: 'BK6', room: 'R.J1' },
      xk2: { subject: 'MATEMATIKA', teacherCode: 'MT7', room: 'R.J2' },
    },
  },
  {
    id: 'jumat-sholat',
    day: 'JUMAT',
    timeStart: '10:30',
    timeEnd: '12:30',
    type: 'BREAK',
    title: 'PERSIAPAN & SHOLAT JUMAT',
    classes: {
      xk1: { subject: 'SHOLAT JUMAT', teacherCode: '-', room: 'MASJID' },
      xk2: { subject: 'SHOLAT JUMAT', teacherCode: '-', room: 'MASJID' },
    },
  },
  {
    id: 'jumat-eks',
    day: 'JUMAT',
    periodNumber: 'EKS',
    timeStart: '12:30',
    timeEnd: '14:45',
    type: 'EKSTRAKURIKULER',
    title: 'EKSTRAKURIKULER',
    classes: {
      xk1: { subject: 'EKSTRAKURIKULER', teacherCode: '-', room: 'AREA SMKN 1 TEGALSARI' },
      xk2: { subject: 'EKSTRAKURIKULER', teacherCode: '-', room: 'AREA SMKN 1 TEGALSARI' },
    },
  },
];

// Enrich slots for Pekan Normada 10 & Produktif 11
const NORMADA_WEEK_SLOTS: ScheduleSlot[] = BASE_SCHEDULE_RAW.map((slot) => {
  const isCommon = slot.type === 'BREAK' || slot.type === 'UPACARA' || slot.type === 'ISTIGOSAH' || slot.type === 'EKSTRAKURIKULER';
  
  if (isCommon) {
    return {
      ...slot,
      weekType: 'ALL' as const,
      classes: {
        ...slot.classes,
        xik1: slot.classes.xik1 || { subject: slot.title || slot.type, teacherCode: '-', room: slot.type === 'UPACARA' ? 'LAPANGAN' : slot.type === 'ISTIGOSAH' ? 'MASJID' : '-' },
        xik2: slot.classes.xik2 || { subject: slot.title || slot.type, teacherCode: '-', room: slot.type === 'UPACARA' ? 'LAPANGAN' : slot.type === 'ISTIGOSAH' ? 'MASJID' : '-' },
      },
    };
  }

  // Regular slots in Pekan Normada 10 & Produktif 11:
  // Grade 10: Teori Normada (dari foto)
  // Grade 11: Praktik Kejuruan Produktif
  let xi1Subject = 'PENGOLAHAN PASTRY & BAKERY (PRODUKTIF)';
  let xi1Teacher = 'PROD1';
  let xi1Room = 'LAB PASTRY';

  let xi2Subject = 'TATA HIDANG & MAKANAN KONTINENTAL (PRODUKTIF)';
  let xi2Teacher = 'PROD2';
  let xi2Room = 'LAB KULINER';

  if (slot.day === 'RABU' || slot.day === 'KAMIS') {
    xi1Subject = 'TATA HIDANG & MAKANAN KONTINENTAL (PRODUKTIF)';
    xi1Teacher = 'PROD2';
    xi1Room = 'LAB KULINER';

    xi2Subject = 'PENGOLAHAN PASTRY & BAKERY (PRODUKTIF)';
    xi2Teacher = 'PROD1';
    xi2Room = 'LAB PASTRY';
  } else if (slot.day === 'JUMAT') {
    xi1Subject = 'KEWIRAUSAHAAN PRODUKTIF KULINER';
    xi1Teacher = 'PROD1';
    xi1Room = 'LAB PASTRY';

    xi2Subject = 'KEWIRAUSAHAAN PRODUKTIF KULINER';
    xi2Teacher = 'PROD2';
    xi2Room = 'LAB KULINER';
  }

  if (slot.type === 'DINIYAH' || slot.classes.xk1?.subject === 'DINIYAH') {
    xi1Subject = 'DINIYAH';
    xi1Teacher = 'DIN';
    xi1Room = 'R.J3';

    xi2Subject = 'DINIYAH';
    xi2Teacher = 'DIN';
    xi2Room = 'R.J4';
  }

  return {
    ...slot,
    weekType: 'NORMADA_10_PRODUKTIF_11' as const,
    classes: {
      ...slot.classes,
      xik1: slot.classes.xik1 || { subject: xi1Subject, teacherCode: xi1Teacher, room: xi1Room },
      xik2: slot.classes.xik2 || { subject: xi2Subject, teacherCode: xi2Teacher, room: xi2Room },
    },
  };
});

// Generate complementary slots for Pekan Produktif 10 & Normada 11:
// Grade 10: Praktik Kejuruan Produktif di Lab Bengkel/Kitchen
// Grade 11: Teori Normada (Umum) di kelas R.J3 dan R.J4
const PRODUKTIF_WEEK_SLOTS: ScheduleSlot[] = BASE_SCHEDULE_RAW
  .filter((slot) => slot.type === 'REGULAR' || slot.type === 'DINIYAH')
  .map((slot) => {
    let x1Subject = 'DASAR-DASAR KULINER & SANITASI (PRODUKTIF)';
    let x1Teacher = 'PROD3';
    let x1Room = 'LAB KULINER';

    let x2Subject = 'PENGOLAHAN PASTRY & BAKERY DASAR (PRODUKTIF)';
    let x2Teacher = 'PROD1';
    let x2Room = 'LAB PASTRY';

    if (slot.day === 'RABU' || slot.day === 'KAMIS') {
      x1Subject = 'PENGOLAHAN PASTRY & BAKERY DASAR (PRODUKTIF)';
      x1Teacher = 'PROD1';
      x1Room = 'LAB PASTRY';

      x2Subject = 'DASAR-DASAR KULINER & SANITASI (PRODUKTIF)';
      x2Teacher = 'PROD3';
      x2Room = 'LAB KULINER';
    } else if (slot.day === 'JUMAT') {
      x1Subject = 'PRAKTIK KEJURUAN KULINER DASAR';
      x1Teacher = 'PROD3';
      x1Room = 'LAB KULINER';

      x2Subject = 'PRAKTIK KEJURUAN KULINER DASAR';
      x2Teacher = 'PROD1';
      x2Room = 'LAB PASTRY';
    }

    let xi1Subject = 'MATEMATIKA';
    let xi1Teacher = 'MT7';
    let xi1Room = 'R.J3';

    let xi2Subject = 'BAHASA INDONESIA';
    let xi2Teacher = 'BIN7';
    let xi2Room = 'R.J4';

    if (slot.periodNumber && Number(slot.periodNumber) <= 4) {
      xi1Subject = 'BAHASA INGGRIS';
      xi1Teacher = 'BIG3';
      xi2Subject = 'PENDIDIKAN PANCASILA';
      xi2Teacher = 'KN3';
    } else if (slot.periodNumber && Number(slot.periodNumber) <= 7) {
      xi1Subject = 'MATEMATIKA';
      xi1Teacher = 'MT7';
      xi2Subject = 'BAHASA INDONESIA';
      xi2Teacher = 'BIN7';
    } else {
      xi1Subject = 'PENDIDIKAN PANCASILA';
      xi1Teacher = 'KN3';
      xi2Subject = 'MATEMATIKA';
      xi2Teacher = 'MT7';
    }

    if (slot.type === 'DINIYAH' || slot.classes.xk1?.subject === 'DINIYAH') {
      x1Subject = 'DINIYAH';
      x1Teacher = 'DIN';
      x1Room = 'R.J1';

      x2Subject = 'DINIYAH';
      x2Teacher = 'DIN';
      x2Room = 'R.J2';

      xi1Subject = 'DINIYAH';
      xi1Teacher = 'DIN';
      xi1Room = 'R.J3';

      xi2Subject = 'DINIYAH';
      xi2Teacher = 'DIN';
      xi2Room = 'R.J4';
    }

    return {
      id: `prod10-${slot.id}`,
      day: slot.day,
      periodNumber: slot.periodNumber,
      timeStart: slot.timeStart,
      timeEnd: slot.timeEnd,
      type: slot.type,
      title: slot.title,
      weekType: 'PRODUKTIF_10_NORMADA_11' as const,
      classes: {
        xk1: { subject: x1Subject, teacherCode: x1Teacher, room: x1Room },
        xk2: { subject: x2Subject, teacherCode: x2Teacher, room: x2Room },
        xik1: { subject: xi1Subject, teacherCode: xi1Teacher, room: xi1Room },
        xik2: { subject: xi2Subject, teacherCode: xi2Teacher, room: xi2Room },
      },
    };
  });

export const DEFAULT_SCHEDULE: ScheduleSlot[] = [
  ...NORMADA_WEEK_SLOTS,
  ...PRODUKTIF_WEEK_SLOTS,
];

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'Bayu Wibisono, S.Pd.',
    username: 'admin',
    password: 'admin123',
    role: 'kurikulum',
    isActive: true,
    notes: 'Penanggung Jawab Kurikulum & Jadwal Pelajaran Utama SMKN 1 Tegalsari',
    createdAt: '2026-07-01',
  },
  {
    id: 'staff-2',
    name: 'Tim Guru Piket Harian',
    username: 'piket',
    password: 'piket123',
    role: 'piket',
    isActive: true,
    notes: 'Pemantauan kehadiran guru, izin siswa, dan monitoring KBM kelas',
    createdAt: '2026-07-01',
  },
  {
    id: 'staff-3',
    name: 'Operator KBM & Tata Usaha',
    username: 'operator',
    password: 'operator123',
    role: 'operator',
    isActive: true,
    notes: 'Entri data master kelas 7 jurusan, cetak jadwal, dan arsip',
    createdAt: '2026-07-01',
  },
];

