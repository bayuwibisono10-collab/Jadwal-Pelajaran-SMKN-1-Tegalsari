export type DayType = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU';

export type SlotType = 'REGULAR' | 'BREAK' | 'UPACARA' | 'ISTIGOSAH' | 'EKSTRAKURIKULER' | 'DINIYAH';

export type WeekRotationType = 'NORMADA_10_PRODUKTIF_11' | 'PRODUKTIF_10_NORMADA_11';

export interface WeekRotationInfo {
  type: WeekRotationType;
  title: string;
  shortTitle: string;
  grade10Status: string;
  grade11Status: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export const WEEK_ROTATION_CONFIG: Record<WeekRotationType, WeekRotationInfo> = {
  NORMADA_10_PRODUKTIF_11: {
    type: 'NORMADA_10_PRODUKTIF_11',
    title: 'Pekan Normada 10 & Pekan Produktif 11',
    shortTitle: 'Normada 10 / Produktif 11',
    grade10Status: 'Kelas 10: Mapel Normada (Teori/Umum)',
    grade11Status: 'Kelas 11: Mapel Produktif (Praktik Kejuruan)',
    badgeColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100',
    badgeBorder: 'border-emerald-300',
  },
  PRODUKTIF_10_NORMADA_11: {
    type: 'PRODUKTIF_10_NORMADA_11',
    title: 'Pekan Produktif 10 & Pekan Normada 11',
    shortTitle: 'Produktif 10 / Normada 11',
    grade10Status: 'Kelas 10: Mapel Produktif (Praktik Kejuruan)',
    grade11Status: 'Kelas 11: Mapel Normada (Teori/Umum)',
    badgeColor: 'text-amber-900',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-300',
  },
};

export interface ClassAssignment {
  subject: string;
  teacherCode: string;
  room: string;
  notes?: string;
  customColor?: string;
}

export interface ScheduleSlot {
  id: string;
  day: DayType;
  periodNumber?: number | string; // e.g. 1..11, or 'EKS'
  timeStart: string; // 'HH:mm' e.g. "06:45"
  timeEnd: string;   // 'HH:mm' e.g. "07:20"
  type: SlotType;
  title?: string; // used when it applies across classes, e.g. "UPACARA", "ISTIRAHAT", "ISTIGOSAH", "EKSTRAKURIKULER"
  weekType?: WeekRotationType | 'ALL'; // Which rotating week cycle this slot belongs to ('ALL' = both weeks)
  classes: Record<string, ClassAssignment>; // classId -> ClassAssignment
}

export interface SchoolClass {
  id: string;
  name: string;
  department: string; // e.g. "Kuliner", "Teknik Komputer & Jaringan"
  grade: 'X' | 'XI' | 'XII';
  roomDefault?: string;
}

export interface Teacher {
  id: string;
  code: string; // e.g. "BIG3", "MT7", "OR3"
  name: string; // e.g. "Bayu Wibisono, S.Pd."
  subject: string; // e.g. "Bahasa Inggris"
  phone?: string;
  email?: string;
  color?: string;
}

export interface SchoolConfig {
  schoolName: string;
  schoolSubtitle: string;
  academicYear: string;
  runningAnnouncement: string;
  bellAudioEnabled: boolean;
  tvRefreshIntervalSeconds: number;
  activeWeek: WeekRotationType; // Current active rotating week cycle
}

export type StaffRole = 'kurikulum' | 'piket' | 'operator';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: StaffRole;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}
