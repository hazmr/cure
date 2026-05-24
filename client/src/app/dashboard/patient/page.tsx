'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  Shield,
  Plus,
  Loader2,
  CalendarPlus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PatientProfile {
  id: string;
  birthDate?: string;
  gender: 'female' | 'male' | 'other' | 'unknown';
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  assignedNurseId?: string;
}

interface MedicalHistoryItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolvedAt?: string | null;
  diagnosedAt: string;
  description?: string;
}

interface ClinicalNote {
  id: string;
  content: string;
  type: 'general' | 'progress' | 'medication' | 'discharge';
  createdAt: string;
}

interface Booking {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string;
  location?: string;
  notes?: string;
  nurse?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function PatientDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || '';
  const { user, apiFetch } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [history, setHistory] = useState<MedicalHistoryItem[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - Profile Creation
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'unknown'>('unknown');
  const [bloodType, setBloodType] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states - Booking Creation
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [serviceReason, setServiceReason] = useState('');
  const [bookingLocation, setBookingLocation] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [targetNurseId, setTargetNurseId] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch patient profile
      const profRes = await apiFetch('/api/patients');
      if (profRes.ok) {
        const profBody = await profRes.json();
        // Since list() filters by userId for patients, data contains patient items
        const patientRecord = profBody.data?.data?.[0] || null;
        setProfile(patientRecord);

        if (patientRecord) {
          // 2. Fetch history & notes
          const [histRes, notesRes, bookRes] = await Promise.all([
            apiFetch(`/api/patients/${patientRecord.id}/medical-history`),
            apiFetch(`/api/patients/${patientRecord.id}/clinical-notes`),
            apiFetch('/api/bookings'),
          ]);

          if (histRes.ok) {
            const histData = await histRes.json();
            setHistory(histData.data || []);
          }
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            setNotes(notesData.data || []);
          }
          if (bookRes.ok) {
            const bookData = await bookRes.json();
            setBookings(bookData.data?.data || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching patient records:', e);
      toast.error('Failed to synchronize medical details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await apiFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          birthDate: birthDate || undefined,
          gender,
          bloodType: bloodType || undefined,
          phone: phone || undefined,
          email: user?.email,
          address: address || undefined,
          emergencyContactName: emergencyName || undefined,
          emergencyContactPhone: emergencyPhone || undefined,
          allergies: allergies || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Medical profile activated successfully!');
        fetchPatientData();
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to save profile.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Profile save error.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!bookingDate || !bookingTime || !targetNurseId) {
      toast.warning('Please select a date, time, and clinic nurse.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00.000Z`).toISOString();
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          patientId: profile.id,
          nurseId: targetNurseId,
          scheduledAt,
          reason: serviceReason || undefined,
          location: bookingLocation || undefined,
          notes: bookingNotes || undefined,
          durationMinutes: 60,
        }),
      });

      if (res.ok) {
        toast.success('Appointment requested successfully!');
        setServiceReason('');
        setBookingNotes('');
        setBookingLocation('');
        // Refresh
        const bookRes = await apiFetch('/api/bookings');
        if (bookRes.ok) {
          const bookData = await bookRes.json();
          setBookings(bookData.data?.data || []);
        }
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Double-booking conflict detected. Try another slot.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Booking failed.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await apiFetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Appointment cancelled successfully.');
        setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to cancel appointment.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Cancellation failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Phase 1: Complete Profile Screen
  if (!profile) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Setup Medical Profile</h1>
          <p className="text-sm text-text/60">
            Please register your basic clinical details to schedule appointments and view logs.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-xl">
          <form onSubmit={handleCreateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Biological Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                required
              >
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Blood Type</label>
              <input
                type="text"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="A+, O-, B+, etc."
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Careway Ave, San Francisco, CA"
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 (555) 091-2384"
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text/80">Known Allergies</label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Penicillin, Peanuts, Latex, etc."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-primary text-bg font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Activate Medical Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Status Badges
  const getStatusBadge = (status: Booking['status']) => {
    const styling = {
      requested: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/10',
      confirmed: 'bg-blue-500/10 text-blue-600 border border-blue-500/10',
      in_progress: 'bg-purple-500/10 text-purple-600 border border-purple-500/10',
      completed: 'bg-green-500/10 text-green-600 border border-green-500/10',
      cancelled: 'bg-red-500/10 text-red-600 border border-red-500/10',
    }[status];

    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${styling}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome Board */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Patient Portal</h1>
          <p className="text-sm text-text/60 mt-1">Review your clinical records and book healthcare slots.</p>
        </div>
        <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold text-text/70">
          <Shield className="h-4 w-4 text-primary" /> Care ID: <span className="font-mono text-primary">{profile.id.substring(0, 8)}...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: History & Notes (shown in default or records tab) */}
        {(activeTab === '' || activeTab === 'records') && (
          <div className={`${activeTab === 'records' ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-8`}>
            {/* Medical Details Card */}
            <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                <User className="h-5 w-5 text-primary" /> Active Medical Card
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text/40">Blood Type</span>
                  <span className="font-bold text-text/80 mt-0.5">{profile.bloodType || 'Not Registered'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text/40">Gender</span>
                  <span className="font-bold text-text/80 mt-0.5 capitalize">{profile.gender}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text/40">Allergies</span>
                  <span className="font-bold text-red-500 mt-0.5 truncate max-w-[150px]" title={profile.allergies}>
                    {profile.allergies || 'None Reported'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text/40">Birth Date</span>
                  <span className="font-bold text-text/80 mt-0.5">{profile.birthDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Medical History Timeline */}
            <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                <Heart className="h-5 w-5 text-primary" /> Clinical Diagnostics History
              </h2>
              {history.length === 0 ? (
                <p className="text-xs text-text/50 py-4 text-center">No diagnostic history records filed.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-text/[0.02] border border-text/5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-text/80">{item.title}</span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              {
                                low: 'bg-green-500/10 text-green-600',
                                medium: 'bg-yellow-500/10 text-yellow-600',
                                high: 'bg-orange-500/10 text-orange-600',
                                critical: 'bg-red-500/10 text-red-600',
                              }[item.severity]
                            }`}
                          >
                            {item.severity}
                          </span>
                          {item.resolvedAt ? (
                            <span className="text-[9px] bg-green-500/15 text-green-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle className="h-3 w-3" /> Resolved
                            </span>
                          ) : (
                            <span className="text-[9px] bg-red-500/15 text-red-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text/60 mt-1.5">{item.description || 'No description provided.'}</p>
                        <span className="text-[10px] text-text/40 font-semibold mt-2.5">
                          Diagnosed on {new Date(item.diagnosedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Notes Timeline */}
            <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                <FileText className="h-5 w-5 text-primary" /> Nurse Progress Records
              </h2>
              {notes.length === 0 ? (
                <p className="text-xs text-text/50 py-4 text-center">No clinical logs registered.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 rounded-2xl bg-text/[0.02] border border-text/5 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {note.type} Log
                        </span>
                        <span className="text-[10px] text-text/40 font-semibold">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-text/70 leading-relaxed italic">"{note.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Book & Appt list (shown in default or bookings tab) */}
        {(activeTab === '' || activeTab === 'bookings') && (
          <div className={`${activeTab === 'bookings' ? 'lg:col-span-3' : 'flex flex-col gap-8'}`}>
            {activeTab === 'bookings' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {/* Bookings Queue */}
                  <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4 h-full">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                      <Clock className="h-5 w-5 text-primary" /> My Booking Orders
                    </h2>
                    {bookings.length === 0 ? (
                      <p className="text-xs text-text/50 py-4 text-center">No appointments scheduled.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="p-4 rounded-2xl bg-text/[0.02] border border-text/5 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-text/80 truncate max-w-[180px]">
                                {booking.reason}
                              </span>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex flex-col gap-1 text-[11px] text-text/60">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-primary/70" /> {new Date(booking.scheduledAt).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary/70" /> {booking.location}
                              </span>
                            </div>
                            {booking.status === 'requested' && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="w-full text-center mt-2 py-1.5 rounded-lg border border-red-500/10 text-red-500 font-semibold text-[10px] hover:bg-red-500/5 cursor-pointer transition-all"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Appointment Form */}
                  <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                      <CalendarPlus className="h-5 w-5 text-primary" /> Book Appointment
                    </h2>

                    <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Preferred Care Nurse</label>
                        <select
                          value={targetNurseId}
                          onChange={(e) => setTargetNurseId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm animate-none"
                          required
                        >
                          <option value="">Choose a sandbox nurse...</option>
                          <option value="de9f189e-4ae4-4759-a895-79077c4a11ad">Nurse Sandra (Primary Sandbox)</option>
                          <option value="ae3f2762-234b-44bb-99f2-8923b72349ac">Nurse David (Auxiliary Care)</option>
                          {profile.assignedNurseId && (
                            <option value={profile.assignedNurseId}>My Assigned Nurse ID</option>
                          )}
                        </select>
                        <p className="text-[9px] text-text/40">Select a sandbox nurse UUID to register transactional isolation lock.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Date</label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Time</label>
                          <input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Service Reason</label>
                        <input
                          type="text"
                          value={serviceReason}
                          onChange={(e) => setServiceReason(e.target.value)}
                          placeholder="Routine Checkup, Dental, etc."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Visit Location</label>
                        <input
                          type="text"
                          value={bookingLocation}
                          onChange={(e) => setBookingLocation(e.target.value)}
                          placeholder="Clinic A, Home Visit, etc."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Special Instructions</label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="Notes for nurse..."
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary text-bg font-semibold py-3 rounded-xl shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        disabled={isSubmittingBooking}
                      >
                        {isSubmittingBooking ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Calendar className="h-4.5 w-4.5" />}
                        Confirm Booking Request
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Appointment Form */}
                <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                    <CalendarPlus className="h-5 w-5 text-primary" /> Book Appointment
                  </h2>

                  <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Preferred Care Nurse</label>
                      <select
                        value={targetNurseId}
                        onChange={(e) => setTargetNurseId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm animate-none"
                        required
                      >
                        <option value="">Choose a sandbox nurse...</option>
                        <option value="de9f189e-4ae4-4759-a895-79077c4a11ad">Nurse Sandra (Primary Sandbox)</option>
                        <option value="ae3f2762-234b-44bb-99f2-8923b72349ac">Nurse David (Auxiliary Care)</option>
                        {profile.assignedNurseId && (
                          <option value={profile.assignedNurseId}>My Assigned Nurse ID</option>
                        )}
                      </select>
                      <p className="text-[9px] text-text/40">Select a sandbox nurse UUID to register transactional isolation lock.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Time</label>
                        <input
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Service Reason</label>
                      <input
                        type="text"
                        value={serviceReason}
                        onChange={(e) => setServiceReason(e.target.value)}
                        placeholder="Routine Checkup, Dental, etc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Visit Location</label>
                      <input
                        type="text"
                        value={bookingLocation}
                        onChange={(e) => setBookingLocation(e.target.value)}
                        placeholder="Clinic A, Home Visit, etc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text/60">Special Instructions</label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Notes for nurse..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none text-sm resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-bg font-semibold py-3 rounded-xl shadow-lg shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      disabled={isSubmittingBooking}
                    >
                      {isSubmittingBooking ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Calendar className="h-4.5 w-4.5" />}
                      Confirm Booking Request
                    </button>
                  </form>
                </div>

                {/* Bookings Queue */}
                <div className="glass p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 border-b border-text/5 pb-3">
                    <Clock className="h-5 w-5 text-primary" /> My Booking Orders
                  </h2>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-text/50 py-4 text-center">No appointments scheduled.</p>
                  ) : (
                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px]">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="p-4 rounded-2xl bg-text/[0.02] border border-text/5 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-text/80 truncate max-w-[120px]">
                              {booking.reason}
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex flex-col gap-1 text-[11px] text-text/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary/70" /> {new Date(booking.scheduledAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-primary/70" /> {booking.location}
                            </span>
                          </div>
                          {booking.status === 'requested' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="w-full text-center mt-2 py-1.5 rounded-lg border border-red-500/10 text-red-500 font-semibold text-[10px] hover:bg-red-500/5 cursor-pointer transition-all"
                            >
                              Cancel Request
                            </button>
                          )}
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
  );
}

export default function PatientDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 bg-bg text-text">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <PatientDashboardContent />
    </Suspense>
  );
}
