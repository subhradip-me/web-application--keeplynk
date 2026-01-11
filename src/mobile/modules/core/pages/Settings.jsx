import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, User, Bell, Palette, Shield, HelpCircle, GraduationCap, BookOpen, Briefcase, Lightbulb, FlaskConical, Sparkles, ChevronRight, Lock } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  const [selectedPersona, setSelectedPersona] = useState('genaral')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const personas = [
    { 
      id: 'genaral', 
      label: 'General', 
      icon: Sparkles, 
      color: 'from-zinc-600 to-zinc-800',
      description: 'For everyday knowledge management'
    },
    { 
      id: 'student', 
      label: 'Student', 
      icon: GraduationCap, 
      color: 'from-blue-500 to-blue-700',
      description: 'Organize study materials and courses'
    },
    { 
      id: 'researcher', 
      label: 'Researcher', 
      icon: FlaskConical, 
      color: 'from-purple-500 to-purple-700',
      description: 'Manage research papers and data'
    },
    { 
      id: 'professional', 
      label: 'Professional', 
      icon: Briefcase, 
      color: 'from-emerald-500 to-emerald-700',
      description: 'Track work projects and documents'
    },
    { 
      id: 'entrepreneur', 
      label: 'Entrepreneur', 
      icon: Lightbulb, 
      color: 'from-orange-500 to-orange-700',
      description: 'Organize business ideas and plans'
    },
    { 
      id: 'creator', 
      label: 'Creator', 
      icon: Palette, 
      color: 'from-pink-500 to-pink-700',
      description: 'Manage creative projects and assets'
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
          >
            <ChevronLeft size={22} className="text-zinc-700" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <section className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Profile</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-zinc-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-zinc-500 truncate">{user?.email}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Persona Selection */}
        <section className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Workspace Persona</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Choose your primary workspace style</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <Lock size={12} className="text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Disabled</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {personas.map((persona) => {
              const Icon = persona.icon
              const isSelected = selectedPersona === persona.id
              const isDisabled = persona.id !== 'genaral'
              
              return (
                <button
                  key={persona.id}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setSelectedPersona(persona.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-zinc-400 bg-zinc-100'
                      : isDisabled
                      ? 'border-zinc-100 bg-zinc-50/50 opacity-60 cursor-not-allowed'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${persona.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <Icon size={20} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">{persona.label}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-zinc-600 text-white text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{persona.description}</p>
                  </div>
                  {!isDisabled && <ChevronRight size={18} className="text-zinc-400" />}
                </button>
              )
            })}
          </div>
          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
            <p className="text-xs text-zinc-600">
              💡 <span className="font-medium">Coming Soon:</span> Persona switching will allow you to customize your workspace for different use cases.
            </p>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Preferences</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Bell size={18} className="text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-zinc-900">Notifications</div>
                <div className="text-xs text-zinc-500">Manage notification preferences</div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <Palette size={18} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-zinc-900">Appearance</div>
                <div className="text-xs text-zinc-500">Theme and display options</div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-green-600" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-zinc-900">Privacy & Security</div>
                <div className="text-xs text-zinc-500">Control your data and privacy</div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
          </div>
        </section>

        {/* Support */}
        <section className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Support</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                <HelpCircle size={18} className="text-orange-600" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-zinc-900">Help & Support</div>
                <div className="text-xs text-zinc-500">Get help and contact support</div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
          </div>
        </section>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-xs text-zinc-400 font-medium mb-1">KeepLynk Mobile</p>
          <p className="text-xs text-zinc-400">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
