import React, { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { ArduinoData, MeasurementData } from "./types";

const UPDATE_INTERVAL = 5000; // 5 seconds

interface BatteryStatus {
  soc: number | null;
  timeToEmpty: number | null;
  dropRate: number | null;
}

interface LoadControlProps {
  connected: boolean;
  measurementData: MeasurementData[];
  onLoadStateChange?: (isActive: boolean) => void;
}

const LoadControl: React.FC<LoadControlProps> = ({
  connected,
  measurementData,
  onLoadStateChange,
}) => {
  const [loadActive, setLoadActive] = useState<boolean>(false);
  const [measurementStartTime, setMeasurementStartTime] = useState<
    number | null
  >(null);
  const [loadMeasurements, setLoadMeasurements] = useState<MeasurementData[]>(
    []
  );
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    soc: null,
    timeToEmpty: null,
    dropRate: null,
  });

  const calculateBatteryStatus = (
    measurements: MeasurementData[]
  ): BatteryStatus => {
    const loadMeasurements = measurements.filter((m) => m.loadActive);

    // Need at least 2 measurements
    if (loadMeasurements.length < 2) {
      return { soc: null, timeToEmpty: null, dropRate: null };
    }

    // Get measurements from last 5 minutes only
    const ONE_MINUTE = 60 * 1000;
    const cutoffTime = Date.now() - ONE_MINUTE * 5;
    const recentMeasurements = loadMeasurements.filter(
      (m) => new Date(m.time).getTime() > cutoffTime
    );

    if (recentMeasurements.length < 2) {
      return { soc: null, timeToEmpty: null, dropRate: null };
    }

    // Apply moving average to voltage readings (10 samples window)
    const smoothedMeasurements = recentMeasurements.map(
      (measurement, index) => {
        const start = Math.max(0, index - 9); // Look back 10 samples
        const window = recentMeasurements.slice(start, index + 1);
        const avgVoltage =
          window.reduce((sum, m) => sum + m.voltage, 0) / window.length;

        return {
          ...measurement,
          voltage: avgVoltage,
        };
      }
    );

    // Get first and last smoothed measurements
    const first = smoothedMeasurements[0];
    const last = smoothedMeasurements[smoothedMeasurements.length - 1];
    console.log(smoothedMeasurements);

    const timeDiff =
      (new Date(last.time).getTime() - new Date(first.time).getTime()) / 1000;
    const voltageDiff = first.voltage - last.voltage;
    const dropRate = voltageDiff / timeDiff;

    const voltageRemaining = last.voltage - 6.0;
    const timeToEmpty = dropRate > 0 ? voltageRemaining / dropRate : null;
    const soc = ((last.voltage - 6.0) / (9.0 - 6.0)) * 100;

    return {
      soc: Math.min(Math.max(soc, 0), 100),
      timeToEmpty,
      dropRate,
    };
  };

  useEffect(() => {
    if (!loadActive || !measurementStartTime) {
      return;
    }

    const lastMeasurement = measurementData[measurementData.length - 1];
    if (!lastMeasurement) {
      return;
    }

    // Update measurements immediately
    setLoadMeasurements((prev) => {
      const lastPrevMeasurement = prev[prev.length - 1];
      if (
        !lastPrevMeasurement ||
        lastPrevMeasurement.time !== lastMeasurement.time
      ) {
        const newMeasurements = [...prev, lastMeasurement];

        // Calculate status immediately if we have enough measurements
        if (newMeasurements.length >= 2) {
          const status = calculateBatteryStatus(newMeasurements);
          setBatteryStatus(status);
        }

        return newMeasurements;
      }
      return prev;
    });
  }, [loadActive, measurementStartTime, measurementData]);

  const toggleLoad = async (): Promise<void> => {
    const { ipcRenderer } = window.require("electron");
    const result: { success: boolean; error?: string } =
      await ipcRenderer.invoke("send-data", "load");

    if (result.success) {
      const newLoadState = !loadActive;
      setLoadActive(newLoadState);
      onLoadStateChange?.(newLoadState);

      if (newLoadState) {
        // Starting new measurement
        setMeasurementStartTime(Date.now());
        setLoadMeasurements([]);
        setBatteryStatus({ soc: null, timeToEmpty: null, dropRate: null });
      } else {
        // Stopping measurement
        setMeasurementStartTime(null);
      }
    } else {
      alert(`Failed to toggle load: ${result.error}`);
    }
  };

  const elapsedTime = measurementStartTime
    ? ((Date.now() - measurementStartTime) / 1000).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Load Control Panel */}
      <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">
          Load Control
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg">
              Load Status: {loadActive ? "ON" : "OFF"}
            </span>
            {loadActive && measurementStartTime && (
              <div className="text-sm text-gray-300 mt-2">
                Test Duration: {elapsedTime}s
              </div>
            )}
          </div>
          <button
            onClick={toggleLoad}
            disabled={!connected}
            className={`p-4 rounded-full transition-colors ${
              loadActive
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            } disabled:opacity-50`}
          >
            <Power
              size={24}
              className={loadActive ? "text-white" : "text-gray-300"}
            />
          </button>
        </div>
      </div>

      {/* Battery Status Panel */}
      <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">
          Battery Status
        </h2>
        <div className="space-y-2">
          <div className="text-gray-400">
            {!loadActive ? (
              "Click load button to start measurement"
            ) : (
              <>
                <div className="text-sm mb-2">
                  Samples collected: {loadMeasurements.length}
                </div>
                {batteryStatus.soc !== null && (
                  <div className="space-y-2">
                    <div className="text-lg text-white">
                      Estimated State of Charge: {batteryStatus.soc.toFixed(1)}%
                    </div>
                    {batteryStatus.timeToEmpty && (
                      <div className="text-sm">
                        Time to Empty:{" "}
                        {(batteryStatus.timeToEmpty / 3600).toFixed(1)} hours
                      </div>
                    )}
                    {batteryStatus.dropRate && (
                      <div className="text-sm">
                        Voltage Drop Rate:{" "}
                        {(batteryStatus.dropRate * 3600).toFixed(3)} V/hour
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadControl;
