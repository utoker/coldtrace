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
  createdAt: Scalars['DateTime']['output'];
  device: Device;
  deviceId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isRead: Scalars['Boolean']['output'];
  isResolved: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedBy?: Maybe<Scalars['String']['output']>;
  severity: AlertSeverity;
  title: Scalars['String']['output'];
  type: AlertType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AlertSeverity {
  Critical = 'CRITICAL',
  Warning = 'WARNING'
}

export type AlertStats = {
  __typename?: 'AlertStats';
  byType: AlertTypeStats;
  critical: Scalars['Int']['output'];
  resolved: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  unread: Scalars['Int']['output'];
  warning: Scalars['Int']['output'];
};

export enum AlertType {
  ConnectionLost = 'CONNECTION_LOST',
  DeviceOffline = 'DEVICE_OFFLINE',
  LowBattery = 'LOW_BATTERY',
  TemperatureExcursion = 'TEMPERATURE_EXCURSION'
}

export type AlertTypeStats = {
  __typename?: 'AlertTypeStats';
  CONNECTION_LOST: Scalars['Int']['output'];
  DEVICE_OFFLINE: Scalars['Int']['output'];
  LOW_BATTERY: Scalars['Int']['output'];
  TEMPERATURE_EXCURSION: Scalars['Int']['output'];
};

export type BulkUpdateNotification = {
  __typename?: 'BulkUpdateNotification';
  action: Scalars['String']['output'];
  alertIds: Array<Scalars['ID']['output']>;
};

export type BulkUpdateResult = {
  __typename?: 'BulkUpdateResult';
  count: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type CreateDeviceInput = {
  deviceId: Scalars['String']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location: Scalars['String']['input'];
  longitude?: InputMaybe<Scalars['Float']['input']>;
  maxTemp?: InputMaybe<Scalars['Float']['input']>;
  minTemp?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
};

export type CreateReadingInput = {
  battery?: InputMaybe<Scalars['Float']['input']>;
  deviceId: Scalars['ID']['input'];
  temperature: Scalars['Float']['input'];
};

export type Device = {
  __typename?: 'Device';
  alerts: Array<Alert>;
  battery?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deviceId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  latestReading?: Maybe<Reading>;
  latitude?: Maybe<Scalars['Float']['output']>;
  location: Scalars['String']['output'];
  longitude?: Maybe<Scalars['Float']['output']>;
  maxTemp?: Maybe<Scalars['Float']['output']>;
  minTemp?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  readings: Array<Reading>;
  status: DeviceStatus;
  unreadAlertCount: Scalars['Int']['output'];
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
  complianceRate: Scalars['Float']['output'];
  deviceId: Scalars['ID']['output'];
  lastReading?: Maybe<Reading>;
  readingCount: Scalars['Int']['output'];
  temperatureStats: TemperatureStats;
};

export enum DeviceStatus {
  Maintenance = 'MAINTENANCE',
  Offline = 'OFFLINE',
  Online = 'ONLINE'
}

export type Mutation = {
  __typename?: 'Mutation';
  createDevice: Device;
  createReading: Reading;
  deleteAlert: Alert;
  getSimulatorStats: SimulatorStats;
  markAlertAsRead: Alert;
  markMultipleAlertsAsRead: BulkUpdateResult;
  rechargeBattery: SimulatorResult;
  resolveAlert: Alert;
  returnToNormal: SimulatorResult;
  simulateBatchArrival: SimulatorResult;
  simulateLowBattery: SimulatorResult;
  simulatePowerOutage: SimulatorResult;
  takeDeviceOffline: SimulatorResult;
  triggerExcursion: SimulatorResult;
  updateDevice: Device;
};


export type MutationCreateDeviceArgs = {
  input: CreateDeviceInput;
};


export type MutationCreateReadingArgs = {
  input: CreateReadingInput;
};


export type MutationDeleteAlertArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkAlertAsReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkMultipleAlertsAsReadArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationRechargeBatteryArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationResolveAlertArgs = {
  id: Scalars['ID']['input'];
  resolvedBy?: InputMaybe<Scalars['String']['input']>;
};


export type MutationReturnToNormalArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationSimulateLowBatteryArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationTakeDeviceOfflineArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationTriggerExcursionArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};

