import { adminStore } from '../repositories/adminStore'
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

export const adminService = {
  subscribe(listener: () => void) {
    return adminStore.subscribe(listener)
  },

  // Overview
  getMetrics(): PlatformMetrics {
    return adminStore.getMetrics()
  },

  // Organizations
  getOrganizations(): Organization[] {
    return adminStore.getOrganizations()
  },
  getOrganizationById(id: string): Organization | undefined {
    return adminStore.getOrganizationById(id)
  },
  createOrganization(data: Partial<Organization>): Organization {
    return adminStore.createOrganization(data)
  },
  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    return adminStore.updateOrganization(id, updates)
  },
  setOrganizationStatus(id: string, status: TenantStatus, reason?: string): Organization | undefined {
    return adminStore.setOrganizationStatus(id, status, reason)
  },

  // Users
  getUsers(): IndividualUser[] {
    return adminStore.getUsers()
  },
  getUserById(id: string): IndividualUser | undefined {
    return adminStore.getUserById(id)
  },
  createUser(data: Partial<IndividualUser>): IndividualUser {
    return adminStore.createUser(data)
  },
  updateUser(id: string, updates: Partial<IndividualUser>): IndividualUser | undefined {
    return adminStore.updateUser(id, updates)
  },
  setUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED', reason?: string): IndividualUser | undefined {
    return adminStore.setUserStatus(id, status, reason)
  },

  // Devices
  getDevices(): ManagedDevice[] {
    return adminStore.getDevices()
  },
  getDeviceById(id: string): ManagedDevice | undefined {
    return adminStore.getDeviceById(id)
  },
  simulateDeviceCommand(deviceId: string, command: 'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC', reason: string) {
    return adminStore.simulateDeviceCommand(deviceId, command, reason)
  },

  // Plans & Subscriptions
  getPlans(): Plan[] {
    return adminStore.getPlans()
  },
  getPlanById(id: string): Plan | undefined {
    return adminStore.getPlanById(id)
  },
  createPlan(data: Partial<Plan>): Plan {
    return adminStore.createPlan(data)
  },
  updatePlan(id: string, updates: Partial<Plan>): Plan | undefined {
    return adminStore.updatePlan(id, updates)
  },
  getSubscriptions(): Subscription[] {
    return adminStore.getSubscriptions()
  },
  getSubscriptionById(id: string): Subscription | undefined {
    return adminStore.getSubscriptionById(id)
  },

  // Security
  getSecurityEvents(): SecurityEvent[] {
    return adminStore.getSecurityEvents()
  },
  getIncidents(): SecurityIncident[] {
    return adminStore.getIncidents()
  },
  getIncidentById(id: string): SecurityIncident | undefined {
    return adminStore.getIncidentById(id)
  },
  createIncident(data: Partial<SecurityIncident>): SecurityIncident {
    return adminStore.createIncident(data)
  },
  updateIncidentStatus(id: string, status: IncidentStatus, notes?: string): SecurityIncident | undefined {
    return adminStore.updateIncidentStatus(id, status, notes)
  },
  assignIncident(id: string, adminName: string, adminEmail: string): SecurityIncident | undefined {
    return adminStore.assignIncident(id, adminName, adminEmail)
  },
  getAlerts(): SecurityAlert[] {
    return adminStore.getAlerts()
  },
  setAlertStatus(id: string, status: AlertStatus, assignedTo?: string): SecurityAlert | undefined {
    return adminStore.setAlertStatus(id, status, assignedTo)
  },

  // IAM
  getAdmins(): GuardianAdminUser[] {
    return adminStore.getAdmins()
  },
  getAdminById(id: string): GuardianAdminUser | undefined {
    return adminStore.getAdminById(id)
  },
  createAdmin(data: Partial<GuardianAdminUser>): GuardianAdminUser {
    return adminStore.createAdmin(data)
  },
  updateAdmin(id: string, updates: Partial<GuardianAdminUser>): GuardianAdminUser | undefined {
    return adminStore.updateAdmin(id, updates)
  },
  setAdminStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): GuardianAdminUser | undefined {
    return adminStore.setAdminStatus(id, status)
  },
  resetAdminMfa(id: string): boolean {
    return adminStore.resetAdminMfa(id)
  },
  removeAdmin(id: string): boolean {
    return adminStore.removeAdmin(id)
  },
  getRoles(): GuardianRole[] {
    return adminStore.getRoles()
  },
  getRoleById(id: string): GuardianRole | undefined {
    return adminStore.getRoleById(id)
  },
  updateRolePermissions(roleId: string, permissions: string[]): GuardianRole | undefined {
    return adminStore.updateRolePermissions(roleId, permissions)
  },
  getPermissions(): PermissionDefinition[] {
    return adminStore.getPermissions()
  },
  getTeams(): GuardianTeam[] {
    return adminStore.getTeams()
  },
  getInvitations(): AdminInvitation[] {
    return adminStore.getInvitations()
  },
  revokeInvitation(id: string): boolean {
    return adminStore.revokeInvitation(id)
  },
  getSessions(): AdminSession[] {
    return adminStore.getSessions()
  },
  revokeSession(id: string): boolean {
    return adminStore.revokeSession(id)
  },

  // Audit
  getAuditLogs(): AuditLogEntry[] {
    return adminStore.getAuditLogs()
  },

  // Platform
  getServicesHealth(): ServiceHealth[] {
    return adminStore.getServicesHealth()
  },
  getAgentReleases(): AgentRelease[] {
    return adminStore.getAgentReleases()
  },
  toggleAgentMinSupported(releaseId: string): AgentRelease | undefined {
    return adminStore.toggleAgentMinSupported(releaseId)
  },
  getFeatureFlags(): FeatureFlag[] {
    return adminStore.getFeatureFlags()
  },
  toggleFeatureFlag(flagId: string): FeatureFlag | undefined {
    return adminStore.toggleFeatureFlag(flagId)
  },
  getMaintenanceWindows(): MaintenanceWindow[] {
    return adminStore.getMaintenanceWindows()
  },
  createMaintenanceWindow(data: Partial<MaintenanceWindow>): MaintenanceWindow {
    return adminStore.createMaintenanceWindow(data)
  },

  // Settings
  getSettings(): PlatformSettings {
    return adminStore.getSettings()
  },
  updateSettings(section: keyof PlatformSettings, updates: Record<string, unknown>): PlatformSettings {
    return adminStore.updateSettings(section, updates)
  },
}
