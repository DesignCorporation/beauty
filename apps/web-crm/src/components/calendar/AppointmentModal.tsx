import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import api from '../../lib/api';
import { useTenant } from '../../hooks/useTenant';
import type { CalendarAppointment, AppointmentStatus } from '../../types/calendar';

interface AppointmentModalProps {
  appointmentId: string | null;
  initialDate?: Date | null;
  onClose: () => void;
  onUpdate: (appointmentId: string, status: AppointmentStatus) => void;
}

const statusOptions = [
  { value: 'PENDING' as AppointmentStatus, label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED' as AppointmentStatus, label: 'Potwierdzona', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED' as AppointmentStatus, label: 'Zakończona', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELED' as AppointmentStatus, label: 'Anulowana', color: 'bg-red-100 text-red-800' }
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  appointmentId,
  initialDate,
  onClose,
  onUpdate
}) => {
  const [appointment, setAppointment] = useState<CalendarAppointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useTenant();

  const isNewAppointment = !appointmentId;

  useEffect(() => {
    if (appointmentId && token) {
      fetchAppointment();
    }
  }, [appointmentId, token]);

  const fetchAppointment = async () => {
    if (!appointmentId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/crm/appointments/${appointmentId}`);
      setAppointment(response);
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
      setError('Nie udało się załadować danych wizyty');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    if (!appointment || !token) return;

    setSaving(true);
    try {
      await api.patch(`/crm/appointments/${appointment.id}/status`, {
        status: newStatus
      });

      setAppointment({ ...appointment, status: newStatus });
      onUpdate(appointment.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Nie udało się zaktualizować statusu');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    return format(new Date(datetime), 'EEEE, d MMMM yyyy · HH:mm', { locale: pl });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNewAppointment ? 'Nowa wizyta' : 'Szczegóły wizyty'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={fetchAppointment}
                className="btn-secondary"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : isNewAppointment ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nowa wizyta</h3>
              <p className="text-gray-500 mb-4">
                {initialDate && `Data: ${format(initialDate, 'EEEE, d MMMM yyyy · HH:mm', { locale: pl })}`}
              </p>
              <p className="text-sm text-gray-500">
                Funkcja dodawania nowych wizyt będzie dostępna wkrótce
              </p>
            </div>
          ) : appointment ? (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{appointment.clientName}</h3>
                  <p className="text-sm text-gray-500">Klient</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(appointment.startAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Czas trwania: {Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / (1000 * 60))} min
                  </p>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Usługi</h4>
                <div className="space-y-1">
                  {appointment.serviceNames.map((service, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      {service}
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Pracownik</h4>
                <div className="text-sm text-gray-700">{appointment.staffName}</div>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(appointment.price, appointment.currency)}
                  </p>
                  <p className="text-sm text-gray-500">Cena</p>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Notatki</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status wizyty</h4>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      disabled={saving || appointment.status === option.value}
                      className={`
                        p-3 text-sm font-medium rounded-lg border-2 transition-all
                        ${appointment.status === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }
                        ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${option.color} mb-1`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Zamknij
          </button>
          {!isNewAppointment && appointment && (
            <button
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Zapisywanie...' : 'Edytuj wizytę'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
