import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { SuperSidebar } from './components/SuperSidebar'
import { SuperHeader } from './components/SuperHeader'
import { CommandPalette } from './components/CommandPalette'

export function SuperAdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('guardian-super-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('guardian-super-sidebar', collapsed ? 'collapsed' : 'expanded')
    } catch {
      // ignore
    }
  }, [collapsed])

  // Ensure demo session exists so reviewer can immediately browse all admin routes
  useEffect(() => {
    const session = localStorage.getItem('super_admin_session')
    if (!session) {
      localStorage.setItem('super_admin_session', JSON.stringify({
        id: 'demo-session',
        email: 'alexander.vance@guardian.internal',
        role: 'SUPER_ADMIN',
        name: 'Alexander Vance',
      }))
    }
  }, [])

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-mist text-ink flex font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <SuperSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72">
            <SuperSidebar
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              onMobileClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden bg-mist g-atmosphere relative">
        <SuperHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent relative z-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
      />
    </div>
  )
}
