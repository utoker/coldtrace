'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

// GraphQL Mutations
const TRIGGER_EXCURSION = gql`
  mutation TriggerExcursion($deviceId: ID) {
    triggerExcursion(deviceId: $deviceId) {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const SIMULATE_LOW_BATTERY = gql`
  mutation SimulateLowBattery($deviceId: ID) {
    simulateLowBattery(deviceId: $deviceId) {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const TAKE_DEVICE_OFFLINE = gql`
  mutation TakeDeviceOffline($deviceId: ID) {
    takeDeviceOffline(deviceId: $deviceId) {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const SIMULATE_POWER_OUTAGE = gql`
  mutation SimulatePowerOutage {
    simulatePowerOutage {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const SIMULATE_BATCH_ARRIVAL = gql`
  mutation SimulateBatchArrival {
    simulateBatchArrival {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const RETURN_TO_NORMAL = gql`
  mutation ReturnToNormal {
    returnToNormal {
      success
      message
      affectedDevices {
        id
        name
      }
    }
  }
`;

const GET_SIMULATOR_STATS = gql`
  query GetSimulatorStats {
    getSimulatorStats {
      totalReadings
      successfulReadings
      failedReadings
      alertsCreated
      runtime
      devicesOnline
      devicesOffline
      devicesInExcursion
      lowBatteryDevices
    }
  }
`;

interface SimulatorResult {
  success: boolean;
  message: string;
  affectedDevices: Array<{
    id: string;
    name: string;
  }>;
}

interface SimulatorStats {
  totalReadings: number;
  successfulReadings: number;
  failedReadings: number;
  alertsCreated: number;
  runtime: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesInExcursion: number;
  lowBatteryDevices: number;
}

export function SimulatorControls() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [lastResult, setLastResult] = useState<SimulatorResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mutations
  const [triggerExcursion, { loading: excursionLoading }] =
    useMutation(TRIGGER_EXCURSION);
  const [simulateLowBattery, { loading: batteryLoading }] =
    useMutation(SIMULATE_LOW_BATTERY);
  const [takeDeviceOffline, { loading: offlineLoading }] =
    useMutation(TAKE_DEVICE_OFFLINE);
  const [simulatePowerOutage, { loading: powerLoading }] = useMutation(
    SIMULATE_POWER_OUTAGE
  );
  const [simulateBatchArrival, { loading: batchLoading }] = useMutation(
    SIMULATE_BATCH_ARRIVAL
  );
  const [returnToNormal, { loading: normalLoading }] =
    useMutation(RETURN_TO_NORMAL);

  // Query for stats
  const { data: statsData, refetch: refetchStats } = useQuery<{
    getSimulatorStats: SimulatorStats;
  }>(GET_SIMULATOR_STATS, {
    pollInterval: 10000, // Refresh every 10 seconds
    errorPolicy: 'all',
  });

  const handleMutation = async (mutation: any, variables?: any) => {
    try {
      const result = await mutation({ variables });
      const data = result.data[Object.keys(result.data)[0]];
      setLastResult(data);

      // Refresh stats after any mutation
      setTimeout(() => refetchStats(), 1000);
    } catch (error) {
      console.error('Simulator mutation error:', error);
      setLastResult({
        success: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        affectedDevices: [],
      });
    }
  };

  const stats = statsData?.getSimulatorStats;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Simulator Controls
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Demo Mode
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {stats && (
            <span className="text-sm text-gray-600">
              {stats.devicesOnline} online, {stats.devicesOffline} offline
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Last Result */}
          {lastResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                lastResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {lastResult.success ? (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="font-medium">{lastResult.message}</span>
              </div>
              {lastResult.affectedDevices.length > 0 && (
                <div className="mt-2 text-xs">
                  Affected devices:{' '}
                  {lastResult.affectedDevices.map((d) => d.name).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Device Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Target Device (optional - leave empty for random)
            </label>
            <input
              type="text"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              placeholder="Enter device ID or leave empty for random selection"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Temperature Excursion */}
            <button
              onClick={() =>
                handleMutation(triggerExcursion, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={excursionLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>
                {excursionLoading ? 'Triggering...' : 'Temperature Excursion'}
              </span>
            </button>

            {/* Low Battery */}
            <button
              onClick={() =>
                handleMutation(simulateLowBattery, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={batteryLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10.5h.5c0-.3-.2-.5-.5-.5v.5zm-1 0V10a.5.5 0 0 0-.5.5h.5zm-8.5 0h.5V10a.5.5 0 0 0-.5.5zm-1 0V10a.5.5 0 0 0-.5.5h.5z"
                />
              </svg>
              <span>{batteryLoading ? 'Simulating...' : 'Low Battery'}</span>
            </button>

            {/* Device Offline */}
            <button
              onClick={() =>
                handleMutation(takeDeviceOffline, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={offlineLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              </svg>
              <span>
                {offlineLoading ? 'Taking Offline...' : 'Take Offline'}
              </span>
            </button>

            {/* Power Outage */}
            <button
              onClick={() => handleMutation(simulatePowerOutage)}
              disabled={powerLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{powerLoading ? 'Simulating...' : 'Power Outage'}</span>
            </button>

            {/* Batch Arrival */}
            <button
              onClick={() => handleMutation(simulateBatchArrival)}
              disabled={batchLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>{batchLoading ? 'Simulating...' : 'Batch Arrival'}</span>
            </button>

            {/* Return to Normal */}
            <button
              onClick={() => handleMutation(returnToNormal)}
              disabled={normalLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{normalLoading ? 'Resetting...' : 'Return to Normal'}</span>
            </button>
          </div>

          {/* Stats Display */}
          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Simulator Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Readings:</span>
                    <span className="font-medium">
                      {stats.totalReadings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">
                      {stats.totalReadings > 0
                        ? Math.round(
                            (stats.successfulReadings / stats.totalReadings) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alerts Created:</span>
                    <span className="font-medium text-yellow-600">
                      {stats.alertsCreated}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online Devices:</span>
                    <span className="font-medium text-green-600">
                      {stats.devicesOnline}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offline Devices:</span>
                    <span className="font-medium text-red-600">
                      {stats.devicesOffline}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low Battery:</span>
                    <span className="font-medium text-orange-600">
                      {stats.lowBatteryDevices}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">💡 Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Leave device ID empty to target a random device</li>
              <li>
                Power outage affects all online devices (auto-recovery in 30s)
              </li>
              <li>Batch arrival brings up to 3 offline devices online</li>
              <li>Return to normal resets all devices to healthy state</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
