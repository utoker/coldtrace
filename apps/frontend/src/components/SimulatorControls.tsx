'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Activity,
  Battery,
  Power,
  Thermometer,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';

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

interface SimulationResult {
  success: boolean;
  message: string;
  affectedDevices: Array<{ id: string; name: string }>;
}

export function SimulatorControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  // GraphQL hooks
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

  const handleMutation = async (mutation: any, variables?: any) => {
    try {
      const { data } = await mutation({ variables });
      const result = Object.values(data)[0] as SimulationResult;
      setLastResult(result);
    } catch (error) {
      console.error('Simulation error:', error);
      setLastResult({
        success: false,
        message: 'Failed to execute simulation',
        affectedDevices: [],
      });
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-apple border border-white/20 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-light text-gray-900">
                Simulator Controls
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Test scenarios and device behaviors
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center space-x-2 text-sm font-medium text-gray-700"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Controls</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 py-6 space-y-8">
          {/* Last Result */}
          {lastResult && (
            <div
              className={`p-3 rounded-lg border ${
                lastResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {lastResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">{lastResult.message}</span>
              </div>
              {lastResult.affectedDevices.length > 0 && (
                <div className="mt-2 text-sm">
                  Affected devices:{' '}
                  {lastResult.affectedDevices.map((d) => d.name).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Device Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Target Device (optional - leave empty for random)
            </label>
            <input
              type="text"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              placeholder="Enter device ID or leave empty for random selection"
              className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
            />
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() =>
                handleMutation(triggerExcursion, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={excursionLoading}
              className="flex items-center justify-start px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Thermometer className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {excursionLoading ? 'Triggering...' : 'Temperature Excursion'}
              </span>
            </button>

            <button
              onClick={() =>
                handleMutation(simulateLowBattery, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={batteryLoading}
              className="flex items-center justify-start px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Battery className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {batteryLoading ? 'Simulating...' : 'Low Battery'}
              </span>
            </button>

            <button
              onClick={() =>
                handleMutation(takeDeviceOffline, {
                  deviceId: selectedDeviceId || undefined,
                })
              }
              disabled={offlineLoading}
              className="flex items-center justify-start px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Power className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {offlineLoading ? 'Taking Offline...' : 'Take Offline'}
              </span>
            </button>

            <button
              onClick={() => handleMutation(simulatePowerOutage)}
              disabled={powerLoading}
              className="flex items-center justify-start px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Zap className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {powerLoading ? 'Simulating...' : 'Power Outage'}
              </span>
            </button>

            <button
              onClick={() => handleMutation(simulateBatchArrival)}
              disabled={batchLoading}
              className="flex items-center justify-start px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Activity className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {batchLoading ? 'Simulating...' : 'Batch Arrival'}
              </span>
            </button>

            <button
              onClick={() => handleMutation(returnToNormal)}
              disabled={normalLoading}
              className="flex items-center justify-start px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <CheckCircle className="mr-3 h-5 w-5" />
              <span className="font-medium">
                {normalLoading ? 'Resetting...' : 'Return to Normal'}
              </span>
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
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
