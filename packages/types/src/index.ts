// Re-export database types for convenience
export type {
  Device,
  Reading,
  Alert,
  DeviceStatus,
  ReadingStatus,
  AlertType,
  AlertSeverity,
  DeviceWithReadings,
  DeviceWithAlertsAndReadings,
  ReadingWithDevice,
  AlertWithDevice,
} from '@coldtrace/database';

// Enhanced API interfaces for frontend/backend communication
export interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalReadings: number;
  activeAlerts: number;
  criticalAlerts: number;
}

export interface TemperatureStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface DeviceLocationData {
  id: string;
  deviceId: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  battery: number;
  lastReading?: {
    temperature: number;
    battery?: number;
    status: string;
    timestamp: Date;
  };
  alertCount: number;
}

// API Request/Response types
export interface CreateDeviceInput {
  deviceId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface UpdateDeviceInput extends Partial<CreateDeviceInput> {
  id: string;
  status?: string;
  isActive?: boolean;
}

export interface CreateReadingInput {
  deviceId: string;
  temperature: number;
  battery?: number;
}

export interface CreateAlertInput {
  deviceId: string;
  readingId?: string;
  type: string;
  severity: string;
  message: string;
  temperature?: number;
  threshold?: number;
}

export interface AlertFilters {
  deviceId?: string;
  type?: string;
  severity?: string;
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ReadingFilters {
  deviceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface DeviceFilters {
  status?: string;
  location?: string;
  isActive?: boolean;
  hasAlerts?: boolean;
}

// WebSocket/Real-time types
export interface RealtimeReading {
  deviceId: string;
  deviceName: string;
  reading: {
    temperature: number;
    battery?: number;
    status: string;
    timestamp: Date;
  };
}

export interface RealtimeAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
}

// Dashboard/Analytics types
export interface DashboardData {
  stats: DeviceStats;
  recentAlerts: Array<{
    id: string;
    deviceName: string;
    type: string;
    severity: string;
    message: string;
    createdAt: Date;
  }>;
  recentReadings: Array<{
    deviceId: string;
    deviceName: string;
    temperature: number;
    battery?: number;
    status: string;
    timestamp: Date;
  }>;
  deviceLocations: DeviceLocationData[];
}

export interface TimeSeriesData {
  timestamp: Date;
  temperature: number;
  battery?: number;
  status: string;
}

export interface DeviceAnalytics {
  deviceId: string;
  deviceName: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  temperatureStats: TemperatureStats;
  readingCount: number;
  alertCount: number;
  uptimePercentage: number;
  timeSeries: TimeSeriesData[];
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// GraphQL operation types
export type QueryVariables = Record<string, unknown>;

export type MutationVariables = Record<string, unknown>;

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Export environment validation for convenience
export { validateEnvironment, env, isDevelopment, isProduction, isTest } from '@coldtrace/env';