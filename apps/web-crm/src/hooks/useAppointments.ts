import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { CalendarAppointment, CalendarView, AppointmentFilters, AppointmentStatus } from '../types/calendar';

interface UseAppointmentsParams {
  date: Date;
  view: CalendarView;
  filters: AppointmentFilters;
  salonId: string;
  token: string;
}

export const useAppointments = ({ date, view, filters, salonId, token }: UseAppointmentsParams) => {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!salonId || !token) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date: date.toISOString().split('T')[0],
        view,
        ...(filters.staffIds.length > 0 && { staffIds: filters.staffIds.join(',') }),
        ...(filters.statuses.length > 0 && { statuses: filters.statuses.join(',') })
      });

      const response = await api.get(`/api/v1/crm/appointments?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setAppointments(response.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Nie udało się załadować zapisów');
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newStartAt: string, newStaffId?: string) => {
    try {
      await api.post(`/api/v1/crm/appointments/${appointmentId}/reschedule`, {
        startAt: newStartAt,
        staffId: newStaffId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh appointments
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to reschedule appointment:', err);
      setError('Nie udało się przełożyć zapisu');
    }
  };

  const updateStatus = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      await api.patch(`/api/v1/crm/appointments/${appointmentId}/status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status } : apt
        )
      );
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      setError('Nie udało się zaktualizować statusu');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [date, view, filters, salonId, token]);

  return {
    appointments,
    loading,
    error,
    rescheduleAppointment,
    updateStatus,
    refetch: fetchAppointments
  };
};
