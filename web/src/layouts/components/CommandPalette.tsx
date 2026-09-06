import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, User, Laptop, ShieldAlert, Activity, ArrowRight, X } from 'lucide-react'
import { adminStore } from '../../repositories/adminStore'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open handled by parent or custom event
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const orgs = adminStore.getOrganizations()
  const users = adminStore.getUsers()
  const devices = adminStore.getDevices()
  const incidents = adminStore.getIncidents()

  const q = query.toLowerCase().trim()

  const filteredOrgs = q
    ? orgs.filter((o) => o.name.toLowerCase().includes(q) || o.domain.toLowerCase().includes(q)).slice(0, 4)
    : orgs.slice(0, 3)

  const filteredUsers = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 4)
    : users.slice(0, 3)

  const filteredDevices = q
    ? devices.filter((d) => d.hostname.toLowerCase().includes(q) || d.displayName.toLowerCase().includes(q)).slice(0, 4)
    : devices.slice(0, 3)

  const filteredIncidents = q
    ? incidents.filter((i) => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).slice(0, 4)
    : incidents.slice(0, 3)

  function handleSelect(path: string) {
    navigate(path)
    onClose()
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search className="h-4 w-4 text-signal shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations, users, devices, incidents, events… (Cmd+K)"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-ink-soft hover:text-ink text-xs font-mono"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs font-mono">
          {/* Organizations */}
          {filteredOrgs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-signal" /> Organizations
              </div>
              <div className="space-y-1 mt-1">
                {filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(`/admin/organizations/${org.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors text-ink hover:text-ink group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{org.name}</span>
                      <span className="text-ink-soft font-normal">({org.domain})</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft group-hover:text-signal">
                      <span className="text-[10px]">{org.planName}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Individual Users */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1.5">
                <User className="h-3 w-3 text-signal" /> Individual Users
              </div>
              <div className="space-y-1 mt-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(`/admin/users/${u.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors text-ink hover:text-ink group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{u.name}</span>
                      <span className="text-ink-soft font-normal">({u.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft group-hover:text-signal">
                      <span className="text-[10px]">{u.planName}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Devices */}
          {filteredDevices.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1.5">
                <Laptop className="h-3 w-3 text-signal" /> Managed Devices
              </div>
              <div className="space-y-1 mt-1">
                {filteredDevices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/admin/devices/${d.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors text-ink hover:text-ink group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{d.hostname}</span>
                      <span className="text-ink-soft font-normal">[{d.platform}] • {d.tenantName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft group-hover:text-signal">
                      <span className="text-[10px]">{d.status}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Incidents */}
          {filteredIncidents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-alert" /> Security Incidents
              </div>
              <div className="space-y-1 mt-1">
                {filteredIncidents.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => handleSelect(`/admin/security/incidents`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors text-ink hover:text-ink group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-semibold text-alert shrink-0">[{i.severity}]</span>
                      <span className="truncate text-ink">{i.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft group-hover:text-signal shrink-0">
                      <span className="text-[10px]">{i.status}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-line/80 px-4 py-2.5 bg-surface-2 text-[10px] font-mono text-ink-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-ink border border-line">ESC</kbd> to close
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-ink border border-line">↵</kbd> to select
            </span>
          </div>
          <span>Platform Search Engine</span>
        </div>
      </div>
    </div>
  )
}
