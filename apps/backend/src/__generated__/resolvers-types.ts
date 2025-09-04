import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../graphql/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
};

export type Alert = {
  __typename?: 'Alert';
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  acknowledgedBy?: Maybe<Scalars['String']['output']>;
  alertType: AlertType;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  device: Device;
  deviceId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  reading?: Maybe<Reading>;
  readingId?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  severity: AlertSeverity;
  threshold?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['Float']['output']>;
};

export enum AlertSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export enum AlertType {
  BatteryLow = 'BATTERY_LOW',
  DeviceOffline = 'DEVICE_OFFLINE',
  HumidityHigh = 'HUMIDITY_HIGH',
  HumidityLow = 'HUMIDITY_LOW',
  PressureAbnormal = 'PRESSURE_ABNORMAL',
  SensorFault = 'SENSOR_FAULT',
  TemperatureHigh = 'TEMPERATURE_HIGH',
  TemperatureLow = 'TEMPERATURE_LOW'
}

export type CreateDeviceInput = {
  deviceType: DeviceType;
  firmwareVersion?: InputMaybe<Scalars['String']['input']>;
  humidityMax?: InputMaybe<Scalars['Float']['input']>;
  humidityMin?: InputMaybe<Scalars['Float']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location: Scalars['String']['input'];
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  serialNumber: Scalars['String']['input'];
  tempMax?: InputMaybe<Scalars['Float']['input']>;
  tempMin?: InputMaybe<Scalars['Float']['input']>;
};

