export type TenantType = 'PERSONAL' | 'ORGANIZATION'
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED' | 'ONBOARDING'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DevicePlatform = 'MACOS' | 'WINDOWS' | 'LINUX' | 'IOS' | 'ANDROID'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'AT_RISK' | 'ENROLLING' | 'REVOKED'
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED'
export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
export type PlanTier = 'FREE' | 'PERSONAL' | 'BUSINESS' | 'BUSINESS_PLUS' | 'ENTERPRISE'
export type PlanInterval = 'MONTHLY' | 'ANNUAL'
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID'
export type AdminRoleType =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'SECURITY_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'BILLING_ADMIN'
  | 'READ_ONLY_ADMIN'

export interface Organization {
  id: string
  name: string
  slug: string
  domain: string
  planId: string
  planName: string
  planTier: PlanTier
  status: TenantStatus
  riskScore: number
  riskLevel: RiskLevel
  employeeCount: number
  deviceCount: number
  healthyDeviceCount: number
  openIncidentsCount: number
  policyViolationsCount: number
  mrr: number
  subscriptionStatus: SubscriptionStatus
  ownerName: string
  ownerEmail: string
  createdAt: string
  lastActiveAt: string
  logoUrl?: string
  industry?: string
  region?: string
}

export interface IndividualUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED'
  riskScore: number
  riskLevel: RiskLevel
  securityScore: number
  planTier: PlanTier
  planName: string
  deviceCount: number
  subscriptionStatus: SubscriptionStatus
  mfaEnabled: boolean
  mfaMethod?: string
  lastActiveAt: string
  createdAt: string
}

export interface ManagedDevice {
  id: string
  hostname: string
  displayName: string
  assignedUserId?: string
  assignedUserName?: string
  tenantId: string
  tenantName: string
  tenantType: TenantType
  platform: DevicePlatform
  osVersion: string
  agentVersion: string
  status: DeviceStatus
  riskScore: number
  riskLevel: RiskLevel
  ipAddress: string
  macAddress: string
  serialNumber: string
  encryptionStatus: 'ENCRYPTED' | 'UNENCRYPTED' | 'PENDING'
  firewallEnabled: boolean
  lastSeenAt: string
  registeredAt: string
}

export interface SecurityEvent {
  id: string
  timestamp: string
  severity: RiskLevel
  eventType: string
  category: 'ENDPOINT' | 'NETWORK' | 'IDENTITY' | 'POLICY' | 'MALWARE'
  tenantId?: string
  tenantName?: string
  userId?: string
  userName?: string
  deviceId?: string
  deviceHostname?: string
  source: string
  actionTaken: string
  status: 'BLOCKED' | 'FLAGGED' | 'ALLOWED' | 'QUARANTINED'
  rawPayload?: Record<string, unknown>
}

export interface SecurityIncident {
  id: string
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  category: string
  tenantId?: string
  tenantName?: string
  deviceId?: string
  deviceHostname?: string
  userId?: string
  userName?: string
  riskScore: number
  createdAt: string
  updatedAt: string
  assignedToAdmin?: string
  assignedAdminEmail?: string
  summary: string
  timeline: Array<{
    timestamp: string
    title: string
    description: string
    actor: string
  }>
  relatedEventIds: string[]
}

export interface SecurityAlert {
  id: string
  title: string
  severity: RiskLevel
  category: string
  tenantName: string
  deviceName?: string
  timestamp: string
  status: AlertStatus
  assignedTo?: string
  description: string
}

export interface Subscription {
  id: string
  tenantId: string
  customerName: string
  customerEmail: string
  customerType: TenantType
  planId: string
  planName: string
  planTier: PlanTier
  status: SubscriptionStatus
  seatsAllocated: number
  seatsUsed: number
  devicesAllocated: number
  devicesUsed: number
  mrr: number
  billingInterval: PlanInterval
  startedAt: string
  renewsAt: string
}

export interface Plan {
  id: string
  name: string
  tier: PlanTier
  targetType: TenantType
  priceMonthly: number
  priceAnnual: number
  deviceLimit: number
  employeeLimit: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  subscriberCount: number
  features: string[]
  description: string
}

