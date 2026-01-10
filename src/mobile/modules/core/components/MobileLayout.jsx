import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Plus, Folder, Settings, Menu, X, ChevronRight, Star, Clock, BookOpen, Briefcase, Lightbulb, GraduationCap, Palette, MoreHorizontal } from 'lucide-react'
import AddResource from '../../personas/student/components/AddResource'

export default function MobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [addResourceOpen, setAddResourceOpen] = useState(false)

  const personas = [
    { path: '/student', icon: GraduationCap, label: 'Student', emoji: '🎓' },
    { path: '/researcher', icon: BookOpen, label: 'Researcher', emoji: '🔬' },
    { path: '/professional', icon: Briefcase, label: 'Professional', emoji: '💼' },
    { path: '/entrepreneur', icon: Lightbulb, label: 'Entrepreneur', emoji: '💡' },
    { path: '/creator', icon: Palette, label: 'Creator', emoji: '🎨' },
  ]

  const studentRoutes = [
    { path: '/student/home', icon: Home, label: 'Home' },
    { path: '/student/resources', icon: Clock, label: 'All Resources' },
    { path: '/student/folders', icon: Folder, label: 'Folders' },
  ]

  const getCurrentPageTitle = () => {
    const route = studentRoutes.find(r => r.path === location.pathname)
    return route?.label || 'KeepLynk'
  }

  

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Pure Notion Style */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#fbfbfa] z-50 transform transition-transform duration-200 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } border-r border-zinc-200`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header - Notion Style */}
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-zinc-200/60 rounded transition-colors"
              >
                <X size={18} className="text-zinc-600" />
              </button>
            </div>
            
            {/* Workspace Selector - Notion Style */}
            <button className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-200/60 rounded transition-colors group">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <span className="text-sm font-medium text-zinc-800">Student Space</span>
              </div>
              <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-600" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 mb-2">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200/60 rounded transition-colors">
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-3">
            {/* Main Navigation */}
            <div className="space-y-0.5 mb-4">
              {studentRoutes.map((route) => {
                const Icon = route.icon
                const isActive = location.pathname === route.path
                return (
                  <button
                    key={route.path}
                    onClick={() => {
                      navigate(route.path)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                      isActive 
                        ? 'bg-zinc-200/80 text-zinc-900' 
                        : 'text-zinc-700 hover:bg-zinc-200/60'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{route.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-200 my-3" />

            {/* Personas Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs text-zinc-500 font-medium">Workspaces</span>
              </div>
              <div className="space-y-0.5">
                {personas.map((persona) => {
                  const isActive = location.pathname.startsWith(persona.path)
                  return (
                    <button
                      key={persona.path}
                      onClick={() => {
                        navigate(`${persona.path}/home`)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        isActive 
                          ? 'bg-zinc-200/80 text-zinc-900' 
                          : 'text-zinc-700 hover:bg-zinc-200/60'
                      }`}
                    >
                      <span className="text-base">{persona.emoji}</span>
                      <span>{persona.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer - Notion Style */}
          <div className="px-3 py-3 border-t border-zinc-200">
            <button 
              onClick={() => {
                navigate('/settings')
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200/60 rounded transition-colors"
            >
              <Settings size={16} strokeWidth={1.5} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top Header - Notion Style (Minimal) */}
      <header className="bg-white px-3 py-2 flex items-center justify-between sticky top-0 z-10 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
          >
            <Menu size={20} className="text-zinc-600" strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-medium text-zinc-900">{getCurrentPageTitle()}</h1>
        </div>
        <button onClick={() => setQuickActionOpen(true)} className="p-1.5 hover:bg-zinc-100 rounded transition-colors">
          <MoreHorizontal size={20} className="text-zinc-600" strokeWidth={1.5} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>

      {/* Quick Action Menu */}
      {quickActionOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setQuickActionOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
            <div className="px-4 pt-4 pb-2">
              <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-semibold text-zinc-900 mb-3">Quick Actions</h3>
            </div>
            
            <div className="px-4 pb-6 space-y-1">
              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  setAddResourceOpen(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Plus size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">Add Resource</div>
                  <div className="text-xs text-zinc-500">Save a link or file</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open add folder modal
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Folder size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">New Folder</div>
                  <div className="text-xs text-zinc-500">Organize your resources</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open manage tags modal
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Star size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">Manage Tags</div>
                  <div className="text-xs text-zinc-500">Create and edit tags</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open search
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Search size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">Search</div>
                  <div className="text-xs text-zinc-500">Find your resources</div>
                </div>
              </button>
            </div>

            <div className="px-4 pb-4">
              <button 
                onClick={() => setQuickActionOpen(false)}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Action Button - Notion Style */}
      <button 
        onClick={() => setAddResourceOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 border-1 border-zinc-300 bg-white hover:bg-zinc-200 text-zinc-900 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      {/* Add Resource Modal */}
      <AddResource 
        isOpen={addResourceOpen}
        onClose={() => setAddResourceOpen(false)}
        onResourceCreated={() => {
          // Optional: Add refresh logic here if needed
          console.log('Resource created')
        }}
      />
    </div>
  )
}

export function AddResourceButton({ onClick }) {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 border-1 border-zinc-300 bg-white hover:bg-zinc-200 text-zinc-900 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
    >
      <Plus size={24} strokeWidth={2} />
    </button>
  )
}
