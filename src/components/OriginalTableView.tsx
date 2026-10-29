import React, { useState } from 'react';
import { 
  Eye, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Layers,
  Table,
  Edit2,
  Trash2,
  Plus,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayType, WeekRotationType, WEEK_ROTATION_CONFIG } from '../types/schedule';
import { DAYS_LIST, timeStringToMinutes } from '../utils/timeHelper';

interface OriginalTableViewProps {
  schedule: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  currentSlotId?: string;
  currentDay: DayType | 'MINGGU' | 'SABTU';
  filterDay?: DayType | 'ALL';
  isAdmin?: boolean;
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slotId: string) => void;
  onAddNewSlot?: () => void;
  onOpenExcelImport?: () => void;
  activeWeek?: WeekRotationType;
  onToggleActiveWeek?: (week?: WeekRotationType) => void;
  onSelectDay?: (day: DayType) => void;
}

export const OriginalTableView: React.FC<OriginalTableViewProps> = ({
  schedule,
  teachers,
  classes,
  currentSlotId,
  currentDay,
  filterDay = 'ALL',
  isAdmin = false,
  onEditSlot,
  onDeleteSlot,
  onAddNewSlot,
  onOpenExcelImport,
  activeWeek = 'NORMADA_10_PRODUKTIF_11',
  onToggleActiveWeek,
  onSelectDay,
}) => {
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [selectedTeacherCode, setSelectedTeacherCode] = useState<string | null>(null);
  const [internalDayFilter, setInternalDayFilter] = useState<DayType | 'ALL'>(filterDay);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<WeekRotationType | 'ALL'>(activeWeek || 'NORMADA_10_PRODUKTIF_11');

  // Synchronize internal week filter with activeWeek prop
  React.useEffect(() => {
    if (activeWeek) {
      setSelectedWeekFilter(activeWeek);
    }
  }, [activeWeek]);

  // Synchronize internal day filter with filterDay prop
  React.useEffect(() => {
    setInternalDayFilter(filterDay);
  }, [filterDay]);

  const handleSelectWeek = (w: WeekRotationType | 'ALL') => {
    setSelectedWeekFilter(w);
    if (w !== 'ALL' && onToggleActiveWeek) {
      onToggleActiveWeek(w);
    }
  };

  // Dynamic class display state
  const [displayMode, setDisplayMode] = useState<'paired' | 'single' | 'all'>('paired');
  const [leftClassId, setLeftClassId] = useState<string>(classes[0]?.id || 'xk1');
  const [rightClassId, setRightClassId] = useState<string>(classes[1]?.id || 'xk2');
  const [singleClassId, setSingleClassId] = useState<string>(classes[0]?.id || 'xk1');

  const getTeacher = (code: string) => {
    return teachers.find((t) => t.code.toUpperCase() === code.toUpperCase());
  };

  const activeDayFilter = internalDayFilter;
  const daysToRender = activeDayFilter === 'ALL' ? DAYS_LIST : [activeDayFilter];

  // Determine active classes to display
  let displayedClasses: SchoolClass[] = [];
  if (displayMode === 'paired') {
    const c1 = classes.find((c) => c.id === leftClassId) || classes[0];
    const c2 = classes.find((c) => c.id === rightClassId) || classes[1] || c1;
    displayedClasses = c1 && c2 && c1.id !== c2.id ? [c1, c2] : [c1].filter(Boolean);
  } else if (displayMode === 'single') {
    const sc = classes.find((c) => c.id === singleClassId) || classes[0];
    displayedClasses = sc ? [sc] : [];
  } else {
    displayedClasses = classes;
  }

  // Fallback if empty
  if (displayedClasses.length === 0 && classes.length > 0) {
    displayedClasses = [classes[0]];
  }

  const specialColSpan = displayedClasses.length * 3;

  const renderAdminAction = (slot: ScheduleSlot) => (
    <td className="border border-slate-300 px-2 py-1.5 text-center whitespace-nowrap bg-slate-50/90 w-20">
      <div className="flex items-center justify-center gap-1">
        {onEditSlot && (
          <button
            type="button"
            onClick={() => onEditSlot(slot)}
            className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300 bg-white shadow-2xs"
            title="Edit Slot Pelajaran Ini"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDeleteSlot && (
          <button
            type="button"
            onClick={() => onDeleteSlot(slot.id)}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 bg-white shadow-2xs"
            title="Hapus Slot Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </td>
  );

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden mb-8">
      
      {/* Table Toolbar Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Tabel Matriks Lengkap (Format Resmi SMKN 1 Tegalsari)
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Format Gambar
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Format tabel matriks berdampingan (contoh: <strong>{classes[0]?.name || 'X KULINER 1'}</strong> & <strong>{classes[1]?.name || 'X KULINER 2'}</strong>) sesuai lembar jadwal resmi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin specific buttons */}
          {isAdmin && onOpenExcelImport && (
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
              title="Impor Jadwal Pelajaran (Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Impor Jadwal Excel</span>
            </button>
          )}

          {isAdmin && onAddNewSlot && (
            <button
              type="button"
              onClick={onAddNewSlot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-2xs"
              title="Tambah Slot Pelajaran Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Slot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Cetak atau simpan PDF tabel matriks ini"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {/* Button to compare with original photo */}
          <button
            type="button"
            onClick={() => setShowOriginalModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Lihat Foto Asli</span>
          </button>
        </div>
      </div>

      {/* Admin Mode Info Banner */}
      {isAdmin && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Mode Admin Matriks Aktif: Anda dapat mengedit / menghapus slot secara langsung dari kolom aksi tabel, atau mengimpor lembar matriks Excel baru.
            </span>
          </div>
          <span className="text-[10px] bg-emerald-700 text-white font-extrabold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
            ADMIN MATRIKS
          </span>
        </div>
      )}

      {/* Class Selection & Display Controls */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            Mode Matriks:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setDisplayMode('paired')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                displayMode === 'paired'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Kelas Bersandingan (Contoh: 10 Kuliner 1 & 2)
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('single')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                displayMode === 'single'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per-Kelas (1 Rombel)
            </button>
            {classes.length > 2 && (
              <button
                type="button"
                onClick={() => setDisplayMode('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  displayMode === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Kelas ({classes.length})
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Selectors for Paired or Single Mode */}
        {displayMode === 'paired' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Pilih 2 Kelas:</span>
            <select
              value={leftClassId}
              onChange={(e) => setLeftClassId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kolom 1: {c.name}
                </option>
              ))}
            </select>
            <span className="text-slate-400 font-bold">&</span>
            <select
              value={rightClassId}
              onChange={(e) => setRightClassId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kolom 2: {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {displayMode === 'single' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Pilih Kelas:</span>
            <select
              value={singleClassId}
              onChange={(e) => setSingleClassId(e.target.value)}
              className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.department})
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Filter Bar: Day & Synchronized Week Rotation */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Table className="w-3.5 h-3.5 text-emerald-700" />
            Filter Hari:
          </span>
          {(['ALL', ...DAYS_LIST] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setInternalDayFilter(d);
                if (d !== 'ALL' && onSelectDay) onSelectDay(d);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeDayFilter === d
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {d === 'ALL' ? 'Semua Hari (Penuh)' : d}
            </button>
          ))}
        </div>

        {/* Synchronized Week Rotation Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 pl-1">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              Siklus:
            </span>
            <button
              type="button"
              onClick={() => handleSelectWeek('NORMADA_10_PRODUKTIF_11')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedWeekFilter === 'NORMADA_10_PRODUKTIF_11'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
              title="Pekan Normada 10 & Produktif 11 (Kelas 10 Teori, Kelas 11 Praktik)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedWeekFilter === 'NORMADA_10_PRODUKTIF_11' ? 'bg-emerald-300' : 'bg-slate-300'}`}></span>
              <span>Normada 10 & Prod 11</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectWeek('PRODUKTIF_10_NORMADA_11')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedWeekFilter === 'PRODUKTIF_10_NORMADA_11'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
              }`}
              title="Pekan Produktif 10 & Normada 11 (Kelas 10 Praktik, Kelas 11 Teori)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedWeekFilter === 'PRODUKTIF_10_NORMADA_11' ? 'bg-amber-200' : 'bg-slate-300'}`}></span>
              <span>Prod 10 & Normada 11</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectWeek('ALL')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                selectedWeekFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilkan Semua Slot Kedua Siklus Pekan"
            >
              Semua Pekan
            </button>
          </div>

          <div className="text-slate-500 text-[11px] font-semibold hidden md:block">
            Matriks: <strong className="text-slate-800">{displayedClasses.map(c => c.name).join(' & ')}</strong>
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Super Header: Class Groups */}
            <tr className="bg-[#008037] text-white uppercase text-center font-black tracking-wider border-b-2 border-emerald-950">
              <th rowSpan={2} className="border border-emerald-800/80 px-3 py-3 w-16">
                HARI
              </th>
              <th rowSpan={2} className="border border-emerald-800/80 px-2 py-3 w-12">
                JAM
              </th>
              <th rowSpan={2} className="border border-emerald-800/80 px-3 py-3 w-28">
                PUKUL
              </th>
              
              {/* Dynamic Class Headers */}
              {displayedClasses.map((cls, idx) => (
                <th
                  key={cls.id}
                  colSpan={3}
                  className={`border border-emerald-800/80 py-2.5 text-sm sm:text-base font-extrabold ${
                    idx % 2 === 0 ? 'bg-[#007030]' : 'bg-[#006428]'
                  }`}
                >
                  {cls.name}
                </th>
              ))}

              {/* Admin Column Header */}
              {isAdmin && (
                <th rowSpan={2} className="border border-emerald-800/80 px-2 py-3 w-20 text-center font-bold text-xs bg-emerald-900">
                  AKSI ADMIN
                </th>
              )}
            </tr>

            {/* Sub Header: MAPEL, KODE GURU, RUANG per class */}
            <tr className="bg-[#008037] text-white font-bold text-center border-b-2 border-emerald-950 text-[11px]">
              {displayedClasses.map((cls) => (
                <React.Fragment key={`sub-${cls.id}`}>
                  <th className="border border-emerald-800/80 px-3 py-2 w-48">MAPEL</th>
                  <th className="border border-emerald-800/80 px-2 py-2 w-20">KODE GURU</th>
                  <th className="border border-emerald-800/80 px-2 py-2 w-20">RUANG</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {daysToRender.map((day) => {
              const daySlots = schedule
                .filter((s) => s.day === day)
                .filter((s) => selectedWeekFilter === 'ALL' || !s.weekType || s.weekType === 'ALL' || s.weekType === selectedWeekFilter)
                .sort((a, b) => timeStringToMinutes(a.timeStart) - timeStringToMinutes(b.timeStart));
              const totalSlots = daySlots.length;
              const isToday = currentDay === day;

              return daySlots.map((slot, index) => {
                const isCurrentRow = currentSlotId === slot.id && isToday;
                const isFirstRowOfDay = index === 0;

                // Color schemes matching the photo
                const isDiniyah = slot.type === 'DINIYAH';
                const isIstigosah = slot.type === 'ISTIGOSAH';
                const isUpacara = slot.type === 'UPACARA';
                const isBreak = slot.type === 'BREAK';
                const isEkstrakurikuler = slot.type === 'EKSTRAKURIKULER';

                return (
                  <tr
                    key={slot.id}
                    className={`transition-colors border-b border-slate-300 font-medium ${
                      isCurrentRow 
                        ? 'ring-2 ring-emerald-500 bg-emerald-50/90 font-bold' 
                        : index % 2 === 0 
                        ? 'bg-white' 
                        : 'bg-slate-50/50'
                    }`}
                  >
                    {/* HARI Column (RowSpan for entire day) */}
                    {isFirstRowOfDay && (
                      <td
                        rowSpan={totalSlots}
                        className={`border border-slate-300 text-center font-black tracking-widest text-slate-800 text-sm align-middle select-none ${
                          isToday ? 'bg-emerald-100/70 text-emerald-950 font-black' : 'bg-slate-100'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center font-mono py-2 font-extrabold text-base leading-tight">
                          {day.split('').map((char, i) => (
                            <span key={i} className="block my-0.5">{char}</span>
                          ))}
                        </div>
                        {isToday && (
                          <span className="block mt-1 text-[9px] bg-emerald-700 text-white rounded-full px-1 py-0.5 uppercase tracking-tighter mx-auto max-w-[50px]">
                            Hari Ini
                          </span>
                        )}
                      </td>
                    )}

                    {/* JAM Column */}
                    <td className={`border border-slate-300 text-center font-bold px-2 py-2 ${
                      isCurrentRow ? 'text-emerald-800 bg-emerald-100/50' : 'text-slate-700'
                    }`}>
                      <div className="flex flex-col items-center justify-center">
                        <span>{slot.periodNumber ? slot.periodNumber : '-'}</span>
                        {slot.weekType && slot.weekType !== 'ALL' && (
                          <span className={`mt-0.5 inline-block text-[8px] font-black px-1 py-0.2 rounded border leading-tight ${
                            slot.weekType === 'NORMADA_10_PRODUKTIF_11'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {slot.weekType === 'NORMADA_10_PRODUKTIF_11' ? 'NORM 10' : 'PROD 10'}
                          </span>
                        )}
                        {isCurrentRow && (
                          <span className="block text-[8px] uppercase tracking-tighter text-emerald-600 font-extrabold mt-0.5">
                            NOW
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PUKUL Column */}
                    <td className={`border border-slate-300 text-center font-mono text-[11px] px-2 py-2 whitespace-nowrap ${
                      isCurrentRow ? 'font-bold text-emerald-900 bg-emerald-100/50' : 'text-slate-600'
                    }`}>
                      {slot.timeStart} - {slot.timeEnd}
                    </td>

                    {/* Full Width Special Rows (UPACARA, ISTIRAHAT, ISTIGOSAH, EKSTRAKURIKULER) */}
                    {isUpacara ? (
                      <>
                        <td colSpan={specialColSpan} className="border border-slate-300 text-center py-2.5 font-black text-sm uppercase tracking-wider bg-white text-slate-900">
                          {slot.title || 'UPACARA'}
                        </td>
                        {isAdmin && renderAdminAction(slot)}
                      </>
                    ) : isIstigosah ? (
                      <>
                        <td colSpan={specialColSpan} className="border border-slate-300 text-center py-2.5 font-black text-sm uppercase tracking-wider bg-[#22d3ee] text-slate-900">
                          {slot.title || 'ISTIGOSAH'}
                        </td>
                        {isAdmin && renderAdminAction(slot)}
                      </>
                    ) : isBreak ? (
                      <>
                        <td colSpan={specialColSpan} className="border border-slate-300 text-center py-2 font-black text-xs uppercase tracking-widest bg-slate-200 text-slate-700">
                          {slot.title || 'ISTIRAHAT'}
                        </td>
                        {isAdmin && renderAdminAction(slot)}
                      </>
                    ) : isEkstrakurikuler ? (
                      <>
                        <td colSpan={specialColSpan} className="border border-slate-300 text-center py-2.5 font-black text-sm uppercase tracking-wider bg-white text-slate-900">
                          {slot.title || 'EKSTRAKURIKULER'}
                        </td>
                        {isAdmin && renderAdminAction(slot)}
                      </>
                    ) : (
                      <>
                        {displayedClasses.map((cls) => {
                          const asg = slot.classes[cls.id];
                          const subjectName = asg?.subject || '-';
                          const teacherCode = asg?.teacherCode || '-';
                          const roomName = asg?.room || '-';

                          return (
                            <React.Fragment key={`cell-${slot.id}-${cls.id}`}>
                              {/* Mapel */}
                              <td className={`border border-slate-300 px-3 py-2 text-center uppercase font-bold ${
                                isDiniyah ? 'bg-[#ff3399] text-slate-900 font-black' : 'text-slate-800'
                              }`}>
                                {subjectName}
                              </td>

                              {/* Kode Guru */}
                              <td 
                                onClick={() => teacherCode !== '-' && setSelectedTeacherCode(teacherCode)}
                                className={`border border-slate-300 px-2 py-2 text-center font-bold font-mono ${
                                  teacherCode !== '-' ? 'cursor-pointer hover:bg-emerald-100 transition-colors' : ''
                                } ${
                                  isDiniyah ? 'bg-[#ff3399] text-slate-900' : 'text-slate-700'
                                }`}
                                title={teacherCode !== '-' ? `Klik untuk detail guru ${teacherCode}` : ''}
                              >
                                <span className={teacherCode !== '-' ? 'underline decoration-dotted decoration-slate-400' : ''}>
                                  {teacherCode}
                                </span>
                              </td>

                              {/* Ruang */}
                              <td className={`border border-slate-300 px-2 py-2 text-center font-semibold ${
                                isDiniyah ? 'bg-[#ff3399] text-slate-900' : 'text-slate-600'
                              }`}>
                                {roomName}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        {isAdmin && renderAdminAction(slot)}
                      </>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">Keterangan Warna:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#008037]"></span>
            <span>Header SMKN 1 Tegalsari</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#ff3399]"></span>
            <span>Diniyah (Kamis)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#22d3ee]"></span>
            <span>Istigosah (Jumat)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300"></span>
            <span>Istirahat</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-500"></span>
            <span>Sedang Berlangsung Sekarang</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          * Klik pada kode guru (misal <span className="font-mono font-bold text-slate-700">BIG3</span> atau <span className="font-mono font-bold text-slate-700">MT7</span>) untuk melihat nama lengkap pengajar.
        </div>
      </div>

      {/* Teacher Detail Popup Modal */}
      {selectedTeacherCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {(() => {
              const teacher = getTeacher(selectedTeacherCode);
              return (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                      Kode: {selectedTeacherCode}
                    </span>
                    <button
                      onClick={() => setSelectedTeacherCode(null)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="my-4">
                    <h4 className="text-lg font-extrabold text-slate-900">
                      {teacher?.name || `Guru (${selectedTeacherCode})`}
                    </h4>
                    <p className="text-sm text-emerald-700 font-semibold mt-0.5">
                      {teacher?.subject || 'Tenaga Pendidik SMKN 1 Tegalsari'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      Pengampu Resmi SMKN 1 Tegalsari
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTeacherCode(null)}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Original Image Viewer Modal */}
      {showOriginalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm sm:text-base">
                  Foto Jadwal Asli (Dokumen Referensi)
                </h4>
              </div>
              <button
                onClick={() => setShowOriginalModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg text-sm font-bold"
              >
                Tutup (✕)
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-100 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_b1e75f29.png"
                alt="Jadwal Pelajaran SMKN 1 Tegalsari Asli"
                className="max-w-full h-auto rounded-lg shadow-md border border-slate-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/public/assets/aistudio/image_b1e75f29.png';
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
