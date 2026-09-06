import { z } from 'zod'

export const organizationOnboardingSchema = z.object({
  // Step 1: Organization
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens'),
  domain: z.string().min(3, 'Corporate domain is required').regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain name'),
  industry: z.string().min(1, 'Industry is required'),
  region: z.string().min(1, 'Region is required'),

  // Step 2: Owner
  ownerName: z.string().min(2, 'Owner full name is required'),
  ownerEmail: z.string().email('Valid owner corporate email is required'),
  ownerTitle: z.string().optional(),

  // Step 3: Plan
  planTier: z.enum(['BUSINESS', 'BUSINESS_PLUS', 'ENTERPRISE']),
  billingInterval: z.enum(['MONTHLY', 'ANNUAL']),

  // Step 4: Subscription
  seatCount: z.coerce.number().min(1, 'At least 1 seat required').max(100000),
  deviceMultiplier: z.coerce.number().min(1, 'Multiplier must be at least 1').max(10),

  // Step 5: Security Defaults
  enforceMfa: z.boolean().default(true),
  isolateHighRiskDevices: z.boolean().default(true),
  complianceStandard: z.enum(['SOC2', 'HIPAA', 'ISO27001', 'NIST_CSF', 'STANDARD']),
  riskThreshold: z.coerce.number().min(50).max(95).default(75),

  // Step 6: Limits
  maxSimultaneousLogins: z.coerce.number().min(1).max(10).default(3),
  apiRateLimitPerMin: z.coerce.number().min(100).max(50000).default(1000),
  retentionMonths: z.coerce.number().min(1).max(84).default(12),
})

export type OrganizationOnboardingFormValues = z.infer<typeof organizationOnboardingSchema>

export const editOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  domain: z.string().min(3, 'Corporate domain is required'),
  planTier: z.enum(['FREE', 'PERSONAL', 'BUSINESS', 'BUSINESS_PLUS', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'ARCHIVED']),
})

export const suspendReasonSchema = z.object({
  reason: z.string().min(10, 'A detailed justification (minimum 10 characters) is required for platform audit'),
  notifyTenantAdmins: z.boolean().default(true),
  preserveDataForDays: z.coerce.number().min(7).max(365).default(90),
})

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  planTier: z.enum(['FREE', 'PERSONAL']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'ARCHIVED']),
})

export const planFormSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  tier: z.enum(['FREE', 'PERSONAL', 'BUSINESS', 'BUSINESS_PLUS', 'ENTERPRISE']),
  targetType: z.enum(['PERSONAL', 'ORGANIZATION']),
  priceMonthly: z.coerce.number().min(0),
  priceAnnual: z.coerce.number().min(0),
  deviceLimit: z.coerce.number().min(1),
  employeeLimit: z.coerce.number().min(1),
  description: z.string().min(10, 'Description required'),
})

export const createAdminSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Internal Guardian email is required'),
  role: z.enum([
    'SUPER_ADMIN',
    'OPERATIONS_ADMIN',
    'SECURITY_ADMIN',
    'SUPPORT_ADMIN',
    'BILLING_ADMIN',
    'READ_ONLY_ADMIN',
  ]),
  team: z.enum(['Platform', 'Security', 'Operations', 'Support', 'Billing']),
  requireMfa: z.boolean().default(true),
})

export const createIncidentSchema = z.object({
  title: z.string().min(5, 'Incident title must be at least 5 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().min(2, 'Category is required'),
  tenantId: z.string().optional(),
  deviceId: z.string().optional(),
  summary: z.string().min(15, 'Provide a detailed incident summary'),
  assignedToAdmin: z.string().optional(),
})

export const maintenanceWindowSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  impactLevel: z.enum(['NONE', 'LOW', 'MODERATE', 'CRITICAL']),
  startAt: z.string().min(1, 'Start date/time is required'),
  endAt: z.string().min(1, 'End date/time is required'),
  affectedServices: z.array(z.string()).min(1, 'Select at least one affected service'),
  notes: z.string().optional(),
})