export type Query = {
  __typename?: 'Query';
  getAlert?: Maybe<Alert>;
  getAlertStats: AlertStats;
  getAlerts: Array<Alert>;
  getDevice?: Maybe<Device>;
  getDeviceHistory: DeviceHistoryResult;
  getDeviceReadings: Array<Reading>;
  getDeviceStats: DeviceStats;
  getDevices: Array<Device>;
  getUnreadAlertCount: Scalars['Int']['output'];
  hello?: Maybe<Scalars['String']['output']>;
};


export type QueryGetAlertArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAlertsArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
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
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<DeviceStatus>;
};


export type QueryGetUnreadAlertCountArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};

export type Reading = {
  __typename?: 'Reading';
  battery?: Maybe<Scalars['Float']['output']>;
  device: Device;
  deviceId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  status: ReadingStatus;
  temperature: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export enum ReadingStatus {
  Critical = 'CRITICAL',
  Normal = 'NORMAL',
  Warning = 'WARNING'
}

export type SimulatorResult = {
  __typename?: 'SimulatorResult';
  affectedDevices: Array<Device>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SimulatorStats = {
  __typename?: 'SimulatorStats';
  alertsCreated: Scalars['Int']['output'];
  devicesInExcursion: Scalars['Int']['output'];
  devicesOffline: Scalars['Int']['output'];
  devicesOnline: Scalars['Int']['output'];
  failedReadings: Scalars['Int']['output'];
  lowBatteryDevices: Scalars['Int']['output'];
  runtime: Scalars['Int']['output'];
  successfulReadings: Scalars['Int']['output'];
  totalReadings: Scalars['Int']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  alertCreated: Alert;
  alertDeleted: Alert;
  alertResolved: Alert;
  alertUpdated: Alert;
  alertsBulkUpdated: BulkUpdateNotification;
  deviceStatusChanged: Device;
  ping: Scalars['String']['output'];
  temperatureUpdates: Reading;
};


export type SubscriptionTemperatureUpdatesArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
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
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  maxTemp?: InputMaybe<Scalars['Float']['input']>;
  minTemp?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<DeviceStatus>;
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
  AlertStats: ResolverTypeWrapper<AlertStats>;
  AlertType: AlertType;
  AlertTypeStats: ResolverTypeWrapper<AlertTypeStats>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BulkUpdateNotification: ResolverTypeWrapper<BulkUpdateNotification>;
  BulkUpdateResult: ResolverTypeWrapper<BulkUpdateResult>;
  CreateDeviceInput: CreateDeviceInput;
  CreateReadingInput: CreateReadingInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Device: ResolverTypeWrapper<Device>;
  DeviceHistoryResult: ResolverTypeWrapper<DeviceHistoryResult>;
  DeviceStats: ResolverTypeWrapper<DeviceStats>;
  DeviceStatus: DeviceStatus;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Reading: ResolverTypeWrapper<Reading>;
  ReadingStatus: ReadingStatus;
  SimulatorResult: ResolverTypeWrapper<SimulatorResult>;
  SimulatorStats: ResolverTypeWrapper<SimulatorStats>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  TemperatureStats: ResolverTypeWrapper<TemperatureStats>;
  TimeRangeInfo: ResolverTypeWrapper<TimeRangeInfo>;
  TimeRangeInput: TimeRangeInput;
  UpdateDeviceInput: UpdateDeviceInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Alert: Alert;
  AlertStats: AlertStats;
  AlertTypeStats: AlertTypeStats;
  Boolean: Scalars['Boolean']['output'];
  BulkUpdateNotification: BulkUpdateNotification;
  BulkUpdateResult: BulkUpdateResult;
  CreateDeviceInput: CreateDeviceInput;
  CreateReadingInput: CreateReadingInput;
  DateTime: Scalars['DateTime']['output'];
  Device: Device;
  DeviceHistoryResult: DeviceHistoryResult;
  DeviceStats: DeviceStats;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  Reading: Reading;
  SimulatorResult: SimulatorResult;
  SimulatorStats: SimulatorStats;
  String: Scalars['String']['output'];
  Subscription: {};
  TemperatureStats: TemperatureStats;
  TimeRangeInfo: TimeRangeInfo;
  TimeRangeInput: TimeRangeInput;
  UpdateDeviceInput: UpdateDeviceInput;
}>;

export type AlertResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Alert'] = ResolversParentTypes['Alert']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  device?: Resolver<ResolversTypes['Device'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isResolved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  resolvedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  severity?: Resolver<ResolversTypes['AlertSeverity'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AlertType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AlertStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AlertStats'] = ResolversParentTypes['AlertStats']> = ResolversObject<{
  byType?: Resolver<ResolversTypes['AlertTypeStats'], ParentType, ContextType>;
  critical?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resolved?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unread?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  warning?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AlertTypeStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AlertTypeStats'] = ResolversParentTypes['AlertTypeStats']> = ResolversObject<{
  CONNECTION_LOST?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  DEVICE_OFFLINE?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  LOW_BATTERY?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  TEMPERATURE_EXCURSION?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BulkUpdateNotificationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BulkUpdateNotification'] = ResolversParentTypes['BulkUpdateNotification']> = ResolversObject<{
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  alertIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BulkUpdateResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BulkUpdateResult'] = ResolversParentTypes['BulkUpdateResult']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeviceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = ResolversObject<{
  alerts?: Resolver<Array<ResolversTypes['Alert']>, ParentType, ContextType>;
  battery?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latestReading?: Resolver<Maybe<ResolversTypes['Reading']>, ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  maxTemp?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  minTemp?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  readings?: Resolver<Array<ResolversTypes['Reading']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['DeviceStatus'], ParentType, ContextType>;
  unreadAlertCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  complianceRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastReading?: Resolver<Maybe<ResolversTypes['Reading']>, ParentType, ContextType>;
  readingCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  temperatureStats?: Resolver<ResolversTypes['TemperatureStats'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationCreateDeviceArgs, 'input'>>;
  createReading?: Resolver<ResolversTypes['Reading'], ParentType, ContextType, RequireFields<MutationCreateReadingArgs, 'input'>>;
  deleteAlert?: Resolver<ResolversTypes['Alert'], ParentType, ContextType, RequireFields<MutationDeleteAlertArgs, 'id'>>;
  getSimulatorStats?: Resolver<ResolversTypes['SimulatorStats'], ParentType, ContextType>;
  markAlertAsRead?: Resolver<ResolversTypes['Alert'], ParentType, ContextType, RequireFields<MutationMarkAlertAsReadArgs, 'id'>>;
  markMultipleAlertsAsRead?: Resolver<ResolversTypes['BulkUpdateResult'], ParentType, ContextType, RequireFields<MutationMarkMultipleAlertsAsReadArgs, 'ids'>>;
  rechargeBattery?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType, Partial<MutationRechargeBatteryArgs>>;
  resolveAlert?: Resolver<ResolversTypes['Alert'], ParentType, ContextType, RequireFields<MutationResolveAlertArgs, 'id'>>;
  returnToNormal?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType, Partial<MutationReturnToNormalArgs>>;
  simulateBatchArrival?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType>;
  simulateLowBattery?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType, Partial<MutationSimulateLowBatteryArgs>>;
  simulatePowerOutage?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType>;
  takeDeviceOffline?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType, Partial<MutationTakeDeviceOfflineArgs>>;
  triggerExcursion?: Resolver<ResolversTypes['SimulatorResult'], ParentType, ContextType, Partial<MutationTriggerExcursionArgs>>;
  updateDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationUpdateDeviceArgs, 'id' | 'input'>>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getAlert?: Resolver<Maybe<ResolversTypes['Alert']>, ParentType, ContextType, RequireFields<QueryGetAlertArgs, 'id'>>;
  getAlertStats?: Resolver<ResolversTypes['AlertStats'], ParentType, ContextType>;
  getAlerts?: Resolver<Array<ResolversTypes['Alert']>, ParentType, ContextType, RequireFields<QueryGetAlertsArgs, 'limit' | 'offset' | 'unreadOnly'>>;
  getDevice?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryGetDeviceArgs, 'id'>>;
  getDeviceHistory?: Resolver<ResolversTypes['DeviceHistoryResult'], ParentType, ContextType, RequireFields<QueryGetDeviceHistoryArgs, 'deviceId' | 'limit' | 'timeRange'>>;
  getDeviceReadings?: Resolver<Array<ResolversTypes['Reading']>, ParentType, ContextType, RequireFields<QueryGetDeviceReadingsArgs, 'deviceId' | 'limit'>>;
  getDeviceStats?: Resolver<ResolversTypes['DeviceStats'], ParentType, ContextType, RequireFields<QueryGetDeviceStatsArgs, 'deviceId'>>;
  getDevices?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryGetDevicesArgs, 'limit' | 'offset'>>;
  getUnreadAlertCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType, Partial<QueryGetUnreadAlertCountArgs>>;
  hello?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ReadingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Reading'] = ResolversParentTypes['Reading']> = ResolversObject<{
  battery?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  device?: Resolver<ResolversTypes['Device'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ReadingStatus'], ParentType, ContextType>;
  temperature?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SimulatorResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SimulatorResult'] = ResolversParentTypes['SimulatorResult']> = ResolversObject<{
  affectedDevices?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SimulatorStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SimulatorStats'] = ResolversParentTypes['SimulatorStats']> = ResolversObject<{
  alertsCreated?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  devicesInExcursion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  devicesOffline?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  devicesOnline?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  failedReadings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lowBatteryDevices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  runtime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  successfulReadings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalReadings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  alertCreated?: SubscriptionResolver<ResolversTypes['Alert'], "alertCreated", ParentType, ContextType>;
  alertDeleted?: SubscriptionResolver<ResolversTypes['Alert'], "alertDeleted", ParentType, ContextType>;
  alertResolved?: SubscriptionResolver<ResolversTypes['Alert'], "alertResolved", ParentType, ContextType>;
  alertUpdated?: SubscriptionResolver<ResolversTypes['Alert'], "alertUpdated", ParentType, ContextType>;
  alertsBulkUpdated?: SubscriptionResolver<ResolversTypes['BulkUpdateNotification'], "alertsBulkUpdated", ParentType, ContextType>;
  deviceStatusChanged?: SubscriptionResolver<ResolversTypes['Device'], "deviceStatusChanged", ParentType, ContextType>;
  ping?: SubscriptionResolver<ResolversTypes['String'], "ping", ParentType, ContextType>;
  temperatureUpdates?: SubscriptionResolver<ResolversTypes['Reading'], "temperatureUpdates", ParentType, ContextType, Partial<SubscriptionTemperatureUpdatesArgs>>;
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
  AlertStats?: AlertStatsResolvers<ContextType>;
  AlertTypeStats?: AlertTypeStatsResolvers<ContextType>;
  BulkUpdateNotification?: BulkUpdateNotificationResolvers<ContextType>;
  BulkUpdateResult?: BulkUpdateResultResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Device?: DeviceResolvers<ContextType>;
  DeviceHistoryResult?: DeviceHistoryResultResolvers<ContextType>;
  DeviceStats?: DeviceStatsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Reading?: ReadingResolvers<ContextType>;
  SimulatorResult?: SimulatorResultResolvers<ContextType>;
  SimulatorStats?: SimulatorStatsResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TemperatureStats?: TemperatureStatsResolvers<ContextType>;
  TimeRangeInfo?: TimeRangeInfoResolvers<ContextType>;
}>;