export interface GuardianAdminUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: AdminRoleType
  roleTitle: string
  team: string
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED'
  mfaEnabled: boolean
  lastLoginAt: string
  createdAt: string
  assignedPermissions: string[]
}

export interface GuardianRole {
  id: string
  key: AdminRoleType
  name: string
  description: string
  adminCount: number
  isSystemRole: boolean
  permissions: string[]
  updatedAt: string
}

export interface PermissionDefinition {
  id: string
  resource: string
  action: string
  key: string // e.g. "organizations.read"
  description: string
  category: string
}

export interface GuardianTeam {
  id: string
  name: string
  description: string
  leadEmail: string
  memberCount: number
  slackChannel: string
}

export interface AdminInvitation {
  id: string
  email: string
  role: AdminRoleType
  team: string
  invitedBy: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  sentAt: string
  expiresAt: string
}

export interface AdminSession {
  id: string
  adminId: string
  adminName: string
  adminEmail: string
  device: string
  browser: string
  ipAddress: string
  location: string
  lastActiveAt: string
  status: 'ACTIVE' | 'REVOKED'
  isCurrent: boolean
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorName: string
  actorEmail: string
  actorRole: string
  action: string
  resource: string
  resourceId: string
  result: 'SUCCESS' | 'FAILURE' | 'DENIED'
  ipAddress: string
  requestId: string
  category: 'ADMIN_ACTION' | 'SECURITY_ACTION' | 'DATA_ACCESS'
  isSensitiveDataAccess?: boolean
  details?: Record<string, unknown>
}

export interface ServiceHealth {
  id: string
  name: string
  category: string
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE'
  latencyMs: number
  uptimePercent: number
  lastCheckedAt: string
  region: string
  notes?: string
}

export interface AgentRelease {
  id: string
  version: string
  platform: DevicePlatform
  releaseDate: string
  status: 'ACTIVE' | 'ROLLING_OUT' | 'DEPRECATED'
  adoptionRate: number
  isMinSupported: boolean
  checksumSha256: string
  releaseNotes: string
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  environment: 'PRODUCTION' | 'STAGING' | 'ALL'
  enabled: boolean
  rolloutPercentage: number
  updatedAt: string
  updatedBy: string
}

export interface MaintenanceWindow {
  id: string
  title: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  startAt: string
  endAt: string
  affectedServices: string[]
  impactLevel: 'NONE' | 'LOW' | 'MODERATE' | 'CRITICAL'
  createdBy: string
}

export interface PlatformSettings {
  general: {
    portalName: string
    supportEmail: string
    incidentAlertEmail: string
    allowTrialAutoEnroll: boolean
    enforceStrictTenancy: boolean
  }
  security: {
    mfaEnforcedForAdmins: boolean
    sessionTimeoutMinutes: number
    ipAllowlistEnabled: boolean
    allowedIpRanges: string
    maxFailedLogins: number
  }
  authentication: {
    ssoEnabled: boolean
    samlEntityId: string
    samlSsoUrl: string
    scimProvisioningEnabled: boolean
  }
  notifications: {
    slackWebhookUrl: string
    pagerDutyKey: string
    emailDigestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY'
    notifyOnCriticalIncidents: boolean
  }
  storage: {
    evidenceBucket: string
    encryptionAlgorithm: string
    evidenceRegion: string
    redundancyMode: 'CROSS_REGION' | 'GEO_REDUNDANT' | 'STANDARD'
  }
  retention: {
    auditRetentionDays: number
    securityEventRetentionDays: number
    telemetryRetentionDays: number
    purgeArchivedTenantsDays: number
  }
  integrations: {
    splunkExportEnabled: boolean
    datadogApiKey: string
    crowdstrikeIntelSync: boolean
    sentinelWorkspaceId: string
  }
  defaults: {
    defaultDeviceLimit: number
    defaultEmployeeLimit: number
    defaultPasswordPolicy: 'STANDARD' | 'STRICT' | 'MILITARY'
    defaultAutoQuarantineRiskScore: number
  }
}

export interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  managedDevices: number
  activeAgents: number
  activeSubscriptions: number
  mrr: number
  openIncidents: number
  criticalAlerts: number
  riskBreakdown: {
    healthy: number
    warning: number
    highRisk: number
    critical: number
  }
}