export type Device = {
  __typename?: 'Device';
  alerts: Array<Alert>;
  createdAt: Scalars['DateTime']['output'];
  deviceType: DeviceType;
  firmwareVersion?: Maybe<Scalars['String']['output']>;
  humidityMax?: Maybe<Scalars['Float']['output']>;
  humidityMin?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  latestReading?: Maybe<Reading>;
  latitude?: Maybe<Scalars['Float']['output']>;
  location: Scalars['String']['output'];
  longitude?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  readings: Array<Reading>;
  serialNumber: Scalars['String']['output'];
  tempMax?: Maybe<Scalars['Float']['output']>;
  tempMin?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DeviceHistoryResult = {
  __typename?: 'DeviceHistoryResult';
  deviceId: Scalars['ID']['output'];
  readings: Array<Reading>;
  timeRange: TimeRangeInfo;
  totalCount: Scalars['Int']['output'];
};

export type DeviceStats = {
  __typename?: 'DeviceStats';
  dataRange: TimeRangeInfo;
  deviceId: Scalars['ID']['output'];
  humidityStats?: Maybe<HumidityStats>;
  lastReading?: Maybe<Reading>;
  readingCount: Scalars['Int']['output'];
  temperatureStats: TemperatureStats;
};

export enum DeviceType {
  Cooler = 'COOLER',
  Freezer = 'FREEZER',
  PortableLogger = 'PORTABLE_LOGGER',
  TransportVehicle = 'TRANSPORT_VEHICLE',
  WarehouseSensor = 'WAREHOUSE_SENSOR'
}

export type HumidityStats = {
  __typename?: 'HumidityStats';
  avg?: Maybe<Scalars['Float']['output']>;
  current?: Maybe<Scalars['Float']['output']>;
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createDevice: Device;
  updateDevice: Device;
};


export type MutationCreateDeviceArgs = {
  input: CreateDeviceInput;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};

export type Query = {
  __typename?: 'Query';
  getActiveAlerts: Array<Alert>;
  getDevice?: Maybe<Device>;
  getDeviceHistory: DeviceHistoryResult;
  getDeviceReadings: Array<Reading>;
  getDeviceStats: DeviceStats;
  getDevices: Array<Device>;
  hello?: Maybe<Scalars['String']['output']>;
};


export type QueryGetActiveAlertsArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDeviceHistoryArgs = {
  deviceId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  timeRange: TimeRangeInput;
};


export type QueryGetDeviceReadingsArgs = {
  deviceId: Scalars['ID']['input'];
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryGetDeviceStatsArgs = {
  deviceId: Scalars['ID']['input'];
};


export type QueryGetDevicesArgs = {
  deviceType?: InputMaybe<DeviceType>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type Reading = {
  __typename?: 'Reading';
  alerts: Array<Alert>;
  battery?: Maybe<Scalars['Float']['output']>;
  device: Device;
  deviceId: Scalars['String']['output'];
  humidity?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  pressure?: Maybe<Scalars['Float']['output']>;
  temperature: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type TemperatureStats = {
  __typename?: 'TemperatureStats';
  avg: Scalars['Float']['output'];
  current?: Maybe<Scalars['Float']['output']>;
  max: Scalars['Float']['output'];
  min: Scalars['Float']['output'];
};

export type TimeRangeInfo = {
  __typename?: 'TimeRangeInfo';
  duration: Scalars['String']['output'];
  endTime: Scalars['DateTime']['output'];
  startTime: Scalars['DateTime']['output'];
};

export type TimeRangeInput = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};

export type UpdateDeviceInput = {
  firmwareVersion?: InputMaybe<Scalars['String']['input']>;
  humidityMax?: InputMaybe<Scalars['Float']['input']>;
  humidityMin?: InputMaybe<Scalars['Float']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tempMax?: InputMaybe<Scalars['Float']['input']>;
  tempMin?: InputMaybe<Scalars['Float']['input']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Alert: ResolverTypeWrapper<Alert>;
  AlertSeverity: AlertSeverity;
  AlertType: AlertType;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateDeviceInput: CreateDeviceInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Device: ResolverTypeWrapper<Device>;
  DeviceHistoryResult: ResolverTypeWrapper<DeviceHistoryResult>;
  DeviceStats: ResolverTypeWrapper<DeviceStats>;
  DeviceType: DeviceType;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  HumidityStats: ResolverTypeWrapper<HumidityStats>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Reading: ResolverTypeWrapper<Reading>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  TemperatureStats: ResolverTypeWrapper<TemperatureStats>;
  TimeRangeInfo: ResolverTypeWrapper<TimeRangeInfo>;
  TimeRangeInput: TimeRangeInput;
  UpdateDeviceInput: UpdateDeviceInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Alert: Alert;
  Boolean: Scalars['Boolean']['output'];
  CreateDeviceInput: CreateDeviceInput;
  DateTime: Scalars['DateTime']['output'];
  Device: Device;
  DeviceHistoryResult: DeviceHistoryResult;
  DeviceStats: DeviceStats;
  Float: Scalars['Float']['output'];
  HumidityStats: HumidityStats;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  Reading: Reading;
  String: Scalars['String']['output'];
  TemperatureStats: TemperatureStats;
  TimeRangeInfo: TimeRangeInfo;
  TimeRangeInput: TimeRangeInput;
  UpdateDeviceInput: UpdateDeviceInput;
}>;

export type AlertResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Alert'] = ResolversParentTypes['Alert']> = ResolversObject<{
  acknowledgedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  acknowledgedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  alertType?: Resolver<ResolversTypes['AlertType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  device?: Resolver<ResolversTypes['Device'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  reading?: Resolver<Maybe<ResolversTypes['Reading']>, ParentType, ContextType>;
  readingId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  severity?: Resolver<ResolversTypes['AlertSeverity'], ParentType, ContextType>;
  threshold?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeviceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = ResolversObject<{
  alerts?: Resolver<Array<ResolversTypes['Alert']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deviceType?: Resolver<ResolversTypes['DeviceType'], ParentType, ContextType>;
  firmwareVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  humidityMax?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  humidityMin?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latestReading?: Resolver<Maybe<ResolversTypes['Reading']>, ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  readings?: Resolver<Array<ResolversTypes['Reading']>, ParentType, ContextType>;
  serialNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tempMax?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  tempMin?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DeviceHistoryResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DeviceHistoryResult'] = ResolversParentTypes['DeviceHistoryResult']> = ResolversObject<{
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  readings?: Resolver<Array<ResolversTypes['Reading']>, ParentType, ContextType>;
  timeRange?: Resolver<ResolversTypes['TimeRangeInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DeviceStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DeviceStats'] = ResolversParentTypes['DeviceStats']> = ResolversObject<{
  dataRange?: Resolver<ResolversTypes['TimeRangeInfo'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  humidityStats?: Resolver<Maybe<ResolversTypes['HumidityStats']>, ParentType, ContextType>;
  lastReading?: Resolver<Maybe<ResolversTypes['Reading']>, ParentType, ContextType>;
  readingCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  temperatureStats?: Resolver<ResolversTypes['TemperatureStats'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HumidityStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['HumidityStats'] = ResolversParentTypes['HumidityStats']> = ResolversObject<{
  avg?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  current?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  max?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  min?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationCreateDeviceArgs, 'input'>>;
  updateDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationUpdateDeviceArgs, 'id' | 'input'>>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getActiveAlerts?: Resolver<Array<ResolversTypes['Alert']>, ParentType, ContextType, Partial<QueryGetActiveAlertsArgs>>;
  getDevice?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryGetDeviceArgs, 'id'>>;
  getDeviceHistory?: Resolver<ResolversTypes['DeviceHistoryResult'], ParentType, ContextType, RequireFields<QueryGetDeviceHistoryArgs, 'deviceId' | 'limit' | 'timeRange'>>;
  getDeviceReadings?: Resolver<Array<ResolversTypes['Reading']>, ParentType, ContextType, RequireFields<QueryGetDeviceReadingsArgs, 'deviceId' | 'limit'>>;
  getDeviceStats?: Resolver<ResolversTypes['DeviceStats'], ParentType, ContextType, RequireFields<QueryGetDeviceStatsArgs, 'deviceId'>>;
  getDevices?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryGetDevicesArgs, 'limit' | 'offset'>>;
  hello?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ReadingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Reading'] = ResolversParentTypes['Reading']> = ResolversObject<{
  alerts?: Resolver<Array<ResolversTypes['Alert']>, ParentType, ContextType>;
  battery?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  device?: Resolver<ResolversTypes['Device'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  humidity?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  pressure?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  temperature?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemperatureStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemperatureStats'] = ResolversParentTypes['TemperatureStats']> = ResolversObject<{
  avg?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  current?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  max?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TimeRangeInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TimeRangeInfo'] = ResolversParentTypes['TimeRangeInfo']> = ResolversObject<{
  duration?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Alert?: AlertResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Device?: DeviceResolvers<ContextType>;
  DeviceHistoryResult?: DeviceHistoryResultResolvers<ContextType>;
  DeviceStats?: DeviceStatsResolvers<ContextType>;
  HumidityStats?: HumidityStatsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Reading?: ReadingResolvers<ContextType>;
  TemperatureStats?: TemperatureStatsResolvers<ContextType>;
  TimeRangeInfo?: TimeRangeInfoResolvers<ContextType>;
}>;

