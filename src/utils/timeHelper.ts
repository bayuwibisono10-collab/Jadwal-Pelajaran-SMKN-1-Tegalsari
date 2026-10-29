import { DayType, ScheduleSlot, WeekRotationType } from '../types/schedule';

export const DAYS_LIST: DayType[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

export function getDayNameIndonesian(date: Date): DayType | 'MINGGU' | 'SABTU' {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  switch (dayIndex) {
    case 1: return 'SENIN';
    case 2: return 'SELASA';
    case 3: return 'RABU';
    case 4: return 'KAMIS';
    case 5: return 'JUMAT';
    case 6: return 'SABTU';
    default: return 'MINGGU';
  }
}

export function formatDateIndonesian(date: Date): string {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatTimeWithSeconds(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
}

export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export interface SlotStatusResult {
  currentSlot: ScheduleSlot | null;
  nextSlot: ScheduleSlot | null;
  status: 'WEEKEND' | 'BEFORE_SCHOOL' | 'IN_SESSION' | 'BREAK' | 'AFTER_SCHOOL';
  statusText: string;
  progressPercentage: number;
  timeRemainingFormatted: string;
  minutesRemaining: number;
}

export function calculateSlotStatus(
  schedule: ScheduleSlot[],
  currentDay: DayType | 'MINGGU' | 'SABTU',
  currentTime: Date,
  activeWeek?: WeekRotationType
): SlotStatusResult {
  if (currentDay === 'MINGGU' || currentDay === 'SABTU') {
    return {
      currentSlot: null,
      nextSlot: null,
      status: 'WEEKEND',
      statusText: 'Hari Libur Akhir Pekan',
      progressPercentage: 0,
      timeRemainingFormatted: '-',
      minutesRemaining: 0,
    };
  }

  const daySlots = schedule
    .filter((s) => s.day === currentDay && (!activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek))
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  if (daySlots.length === 0) {
    return {
      currentSlot: null,
      nextSlot: null,
      status: 'AFTER_SCHOOL',
      statusText: 'Tidak ada jadwal terdaftar untuk hari ini',
      progressPercentage: 0,
      timeRemainingFormatted: '-',
      minutesRemaining: 0,
    };
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSecondsInMinute = currentTime.getSeconds();
  const currentTotalSeconds = currentMinutes * 60 + currentSecondsInMinute;

  const firstSlot = daySlots[0];
  const lastSlot = daySlots[daySlots.length - 1];

  const firstSlotStartMinutes = timeStringToMinutes(firstSlot.timeStart);
  const lastSlotEndMinutes = timeStringToMinutes(lastSlot.timeEnd);

  // Before school starts
  if (currentMinutes < firstSlotStartMinutes) {
    const diffMins = firstSlotStartMinutes - currentMinutes;
    return {
      currentSlot: null,
      nextSlot: firstSlot,
      status: 'BEFORE_SCHOOL',
      statusText: `KBM Belum Dimulai (Mulai Pukul ${firstSlot.timeStart})`,
      progressPercentage: 0,
      timeRemainingFormatted: `${diffMins} menit menuju jam pertama`,
      minutesRemaining: diffMins,
    };
  }

  // After school ends
  if (currentMinutes >= lastSlotEndMinutes) {
    return {
      currentSlot: null,
      nextSlot: null,
      status: 'AFTER_SCHOOL',
      statusText: 'Kegiatan Belajar Mengajar (KBM) Hari Ini Telah Selesai',
      progressPercentage: 100,
      timeRemainingFormatted: 'Selesai',
      minutesRemaining: 0,
    };
  }

  // Check if inside one of the slots
  for (let i = 0; i < daySlots.length; i++) {
    const slot = daySlots[i];
    const slotStartMin = timeStringToMinutes(slot.timeStart);
    const slotEndMin = timeStringToMinutes(slot.timeEnd);

    if (currentMinutes >= slotStartMin && currentMinutes < slotEndMin) {
      const slotStartSec = slotStartMin * 60;
      const slotEndSec = slotEndMin * 60;
      const elapsedSec = currentTotalSeconds - slotStartSec;
      const durationSec = slotEndSec - slotStartSec;

      const progress = Math.min(100, Math.max(0, Math.round((elapsedSec / durationSec) * 100)));
      const secRemaining = Math.max(0, slotEndSec - currentTotalSeconds);
      const minsRem = Math.floor(secRemaining / 60);
      const secsRem = secRemaining % 60;

      const nextSlot = i + 1 < daySlots.length ? daySlots[i + 1] : null;

      let statusType: SlotStatusResult['status'] = 'IN_SESSION';
      let titlePrefix = 'Sedang Berlangsung';

      if (slot.type === 'BREAK') {
        statusType = 'BREAK';
        titlePrefix = 'Waktu Istirahat';
      } else if (slot.type === 'UPACARA') {
        titlePrefix = 'Sedang Berlangsung: UPACARA BENDERA';
      } else if (slot.type === 'ISTIGOSAH') {
        titlePrefix = 'Sedang Berlangsung: ISTIGOSAH BERSAMA';
      } else if (slot.type === 'DINIYAH') {
        titlePrefix = 'Sedang Berlangsung: PEMBELAJARAN DINIYAH';
      } else if (slot.type === 'EKSTRAKURIKULER') {
        titlePrefix = 'Sedang Berlangsung: KEGIATAN EKSTRAKURIKULER';
      } else if (slot.periodNumber) {
        titlePrefix = `Sedang Berlangsung: Jam Pelajaran ke-${slot.periodNumber}`;
      }

      return {
        currentSlot: slot,
        nextSlot,
        status: statusType,
        statusText: titlePrefix,
        progressPercentage: progress,
        timeRemainingFormatted: `${minsRem}m ${secsRem}d tersisa`,
        minutesRemaining: minsRem,
      };
    }
  }

  // If in a gap between slots (e.g. 5 min transition)
  const nextSlot = daySlots.find((s) => timeStringToMinutes(s.timeStart) > currentMinutes) || null;
  const diffMins = nextSlot ? timeStringToMinutes(nextSlot.timeStart) - currentMinutes : 0;

  return {
    currentSlot: null,
    nextSlot,
    status: 'BREAK',
    statusText: 'Waktu Pergantian Jam / Transisi',
    progressPercentage: 100,
    timeRemainingFormatted: `${diffMins} menit menuju sesi berikutnya`,
    minutesRemaining: diffMins,
  };
}
