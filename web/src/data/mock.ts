export type DeviceStatus = 'online' | 'offline' | 'protect'

export type MockDevice = {
  id: string
  name: string
  platform: 'MACOS' | 'WINDOWS' | 'LINUX'
  status: DeviceStatus
  lastSeen: string
  agentVersion: string
  risk: 'low' | 'medium' | 'high'
  locationHint: string
}

export type MockEvent = {
  id: string
  code: string
  deviceId: string
  deviceName: string
  tone: 'signal' | 'alert' | 'soft'
  when: string
  detail: string
}

export type MockIncident = {
  id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  deviceName: string
  openedAt: string
  summary: string
}

export const MOCK_DEVICES: MockDevice[] = [
  {
    id: 'mac',
    name: 'Studio Mac',
    platform: 'MACOS',
    status: 'online',
    lastSeen: '2m ago',
    agentVersion: '0.4.1',
    risk: 'low',
    locationHint: 'Home office',
  },
  {
    id: 'win',
    name: 'Travel Win',
    platform: 'WINDOWS',
    status: 'offline',
    lastSeen: '1h ago',
    agentVersion: '0.4.0',
    risk: 'medium',
    locationHint: 'Last: airport Wi‑Fi',
  },
  {
    id: 'linux',
    name: 'Lab Linux',
    platform: 'LINUX',
    status: 'online',
    lastSeen: '4m ago',
    agentVersion: '0.4.1',
    risk: 'low',
    locationHint: 'Lab rack',
  },
]

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'e1',
    code: 'DEVICE_ONLINE',
    deviceId: 'mac',
    deviceName: 'Studio Mac',
    tone: 'signal',
    when: '2m ago',
    detail: 'Heartbeat restored on watchline spine.',
  },
  {
    id: 'e2',
    code: 'HEARTBEAT',
    deviceId: 'linux',
    deviceName: 'Lab Linux',
    tone: 'soft',
    when: '4m ago',
    detail: 'Periodic presence check OK.',
  },
  {
    id: 'e3',
    code: 'DEVICE_OFFLINE',
    deviceId: 'win',
    deviceName: 'Travel Win',
    tone: 'alert',
    when: '1h ago',
    detail: 'Missed heartbeat window — awaiting rejoin.',
  },
  {
    id: 'e4',
    code: 'POLICY_SYNC',
    deviceId: 'mac',
    deviceName: 'Studio Mac',
    tone: 'soft',
    when: '3h ago',
    detail: 'Personal protect template applied.',
  },
  {
    id: 'e5',
    code: 'FACE_TRUST_OK',
    deviceId: 'mac',
    deviceName: 'Studio Mac',
    tone: 'signal',
    when: 'Yesterday',
    detail: 'Trusted face check passed at unlock.',
  },
]

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: 'i1',
    title: 'Travel Win left watchline',
    severity: 'MEDIUM',
    status: 'INVESTIGATING',
    deviceName: 'Travel Win',
    openedAt: '1h ago',
    summary: 'Device missed two heartbeat windows after network change.',
  },
  {
    id: 'i2',
    title: 'Unusual unlock attempt',
    severity: 'HIGH',
    status: 'RESOLVED',
    deviceName: 'Studio Mac',
    openedAt: '3d ago',
    summary: 'Non-trusted face rejected; owner confirmed later.',
  },
]

export const SIGNAL_SERIES = [
  { hour: '00', signals: 2, risk: 1 },
  { hour: '04', signals: 1, risk: 0 },
  { hour: '08', signals: 6, risk: 1 },
  { hour: '12', signals: 9, risk: 2 },
  { hour: '16', signals: 7, risk: 3 },
  { hour: '20', signals: 4, risk: 2 },
  { hour: 'now', signals: 5, risk: 2 },
]

export const PLATFORM_HEALTH = [
  { day: 'Mon', api: 99.9, agents: 98.2 },
  { day: 'Tue', api: 99.8, agents: 98.5 },
  { day: 'Wed', api: 99.95, agents: 97.9 },
  { day: 'Thu', api: 99.7, agents: 98.8 },
  { day: 'Fri', api: 99.9, agents: 99.1 },
  { day: 'Sat', api: 100, agents: 99.0 },
  { day: 'Sun', api: 99.95, agents: 98.7 },
]
