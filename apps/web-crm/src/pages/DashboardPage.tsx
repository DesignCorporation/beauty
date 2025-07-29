import React from 'react';
import { BarChart3, Users, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { 
      name: 'Dzisiejsze wizyty', 
      value: '12', 
      icon: Calendar, 
      change: '+4.75%', 
      changeType: 'positive',
      bgColor: 'var(--pastel-lavender)'
    },
    { 
      name: 'Przychód dziś', 
      value: '2,840 zł', 
      icon: DollarSign, 
      change: '+12.02%', 
      changeType: 'positive',
      bgColor: 'var(--pastel-mint)'
    },
    { 
      name: 'Nowi klienci', 
      value: '3', 
      icon: Users, 
      change: '+1', 
      changeType: 'positive',
      bgColor: 'var(--pastel-peach)'
    },
    { 
      name: 'Avg. czas wizyty', 
      value: '45 min', 
      icon: Clock, 
      change: '-2 min', 
      changeType: 'positive',
      bgColor: 'var(--pastel-blue)'
    },
  ];

  const recentAppointments = [
    { id: 1, client: 'Anna Kowalska', service: 'Strzyżenie damskie', time: '10:00', status: 'confirmed' },
    { id: 2, client: 'Maria Nowak', service: 'Manicure hybrydowy', time: '11:30', status: 'in-progress' },
    { id: 3, client: 'Katarzyna Wiśniewska', service: 'Koloryzacja', time: '14:00', status: 'confirmed' },
    { id: 4, client: 'Agnieszka Kaczmarek', service: 'Regulacja brwi', time: '15:30', status: 'pending' },
  ];

  return (
    <div>
      {/* Page header - FLAT DESIGN */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Przegląd aktywności w salonie
        </p>
      </div>

      {/* Stats - FLAT CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <item.icon className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                    {item.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments - FLAT DESIGN */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Dzisiejsze wizyty
            </h3>
            <button 
              className="text-sm font-medium"
              style={{ color: 'var(--purple-primary)' }}
            >
              Zobacz wszystkie
            </button>
          </div>
          
          <div className="space-y-3">
            {recentAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-hover)' }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {appointment.client}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {appointment.service}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {appointment.time}
                  </p>
                  <span 
                    className={`status-badge ${
                      appointment.status === 'confirmed' ? 'status-potwierdzona' :
                      appointment.status === 'in-progress' ? 'status-zakonczona' :
                      'status-oczekujaca'
                    }`}
                  >
                    {appointment.status === 'confirmed' ? 'Potwierdzona' :
                     appointment.status === 'in-progress' ? 'W trakcie' :
                     'Oczekująca'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - FLAT DESIGN */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            Szybkie akcje
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary">
              Nowa wizyta
            </button>
            <button className="btn-secondary">
              Nowy klient
            </button>
            <button className="btn-secondary">
              Dodaj usługę
            </button>
            <button className="btn-secondary">
              Raporty
            </button>
          </div>
          
          <div 
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--pastel-mint)' }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Miesięczny raport
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Twój salon osiągnął 125% celu na ten miesiąc!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
