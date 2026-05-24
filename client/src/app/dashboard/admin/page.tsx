'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Loader2,
  Users,
  Calendar,
  ShieldAlert,
  BarChart3,
  Trash2,
  UserPlus,
  ChevronRight,
  Search,
  X,
  Clock,
  MapPin,
  ClipboardList,
  Activity,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

/* ─── Shared Types ─── */
interface PublicUser {
  id: string;
  email: string;
  role: 'admin' | 'nurse' | 'patient';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}

interface Patient {
  id: string;
  userId?: string;
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
  assignedNurseId?: string;
}

interface Booking {
  id: string;
  scheduledAt: string;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string;
  location?: string;
  notes?: string;
  nurseId?: string;
  patientId?: string;
  patient?: { id: string; firstName?: string; lastName?: string; email?: string };
  nurse?: { id: string; firstName: string; lastName: string; email: string };
}

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
  completed: 'bg-green-500/10 text-green-600 border border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

/* ─── Dashboard Content ─── */
function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || '';
  const { apiFetch } = useAuth();

  /* ─── Global data ─── */
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [nurses, setNurses] = useState<PublicUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ─── Analytics computed ─── */
  const totalPatients = patients.length;
  const totalNurses = nurses.length;
  const activeBookings = bookings.filter(b => !['cancelled', 'completed'].includes(b.status)).length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  /* Bookings by city */
  const bookingsByCity: Record<string, number> = {};
  bookings.forEach(b => {
    const city = b.location || 'Unknown';
    bookingsByCity[city] = (bookingsByCity[city] || 0) + 1;
  });
  const cityEntries = Object.entries(bookingsByCity).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cityMax = cityEntries.length > 0 ? Math.max(...cityEntries.map(c => c[1])) : 1;

  /* Status distribution */
  const statusCounts: Record<string, number> = { requested: 0, confirmed: 0, in_progress: 0, completed: 0, cancelled: 0 };
  bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
  const statusTotal = bookings.length || 1;
  const statusColors: Record<string, string> = {
    requested: '#eab308',
    confirmed: '#3b82f6',
    in_progress: '#a855f7',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };

  /* ─── Patient manager state ─── */
  const [patientSearch, setPatientSearch] = useState('');
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '', lastName: '', email: '', birthDate: '', gender: 'unknown',
    bloodType: '', address: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '', assignedNurseId: '',
  });
  const [savingPatient, setSavingPatient] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);

  /* ─── Scheduling state ─── */
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [nurseAssignments, setNurseAssignments] = useState<Record<string, string>>({});

  /* ─── Audit state ─── */
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  /* ─── Data fetchers ─── */
  const fetchPatients = async () => {
    try {
      const res = await apiFetch('/api/patients?limit=200');
      if (res.ok) { const d = await res.json(); setPatients(d.data?.data || []); }
    } catch { toast.error('Failed to load patients.'); }
  };

  const fetchBookings = async () => {
    try {
      const res = await apiFetch('/api/bookings?limit=200');
      if (res.ok) { const d = await res.json(); setBookings(d.data?.data || []); }
    } catch { toast.error('Failed to load bookings.'); }
  };

  const fetchNurses = async () => {
    try {
      const res = await apiFetch('/api/users?role=nurse&limit=100');
      if (res.ok) { const d = await res.json(); setNurses(d.data?.data || []); }
    } catch { toast.error('Failed to load nurses.'); }
  };

  const fetchAudit = async (page = 1) => {
    try {
      let url = `/api/audit-logs?page=${page}&limit=15`;
      if (auditAction) url += `&action=${auditAction}`;
      if (auditEntity) url += `&entity=${auditEntity}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const d = await res.json();
        setAuditLogs(d.data?.data || []);
        setAuditTotal(d.data?.meta?.total || 0);
      }
    } catch { toast.error('Failed to load audit logs.'); }
  };

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      if (activeTab === '' || activeTab === 'analytics') {
        await Promise.all([fetchPatients(), fetchBookings(), fetchNurses()]);
      } else if (activeTab === 'patients') {
        await Promise.all([fetchPatients(), fetchNurses()]);
      } else if (activeTab === 'scheduling') {
        await Promise.all([fetchBookings(), fetchNurses()]);
      } else if (activeTab === 'audit') {
        await fetchAudit(1);
      }
      setLoading(false);
    };
    load();
  }, [activeTab]);

  /* ─── Patient CRUD ─── */
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPatient(true);
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(newPatientForm)) { if (v) body[k] = v; }
      const res = await apiFetch('/api/patients', { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) {
        toast.success('Patient registered.');
        setShowCreatePatient(false);
        setNewPatientForm({ firstName: '', lastName: '', email: '', birthDate: '', gender: 'unknown', bloodType: '', address: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '', assignedNurseId: '' });
        await fetchPatients();
      } else {
        const d = await res.json();
        throw new Error(d.message || 'Failed to create.');
      }
    } catch (e: any) { toast.error(e.message); } finally { setSavingPatient(false); }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Soft-delete this patient?')) return;
    setDeletingPatientId(id);
    try {
      const res = await apiFetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        toast.success('Patient removed.');
        setPatients(prev => prev.filter(p => p.id !== id));
      } else { throw new Error('Delete failed.'); }
    } catch (e: any) { toast.error(e.message); } finally { setDeletingPatientId(null); }
  };

  /* ─── Nurse assignment ─── */
  const handleAssignNurse = async (bookingId: string) => {
    const nurseId = nurseAssignments[bookingId];
    if (!nurseId) { toast.warning('Pick a nurse first.'); return; }
    setAssigningId(bookingId);
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nurseId }),
      });
      if (res.ok) {
        toast.success('Nurse assigned to booking.');
        await fetchBookings();
      } else {
        const d = await res.json();
        throw new Error(d.message || 'Assignment failed.');
      }
    } catch (e: any) { toast.error(e.message); } finally { setAssigningId(null); }
  };

  /* ─── Audit pagination ─── */
  const handleAuditPageChange = (p: number) => {
    setAuditPage(p);
    fetchAudit(p);
  };

  const handleAuditFilter = () => {
    setAuditPage(1);
    fetchAudit(1);
  };

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return p.firstName?.toLowerCase().includes(q) || p.lastName?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
  });

  /* ─── SVG pie chart helpers ─── */
  const pieSegments = (() => {
    const items = Object.entries(statusCounts).filter(([, v]) => v > 0);
    let cumAngle = 0;
    return items.map(([status, count]) => {
      const pct = count / statusTotal;
      const startAngle = cumAngle;
      cumAngle += pct * 360;
      const endAngle = cumAngle;
      const largeArc = pct > 0.5 ? 1 : 0;
      const r = 70;
      const cx = 90, cy = 90;
      const x1 = cx + r * Math.cos((Math.PI / 180) * (startAngle - 90));
      const y1 = cy + r * Math.sin((Math.PI / 180) * (startAngle - 90));
      const x2 = cx + r * Math.cos((Math.PI / 180) * (endAngle - 90));
      const y2 = cy + r * Math.sin((Math.PI / 180) * (endAngle - 90));
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { status, count, pct, d, color: statusColors[status] || '#666' };
    });
  })();

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm';
  const labelCls = 'text-[10px] font-bold uppercase tracking-wider text-text/60';

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
          <p className="text-sm text-text/60 mt-1">Full platform oversight — analytics, patients, scheduling, and audit trail.</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-500/20 flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5" /> Superuser Access
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary/60" /></div>
      )}

      {/* ==================== ANALYTICS TAB ==================== */}
      {!loading && (activeTab === '' || activeTab === 'analytics') && (
        <div className="flex flex-col gap-8">
          {/* Metrics Deck */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { label: 'Total Patients', value: totalPatients, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Nurses', value: totalNurses, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Active Bookings', value: activeBookings, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Completed', value: completedBookings, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: 'Cancelled', value: cancelledBookings, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map(m => (
              <div key={m.label} className="glass p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1">
                <span className={`text-3xl font-extrabold ${m.color}`}>{m.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text/50">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bookings by Location */}
            <div className="glass p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-2 mb-6 border-b border-text/5 pb-3">
                <BarChart3 className="h-5 w-5 text-primary" /> Bookings by Location
              </h3>
              {cityEntries.length === 0 ? (
                <p className="text-xs text-text/40 text-center py-8">No booking data yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {cityEntries.map(([city, count]) => (
                    <div key={city} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-text/70 w-24 truncate shrink-0">{city}</span>
                      <div className="flex-1 bg-text/5 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                          style={{ width: `${Math.max((count / cityMax) * 100, 8)}%` }}
                        >
                          <span className="text-[10px] font-bold text-bg">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Distribution Pie */}
            <div className="glass p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-2 mb-6 border-b border-text/5 pb-3">
                <Activity className="h-5 w-5 text-primary" /> Status Distribution
              </h3>
              {bookings.length === 0 ? (
                <p className="text-xs text-text/40 text-center py-8">No booking data yet.</p>
              ) : (
                <div className="flex items-center justify-center gap-8">
                  <svg viewBox="0 0 180 180" className="w-36 h-36 shrink-0">
                    {pieSegments.map(seg => (
                      <path key={seg.status} d={seg.d} fill={seg.color} opacity={0.85} className="hover:opacity-100 transition-opacity" />
                    ))}
                    <circle cx="90" cy="90" r="35" className="fill-bg" />
                    <text x="90" y="86" textAnchor="middle" className="fill-text text-xs font-bold">{bookings.length}</text>
                    <text x="90" y="100" textAnchor="middle" className="fill-text/50 text-[8px]">TOTAL</text>
                  </svg>
                  <div className="flex flex-col gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: statusColors[status] }} />
                        <span className="text-text/70 capitalize font-medium">{status.replace('_', ' ')}</span>
                        <span className="font-bold text-text/80 ml-auto">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PATIENTS MANAGER TAB ==================== */}
      {!loading && activeTab === 'patients' && (
        <div className="flex flex-col gap-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text/30" />
              <input
                type="text"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                placeholder="Search patients by name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <button
              onClick={() => setShowCreatePatient(!showCreatePatient)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-lg shadow-primary/15"
            >
              <UserPlus className="h-4 w-4" /> Register Patient
            </button>
          </div>

          {/* Create Patient Form */}
          {showCreatePatient && (
            <div className="glass p-6 rounded-3xl shadow-sm animate-in">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 border-b border-text/5 pb-3">
                <UserPlus className="h-5 w-5 text-primary" /> New Patient Profile
              </h3>
              <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>First Name</label>
                  <input value={newPatientForm.firstName} onChange={e => setNewPatientForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Last Name</label>
                  <input value={newPatientForm.lastName} onChange={e => setNewPatientForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Email</label>
                  <input type="email" value={newPatientForm.email} onChange={e => setNewPatientForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Date of Birth</label>
                  <input type="date" value={newPatientForm.birthDate} onChange={e => setNewPatientForm(p => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Gender</label>
                  <select value={newPatientForm.gender} onChange={e => setNewPatientForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                    <option value="unknown">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Blood Type</label>
                  <input value={newPatientForm.bloodType} onChange={e => setNewPatientForm(p => ({ ...p, bloodType: e.target.value }))} placeholder="A+, O-, ..." className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className={labelCls}>Address</label>
                  <input value={newPatientForm.address} onChange={e => setNewPatientForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address..." className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Assign Primary Nurse</label>
                  <select value={newPatientForm.assignedNurseId} onChange={e => setNewPatientForm(p => ({ ...p, assignedNurseId: e.target.value }))} className={inputCls}>
                    <option value="">None</option>
                    {nurses.map(n => <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Emergency Contact</label>
                  <input value={newPatientForm.emergencyContactName} onChange={e => setNewPatientForm(p => ({ ...p, emergencyContactName: e.target.value }))} placeholder="Name" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Emergency Phone</label>
                  <input value={newPatientForm.emergencyContactPhone} onChange={e => setNewPatientForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} placeholder="+1 555..." className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Allergies</label>
                  <input value={newPatientForm.allergies} onChange={e => setNewPatientForm(p => ({ ...p, allergies: e.target.value }))} placeholder="Penicillin, Latex..." className={inputCls} />
                </div>
                <div className="md:col-span-3 pt-2">
                  <button type="submit" disabled={savingPatient} className="w-full bg-primary text-bg font-semibold py-3 rounded-xl shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                    {savingPatient ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    Register Patient
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Patient Table */}
          <div className="glass rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-text/5">
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Patient</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Gender</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Blood</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Allergies</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Nurse</th>
                    <th className="text-right px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-text/40 text-xs">No patients found.</td></tr>
                  ) : (
                    filteredPatients.map(p => (
                      <tr key={p.id} className="border-b border-text/[0.03] hover:bg-text/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                              {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{p.firstName} {p.lastName}</p>
                              <p className="text-[11px] text-text/50 truncate">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text/70 capitalize">{p.gender || 'N/A'}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-text/80">{p.bloodType || '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-red-500 max-w-[120px] truncate">{p.allergies || '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-text/60">
                          {p.assignedNurseId ? (
                            <span className="text-emerald-500 font-semibold">Assigned</span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDeletePatient(p.id)}
                            disabled={deletingPatientId === p.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-500/10 hover:bg-red-500/5 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {deletingPatientId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCHEDULING TAB ==================== */}
      {!loading && activeTab === 'scheduling' && (
        <div className="flex flex-col gap-6">
          <div className="glass p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3 mb-6">
              <Calendar className="h-5 w-5 text-primary" /> Network Schedule Coordinator
            </h2>

            {bookings.length === 0 ? (
              <p className="text-xs text-text/40 text-center py-12">No bookings in the system.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {bookings.filter(b => b.status !== 'cancelled').map(booking => (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl bg-text/[0.025] border border-text/5 flex flex-col gap-3 hover:border-primary/20 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{booking.patient?.firstName} {booking.patient?.lastName}</p>
                        <p className="text-[11px] text-text/50 truncate">{booking.patient?.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 ${STATUS_BADGE[booking.status]}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-text/60">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary/60" /> {new Date(booking.scheduledAt).toLocaleString()}</div>
                      {booking.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary/60" /> {booking.location}</div>}
                      {booking.reason && <div className="flex items-center gap-1.5"><ClipboardList className="h-3 w-3 text-primary/60" /> {booking.reason}</div>}
                    </div>

                    {/* Nurse Assignment */}
                    <div className="border-t border-text/5 pt-3 mt-auto">
                      {booking.nurse ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold uppercase">
                            {booking.nurse.firstName[0]}{booking.nurse.lastName[0]}
                          </div>
                          <span className="font-semibold text-emerald-600">{booking.nurse.firstName} {booking.nurse.lastName}</span>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            value={nurseAssignments[booking.id] || ''}
                            onChange={e => setNurseAssignments(prev => ({ ...prev, [booking.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg border border-text/10 bg-bg text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Assign nurse...</option>
                            {nurses.map(n => <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>)}
                          </select>
                          <button
                            onClick={() => handleAssignNurse(booking.id)}
                            disabled={assigningId === booking.id}
                            className="px-3 py-2 rounded-lg bg-primary text-bg text-xs font-bold hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center gap-1 transition-all"
                          >
                            {assigningId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOGS TAB ==================== */}
      {!loading && activeTab === 'audit' && (
        <div className="flex flex-col gap-6">
          {/* Filters */}
          <div className="glass p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <label className={labelCls}>Action</label>
              <select value={auditAction} onChange={e => setAuditAction(e.target.value)} className={inputCls}>
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className={labelCls}>Entity</label>
              <select value={auditEntity} onChange={e => setAuditEntity(e.target.value)} className={inputCls}>
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Patient">Patient</option>
                <option value="Booking">Booking</option>
                <option value="MedicalHistory">MedicalHistory</option>
                <option value="ClinicalNote">ClinicalNote</option>
              </select>
            </div>
            <button onClick={handleAuditFilter} className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:opacity-90 active:scale-[0.98] cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-primary/15">
              <RefreshCw className="h-4 w-4" /> Apply
            </button>
          </div>

          {/* Logs Table */}
          <div className="glass rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-text/5">
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Timestamp</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Action</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Entity</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Entity ID</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">User ID</th>
                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">IP</th>
                    <th className="text-right px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-text/40">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-text/40 text-xs">No audit logs found.</td></tr>
                  ) : (
                    auditLogs.map(log => {
                      const actionColors: Record<string, string> = {
                        CREATE: 'bg-green-500/10 text-green-600',
                        UPDATE: 'bg-blue-500/10 text-blue-600',
                        DELETE: 'bg-red-500/10 text-red-600',
                      };
                      const isExpanded = expandedLogId === log.id;

                      return (
                        <React.Fragment key={log.id}>
                          <tr className="border-b border-text/[0.03] hover:bg-text/[0.02] transition-colors">
                            <td className="px-5 py-3 text-xs text-text/60 font-mono whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${actionColors[log.action] || 'bg-text/10 text-text/60'}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-semibold text-text/80">{log.entity}</td>
                            <td className="px-5 py-3 text-[11px] text-text/50 font-mono">{log.entityId?.substring(0, 8)}...</td>
                            <td className="px-5 py-3 text-[11px] text-text/50 font-mono">{log.userId?.substring(0, 8) || '—'}...</td>
                            <td className="px-5 py-3 text-[11px] text-text/50">{log.ipAddress || '—'}</td>
                            <td className="px-5 py-3 text-right">
                              {(log.oldValue || log.newValue) && (
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 hover:bg-primary/5 cursor-pointer transition-all"
                                >
                                  <Eye className="h-3 w-3" /> {isExpanded ? 'Hide' : 'View'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-text/[0.03]">
                              <td colSpan={7} className="px-5 py-4 bg-text/[0.015]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  {log.oldValue && (
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-500/80 block mb-2">Old Value</span>
                                      <pre className="bg-text/[0.03] p-3 rounded-xl overflow-x-auto text-text/70 text-[11px] font-mono leading-relaxed max-h-[200px]">
                                        {JSON.stringify(log.oldValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.newValue && (
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-500/80 block mb-2">New Value</span>
                                      <pre className="bg-text/[0.03] p-3 rounded-xl overflow-x-auto text-text/70 text-[11px] font-mono leading-relaxed max-h-[200px]">
                                        {JSON.stringify(log.newValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditTotal > 15 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-text/5">
                <span className="text-xs text-text/50">
                  Showing {(auditPage - 1) * 15 + 1}–{Math.min(auditPage * 15, auditTotal)} of {auditTotal}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAuditPageChange(auditPage - 1)}
                    disabled={auditPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-text/10 text-xs font-semibold hover:bg-text/5 cursor-pointer disabled:opacity-30 transition-all"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => handleAuditPageChange(auditPage + 1)}
                    disabled={auditPage * 15 >= auditTotal}
                    className="px-3 py-1.5 rounded-lg border border-text/10 text-xs font-semibold hover:bg-text/5 cursor-pointer disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
