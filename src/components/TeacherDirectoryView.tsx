import React, { useState } from 'react';
import { 
  Search, 
  User, 
  BookOpen, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle, 
  Activity,
  Layers
} from 'lucide-react';
import { Teacher, ScheduleSlot, SchoolClass, DayType, WeekRotationType } from '../types/schedule';
import { DAYS_LIST, timeStringToMinutes } from '../utils/timeHelper';

interface TeacherDirectoryViewProps {
  teachers: Teacher[];
  schedule: ScheduleSlot[];
  classes: SchoolClass[];
  currentDay: DayType | 'MINGGU' | 'SABTU';
  currentTime: Date;
  activeWeek?: WeekRotationType;
}

export const TeacherDirectoryView: React.FC<TeacherDirectoryViewProps> = ({
  teachers,
  schedule,
  classes,
  currentDay,
  currentTime,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Find where this teacher is currently teaching right now
  const getCurrentTeachingStatus = (code: string) => {
    if (currentDay === 'MINGGU' || currentDay === 'SABTU') {
      return { isTeaching: false, label: 'Libur Akhir Pekan' };
    }

    const currentSlot = schedule.find((slot) => {
      if (slot.day !== currentDay) return false;
      if (activeWeek && slot.weekType && slot.weekType !== 'ALL' && slot.weekType !== activeWeek) return false;
      const start = timeStringToMinutes(slot.timeStart);
      const end = timeStringToMinutes(slot.timeEnd);
      return currentMinutes >= start && currentMinutes < end;
    });

    if (!currentSlot) {
      return { isTeaching: false, label: 'Tidak ada jam KBM saat ini' };
    }

    for (const [classId, assignment] of Object.entries(currentSlot.classes)) {
      if (assignment.teacherCode.toUpperCase() === code.toUpperCase()) {
        const cls = classes.find((c) => c.id === classId);
        return {
          isTeaching: true,
          label: `Sedang Mengajar: ${cls?.name || classId} di ${assignment.room} (${assignment.subject})`,
          slot: currentSlot,
          room: assignment.room,
          classTitle: cls?.name,
        };
      }
    }

    return { isTeaching: false, label: 'Sedang tidak ada jam mengajar (Waktu Kosong)' };
  };

  // Get total periods taught across the week
  const getTeacherStats = (code: string) => {
    let totalPeriods = 0;
    const scheduleByDay: Record<DayType, Array<{ slot: ScheduleSlot; classTitle: string; room: string; subject: string }>> = {
      SENIN: [],
      SELASA: [],
      RABU: [],
      KAMIS: [],
      JUMAT: [],
      SABTU: [],
    };

    schedule
      .filter((s) => !activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek)
      .forEach((slot) => {
        Object.entries(slot.classes).forEach(([classId, assignment]) => {
        if (assignment.teacherCode.toUpperCase() === code.toUpperCase()) {
          totalPeriods++;
          const cls = classes.find((c) => c.id === classId);
          if (scheduleByDay[slot.day]) {
            scheduleByDay[slot.day].push({
              slot,
              classTitle: cls?.name || classId,
              room: assignment.room,
              subject: assignment.subject,
            });
          }
        }
      });
    });

    return { totalPeriods, scheduleByDay };
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.code.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 mb-8">
      
      {/* Search & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Direktori Guru & Kode Pengajar
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Daftar lengkap kode guru (BIG3, MT7, dsb.), nama pengajar, mata pelajaran, dan jadwal mengajar mingguan.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode (misal BIG3), nama guru..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => {
          const status = getCurrentTeachingStatus(teacher.code);
          const { totalPeriods } = getTeacherStats(teacher.code);

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header with Code Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
                      {teacher.code}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {teacher.name}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-700">
                        {teacher.subject}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time Status */}
                <div className="my-3 p-2.5 rounded-xl text-xs font-medium border bg-slate-50">
                  <div className="flex items-center gap-1.5 mb-1 font-bold">
                    <span className={`w-2 h-2 rounded-full ${status.isTeaching ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                    <span className={status.isTeaching ? 'text-emerald-700' : 'text-slate-600'}>
                      {status.isTeaching ? 'SEDANG MENGAJAR' : 'STATUS SEKARANG'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {status.label}
                  </p>
                </div>

                {/* Contact & Hours */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Beban Mengajar:</span>
                  <span className="font-bold text-slate-800">{totalPeriods} Jam Pelajaran</span>
                </div>
              </div>

              {/* View Schedule Button */}
              <button
                onClick={() => setSelectedTeacher(teacher)}
                className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lihat Jadwal Lengkap Beliau</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Teacher Full Schedule Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-900 font-mono font-black text-sm flex items-center justify-center">
                  {selectedTeacher.code}
                </div>
                <div>
                  <h4 className="font-extrabold text-base sm:text-lg text-white">
                    {selectedTeacher.name}
                  </h4>
                  <p className="text-xs text-emerald-200">
                    Pengampu {selectedTeacher.subject} • SMKN 1 Tegalsari
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-white/80 hover:text-white text-sm font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Days breakdown */}
            <div className="p-5 overflow-y-auto space-y-4">
              {(() => {
                const { totalPeriods, scheduleByDay } = getTeacherStats(selectedTeacher.code);

                return (
                  <div>
                    <div className="mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                      <span>Total Beban Mengajar: <strong>{totalPeriods} Jam Pelajaran</strong></span>
                      <span>Mata Pelajaran: <strong>{selectedTeacher.subject}</strong></span>
                    </div>

                    <div className="space-y-4">
                      {DAYS_LIST.map((day) => {
                        const items = scheduleByDay[day] || [];
                        return (
                          <div key={day} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                            <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              {day} ({items.length} Sesi)
                            </h5>

                            {items.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Tidak ada jadwal mengajar pada hari ini.</p>
                            ) : (
                              <div className="space-y-2">
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-900">
                                        {item.classTitle} • {item.subject}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono">
                                        {item.slot.timeStart} - {item.slot.timeEnd} (Jam ke-{item.slot.periodNumber})
                                      </div>
                                    </div>
                                    <div className="px-2 py-1 rounded bg-slate-100 font-bold text-slate-700 text-[11px] border border-slate-200">
                                      {item.room}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
