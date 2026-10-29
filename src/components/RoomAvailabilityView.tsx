import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { ScheduleSlot, SchoolClass, Teacher, DayType, WeekRotationType } from '../types/schedule';
import { timeStringToMinutes } from '../utils/timeHelper';

interface RoomAvailabilityViewProps {
  schedule: ScheduleSlot[];
  classes: SchoolClass[];
  teachers: Teacher[];
  selectedDay: DayType;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  currentTime: Date;
  activeWeek?: WeekRotationType;
}

export const RoomAvailabilityView: React.FC<RoomAvailabilityViewProps> = ({
  schedule,
  classes,
  teachers,
  selectedDay,
  currentDay,
  currentTime,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('R.J1');

  const knownRooms = ['R.J1', 'R.J2', 'R.J3', 'R.J4', 'LAB KULINER', 'LAB PASTRY', 'LAPANGAN', 'MASJID'];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = currentDay === selectedDay;

  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => !activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek)
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  // Determine room current usage
  const getRoomCurrentStatus = (roomName: string) => {
    if (!isToday) {
      return { isUsed: false, details: 'Tidak ada KBM aktif saat ini' };
    }

    const currentSlot = daySlots.find((slot) => {
      const start = timeStringToMinutes(slot.timeStart);
      const end = timeStringToMinutes(slot.timeEnd);
      return currentMinutes >= start && currentMinutes < end;
    });

    if (!currentSlot) {
      return { isUsed: false, details: 'Ruangan kosong / Tidak ada sesi' };
    }

    if (currentSlot.type === 'BREAK') {
      return { isUsed: false, details: 'Waktu Istirahat' };
    }

    if (currentSlot.type === 'UPACARA' && roomName === 'LAPANGAN') {
      return { isUsed: true, details: 'Digunakan: Seluruh Siswa (UPACARA BENDERA)' };
    }

    if (currentSlot.type === 'ISTIGOSAH' && (roomName === 'MASJID' || roomName === 'LAPANGAN')) {
      return { isUsed: true, details: 'Digunakan: Seluruh Siswa (ISTIGOSAH BERSAMA)' };
    }

    for (const [classId, assignment] of Object.entries(currentSlot.classes)) {
      if (assignment.room.toUpperCase() === roomName.toUpperCase()) {
        const cls = classes.find((c) => c.id === classId);
        return {
          isUsed: true,
          details: `Sedang Digunakan: ${cls?.name || classId} • ${assignment.subject} (${assignment.teacherCode})`,
        };
      }
    }

    return { isUsed: false, details: 'Ruangan Sedang Kosong' };
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Status Penggunaan Ruangan & Lapangan
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitoring okupansi ruang teori, bengkel/lab, dan lapangan secara real-time pada hari <strong className="text-emerald-800">{selectedDay}</strong>.
          </p>
        </div>

        {/* Room Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {knownRooms.map((room) => {
            const status = getRoomCurrentStatus(room);
            const isSelected = selectedRoom === room;

            return (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${status.isUsed ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}></span>
                <span>{room}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Room Details Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              <MapPin className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                Ruangan: {selectedRoom}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedRoom === 'R.J1' && 'Ruang Teori Jurusan Kuliner 1'}
                {selectedRoom === 'R.J2' && 'Ruang Teori Jurusan Kuliner 2'}
                {selectedRoom === 'LAPANGAN' && 'Lapangan Utama Upacara & PJOK SMKN 1 Tegalsari'}
                {selectedRoom === 'MASJID' && 'Masjid Sekolah SMKN 1 Tegalsari'}
              </p>
            </div>
          </div>

          <div>
            {(() => {
              const status = getRoomCurrentStatus(selectedRoom);
              return (
                <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  status.isUsed
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {status.isUsed ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{status.details}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Schedule Grid for Selected Room on this Day */}
        <div className="mt-5">
          <h5 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-3">
            Jadwal Penggunaan {selectedRoom} ({selectedDay}):
          </h5>

          <div className="space-y-2">
            {daySlots.map((slot) => {
              // Find if this room is used in this slot
              let usedByClass = '';
              let subject = '';
              let teacherCode = '';

              if (slot.type === 'UPACARA' && selectedRoom === 'LAPANGAN') {
                usedByClass = 'Seluruh Siswa SMKN 1 Tegalsari';
                subject = 'UPACARA BENDERA';
              } else if (slot.type === 'ISTIGOSAH' && (selectedRoom === 'MASJID' || selectedRoom === 'LAPANGAN')) {
                usedByClass = 'Seluruh Siswa';
                subject = 'ISTIGOSAH BERSAMA';
              } else {
                for (const [classId, assignment] of Object.entries(slot.classes)) {
                  if (assignment.room.toUpperCase() === selectedRoom.toUpperCase()) {
                    const cls = classes.find((c) => c.id === classId);
                    usedByClass = cls?.name || classId;
                    subject = assignment.subject;
                    teacherCode = assignment.teacherCode;
                    break;
                  }
                }
              }

              const isSlotUsed = !!usedByClass && slot.type !== 'BREAK';

              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isSlotUsed
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : slot.type === 'BREAK'
                      ? 'bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-[11px] w-24">
                      {slot.timeStart} - {slot.timeEnd}
                    </span>
                    <span className="font-bold text-slate-700">
                      {slot.periodNumber ? `Jam ke-${slot.periodNumber}` : slot.title || '-'}
                    </span>
                  </div>

                  <div>
                    {isSlotUsed ? (
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-950">
                          {usedByClass}: {subject}
                        </span>
                        {teacherCode && (
                          <span className="ml-2 font-mono text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                            {teacherCode}
                          </span>
                        )}
                      </div>
                    ) : slot.type === 'BREAK' ? (
                      <span className="font-medium text-slate-500 italic">Istirahat</span>
                    ) : (
                      <span className="font-medium text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">
                        ✓ Kosong / Tersedia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
