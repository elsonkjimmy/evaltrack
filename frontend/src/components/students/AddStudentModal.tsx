import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

export const AddStudentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentRoom, addStudent, fetchRoomData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    matricule: '',
    lastName: '',
    firstName: ''
  });

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    
    setLoading(true);
    setError(null);
    try {
      await addStudent({
        room_id: currentRoom.id,
        matricule: formData.matricule,
        last_name: formData.lastName,
        first_name: formData.firstName
      });
      setSuccess("Student added successfully.");
      setFormData({ matricule: '', lastName: '', firstName: '' });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoom) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          throw new Error("The file seems to be empty or invalid.");
        }

        // Robust Header Detection Logic
        const students = data.map((row: any) => {
          // Normalize row keys (lowercase, trim) for easier matching
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = row[key];
          });

          return {
            room_id: currentRoom.id,
            matricule: String(normalizedRow.matricule || normalizedRow.id || normalizedRow.student_id || normalizedRow.code || '').trim(),
            last_name: String(normalizedRow.nom || normalizedRow.name || normalizedRow.last_name || normalizedRow.lastname || normalizedRow.last || '').trim(),
            first_name: String(normalizedRow.prenom || normalizedRow.first_name || normalizedRow.firstname || normalizedRow.first || '').trim(),
          };
        }).filter(s => s.matricule && s.last_name && s.first_name);

        if (students.length === 0) {
          throw new Error("No valid data found. Ensure your columns are named: Matricule, Nom, Prénom.");
        }

        // Check for duplicates within the current room list in the store
        const existingMatricules = new Set(useAppStore.getState().currentStudents.map(s => String(s.matricule)));
        const duplicatesInImport = students.filter(s => existingMatricules.has(String(s.matricule)));
        
        if (duplicatesInImport.length > 0) {
          const duplicateList = duplicatesInImport.slice(0, 3).map(s => s.matricule).join(', ');
          throw new Error(`Import failed: ${duplicatesInImport.length} students (including ${duplicateList}...) already exist in this room.`);
        }

        const { error: insertError } = await supabase.from('students').insert(students);
        if (insertError) throw insertError;

        await fetchRoomData(currentRoom.id);
        setSuccess(`${students.length} students imported successfully.`);
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Failed to import students.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-modal relative w-full max-w-lg rounded-[2.5rem] p-10 overflow-hidden animate-in fade-in zoom-in duration-300 text-white">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/55 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-white/10 rounded-2xl text-white">
              <FileSpreadsheet size={32} />
           </div>
           <div>
              <h3 className="font-headline text-2xl font-extrabold text-white leading-tight">Student Roster</h3>
              <p className="text-sm font-medium text-white/65">Manage students in this academic space.</p>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 p-1 rounded-2xl mb-8 border border-white/10">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Import File
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/15 text-rose-100 rounded-2xl text-sm border border-rose-300/15">
            <AlertCircle size={18} />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/15 text-emerald-100 rounded-2xl text-sm border border-emerald-300/15 animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Matricule / Student ID</label>
              <input 
                type="text" 
                required
                className="px-6 py-4 bg-white/90 rounded-2xl border border-white/15 text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all font-mono text-sm"
                placeholder="e.g. 23006"
                value={formData.matricule}
                onChange={e => setFormData({ ...formData, matricule: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">Last Name</label>
                <input 
                  type="text" 
                  required
                  className="px-6 py-4 bg-white/90 rounded-2xl border border-white/15 text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm font-medium"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-label uppercase tracking-widest text-white/60 ml-4">First Name</label>
                <input 
                  type="text" 
                  required
                  className="px-6 py-4 bg-white/90 rounded-2xl border border-white/15 text-slate-900 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm font-medium"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-terra text-white py-5 rounded-[2rem] font-bold hover:bg-terra-dark shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Add Student"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div 
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`border border-dashed border-white/20 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-white/35 hover:bg-white/5 transition-all cursor-pointer group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="p-4 bg-white/10 rounded-full text-white/65 group-hover:text-white group-hover:bg-white/15 transition-colors">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-white">Click to upload file</p>
                <p className="text-xs text-white/60 mt-1">Supports .xlsx, .xls, .csv</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
              />
            </div>

            {/* Visual Template Example - Square Edges like Excel */}
            <div className="bg-white/5 rounded-none border border-white/10 p-6">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-terra-light">Expected File Structure</p>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-none text-white/40 font-mono border border-white/10">Example</span>
               </div>
               <div className="overflow-hidden rounded-none border border-white/20 shadow-inner">
                  <table className="w-full text-left text-[11px] font-sans border-collapse">
                    <thead className="bg-white/10 text-white/50">
                      <tr>
                        <th className="p-2 font-bold border-r border-white/20">Matricule</th>
                        <th className="p-2 font-bold border-r border-white/20">Nom</th>
                        <th className="p-2 font-bold">Prénom</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 text-white/70">
                      <tr className="border-t border-white/20">
                        <td className="p-2 border-r border-white/20 font-mono">23001</td>
                        <td className="p-2 border-r border-white/20">DOE</td>
                        <td className="p-2 font-medium">Jane</td>
                      </tr>
                      <tr className="border-t border-white/20 opacity-50">
                        <td className="p-2 border-r border-white/20 font-mono">23002</td>
                        <td className="p-2 border-r border-white/20">SMITH</td>
                        <td className="p-2 font-medium">John</td>
                      </tr>
                    </tbody>
                  </table>
               </div>
               <p className="mt-3 text-[10px] text-white/40 leading-relaxed italic text-center">
                  The system also detects: "ID", "Last Name", "First Name", "Name".
               </p>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center gap-3 text-white/70 font-medium py-4">
                 <Loader2 className="animate-spin" size={20} />
                 Analyzing document...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
