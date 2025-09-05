import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String
    getDevices(
      status: DeviceStatus
      isActive: Boolean
      location: String
      limit: Int = 50
      offset: Int = 0
    ): [Device!]!
    getDevice(id: ID!): Device
    getDeviceReadings(
      deviceId: ID!
      startTime: DateTime
      endTime: DateTime
      limit: Int = 100
    ): [Reading!]!
    getActiveAlerts(deviceId: ID): [Alert!]!
    getDeviceHistory(
      deviceId: ID!
      timeRange: TimeRangeInput!
      limit: Int = 1000
    ): DeviceHistoryResult!
    getDeviceStats(deviceId: ID!): DeviceStats!
  }

  type Mutation {
    createDevice(input: CreateDeviceInput!): Device!
    updateDevice(id: ID!, input: UpdateDeviceInput!): Device!
    createReading(input: CreateReadingInput!): Reading!
    acknowledgeAlert(id: ID!): Alert!

    # Simulator Controls
    triggerExcursion(deviceId: ID): SimulatorResult!
    simulateLowBattery(deviceId: ID): SimulatorResult!
    takeDeviceOffline(deviceId: ID): SimulatorResult!
    simulatePowerOutage: SimulatorResult!
    simulateBatchArrival: SimulatorResult!
    returnToNormal: SimulatorResult!
    getSimulatorStats: SimulatorStats!
  }

  type Subscription {
    temperatureUpdates(deviceId: ID): Reading!
    newAlerts: Alert!
    deviceStatusChanged: Device!
    ping: String!
  }

  scalar DateTime

  type Device {
    id: ID!
    deviceId: String!
    name: String!
    location: String!
    latitude: Float
    longitude: Float
    minTemp: Float
    maxTemp: Float
    battery: Float
    status: DeviceStatus!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    readings: [Reading!]!
    alerts: [Alert!]!
    latestReading: Reading
  }

  type Reading {
    id: ID!
    deviceId: ID!
    temperature: Float!
    battery: Float
    status: ReadingStatus!
    timestamp: DateTime!
    device: Device!
    alerts: [Alert!]!
  }

  type Alert {
    id: ID!
    deviceId: ID!
    type: AlertType!
    severity: AlertSeverity!
    message: String!
    temperature: Float
    threshold: Float
    acknowledged: Boolean!
    createdAt: DateTime!
    device: Device!
  }

  enum DeviceStatus {
    ONLINE
    OFFLINE
    MAINTENANCE
  }

  enum ReadingStatus {
    NORMAL
    WARNING
    CRITICAL
  }

  enum AlertType {
    TEMPERATURE_HIGH
    TEMPERATURE_LOW
    BATTERY_LOW
    DEVICE_OFFLINE
  }

  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  input CreateDeviceInput {
    deviceId: String!
    name: String!
    location: String!
    latitude: Float
    longitude: Float
    minTemp: Float = 2.0
    maxTemp: Float = 8.0
  }

  input UpdateDeviceInput {
    name: String
    location: String
    latitude: Float
    longitude: Float
    minTemp: Float
    maxTemp: Float
    status: DeviceStatus
    isActive: Boolean
  }

  input CreateReadingInput {
    deviceId: ID!
    temperature: Float!
    battery: Float
  }

  input TimeRangeInput {
    startTime: DateTime!
    endTime: DateTime!
  }

  type DeviceHistoryResult {
    deviceId: ID!
    readings: [Reading!]!
    totalCount: Int!
    timeRange: TimeRangeInfo!
  }

  type TimeRangeInfo {
    startTime: DateTime!
    endTime: DateTime!
    duration: String!
  }

  type DeviceStats {
    deviceId: ID!
    readingCount: Int!
    temperatureStats: TemperatureStats!
    complianceRate: Float!
    lastReading: Reading
  }

  type TemperatureStats {
    min: Float!
    max: Float!
    avg: Float!
    current: Float
  }

  type SimulatorResult {
    success: Boolean!
    message: String!
    affectedDevices: [Device!]!
  }

  type SimulatorStats {
    totalReadings: Int!
    successfulReadings: Int!
    failedReadings: Int!
    alertsCreated: Int!
    runtime: Int!
    devicesOnline: Int!
    devicesOffline: Int!
    devicesInExcursion: Int!
    lowBatteryDevices: Int!
  }
`;
