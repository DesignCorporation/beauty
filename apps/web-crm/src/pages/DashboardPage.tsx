import React from 'react';
import { BarChart3, Users, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { 
      name: 'Dzisiejsze wizyty', 
      value: '12', 
      icon: Calendar, 
      change: '+4.75%', 
      changeType: 'positive' 
    },
    { 
      name: 'Przychód dziś', 
      value: '2,840 zł', 
      icon: DollarSign, 
      change: '+12.02%', 
      changeType: 'positive' 
    },
    { 
      name: 'Nowi klienci', 
      value: '3', 
      icon: Users, 
      change: '+1', 
      changeType: 'positive' 
    },
    { 
      name: 'Avg. czas wizyty', 
      value: '45 min', 
      icon: Clock, 
      change: '-2 min', 
      changeType: 'positive' 
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
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Przegląd aktywności w salonie
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {item.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
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
        {/* Recent Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Dzisiejsze wizyty</h3>
            <button className="text-sm text-primary-600 hover:text-primary-500">
              Zobacz wszystkie
            </button>
          </div>
          
          <div className="space-y-3">
            {recentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.client}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appointment.service}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.time}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status === 'confirmed' ? 'Potwierdzona' :
                     appointment.status === 'in-progress' ? 'W trakcie' :
                     'Oczekująca'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Szybkie akcje</h3>
          
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
          
          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-primary-900">
                  Miesięczny raport
                </h4>
                <p className="mt-1 text-sm text-primary-700">
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
