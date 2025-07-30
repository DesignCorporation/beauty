import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, DollarSign, Search, Briefcase, Users } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import api from '../../lib/api';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../contexts/ToastContext';
import type { CalendarAppointment, AppointmentStatus } from '../../types/calendar';

interface AppointmentModalProps {
  appointmentId: string | null;
  initialDate?: Date | null;
  onClose: () => void;
  onUpdate: (appointmentId: string, status: AppointmentStatus) => void;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Service {
  id: string;
  baseName: string;
  durationMin: number;
  priceAmount: number;
  priceCurrency: string;
  category?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

interface NewAppointmentData {
  clientId: string;
  serviceIds: string[];
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
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
  
  // Data for new appointments
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // New appointment form state
  const [formData, setFormData] = useState<NewAppointmentData>({
    clientId: '',
    serviceIds: [],
    staffId: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialDate ? format(initialDate, 'HH:mm') : '09:00',
    endTime: initialDate ? format(addMinutes(initialDate, 60), 'HH:mm') : '10:00',
    notes: ''
  });
  
  // Search states
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  
  const { token } = useTenant();
  const { success, error: showError } = useToast();
  const isNewAppointment = !appointmentId;

  useEffect(() => {
    if (appointmentId && token) {
      fetchAppointment();
    } else if (isNewAppointment && token) {
      fetchFormData();
    }
  }, [appointmentId, token]);

  useEffect(() => {
    // Auto-calculate end time based on selected services
    if (formData.serviceIds.length > 0) {
      const totalDuration = formData.serviceIds.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (service?.durationMin || 0);
      }, 0);
      
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = addMinutes(startDateTime, totalDuration);
      
      setFormData(prev => ({
        ...prev,
        endTime: format(endDateTime, 'HH:mm')
      }));
    }
  }, [formData.serviceIds, formData.startTime, formData.date, services]);

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

  const fetchFormData = async () => {
    if (!token) return;

    setLoadingData(true);
    try {
      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        api.get('/api/v1/clients'),
        api.get('/api/v1/services'),
        api.get('/api/v1/staff')
      ]);

      setClients(clientsRes.data || clientsRes);
      setServices(servicesRes.data || servicesRes);
      setStaff((staffRes.data || staffRes).filter((s: Staff) => s.active));
    } catch (err) {
      console.error('Failed to fetch form data:', err);
      setError('Nie udało się załadować danych formularza');
      showError('Nie udało się załadować danych formularza');
    } finally {
      setLoadingData(false);
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
      success('Status wizyty został zaktualizowany');
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Nie udało się zaktualizować statusu');
      showError('Nie udało się zaktualizować statusu');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!token || !validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const appointmentData = {
        clientId: formData.clientId,
        serviceIds: formData.serviceIds,
        staffId: formData.staffId,
        startAt: new Date(`${formData.date}T${formData.startTime}`).toISOString(),
        endAt: new Date(`${formData.date}T${formData.endTime}`).toISOString(),
        notes: formData.notes || undefined
      };

      await api.post('/api/v1/appointments', appointmentData);
      
      success('Wizyta została pomyślnie utworzona');
      onUpdate('new', 'CONFIRMED');
      onClose();
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setError('Nie udało się utworzyć wizyty');
      showError('Nie udało się utworzyć wizyty');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.clientId) {
      setError('Wybierz klienta');
      showError('Wybierz klienta');
      return false;
    }
    if (formData.serviceIds.length === 0) {
      setError('Wybierz przynajmniej jedną usługę');
      showError('Wybierz przynajmniej jedną usługę');
      return false;
    }
    if (!formData.staffId) {
      setError('Wybierz pracownika');
      showError('Wybierz pracownika');
      return false;
    }
    if (!formData.date || !formData.startTime) {
      setError('Wybierz datę i czas');
      showError('Wybierz datę i czas');
      return false;
    }
    return true;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.phone && client.phone.includes(clientSearch))
  );

  const filteredServices = services.filter(service =>
    service.baseName.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(serviceSearch.toLowerCase()))
  );

  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceAmount, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  const formatDateTime = (datetime: string) => {
    return format(new Date(datetime), 'EEEE, d MMMM yyyy · HH:mm');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDateTimeDisplay = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'EEEE, d MMMM yyyy · HH:mm');
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading || loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Ładowanie...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  if (isNewAppointment) {
                    fetchFormData();
                  } else {
                    fetchAppointment();
                  }
                }}
                className="btn-secondary"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : isNewAppointment ? (
            /* NEW APPOINTMENT FORM */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Klient *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Szukaj klienta..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setFormData(prev => ({ ...prev, clientId: client.id }))}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          formData.clientId === client.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <div className="font-medium">{client.name}</div>
                        {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Usługi *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Szukaj usługi..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          const isSelected = formData.serviceIds.includes(service.id);
                          setFormData(prev => ({
                            ...prev,
                            serviceIds: isSelected
                              ? prev.serviceIds.filter(id => id !== service.id)
                              : [...prev.serviceIds, service.id]
                          }));
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          formData.serviceIds.includes(service.id) ? 'bg-green-50 text-green-700' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{service.baseName}</div>
                            <div className="text-sm text-gray-500">
                              {service.durationMin} min • {formatPrice(service.priceAmount, service.priceCurrency)}
                            </div>
                          </div>
                          {formData.serviceIds.includes(service.id) && (
                            <div className="text-green-600 font-medium">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Staff Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Pracownik *
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wybierz pracownika</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Godzina *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notatki
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Dodatkowe informacje..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie wizyty</h3>
                  
                  {/* Selected Client */}
                  {formData.clientId && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500">Klient</div>
                      <div className="font-medium">
                        {clients.find(c => c.id === formData.clientId)?.name}
                      </div>
                    </div>
                  )}

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Usługi</div>
                      <div className="space-y-1">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span>{service.baseName}</span>
                            <span>{formatPrice(service.priceAmount, service.priceCurrency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Staff */}
                  {formData.staffId && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500">Pracownik</div>
                      <div className="font-medium">
                        {staff.find(s => s.id === formData.staffId)?.name}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  {formData.date && formData.startTime && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500">Data i czas</div>
                      <div className="font-medium">
                        {formatDateTimeDisplay(formData.date, formData.startTime)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Zakończenie: {formData.endTime}
                      </div>
                    </div>
                  )}

                  {/* Duration & Price */}
                  {selectedServices.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Czas trwania</span>
                        <span className="font-medium">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Łączna cena</span>
                        <span className="text-lg font-bold">
                          {formatPrice(totalPrice, selectedServices[0]?.priceCurrency || 'PLN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : appointment ? (
            /* EXISTING APPOINTMENT VIEW */
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Brak danych do wyświetlenia</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          {isNewAppointment ? (
            <button
              onClick={handleCreateAppointment}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Zapisywanie...' : 'Utwórz wizytę'}
            </button>
          ) : appointment && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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