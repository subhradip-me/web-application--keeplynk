import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Plus, Folder, Settings, Menu, X, ChevronRight, Star, Clock, BookOpen, Briefcase, Lightbulb, GraduationCap, Palette, MoreHorizontal, User, LogOut } from 'lucide-react'
import AddResource from '../../personas/genaral/components/AddResource'

export default function MobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [addResourceOpen, setAddResourceOpen] = useState(false)

  const mainRoutes = [
    { path: '/genaral/home', icon: Home, label: 'Home' },
    { path: '/genaral/resources', icon: Clock, label: 'All Resources' },
    { path: '/genaral/folders', icon: Folder, label: 'Folders' },
  ]

  const getCurrentPageTitle = () => {
    const route = mainRoutes.find(r => r.path === location.pathname)
    if (location.pathname === '/settings') return 'Settings'
    return route?.label || 'KeepLynk'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Notion Style */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#fbfbfa] z-50 transform transition-transform duration-200 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } border-r border-zinc-200`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.[0] || 'K'}
              </div>
              <span className="text-base font-semibold text-zinc-900">KeepLynk</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-zinc-200/60 rounded-md transition-colors"
            >
              <X size={20} className="text-zinc-600" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-600 bg-zinc-100/70 hover:bg-zinc-200/60 rounded-lg transition-colors">
              <Search size={18} strokeWidth={1.5} />
              <span>Search resources...</span>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainRoutes.map((route) => {
                const Icon = route.icon
                const isActive = location.pathname === route.path
                return (
                  <button
                    key={route.path}
                    onClick={() => {
                      navigate(route.path)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-zinc-200 text-zinc-900' 
                        : 'text-zinc-700 hover:bg-zinc-100 active:scale-[0.98]'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span>{route.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="px-4 py-4 border-t border-zinc-200 space-y-2">
            {/* Profile Section */}
            <div className="bg-zinc-100/70 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  handleLogout()
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              >
                <LogOut size={16} strokeWidth={2} />
                <span>Log out</span>
              </button>
            </div>

            {/* Settings */}
            <button 
              onClick={() => {
                navigate('/settings')
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Settings size={18} strokeWidth={2} />
              <span>Settings & Preferences</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-zinc-200/80 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
          >
            <Menu size={22} className="text-zinc-700" strokeWidth={2} />
          </button>
          <h1 className="text-base font-semibold text-zinc-900">{getCurrentPageTitle()}</h1>
        </div>
        <button 
          onClick={() => setQuickActionOpen(true)} 
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
        >
          <MoreHorizontal size={22} className="text-zinc-700" strokeWidth={2} />
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
            
            <div className="px-4 pb-6 space-y-2">
              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  setAddResourceOpen(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 rounded-xl transition-colors text-left"
              >
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Plus size={22} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Add Resource</div>
                  <div className="text-xs text-zinc-500">Save a link or file</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open add folder modal
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 rounded-xl transition-colors text-left"
              >
                <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Folder size={22} className="text-purple-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">New Folder</div>
                  <div className="text-xs text-zinc-500">Organize your resources</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open manage tags modal
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 rounded-xl transition-colors text-left"
              >
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                  <Star size={22} className="text-green-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Manage Tags</div>
                  <div className="text-xs text-zinc-500">Create and edit tags</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setQuickActionOpen(false)
                  // TODO: Open search
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 rounded-xl transition-colors text-left"
              >
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Search size={22} className="text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Search</div>
                  <div className="text-xs text-zinc-500">Find your resources</div>
                </div>
              </button>
            </div>

            <div className="px-4 pb-4">
              <button 
                onClick={() => setQuickActionOpen(false)}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setAddResourceOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-90 z-30"
      >
        <Plus size={26} strokeWidth={2.5} />
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
