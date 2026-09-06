import {
  INITIAL_ORGANIZATIONS,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_ADMINS,
  INITIAL_ROLES,
  PERMISSION_DEFINITIONS,
  INITIAL_TEAMS,
  INITIAL_INVITATIONS,
  INITIAL_SESSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SERVICES_HEALTH,
  INITIAL_AGENT_RELEASES,
  INITIAL_FEATURE_FLAGS,
  INITIAL_MAINTENANCE_WINDOWS,
  INITIAL_PLATFORM_SETTINGS,
} from '../mock/adminMockData'
import type {
  Organization,
  IndividualUser,
  ManagedDevice,
  SecurityEvent,
  SecurityIncident,
  SecurityAlert,
  Subscription,
  Plan,
  GuardianAdminUser,
  GuardianRole,
  PermissionDefinition,
  GuardianTeam,
  AdminInvitation,
  AdminSession,
  AuditLogEntry,
  ServiceHealth,
  AgentRelease,
  FeatureFlag,
  MaintenanceWindow,
  PlatformSettings,
  PlatformMetrics,
  TenantStatus,
  IncidentStatus,
  AlertStatus,
} from '../types/admin'

type Listener = () => void

class AdminStore {
  private listeners: Set<Listener> = new Set()

  // State
  private organizations: Organization[] = [...INITIAL_ORGANIZATIONS]
  private users: IndividualUser[] = [...INITIAL_USERS]
  private devices: ManagedDevice[] = [...INITIAL_DEVICES]
  private plans: Plan[] = [...INITIAL_PLANS]
  private subscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS]
  private securityEvents: SecurityEvent[] = [...INITIAL_SECURITY_EVENTS]
  private incidents: SecurityIncident[] = [...INITIAL_INCIDENTS]
  private alerts: SecurityAlert[] = [...INITIAL_ALERTS]
  private admins: GuardianAdminUser[] = [...INITIAL_ADMINS]
  private roles: GuardianRole[] = [...INITIAL_ROLES]
  private permissions: PermissionDefinition[] = [...PERMISSION_DEFINITIONS]
  private teams: GuardianTeam[] = [...INITIAL_TEAMS]
  private invitations: AdminInvitation[] = [...INITIAL_INVITATIONS]
  private sessions: AdminSession[] = [...INITIAL_SESSIONS]
  private auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS]
  private servicesHealth: ServiceHealth[] = [...INITIAL_SERVICES_HEALTH]
  private agentReleases: AgentRelease[] = [...INITIAL_AGENT_RELEASES]
  private featureFlags: FeatureFlag[] = [...INITIAL_FEATURE_FLAGS]
  private maintenanceWindows: MaintenanceWindow[] = [...INITIAL_MAINTENANCE_WINDOWS]
  private settings: PlatformSettings = JSON.parse(JSON.stringify(INITIAL_PLATFORM_SETTINGS))

  // Pub/Sub
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  private logAction(action: string, resource: string, resourceId: string, details?: Record<string, unknown>, isSensitive = false) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorName: 'Alexander Vance',
      actorEmail: 'alexander.vance@guardian.internal',
      actorRole: 'Guardian Super Admin',
      action,
      resource,
      resourceId,
      result: 'SUCCESS',
      ipAddress: '198.51.100.12',
      requestId: `req-${Math.random().toString(36).substring(2, 8)}`,
      category: isSensitive ? 'DATA_ACCESS' : action.includes('SECURITY') ? 'SECURITY_ACTION' : 'ADMIN_ACTION',
      isSensitiveDataAccess: isSensitive,
      details,
    }
    this.auditLogs = [entry, ...this.auditLogs]
  }

  // ================= ORGANIZATIONS =================
  public getOrganizations(): Organization[] {
    return [...this.organizations]
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.organizations.find((o) => o.id === id)
  }

  public createOrganization(data: Partial<Organization>): Organization {
    const newOrg: Organization = {
      id: `org-${Date.now().toString().slice(-4)}`,
      name: data.name ?? 'Untitled Organization',
      slug: data.slug ?? 'untitled',
      domain: data.domain ?? 'example.com',
      planId: data.planId ?? 'plan-bus',
      planName: data.planName ?? 'Guardian Business',
      planTier: data.planTier ?? 'BUSINESS',
      status: 'ACTIVE',
      riskScore: 20,
      riskLevel: 'LOW',
      employeeCount: data.employeeCount ?? 1,
      deviceCount: data.deviceCount ?? 1,
      healthyDeviceCount: data.deviceCount ?? 1,
      openIncidentsCount: 0,
      policyViolationsCount: 0,
      mrr: data.mrr ?? 180,
      subscriptionStatus: 'ACTIVE',
      ownerName: data.ownerName ?? 'Primary Admin',
      ownerEmail: data.ownerEmail ?? 'admin@domain.com',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      industry: data.industry ?? 'Technology',
      region: data.region ?? 'us-east-1',
    }

    this.organizations = [newOrg, ...this.organizations]

    // Create corresponding subscription
    const sub: Subscription = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      tenantId: newOrg.id,
      customerName: newOrg.name,
      customerEmail: newOrg.ownerEmail,
      customerType: 'ORGANIZATION',
      planId: newOrg.planId,
      planName: newOrg.planName,
      planTier: newOrg.planTier,
      status: 'ACTIVE',
      seatsAllocated: Math.max(newOrg.employeeCount, 25),
      seatsUsed: newOrg.employeeCount,
      devicesAllocated: Math.max(newOrg.deviceCount, 50),
      devicesUsed: newOrg.deviceCount,
      mrr: newOrg.mrr,
      billingInterval: 'ANNUAL',
      startedAt: new Date().toISOString(),
      renewsAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    }
    this.subscriptions = [sub, ...this.subscriptions]

    this.logAction('TENANT_CREATED', 'Organization', newOrg.id, { name: newOrg.name, domain: newOrg.domain })
    this.notify()
    return newOrg
  }

  public updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    const index = this.organizations.findIndex((o) => o.id === id)
    if (index === -1) return undefined
    const updated = { ...this.organizations[index], ...updates }
    this.organizations[index] = updated
    this.logAction('TENANT_UPDATED', 'Organization', id, { updates })
    this.notify()
    return updated
  }

  public setOrganizationStatus(id: string, status: TenantStatus, reason?: string): Organization | undefined {
    const index = this.organizations.findIndex((o) => o.id === id)
    if (index === -1) return undefined
    const prev = this.organizations[index].status
    this.organizations[index] = { ...this.organizations[index], status }
    this.logAction(`TENANT_${status}`, 'Organization', id, { previousStatus: prev, newStatus: status, reason })
    this.notify()
    return this.organizations[index]
  }

  // ================= USERS =================
  public getUsers(): IndividualUser[] {
    return [...this.users]
  }

  public getUserById(id: string): IndividualUser | undefined {
    return this.users.find((u) => u.id === id)
  }

  public createUser(data: Partial<IndividualUser>): IndividualUser {
    const newUser: IndividualUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: data.name ?? 'New User',
      email: data.email ?? 'user@example.com',
      status: data.status ?? 'ACTIVE',
      riskScore: 15,
      riskLevel: 'LOW',
      securityScore: 92,
      planTier: data.planTier ?? 'PERSONAL',
      planName: data.planTier === 'FREE' ? 'Guardian Free' : 'Guardian Personal',
      deviceCount: 0,
      subscriptionStatus: 'ACTIVE',
      mfaEnabled: true,
      mfaMethod: 'TOTP',
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.users = [newUser, ...this.users]
    this.logAction('USER_CREATED', 'User', newUser.id, { email: newUser.email })
    this.notify()
    return newUser
  }

  public updateUser(id: string, updates: Partial<IndividualUser>): IndividualUser | undefined {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return undefined
    this.users[index] = { ...this.users[index], ...updates }
    this.logAction('USER_UPDATED', 'User', id, { updates })
    this.notify()
    return this.users[index]
  }

  public setUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED', reason?: string): IndividualUser | undefined {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return undefined
    this.users[index] = { ...this.users[index], status }
    this.logAction(`USER_STATUS_${status}`, 'User', id, { reason })
    this.notify()
    return this.users[index]
  }

  // ================= DEVICES =================
  public getDevices(): ManagedDevice[] {
    return [...this.devices]
  }

  public getDeviceById(id: string): ManagedDevice | undefined {
    return this.devices.find((d) => d.id === id)
  }

  public simulateDeviceCommand(deviceId: string, command: 'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC', reason: string): { success: boolean; message: string } {
    const dev = this.getDeviceById(deviceId)
    if (!dev) return { success: false, message: 'Device not found' }

    if (command === 'ISOLATE') {
      const idx = this.devices.findIndex((d) => d.id === deviceId)
      if (idx !== -1) {
        this.devices[idx] = { ...this.devices[idx], status: 'OFFLINE' }
      }
    }

    this.logAction(`SIMULATED_DEVICE_${command}`, 'Device', deviceId, {
      hostname: dev.hostname,
      simulated: true,
      reason,
    })
    this.notify()
    return {
      success: true,
      message: `[SIMULATED] Command ${command} dispatched to ${dev.hostname}. No hardware was affected in Demo Mode.`,
    }
  }

  // ================= PLANS =================
  public getPlans(): Plan[] {
    return [...this.plans]
  }

  public getPlanById(id: string): Plan | undefined {
    return this.plans.find((p) => p.id === id)
  }

  public createPlan(data: Partial<Plan>): Plan {
    const newPlan: Plan = {
      id: `plan-${Date.now().toString().slice(-4)}`,
      name: data.name ?? 'Custom Plan',
      tier: data.tier ?? 'BUSINESS',
      targetType: data.targetType ?? 'ORGANIZATION',
      priceMonthly: data.priceMonthly ?? 25,
      priceAnnual: data.priceAnnual ?? 250,
      deviceLimit: data.deviceLimit ?? 100,
      employeeLimit: data.employeeLimit ?? 50,
      status: 'ACTIVE',
      subscriberCount: 0,
      features: data.features ?? ['Core Protection', 'Email Support'],
      description: data.description ?? 'Custom security plan tier.',
    }
    this.plans = [...this.plans, newPlan]
    this.logAction('PLAN_CREATED', 'Plan', newPlan.id, { name: newPlan.name })
    this.notify()
    return newPlan
  }

  public updatePlan(id: string, updates: Partial<Plan>): Plan | undefined {
    const idx = this.plans.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    this.plans[idx] = { ...this.plans[idx], ...updates }
    this.logAction('PLAN_UPDATED', 'Plan', id, { updates })
    this.notify()
    return this.plans[idx]
  }

  // ================= SUBSCRIPTIONS =================
  public getSubscriptions(): Subscription[] {
    return [...this.subscriptions]
  }

  public getSubscriptionById(id: string): Subscription | undefined {
    return this.subscriptions.find((s) => s.id === id)
  }

  // ================= SECURITY =================
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents]
  }

  public getIncidents(): SecurityIncident[] {
    return [...this.incidents]
  }

  public getIncidentById(id: string): SecurityIncident | undefined {
    return this.incidents.find((i) => i.id === id)
  }

  public createIncident(data: Partial<SecurityIncident>): SecurityIncident {
    const newInc: SecurityIncident = {
      id: `inc-${Date.now().toString().slice(-3)}`,
      title: data.title ?? 'Suspicious Activity Detected',
      severity: data.severity ?? 'HIGH',
      status: 'OPEN',
      category: data.category ?? 'Anomalous Endpoint Behavior',
      tenantId: data.tenantId,
      tenantName: data.tenantName ?? 'Global Platform',
      deviceId: data.deviceId,
      deviceHostname: data.deviceHostname,
      riskScore: data.riskScore ?? 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedToAdmin: data.assignedToAdmin ?? 'Unassigned',
      assignedAdminEmail: data.assignedAdminEmail ?? 'soc@guardian.security',
      summary: data.summary ?? 'Anomalous telemetry triggered investigative incident.',
      timeline: [
        {
          timestamp: new Date().toISOString(),
          title: 'Incident Created',
          description: 'Incident ticket manually generated in Super Admin portal.',
          actor: 'Alexander Vance (Super Admin)',
        },
      ],
      relatedEventIds: data.relatedEventIds ?? [],
    }
    this.incidents = [newInc, ...this.incidents]
    this.logAction('SECURITY_INCIDENT_CREATED', 'SecurityIncident', newInc.id, { title: newInc.title })
    this.notify()
    return newInc
  }

  public updateIncidentStatus(id: string, status: IncidentStatus, notes?: string): SecurityIncident | undefined {
    const idx = this.incidents.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    const inc = this.incidents[idx]
    const updated: SecurityIncident = {
      ...inc,
      status,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          title: `Status Changed to ${status}`,
          description: notes ?? `Status modified to ${status}`,
          actor: 'Alexander Vance',
        },
        ...inc.timeline,
      ],
    }
    this.incidents[idx] = updated
    this.logAction('SECURITY_INCIDENT_STATUS_CHANGE', 'SecurityIncident', id, { previous: inc.status, newStatus: status, notes })
    this.notify()
    return updated
  }

  public assignIncident(id: string, adminName: string, adminEmail: string): SecurityIncident | undefined {
    const idx = this.incidents.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    const inc = this.incidents[idx]
    const updated: SecurityIncident = {
      ...inc,
      assignedToAdmin: adminName,
      assignedAdminEmail: adminEmail,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          title: `Assigned to ${adminName}`,
          description: `Assigned by Alexander Vance`,
          actor: 'Alexander Vance',
        },
        ...inc.timeline,
      ],
    }
    this.incidents[idx] = updated
    this.logAction('SECURITY_INCIDENT_ASSIGNED', 'SecurityIncident', id, { assignedTo: adminName })
    this.notify()
    return updated
  }

  public getAlerts(): SecurityAlert[] {
    return [...this.alerts]
  }

  public setAlertStatus(id: string, status: AlertStatus, assignedTo?: string): SecurityAlert | undefined {
    const idx = this.alerts.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    const updated = {
      ...this.alerts[idx],
      status,
      assignedTo: assignedTo ?? this.alerts[idx].assignedTo,
    }
    this.alerts[idx] = updated
    this.logAction(`ALERT_${status}`, 'SecurityAlert', id, { status, assignedTo })
    this.notify()
    return updated
  }

  // ================= GUARDIAN IAM =================
  public getAdmins(): GuardianAdminUser[] {
    return [...this.admins]
  }

  public getAdminById(id: string): GuardianAdminUser | undefined {
    return this.admins.find((a) => a.id === id)
  }

  public createAdmin(data: Partial<GuardianAdminUser>): GuardianAdminUser {
    const roleTitles: Record<string, string> = {
      SUPER_ADMIN: 'Guardian Super Admin',
      OPERATIONS_ADMIN: 'Guardian Operations Admin',
      SECURITY_ADMIN: 'Guardian Security Admin',
      SUPPORT_ADMIN: 'Guardian Support Admin',
      BILLING_ADMIN: 'Guardian Billing Admin',
      READ_ONLY_ADMIN: 'Guardian Read Only Admin',
    }
    const newAdmin: GuardianAdminUser = {
      id: `adm-${Date.now().toString().slice(-4)}`,
      name: data.name ?? 'New Admin',
      email: data.email ?? 'admin@guardian.internal',
      role: data.role ?? 'SUPPORT_ADMIN',
      roleTitle: roleTitles[data.role ?? 'SUPPORT_ADMIN'] ?? 'Guardian Admin',
      team: data.team ?? 'Support',
      status: 'ACTIVE',
      mfaEnabled: true,
      lastLoginAt: 'Never',
      createdAt: new Date().toISOString(),
      assignedPermissions: data.assignedPermissions ?? ['organizations.read'],
    }
    this.admins = [...this.admins, newAdmin]
    this.logAction('IAM_ADMIN_CREATED', 'GuardianAdminUser', newAdmin.id, { email: newAdmin.email, role: newAdmin.role })
    this.notify()
    return newAdmin
  }

  public updateAdmin(id: string, updates: Partial<GuardianAdminUser>): GuardianAdminUser | undefined {
    const idx = this.admins.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    this.admins[idx] = { ...this.admins[idx], ...updates }
    this.logAction('IAM_ADMIN_UPDATED', 'GuardianAdminUser', id, { updates })
    this.notify()
    return this.admins[idx]
  }

  public setAdminStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): GuardianAdminUser | undefined {
    const idx = this.admins.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    this.admins[idx] = { ...this.admins[idx], status }
    this.logAction(`IAM_ADMIN_${status}`, 'GuardianAdminUser', id)
    this.notify()
    return this.admins[idx]
  }

  public resetAdminMfa(id: string): boolean {
    const idx = this.admins.findIndex((a) => a.id === id)
    if (idx === -1) return false
    this.admins[idx] = { ...this.admins[idx], mfaEnabled: false }
    this.logAction('IAM_ADMIN_MFA_RESET', 'GuardianAdminUser', id)
    this.notify()
    return true
  }

  public removeAdmin(id: string): boolean {
    const idx = this.admins.findIndex((a) => a.id === id)
    if (idx === -1) return false
    const removed = this.admins[idx]
    this.admins = this.admins.filter((a) => a.id !== id)
    this.logAction('IAM_ADMIN_REMOVED', 'GuardianAdminUser', id, { email: removed.email })
    this.notify()
    return true
  }

  public getRoles(): GuardianRole[] {
    return [...this.roles]
  }

  public getRoleById(id: string): GuardianRole | undefined {
    return this.roles.find((r) => r.id === id)
  }

  public updateRolePermissions(roleId: string, permissions: string[]): GuardianRole | undefined {
    const idx = this.roles.findIndex((r) => r.id === roleId)
    if (idx === -1) return undefined
    this.roles[idx] = { ...this.roles[idx], permissions, updatedAt: new Date().toISOString() }
    this.logAction('IAM_ROLE_PERMISSIONS_UPDATED', 'GuardianRole', roleId, { count: permissions.length })
    this.notify()
    return this.roles[idx]
  }

  public getPermissions(): PermissionDefinition[] {
    return [...this.permissions]
  }

  public getTeams(): GuardianTeam[] {
    return [...this.teams]
  }

  public getInvitations(): AdminInvitation[] {
    return [...this.invitations]
  }

  public revokeInvitation(id: string): boolean {
    const idx = this.invitations.findIndex((i) => i.id === id)
    if (idx === -1) return false
    this.invitations[idx] = { ...this.invitations[idx], status: 'REVOKED' }
    this.logAction('IAM_INVITATION_REVOKED', 'AdminInvitation', id)
    this.notify()
    return true
  }

  public getSessions(): AdminSession[] {
    return [...this.sessions]
  }

  public revokeSession(id: string): boolean {
    const idx = this.sessions.findIndex((s) => s.id === id)
    if (idx === -1) return false
    this.sessions[idx] = { ...this.sessions[idx], status: 'REVOKED' }
    this.logAction('IAM_SESSION_REVOKED', 'AdminSession', id)
    this.notify()
    return true
  }

  // ================= AUDIT =================
  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs]
  }

  // ================= PLATFORM =================
  public getServicesHealth(): ServiceHealth[] {
    return [...this.servicesHealth]
  }

  public getAgentReleases(): AgentRelease[] {
    return [...this.agentReleases]
  }

  public toggleAgentMinSupported(releaseId: string): AgentRelease | undefined {
    const idx = this.agentReleases.findIndex((r) => r.id === releaseId)
    if (idx === -1) return undefined
    const updated = { ...this.agentReleases[idx], isMinSupported: !this.agentReleases[idx].isMinSupported }
    this.agentReleases[idx] = updated
    this.logAction('AGENT_RELEASE_MIN_SUPPORTED_TOGGLE', 'AgentRelease', releaseId, { minSupported: updated.isMinSupported })
    this.notify()
    return updated
  }

  public getFeatureFlags(): FeatureFlag[] {
    return [...this.featureFlags]
  }

  public toggleFeatureFlag(flagId: string): FeatureFlag | undefined {
    const idx = this.featureFlags.findIndex((f) => f.id === flagId)
    if (idx === -1) return undefined
    const updated = {
      ...this.featureFlags[idx],
      enabled: !this.featureFlags[idx].enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Alexander Vance',
    }
    this.featureFlags[idx] = updated
    this.logAction('FEATURE_FLAG_TOGGLED', 'FeatureFlag', flagId, { key: updated.key, enabled: updated.enabled })
    this.notify()
    return updated
  }

  public getMaintenanceWindows(): MaintenanceWindow[] {
    return [...this.maintenanceWindows]
  }

  public createMaintenanceWindow(data: Partial<MaintenanceWindow>): MaintenanceWindow {
    const window: MaintenanceWindow = {
      id: `maint-${Date.now().toString().slice(-4)}`,
      title: data.title ?? 'Emergency Maintenance',
      status: 'SCHEDULED',
      startAt: data.startAt ?? new Date(Date.now() + 86400000).toISOString(),
      endAt: data.endAt ?? new Date(Date.now() + 90000000).toISOString(),
      affectedServices: data.affectedServices ?? ['Guardian Edge API Gateway'],
      impactLevel: data.impactLevel ?? 'LOW',
      createdBy: 'Alexander Vance',
    }
    this.maintenanceWindows = [window, ...this.maintenanceWindows]
    this.logAction('MAINTENANCE_WINDOW_SCHEDULED', 'MaintenanceWindow', window.id, { title: window.title })
    this.notify()
    return window
  }

  // ================= SETTINGS =================
  public getSettings(): PlatformSettings {
    return JSON.parse(JSON.stringify(this.settings))
  }

  public updateSettings(section: keyof PlatformSettings, updates: Record<string, unknown>): PlatformSettings {
    this.settings = {
      ...this.settings,
      [section]: {
        ...this.settings[section],
        ...updates,
      },
    }
    this.logAction('PLATFORM_SETTINGS_UPDATED', 'PlatformSettings', section, { updates })
    this.notify()
    return this.getSettings()
  }

  // ================= AGGREGATED METRICS =================
  public getMetrics(): PlatformMetrics {
    const totalOrgs = this.organizations.length
    const activeOrgs = this.organizations.filter((o) => o.status === 'ACTIVE').length
    const totalUsers = this.users.length
    const managedDevices = this.devices.length
    const activeAgents = this.devices.filter((d) => d.status === 'ONLINE').length
    const activeSubs = this.subscriptions.filter((s) => s.status === 'ACTIVE').length
    const mrr = this.subscriptions.reduce((acc, s) => acc + (s.status === 'ACTIVE' ? s.mrr : 0), 0)
    const openIncidents = this.incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length
    const criticalAlerts = this.alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'PENDING').length

    let healthy = 0
    let warning = 0
    let highRisk = 0
    let critical = 0

    this.organizations.forEach((o) => {
      if (o.riskLevel === 'LOW') healthy++
      else if (o.riskLevel === 'MEDIUM') warning++
      else if (o.riskLevel === 'HIGH') highRisk++
      else if (o.riskLevel === 'CRITICAL') critical++
    })

    return {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      totalUsers,
      managedDevices,
      activeAgents,
      activeSubscriptions: activeSubs,
      mrr,
      openIncidents,
      criticalAlerts,
      riskBreakdown: { healthy, warning, highRisk, critical },
    }
  }
}

export const adminStore = new AdminStore()
