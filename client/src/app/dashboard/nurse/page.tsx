'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Loader2,
  UserCheck,
  ClipboardList,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Search,
  X,
  Plus,
  Heart,
  FileText,
  MapPin,
  User,
  Activity,
} from 'lucide-react';

interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  userId?: string;
}

interface MedicalHistory {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  diagnosedAt?: string;
  resolvedAt?: string | null;
}

interface ClinicalNote {
  id: string;
  content: string;
  type: 'general' | 'progress' | 'medication' | 'discharge';
  noteDate: string;
  createdAt: string;
}

interface Booking {
  id: string;
  scheduledAt: string;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string;
  location?: string;
  notes?: string;
  patient?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
  completed: 'bg-green-500/10 text-green-600 border border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const NEXT_STATUS: Record<string, { label: string; next: string } | null> = {
  requested: { label: 'Confirm Visit', next: 'confirmed' },
  confirmed: { label: 'Start Visit', next: 'in_progress' },
  in_progress: { label: 'Mark Complete', next: 'completed' },
  completed: null,
  cancelled: null,
};

function NurseDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || '';
  const { apiFetch } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Patient directory state
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<MedicalHistory[]>([]);
  const [patientNotes, setPatientNotes] = useState<ClinicalNote[]>([]);
  const [isLoadingPatientDetail, setIsLoadingPatientDetail] = useState(false);

  // Clinical records form
  const [recordMode, setRecordMode] = useState<'diagnostic' | 'note'>('diagnostic');
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState('');
  // Diagnostic fields
  const [diagTitle, setDiagTitle] = useState('');
  const [diagDescription, setDiagDescription] = useState('');
  const [diagSeverity, setDiagSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [diagDate, setDiagDate] = useState('');
  // Note fields
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'progress' | 'medication' | 'discharge'>('general');
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Booking transition state
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await apiFetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data?.data || []);
      }
    } catch (e) {
      toast.error('Failed to load bookings.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await apiFetch('/api/patients?limit=100');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.data?.data || []);
      }
    } catch (e) {
      toast.error('Failed to load patients.');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (activeTab === '' || activeTab === 'queue') {
      fetchBookings();
    } else if (activeTab === 'patients') {
      fetchPatients();
    } else if (activeTab === 'records') {
      fetchPatients();
    }
  }, [activeTab]);

  const handleTransition = async (bookingId: string, nextStatus: string) => {
    setTransitioningId(bookingId);
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Booking marked as ${nextStatus.replace('_', ' ')}.`);
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus as Booking['status'] } : b));
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to update status.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Status update failed.');
    } finally {
      setTransitioningId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Booking cancelled.');
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to cancel.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Cancel failed.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingPatientDetail(true);
    try {
      const [histRes, notesRes] = await Promise.all([
        apiFetch(`/api/patients/${patient.id}/medical-history`),
        apiFetch(`/api/patients/${patient.id}/clinical-notes`),
      ]);
      if (histRes.ok) {
        const d = await histRes.json();
        setPatientHistory(d.data || []);
      }
      if (notesRes.ok) {
        const d = await notesRes.json();
        setPatientNotes(d.data || []);
      }
    } catch (e) {
      toast.error('Failed to load patient details.');
    } finally {
      setIsLoadingPatientDetail(false);
    }
  };

  const handleSaveDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForRecord) {
      toast.warning('Please select a patient first.');
      return;
    }
    setIsSavingRecord(true);
    try {
      const res = await apiFetch(`/api/patients/${selectedPatientForRecord}/medical-history`, {
        method: 'POST',
        body: JSON.stringify({
          title: diagTitle,
          description: diagDescription,
          severity: diagSeverity,
          diagnosedAt: diagDate || undefined,
        }),
      });
      if (res.ok) {
        toast.success('Diagnostic entry filed successfully.');
        setDiagTitle('');
        setDiagDescription('');
        setDiagSeverity('low');
        setDiagDate('');
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to save diagnostic.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed.');
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleSaveClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForRecord) {
      toast.warning('Please select a patient first.');
      return;
    }
    setIsSavingRecord(true);
    try {
      const res = await apiFetch(`/api/patients/${selectedPatientForRecord}/clinical-notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: noteContent,
          type: noteType,
        }),
      });
      if (res.ok) {
        toast.success('Clinical note logged successfully.');
        setNoteContent('');
        setNoteType('general');
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to save note.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed.');
    } finally {
      setIsSavingRecord(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Nurse Console</h1>
          <p className="text-sm text-text/60 mt-1">Manage assigned visits, patient lookups, and clinical records.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-xl text-xs font-semibold text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            {activeBookings.length} Active Visits
          </div>
          <div className="glass px-4 py-2 rounded-xl text-xs font-semibold text-text/50 flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5" />
            {completedBookings.length} Completed
          </div>
        </div>
      </div>

      {/* ==================== QUEUE TAB (default) ==================== */}
      {(activeTab === '' || activeTab === 'queue') && (
        <div className="flex flex-col gap-6">
          <div className="glass p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-text/5 pb-3">
              <Calendar className="h-5 w-5 text-primary" /> Assigned Bookings Queue
            </h2>

            {isLoadingBookings ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
              </div>
            ) : bookings.filter(b => b.status !== 'cancelled').length === 0 ? (
              <div className="text-center py-12 text-text/40">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No bookings assigned yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {bookings
                  .filter(b => b.status !== 'cancelled')
                  .map(booking => {
                    const transition = NEXT_STATUS[booking.status];
                    const isTransitioning = transitioningId === booking.id;
                    const isCancelling = cancellingId === booking.id;

                    return (
                      <div
                        key={booking.id}
                        className="p-5 rounded-2xl bg-text/[0.025] border border-text/5 flex flex-col gap-3 hover:border-primary/20 transition-all"
                      >
                        {/* Status + Patient */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-bold text-sm truncate">
                              {booking.patient?.firstName} {booking.patient?.lastName}
                            </span>
                            <span className="text-[10px] text-text/50 truncate">{booking.patient?.email}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${STATUS_BADGE[booking.status]}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Booking Info */}
                        <div className="flex flex-col gap-1.5 text-xs text-text/60">
                          {booking.reason && (
                            <div className="flex items-center gap-1.5">
                              <ClipboardList className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                              <span className="truncate">{booking.reason}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                            <span>{new Date(booking.scheduledAt).toLocaleString()}</span>
                          </div>
                          {booking.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                              <span className="truncate">{booking.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-text/5">
                          {transition && (
                            <button
                              onClick={() => handleTransition(booking.id, transition.next)}
                              disabled={isTransitioning}
                              className="w-full py-2 rounded-xl bg-primary text-bg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isTransitioning ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              {transition.label}
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <div className="w-full py-2 rounded-xl border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5" /> Visit Complete
                            </div>
                          )}
                          {booking.status !== 'completed' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={isCancelling}
                              className="w-full py-2 rounded-xl border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/5 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              Cancel Visit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PATIENT DIRECTORY TAB ==================== */}
      {activeTab === 'patients' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Patients list */}
          <div className="lg:col-span-2 glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
              <UserCheck className="h-5 w-5 text-primary" /> Patient Directory
            </h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X className="h-4 w-4 text-text/30 hover:text-text/60" />
                </button>
              )}
            </div>

            {isLoadingPatients ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-text/40 text-sm">
                {search ? 'No matching patients found.' : 'No patients assigned.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[550px]">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedPatient?.id === p.id
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-text/5 hover:bg-text/[0.03] hover:border-text/10 text-text'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                        selectedPatient?.id === p.id ? 'bg-primary/20 text-primary' : 'bg-text/5 text-text/60'
                      }`}>
                        {p.firstName?.[0] || '?'}{p.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-[11px] text-text/50 truncate mt-0.5">{p.email}</p>
                      </div>
                      {selectedPatient?.id === p.id && (
                        <ChevronRight className="h-4 w-4 ml-auto shrink-0 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Patient Detail Panel */}
          <div className="lg:col-span-3">
            {!selectedPatient ? (
              <div className="glass p-10 rounded-3xl shadow-sm h-full flex flex-col items-center justify-center text-text/30 gap-3">
                <User className="h-14 w-14 opacity-20" />
                <p className="text-sm font-medium">Select a patient to view their clinical summary.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Patient Header Card */}
                <div className="glass p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase border border-primary/15">
                      {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                      <p className="text-sm text-text/50">{selectedPatient.email}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="ml-auto cursor-pointer">
                      <X className="h-5 w-5 text-text/30 hover:text-text/60 transition-colors" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Blood Type', value: selectedPatient.bloodType || 'N/A' },
                      { label: 'Gender', value: selectedPatient.gender || 'N/A' },
                      { label: 'DOB', value: selectedPatient.birthDate || 'N/A' },
                      { label: 'Allergies', value: selectedPatient.allergies || 'None', danger: !!selectedPatient.allergies },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col p-3 bg-text/[0.02] rounded-xl border border-text/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text/40">{f.label}</span>
                        <span className={`font-bold text-sm mt-0.5 ${f.danger ? 'text-red-500' : 'text-text/80'}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isLoadingPatientDetail ? (
                  <div className="flex justify-center py-12 glass rounded-3xl">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                  </div>
                ) : (
                  <>
                    {/* Medical History */}
                    <div className="glass p-6 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-base flex items-center gap-2 mb-4 border-b border-text/5 pb-3">
                        <Heart className="h-4.5 w-4.5 text-primary" /> Medical History ({patientHistory.length})
                      </h4>
                      {patientHistory.length === 0 ? (
                        <p className="text-xs text-text/40 text-center py-4">No history recorded.</p>
                      ) : (
                        <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto">
                          {patientHistory.map(h => (
                            <div key={h.id} className="p-3 rounded-xl bg-text/[0.02] border border-text/5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{h.title}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  { low: 'bg-green-500/10 text-green-600', medium: 'bg-yellow-500/10 text-yellow-600', high: 'bg-orange-500/10 text-orange-600', critical: 'bg-red-500/10 text-red-600' }[h.severity]
                                }`}>{h.severity}</span>
                                {h.resolvedAt ? (
                                  <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold"><CheckCircle className="h-2.5 w-2.5" /> Resolved</span>
                                ) : (
                                  <span className="text-[9px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold"><AlertCircle className="h-2.5 w-2.5" /> Active</span>
                                )}
                              </div>
                              <p className="text-xs text-text/60">{h.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clinical Notes */}
                    <div className="glass p-6 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-base flex items-center gap-2 mb-4 border-b border-text/5 pb-3">
                        <FileText className="h-4.5 w-4.5 text-primary" /> Clinical Notes ({patientNotes.length})
                      </h4>
                      {patientNotes.length === 0 ? (
                        <p className="text-xs text-text/40 text-center py-4">No notes filed.</p>
                      ) : (
                        <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto">
                          {patientNotes.map(n => (
                            <div key={n.id} className="p-3 rounded-xl bg-text/[0.02] border border-text/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{n.type}</span>
                                <span className="text-[10px] text-text/40">{new Date(n.noteDate || n.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-text/70 italic">"{n.content}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CLINICAL RECORDS TAB ==================== */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            {/* Patient selector */}
            <div className="glass p-6 rounded-3xl shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3 mb-4">
                <User className="h-5 w-5 text-primary" /> Select Patient
              </h2>
              {isLoadingPatients ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : (
                <select
                  value={selectedPatientForRecord}
                  onChange={e => setSelectedPatientForRecord(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mode Selector */}
            <div className="glass p-6 rounded-3xl shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3 mb-4">
                <Plus className="h-5 w-5 text-primary" /> Record Type
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'diagnostic', label: 'Diagnostic Entry', icon: Heart },
                  { id: 'note', label: 'Clinical Note', icon: FileText },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setRecordMode(id as 'diagnostic' | 'note')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-semibold cursor-pointer transition-all ${
                      recordMode === id
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-text/10 text-text/60 hover:bg-text/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl shadow-sm">
            {/* Diagnostic Form */}
            {recordMode === 'diagnostic' && (
              <>
                <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3 mb-4">
                  <Heart className="h-5 w-5 text-primary" /> File Diagnostic Entry
                </h2>
                <form onSubmit={handleSaveDiagnostic} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Condition Title</label>
                    <input
                      type="text"
                      value={diagTitle}
                      onChange={e => setDiagTitle(e.target.value)}
                      placeholder="e.g. Hypertension Stage 2"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Description / Observations</label>
                    <textarea
                      value={diagDescription}
                      onChange={e => setDiagDescription(e.target.value)}
                      placeholder="Detailed clinical observations..."
                      rows={3}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Severity</label>
                      <select
                        value={diagSeverity}
                        onChange={e => setDiagSeverity(e.target.value as typeof diagSeverity)}
                        className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Diagnosed Date</label>
                      <input
                        type="date"
                        value={diagDate}
                        onChange={e => setDiagDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingRecord}
                    className="w-full bg-primary text-bg font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSavingRecord ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    File Diagnostic Entry
                  </button>
                </form>
              </>
            )}

            {/* Clinical Note Form */}
            {recordMode === 'note' && (
              <>
                <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3 mb-4">
                  <FileText className="h-5 w-5 text-primary" /> Log Clinical Note
                </h2>
                <form onSubmit={handleSaveClinicalNote} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Note Type</label>
                    <select
                      value={noteType}
                      onChange={e => setNoteType(e.target.value as typeof noteType)}
                      className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    >
                      <option value="general">General</option>
                      <option value="progress">Progress</option>
                      <option value="medication">Medication</option>
                      <option value="discharge">Discharge</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Note Content</label>
                    <textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Write your clinical observations, medication changes, or patient progress..."
                      rows={7}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingRecord}
                    className="w-full bg-primary text-bg font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSavingRecord ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    Log Clinical Note
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NurseDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <NurseDashboardContent />
    </Suspense>
  );
}
