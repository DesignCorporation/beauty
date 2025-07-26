'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const timeSlots = [
  '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30'
];

const appointments = [
  {
    id: 1,
    time: '13:00',
    duration: 75, // minutes
    client: 'Jane Doe',
    service: 'Цвет волос',
    stylist: 'Sergii Shevtsov',
    color: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    id: 2,
    time: '15:00',
    duration: 60,
    client: 'Maria Smith',
    service: 'Стрижение + укладка',
    stylist: 'Anna Kowalski', 
    color: 'bg-purple-100 border-purple-300 text-purple-800'
  }
];

const stylists = [
  { id: 1, name: 'Sergii Shevtsov', avatar: 'S', color: 'bg-blue-500' },
  { id: 2, name: 'Anna Kowalski', avatar: 'A', color: 'bg-purple-500' },
  { id: 3, name: 'Maria Nowak', avatar: 'M', color: 'bg-green-500' }
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStylist, setSelectedStylist] = useState(stylists[0]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const isCurrentTime = (time: string) => {
    const current = getCurrentTime();
    return time === current.slice(0, -1) + '0'; // Round to nearest 30min
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Beauty Calendar</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{formatDate(selectedDate)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">Сегодня</span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <select 
                className="text-sm font-medium bg-transparent border-none focus:ring-0 text-gray-700"
                value={selectedStylist.id}
                onChange={(e) => setSelectedStylist(stylists.find(s => s.id === parseInt(e.target.value)) || stylists[0])}
              >
                {stylists.map(stylist => (
                  <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Мастера</h3>
              <div className="space-y-3">
                {stylists.map(stylist => (
                  <div 
                    key={stylist.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStylist.id === stylist.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStylist(stylist)}
                  >
                    <div className={`w-10 h-10 ${stylist.color} rounded-full flex items-center justify-center text-white font-medium`}>
                      {stylist.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{stylist.name}</div>
                      <div className="text-sm text-gray-500">Стилист</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Новая запись
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Time column header */}
              <div className="grid grid-cols-4 border-b border-gray-200">
                <div className="px-4 py-3 text-sm font-medium text-gray-700">Время</div>
                <div className="px-4 py-3 text-sm font-medium text-gray-700">{selectedStylist.name}</div>
                <div className="px-4 py-3 text-sm font-medium text-gray-700">Услуга</div>
                <div className="px-4 py-3 text-sm font-medium text-gray-700">Клиент</div>
              </div>
              
              {/* Time slots */}
              <div className="divide-y divide-gray-100">
                {timeSlots.map(time => {
                  const appointment = appointments.find(apt => apt.time === time);
                  const isCurrent = isCurrentTime(time);
                  
                  return (
                    <div key={time} className={`grid grid-cols-4 hover:bg-gray-50 transition-colors ${
                      isCurrent ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                    }`}>
                      <div className="px-4 py-4 text-sm font-medium text-gray-600 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {time}
                        {isCurrent && <span className="ml-2 text-xs text-yellow-600">(сейчас)</span>}
                      </div>
                      
                      {appointment ? (
                        <>
                          <div className="px-4 py-4">
                            <div className={`${appointment.color} rounded-lg px-3 py-2 border-l-4`}>
                              <div className="font-medium text-sm">{appointment.stylist}</div>
                              <div className="text-xs opacity-75">{appointment.duration} мин</div>
                            </div>
                          </div>
                          <div className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.service}</div>
                            <div className="text-xs text-gray-500 mt-1">{appointment.time} - {appointment.time.slice(0,2)}:{(parseInt(appointment.time.slice(3,5)) + appointment.duration).toString().padStart(2,'0')}</div>
                          </div>
                          <div className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.client}</div>
                            <div className="text-xs text-gray-500 mt-1">Подтверждено</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-4 text-gray-400 text-sm">Свободно</div>
                          <div className="px-4 py-4"></div>
                          <div className="px-4 py-4">
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Добавить запись</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}