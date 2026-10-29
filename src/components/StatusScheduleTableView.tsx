import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Calendar, 
  MapPin, 
  User, 
  Filter, 
  Search, 
  Download, 
  Printer, 
  Sparkles, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  RotateCcw
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayType, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { timeStringToMinutes, DAYS_LIST } from '../utils/timeHelper';

export type ScheduleItemStatus = 'Terlaksana' | 'Berlangsung' | 'Terjadwal';

export interface FlatScheduleRow {
  id: string;
  slotId: string;
  day: DayType;
  periodDisplay: string;
  periodNum?: number | string;
  timeStart: string;
  timeEnd: string;
  classId: string;
  className: string;
  subject: string;
  teacherCode: string;
  teacherName: string;
  room: string;
  status: ScheduleItemStatus;
  type: string;
}

interface StatusScheduleTableViewProps {
  schedule: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  selectedDay: DayType;
  setSelectedDay: (day: DayType) => void;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  currentTime: Date;
  onSelectTeacher?: (code: string) => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
}

export const StatusScheduleTableView: React.FC<StatusScheduleTableViewProps> = ({
  schedule,
  teachers,
  classes,
  selectedDay,
  setSelectedDay,
  currentDay,
  currentTime,
  onSelectTeacher,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State: 30 baris dan kelipatannya (30, 60, 90, 120, 0 = Semua)
  const [pageSize, setPageSize] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Auto-rolling classes state
  const [isAutoRollingClass, setIsAutoRollingClass] = useState<boolean>(false);
  const [rollingCountdown, setRollingCountdown] = useState<number>(8);

  // Auto-rolling classes effect
  useEffect(() => {
    if (!isAutoRollingClass || classes.length <= 1) return;

    const timer = setInterval(() => {
      setRollingCountdown((prev) => {
        if (prev <= 1) {
          setFilterClass((curr) => {
            const classIds = ['all', ...classes.map((c) => c.id)];
            const currIdx = classIds.indexOf(curr);
            const nextIdx = (currIdx + 1) % classIds.length;
            return classIds[nextIdx];
          });
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRollingClass, classes]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = currentDay === selectedDay;

  const getTeacher = (code: string) => {
    return teachers.find((t) => t.code.toUpperCase() === code.toUpperCase());
  };

  // Convert schedule slots for the selected day & active week into flat rows
  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => !activeWeek || !s.weekType || s.weekType === 'ALL' || s.weekType === activeWeek)
    .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));

  const tableRows: FlatScheduleRow[] = [];

  daySlots.forEach((slot) => {
    const startMin = timeStringToMinutes(slot.timeStart);
    const endMin = timeStringToMinutes(slot.timeEnd);

    // Compute Status: Terlaksana, Berlangsung, Terjadwal
    let status: ScheduleItemStatus = 'Terjadwal';
    if (isToday) {
      if (currentMinutes >= endMin) {
        status = 'Terlaksana';
      } else if (currentMinutes >= startMin && currentMinutes < endMin) {
        status = 'Berlangsung';
      } else {
        status = 'Terjadwal';
      }
    } else {
      // If looking at another day:
      // If that day has passed earlier this week, or in the future
      const dayOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
      const currentDayIdx = dayOrder.indexOf(currentDay as string);
      const selectedDayIdx = dayOrder.indexOf(selectedDay);

      if (currentDayIdx !== -1 && selectedDayIdx !== -1) {
        if (selectedDayIdx < currentDayIdx) {
          status = 'Terlaksana';
        } else {
          status = 'Terjadwal';
        }
      } else {
        status = 'Terjadwal';
      }
    }

    const periodDisplay = slot.periodNumber 
      ? `Jam ${slot.periodNumber}` 
      : slot.title || (slot.type === 'BREAK' ? 'Istirahat' : '-');

    if (slot.type === 'BREAK' || slot.type === 'UPACARA' || slot.type === 'ISTIGOSAH' || slot.type === 'EKSTRAKURIKULER') {
      // Special row spanning all classes
      classes.forEach((cls) => {
        const asg = slot.classes[cls.id];
        const teacherObj = asg?.teacherCode && asg.teacherCode !== '-' ? getTeacher(asg.teacherCode) : null;
        tableRows.push({
          id: `${slot.id}-${cls.id}`,
          slotId: slot.id,
          day: slot.day,
          periodDisplay,
          periodNum: slot.periodNumber,
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          classId: cls.id,
          className: cls.name,
          subject: asg?.subject || slot.title || slot.type,
          teacherCode: asg?.teacherCode || '-',
          teacherName: teacherObj ? teacherObj.name : '-',
          room: asg?.room || (slot.type === 'UPACARA' ? 'LAPANGAN' : slot.type === 'ISTIGOSAH' ? 'MASJID' : '-'),
          status,
          type: slot.type,
        });
      });
    } else {
      // Regular or Diniyah classes
      classes.forEach((cls) => {
        const asg = slot.classes[cls.id];
        if (!asg) return;
        const teacherObj = getTeacher(asg.teacherCode);
        tableRows.push({
          id: `${slot.id}-${cls.id}`,
          slotId: slot.id,
          day: slot.day,
          periodDisplay,
          periodNum: slot.periodNumber,
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          classId: cls.id,
          className: cls.name,
          subject: asg.subject,
          teacherCode: asg.teacherCode,
          teacherName: teacherObj ? teacherObj.name : asg.teacherCode,
          room: asg.room,
          status,
          type: slot.type,
        });
      });
    }
  });

  // Filter rows
  const filteredRows = tableRows.filter((row) => {
    // Class filter
    if (filterClass !== 'all' && row.classId !== filterClass) return false;

    // Status filter
    if (filterStatus !== 'all' && row.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = row.subject.toLowerCase().includes(q);
      const matchTeacher = row.teacherName.toLowerCase().includes(q) || row.teacherCode.toLowerCase().includes(q);
      const matchRoom = row.room.toLowerCase().includes(q);
      const matchClass = row.className.toLowerCase().includes(q);
      const matchPeriod = row.periodDisplay.toLowerCase().includes(q);
      if (!matchSubject && !matchTeacher && !matchRoom && !matchClass && !matchPeriod) {
        return false;
      }
    }

    return true;
  });

  // Reset to page 1 when any filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterClass, filterStatus, searchQuery, selectedDay, pageSize]);

  // Pagination Calculation: 30 baris dan kelipatannya (30, 60, 90, 120, Semua)
  const totalRows = filteredRows.length;
  const effectivePageSize = pageSize === 0 ? totalRows || 1 : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 0 ? totalRows : Math.min(startIndex + pageSize, totalRows);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  // Statistics
  const countTerlaksana = tableRows.filter((r) => r.status === 'Terlaksana').length;
  const countBerlangsung = tableRows.filter((r) => r.status === 'Berlangsung').length;
  const countTerjadwal = tableRows.filter((r) => r.status === 'Terjadwal').length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Jam Ke', 'Pukul', 'Kelas', 'Mata Pelajaran', 'Guru', 'Ruang', 'Status'];
    const rows = filteredRows.map((r) => [
      `"${r.periodDisplay}"`,
      `"${r.timeStart} - ${r.timeEnd}"`,
      `"${r.className}"`,
      `"${r.subject}"`,
      `"${r.teacherCode !== '-' ? `${r.teacherCode} - ${r.teacherName}` : '-'}"`,
      `"${r.room}"`,
      `"${r.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jadwal-status-${selectedDay.toLowerCase()}-smkn1tegalsari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 mb-8">
      
      {/* Top Controls & Status Metric Badges */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Tabel Status Jadwal Pelajaran (Real-Time)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Menampilkan kolom: <strong>Jam Ke</strong>, <strong>Kelas</strong>, <strong>Mata Pelajaran</strong>, <strong>Guru</strong>, <strong>Ruang</strong>, dan <strong>Status</strong> (Terlaksana, Berlangsung, Terjadwal).
            </p>
          </div>

          {/* Status Counter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Berlangsung Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black">{countBerlangsung}</span>
              <span className="text-xs font-bold text-emerald-700">Berlangsung</span>
            </div>

            {/* Terjadwal Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-black">{countTerjadwal}</span>
              <span className="text-xs font-bold text-blue-700">Terjadwal</span>
            </div>

            {/* Terlaksana Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-black">{countTerlaksana}</span>
              <span className="text-xs font-bold text-slate-600">Terlaksana</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          
          {/* Day & Class & Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Day Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {DAYS_LIST.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedDay === day
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Active Week Cycle Selector */}
            {activeWeek && onToggleActiveWeek && (
              <button
                type="button"
                onClick={() => onToggleActiveWeek()}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                  activeWeek === 'NORMADA_10_PRODUKTIF_11'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                title="Klik untuk beralih giliran Pekan Normada vs Produktif"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>{WEEK_ROTATION_CONFIG[activeWeek]?.shortTitle || activeWeek}</span>
                <span className="text-[10px] text-slate-500 underline ml-0.5">Ubah ⇄</span>
              </button>
            )}

            {/* Class Filter Dropdown/Pills */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Auto-Rolling Classes Button */}
            <button
              type="button"
              onClick={() => {
                setIsAutoRollingClass(!isAutoRollingClass);
                setRollingCountdown(8);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isAutoRollingClass
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title={isAutoRollingClass ? 'Hentikan Rolling Bergantian' : 'Putar Rolling Bergantian Semua Kelas'}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isAutoRollingClass ? 'animate-spin' : ''}`} />
              <span>{isAutoRollingClass ? `Rolling (${rollingCountdown}s)` : '🔄 Rolling Kelas'}</span>
            </button>

            {/* Status Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="Berlangsung">🟢 Berlangsung</option>
              <option value="Terjadwal">🔵 Terjadwal</option>
              <option value="Terlaksana">⚪ Terlaksana</option>
            </select>

            {/* Rows Per Page (30 and multiples) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              <span className="text-slate-500 font-medium">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-emerald-800 font-bold focus:outline-none cursor-pointer"
                title="Pilih jumlah baris tabel (30 baris dan kelipatannya)"
              >
                <option value={30}>30 Baris (Standar)</option>
                <option value={60}>60 Baris (2x)</option>
                <option value={90}>90 Baris (3x)</option>
                <option value={120}>120 Baris (4x)</option>
                <option value={0}>Semua Baris ({totalRows})</option>
              </select>
            </div>
          </div>

          {/* Search Box & Export */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mapel, guru, ruang..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>

            <button
              onClick={handleExportCSV}
              title="Unduh Tabel (CSV)"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-emerald-800 text-white font-extrabold uppercase tracking-wider text-[11px] border-b border-emerald-900">
                <th className="py-3 px-4 w-28 text-center">Jam Ke</th>
                <th className="py-3 px-4 w-32">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Guru</th>
                <th className="py-3 px-4 w-24 text-center">Ruang</th>
                <th className="py-3 px-4 w-36 text-center">Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada jadwal yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const isOngoing = row.status === 'Berlangsung';
                  const isFinished = row.status === 'Terlaksana';
                  const isScheduled = row.status === 'Terjadwal';

                  const isDiniyah = row.type === 'DINIYAH' || row.subject.toUpperCase().includes('DINIYAH');
                  const isIstigosah = row.type === 'ISTIGOSAH';
                  const isBreak = row.type === 'BREAK';
                  const isUpacara = row.type === 'UPACARA';

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isOngoing
                          ? 'bg-emerald-50/90 font-bold border-l-4 border-l-emerald-600 ring-1 ring-inset ring-emerald-300'
                          : isFinished
                          ? 'bg-slate-50/70 text-slate-500 hover:bg-slate-100/60'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Jam Ke */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">
                          {row.periodDisplay}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {row.timeStart} - {row.timeEnd}
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border shadow-2xs ${
                          row.className.includes('1')
                            ? 'bg-emerald-100/70 text-emerald-900 border-emerald-200'
                            : 'bg-teal-100/70 text-teal-900 border-teal-200'
                        }`}>
                          {row.className}
                        </span>
                      </td>

                      {/* Mata Pelajaran */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm tracking-tight ${
                            isOngoing ? 'text-emerald-950 font-black' : 'text-slate-900'
                          }`}>
                            {row.subject}
                          </span>

                          {isDiniyah && (
                            <span className="text-[10px] bg-pink-100 text-pink-800 font-extrabold px-2 py-0.5 rounded-full border border-pink-200">
                              Diniyah
                            </span>
                          )}

                          {isIstigosah && (
                            <span className="text-[10px] bg-cyan-100 text-cyan-800 font-extrabold px-2 py-0.5 rounded-full border border-cyan-200">
                              Istigosah
                            </span>
                          )}

                          {isBreak && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                              Istirahat
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Guru */}
                      <td className="py-3 px-4">
                        {row.teacherCode !== '-' ? (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {row.teacherCode}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {row.teacherName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Kode: {row.teacherCode}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Ruang */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {row.room}
                        </span>
                      </td>

                      {/* Status (Terlaksana, Berlangsung, Terjadwal) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOngoing && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs animate-pulse ring-2 ring-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                            <span>Berlangsung</span>
                          </span>
                        )}

                        {isFinished && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Terlaksana</span>
                          </span>
                        )}

                        {isScheduled && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Terjadwal</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer of Table with Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900">{totalRows === 0 ? 0 : startIndex + 1} - {endIndex}</strong> dari <strong className="text-slate-900">{totalRows}</strong> sesi pembelajaran ({selectedDay}).
            </span>
            {pageSize > 0 && totalPages > 1 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Halaman {validCurrentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Pagination Buttons */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center">
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const isGap = prev && pageNum - prev > 1;
                    return (
                      <React.Fragment key={pageNum}>
                        {isGap && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            pageNum === validCurrentPage
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-colors"
                title="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Status Legend */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <strong>Berlangsung</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <strong>Terjadwal</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <strong>Terlaksana</strong>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
