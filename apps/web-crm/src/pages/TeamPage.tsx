import React from 'react';
import { UsersRound, Plus, Star, Clock } from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      id: 1,
      name: 'Magdalena Kowalczyk',
      role: 'Fryzjer senior',
      email: 'magdalena@salon.com',
      phone: '+48 123 456 789',
      specializations: ['Strzyżenie', 'Koloryzacja', 'Modelowanie'],
      rating: 4.9,
      workingHours: 'Pon-Pt 9:00-17:00',
      status: 'active'
    },
    {
      id: 2,
      name: 'Anna Nowak',
      role: 'Stylistka paznokci',
      email: 'anna@salon.com',
      phone: '+48 987 654 321',
      specializations: ['Manicure', 'Pedicure', 'Żel', 'Hybryda'],
      rating: 4.8,
      workingHours: 'Wt-Sob 10:00-18:00',
      status: 'active'
    },
    {
      id: 3,
      name: 'Katarzyna Wiśniewska',
      role: 'Kosmetolog',
      email: 'katarzyna@salon.com',
      phone: '+48 555 123 456',
      specializations: ['Brwi', 'Rzęsy', 'Oczyszczanie', 'Depilacja'],
      rating: 4.7,
      workingHours: 'Śr-Nd 11:00-19:00',
      status: 'active'
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zespół</h1>
          <p className="mt-1 text-sm text-gray-500">
            Zarządzaj zespołem i harmonogramami pracy
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj pracownika
        </button>
      </div>

      {/* Team members grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="card">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-800">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {member.role}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Ocena klientów</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-900">
                    {member.rating}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">
                  {member.workingHours}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Specjalizacje:</p>
              <div className="flex flex-wrap gap-1">
                {member.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button className="flex-1 btn-secondary text-sm py-2">
                Edytuj
              </button>
              <button className="flex-1 btn-primary text-sm py-2">
                Harmonogram
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}