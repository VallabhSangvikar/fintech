'use client';

import { useState } from 'react';
import { Building2, TrendingUp, Users } from 'lucide-react';

export default function PersonaSwitcher() {
  const [currentPersona, setCurrentPersona] = useState(
    (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null) || 'customer'
  );

  const personas = [
    { id: 'customer', label: 'Customer', icon: Users, color: 'blue' },
    { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'emerald' },
    { id: 'bank', label: 'Bank', icon: Building2, color: 'purple' },
  ];

  const handlePersonaChange = (personaId: string) => {
    setCurrentPersona(personaId);
    localStorage.setItem('userRole', personaId);
    window.location.reload(); // Reload to trigger dashboard change
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700 mb-3">Demo: Switch Persona</p>
        <div className="space-y-2">
          {personas.map((persona) => {
            const Icon = persona.icon;
            return (
              <button
                key={persona.id}
                onClick={() => handlePersonaChange(persona.id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                  currentPersona === persona.id
                    ? `bg-${persona.color}-100 text-${persona.color}-700 border border-${persona.color}-200`
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{persona.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
