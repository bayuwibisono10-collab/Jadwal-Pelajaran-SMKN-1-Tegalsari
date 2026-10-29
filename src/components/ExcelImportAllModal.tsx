import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  Users,
  Calendar,
  Check
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayType, SlotType } from '../types/schedule';
import { DEFAULT_SCHEDULE, DEFAULT_TEACHERS, DEFAULT_CLASSES } from '../data/defaultData';

interface ExcelImportAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  onImportAll: (payload: {
    schedule?: ScheduleSlot[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
  }) => void;
}

export const ExcelImportAllModal: React.FC<ExcelImportAllModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportAll,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [parsedSchedule, setParsedSchedule] = useState<ScheduleSlot[]>([]);
  const [parsedTeachers, setParsedTeachers] = useState<Teacher[]>([]);
  const [parsedClasses, setParsedClasses] = useState<SchoolClass[]>([]);
  const [importScheduleCheck, setImportScheduleCheck] = useState(true);
  const [importTeachersCheck, setImportTeachersCheck] = useState(true);
  const [importClassesCheck, setImportClassesCheck] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate Master All-In-One Excel Workbook
  const handleDownloadMasterWorkbook = () => {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Jadwal Matriks
    const schedRows = [
      ['HARI', 'JAM', 'PUKUL', 'MAPEL_K1', 'GURU_K1', 'RUANG_K1', 'MAPEL_K2', 'GURU_K2', 'RUANG_K2'],
      ['SENIN', '1', '06:45 - 07:20', 'UPACARA', '-', 'LAPANGAN', 'UPACARA', '-', 'LAPANGAN'],
      ['SENIN', '2', '07:20 - 07:55', 'BAHASA INGGRIS', 'BIG3', 'R.J1', 'PJOK', 'OR3', 'R.J2'],
      ['SENIN', '3', '07:55 - 08:30', 'BAHASA INGGRIS', 'BIG3', 'R.J1', 'PJOK', 'OR3', 'R.J2'],
      ['SENIN', '4', '08:30 - 09:05', 'BAHASA INGGRIS', 'BIG3', 'R.J1', 'BAHASA INDONESIA', 'BIN7', 'R.J2'],
      ['SENIN', '', '09:05 - 09:40', 'ISTIRAHAT', '-', '-', 'ISTIRAHAT', '-', '-'],
      ['SENIN', '5', '09:40 - 10:15', 'PENDIDIKAN PANCASILA', 'KN3', 'R.J1', 'BAHASA INDONESIA', 'BIN7', 'R.J2'],
      ['SENIN', '6', '10:15 - 10:50', 'PENDIDIKAN PANCASILA', 'KN3', 'R.J1', 'BAHASA INDONESIA', 'BIN7', 'R.J2'],
      ['SENIN', '7', '10:50 - 11:25', 'PENDIDIKAN PANCASILA', 'KN3', 'R.J1', 'SEJARAH INDONESIA', 'SJ1', 'R.J2'],
      ['SENIN', '', '11:25 - 12:25', 'ISTIRAHAT', '-', '-', 'ISTIRAHAT', '-', '-'],
      ['SENIN', '8', '12:25 - 13:00', 'PENDIDIKAN PANCASILA', 'KN3', 'R.J1', 'SEJARAH INDONESIA', 'SJ1', 'R.J2'],
      ['SENIN', '9', '13:00 - 13:35', 'MATEMATIKA', 'MT7', 'R.J1', 'BAHASA INGGRIS', 'BIG3', 'R.J2'],
      ['SENIN', '10', '13:35 - 14:10', 'MATEMATIKA', 'MT7', 'R.J1', 'BAHASA INGGRIS', 'BIG3', 'R.J2'],
      ['SENIN', '11', '14:10 - 14:45', 'MATEMATIKA', 'MT7', 'R.J1', 'BAHASA INGGRIS', 'BIG3', 'R.J2'],
      ['KAMIS', '6', '10:15 - 10:50', 'DINIYAH', 'DIN', 'R.J1', 'DINIYAH', 'DIN', 'R.J2'],
      ['KAMIS', '7', '10:50 - 11:25', 'DINIYAH', 'DIN', 'R.J1', 'DINIYAH', 'DIN', 'R.J2'],
      ['JUMAT', '', '06:45 - 07:30', 'ISTIGOSAH', '-', 'MASJID', 'ISTIGOSAH', '-', 'MASJID'],
      ['JUMAT', '1', '07:30 - 08:00', 'PJOK', 'OR3', 'LAPANGAN', 'PEND. AGAMA & BUDI PEKERTI', 'PAI1', 'R.J2'],
      ['JUMAT', 'EKS', '12:30 - 14:45', 'EKSTRAKURIKULER', '-', 'AREA SMKN 1 TEGALSARI', 'EKSTRAKURIKULER', '-', 'AREA SMKN 1 TEGALSARI'],
    ];
    const wsSched = XLSX.utils.aoa_to_sheet(schedRows);
    XLSX.utils.book_append_sheet(wb, wsSched, 'Jadwal');

    // 2. Sheet Data Guru (Tanpa No HP)
    const teacherRows = [
      ['Kode Guru', 'Nama Guru', 'Mata Pelajaran'],
      ['BIG3', 'Bayu Wibisono, S.Pd.', 'Bahasa Inggris'],
      ['MT7', 'Dian Kusumawati, S.Pd.', 'Matematika'],
      ['OR3', 'Wahyu Santoso, S.Pd.', 'PJOK'],
      ['BIN7', 'Nurul Hidayati, S.Pd.', 'Bahasa Indonesia'],
      ['KN3', 'Bambang Prasetyo, M.Pd.', 'Pendidikan Pancasila'],
      ['SJ1', 'Eko Sulistyo, S.Pd.', 'Sejarah Indonesia'],
      ['PAI1', 'Ahmad Fauzi, S.Ag., M.Pd.I', 'Pendidikan Agama & Budi Pekerti'],
      ['SB2', 'Retno Wulandari, S.Sn.', 'Seni Budaya'],
      ['BK6', 'Siti Rahmawati, S.Psi.', 'Bimbingan Konseling'],
      ['BJ6', 'Slamet Widodo, S.Pd.', 'Bahasa Jawa'],
      ['DIN', 'Ustadz M. Maksum, S.Pd.I', 'Diniyah & Keagamaan'],
    ];
    const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows);
    XLSX.utils.book_append_sheet(wb, wsTeachers, 'Guru');

    // 3. Sheet Data Kelas
    const classRows = [
      ['Nama Kelas', 'Jurusan', 'Tingkat', 'Ruang Default'],
      ['X KULINER 1', 'Kuliner', 'X', 'R.J1'],
      ['X KULINER 2', 'Kuliner', 'X', 'R.J2'],
    ];
    const wsClasses = XLSX.utils.aoa_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Kelas');

    XLSX.writeFile(wb, 'buku-kerja-master-smkn1tegalsari.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Parse Teachers if Sheet 'Guru' or similar exists
        const teacherSheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('guru'));
        if (teacherSheetName) {
          const ws = workbook.Sheets[teacherSheetName];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          const teachersList: Teacher[] = [];
          for (let i = 1; i < raw.length; i++) {
            const row = raw[i];
            if (!row || !row[0]) continue;
            teachersList.push({
              id: `t-imp-${i}`,
              code: String(row[0]).trim().toUpperCase(),
              name: String(row[1] || `Guru ${row[0]}`).trim(),
              subject: String(row[2] || '-').trim(),
            });
          }
          setParsedTeachers(teachersList);
        }

        // Parse Classes if Sheet 'Kelas' exists
        const classSheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('kelas'));
        if (classSheetName) {
          const ws = workbook.Sheets[classSheetName];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          const classesList: SchoolClass[] = [];
          for (let i = 1; i < raw.length; i++) {
            const row = raw[i];
            if (!row || !row[0]) continue;
            const name = String(row[0]).trim().toUpperCase();
            classesList.push({
              id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              name,
              department: String(row[1] || 'Kuliner').trim(),
              grade: (String(row[2] || 'X').toUpperCase().includes('XI') ? 'XI' : 'X') as 'X' | 'XI',
              roomDefault: String(row[3] || 'R.J1').trim(),
            });
          }
          setParsedClasses(classesList);
        }

        // Parse Schedule if Sheet 'Jadwal' exists (or first sheet)
        const schedSheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('jadwal')) || workbook.SheetNames[0];
        if (schedSheetName) {
          const ws = workbook.Sheets[schedSheetName];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          const slots: ScheduleSlot[] = [];
          let currentDay: DayType = 'SENIN';

          const class1 = classes[0]?.id || 'xk1';
          const class2 = classes[1]?.id || 'xk2';

          for (let i = 1; i < raw.length; i++) {
            const row = raw[i];
            if (!row || row.length === 0) continue;

            const col0 = String(row[0] || '').toUpperCase();
            if (col0.includes('SENIN')) currentDay = 'SENIN';
            else if (col0.includes('SELASA')) currentDay = 'SELASA';
            else if (col0.includes('RABU')) currentDay = 'RABU';
            else if (col0.includes('KAMIS')) currentDay = 'KAMIS';
            else if (col0.includes('JUMAT')) currentDay = 'JUMAT';

            const timeStr = String(row[2] || row[1] || '');
            const cleanTime = timeStr.replace(/\./g, ':').replace(/wib/gi, '').trim();
            const parts = cleanTime.split(/[-–—]/);
            if (parts.length < 2) continue;

            const tStart = parts[0].trim().slice(0, 5);
            const tEnd = parts[1].trim().slice(0, 5);

            const k1Sub = String(row[3] || '').trim();
            const k1Teacher = String(row[4] || '-').trim().toUpperCase();
            const k1Room = String(row[5] || 'R.J1').trim().toUpperCase();

            const k2Sub = String(row[6] || k1Sub).trim();
            const k2Teacher = String(row[7] || k1Teacher).trim().toUpperCase();
            const k2Room = String(row[8] || 'R.J2').trim().toUpperCase();

            let type: SlotType = 'REGULAR';
            let title: string | undefined = undefined;
            const textAll = `${k1Sub} ${k2Sub}`.toUpperCase();

            if (textAll.includes('ISTIRAHAT')) {
              type = 'BREAK';
              title = 'ISTIRAHAT';
            } else if (textAll.includes('UPACARA')) {
              type = 'UPACARA';
              title = 'UPACARA BENDERA';
            } else if (textAll.includes('ISTIGOSAH')) {
              type = 'ISTIGOSAH';
              title = 'ISTIGOSAH BERSAMA';
            } else if (textAll.includes('DINIYAH')) {
              type = 'DINIYAH';
              title = 'DINIYAH';
            } else if (textAll.includes('EKSTRAKURIKULER')) {
              type = 'EKSTRAKURIKULER';
              title = 'EKSTRAKURIKULER';
            }

            slots.push({
              id: `all-slot-${currentDay.toLowerCase()}-${i}`,
              day: currentDay,
              periodNumber: row[1] ? String(row[1]) : undefined,
              timeStart: tStart,
              timeEnd: tEnd,
              type,
              title,
              classes: {
                [class1]: { subject: k1Sub || title || '-', teacherCode: k1Teacher, room: k1Room },
                [class2]: { subject: k2Sub || title || '-', teacherCode: k2Teacher, room: k2Room },
              },
            });
          }
          setParsedSchedule(slots);
        }

        setErrorMessage(null);
      } catch {
        setErrorMessage('Gagal memproses file Excel master.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    onImportAll({
      schedule: importScheduleCheck && parsedSchedule.length > 0 ? parsedSchedule : undefined,
      teachers: importTeachersCheck && parsedTeachers.length > 0 ? parsedTeachers : undefined,
      classes: importClassesCheck && parsedClasses.length > 0 ? parsedClasses : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Impor Paket Lengkap Sekolah (Multi-Sheet Excel)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Satu file Excel untuk mengimpor <strong>Jadwal</strong>, <strong>Guru</strong>, dan <strong>Kelas</strong> sekaligus.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Download Master Template */}
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs flex items-center justify-between gap-3 text-emerald-950">
          <div>
            <h4 className="font-extrabold text-emerald-900">Unduh Buku Kerja Master SMKN 1 Tegalsari (.xlsx)</h4>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Berisi 3 lembar kerja (Sheet Jadwal, Sheet Guru tanpa no HP, dan Sheet Kelas).
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadMasterWorkbook}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Buku Kerja Master (.xlsx)</span>
          </button>
        </div>

        {/* Upload File */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all rounded-2xl p-6 text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-6 h-6 text-emerald-700" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Pilih file Excel Master yang berisi sheet Jadwal, Guru, dan Kelas
            </p>
            {fileName && (
              <p className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 inline-block px-3 py-1 rounded-lg">
                📄 File terpilih: {fileName}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Detected Data Summary Checkboxes */}
          {(parsedSchedule.length > 0 || parsedTeachers.length > 0 || parsedClasses.length > 0) && (
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Komponen Data Terdeteksi:
              </h4>

              <div className="space-y-2">
                {/* Jadwal Card */}
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importScheduleCheck}
                      onChange={(e) => setImportScheduleCheck(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Jadwal Pelajaran Matriks
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {parsedSchedule.length > 0 ? `${parsedSchedule.length} sesi terdeteksi` : 'Tidak ditemukan sheet jadwal'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    parsedSchedule.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {parsedSchedule.length > 0 ? 'Siap' : 'Kosong'}
                  </span>
                </label>

                {/* Guru Card */}
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importTeachersCheck}
                      onChange={(e) => setImportTeachersCheck(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        Data Guru (Tanpa No HP)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {parsedTeachers.length > 0 ? `${parsedTeachers.length} guru terdeteksi` : 'Tidak ditemukan sheet guru'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    parsedTeachers.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {parsedTeachers.length > 0 ? 'Siap' : 'Kosong'}
                  </span>
                </label>

                {/* Kelas Card */}
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importClassesCheck}
                      onChange={(e) => setImportClassesCheck(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Data Rombel Kelas
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {parsedClasses.length > 0 ? `${parsedClasses.length} kelas terdeteksi` : 'Tidak ditemukan sheet kelas'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    parsedClasses.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {parsedClasses.length > 0 ? 'Siap' : 'Kosong'}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedSchedule.length === 0 && parsedTeachers.length === 0 && parsedClasses.length === 0}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan Seluruh Data Terpilih</span>
          </button>
        </div>

      </div>
    </div>
  );
};
