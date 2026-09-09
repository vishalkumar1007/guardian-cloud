/** Shapes returned by the Guardian authentication API. */

/** What the server decided after a correct password. */
export type LoginStatus = 'authenticated' | 'mfa_required' | 'mfa_enrollment_required'

export interface AuthSessionInfo {
  issued_at: string
  expires_at: string
  /** Absent when the idle timeout is disabled. */
  idle_expires_at?: string
  auth_method: string
}

export interface AuthRole {
  id: string
  key: string
  name: string
}

/** The signed-in caller, as returned by /me. */
export interface AuthUser {
  id: string
  email: string
  display_name: string
  mfa_enabled: boolean
  session: AuthSessionInfo
  /** Staff plane only. Drives which navigation entries are shown. */
  roles?: AuthRole[]
  permissions?: string[]
  /** Customer plane only, and a UI convenience — never authorization. */
  active_tenant_id?: string
}

export interface LoginResponse {
  status: LoginStatus
  user?: {
    id: string
    email: string
    display_name: string
    email_verified: boolean
  }
  csrf_token?: string
  /** Which second factors the challenge will accept. */
  methods?: string[]
  message?: string
}

export interface MfaMethod {
  id: string
  method_type: 'TOTP' | 'EMAIL' | 'WEBAUTHN'
  label: string
  is_primary: boolean
  verified_at?: string
  last_used_at?: string
  created_at: string
}

export interface MfaListResponse {
  items: MfaMethod[]
  total: number
  recovery_codes_remaining: number
}

export interface TotpEnrollmentResponse {
  mfa_method_id: string
  /** Shown once, for manual entry when a QR code cannot be scanned. */
  secret: string
  /** Encoded into the QR code. */
  otpauth_uri: string
}

export interface VerifyEnrollmentResponse {
  verified: boolean
  /** Displayed exactly once; regenerating invalidates every previous code. */
  recovery_codes: string[]
  status?: LoginStatus
}

export interface AuthSession {
  id: string
  ip_address: string
  user_agent: string
  issued_at: string
  last_activity_at: string
  expires_at: string
  auth_method: string
  current: boolean
}

export interface SessionListResponse {
  items: AuthSession[]
  total: number
}
