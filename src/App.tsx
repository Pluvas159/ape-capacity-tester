import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Power } from "lucide-react";
import {
  ArduinoData,
  GraphProps,
  MeasurementData,
  SerialPortInfo,
} from "./types";

const { ipcRenderer } = window.require("electron");

const MeasurementGraph: React.FC<GraphProps> = ({
  dataKey,
  title,
  units,
  domain,
  color,
  data,
}) => (
  <div className="h-64">
    <h3 className="text-lg font-semibold mb-2 text-purple-300">{title}</h3>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, bottom: 25, left: 40 }}
      >
        <XAxis
          dataKey="time"
          stroke="#9CA3AF"
          label={{
            value: "Time",
            position: "bottom",
            fill: "#9CA3AF",
            offset: 10,
          }}
          tickFormatter={(time: string) => new Date(time).toLocaleTimeString()}
        />
        <YAxis
          dataKey={dataKey}
          stroke="#9CA3AF"
          label={{
            value: `${title} (${units})`,
            angle: -90,
            position: "left",
            fill: "#9CA3AF",
            offset: 10,
          }}
          domain={domain}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
          }}
          labelStyle={{ color: "#9CA3AF" }}
          labelFormatter={(time: string) => new Date(time).toLocaleTimeString()}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const App: React.FC = () => {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [receivedData, setReceivedData] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<number>(50);
  const [loadActive, setLoadActive] = useState<boolean>(false);

  const measurementData = useMemo<MeasurementData[]>(() => {
    const now = Date.now();
    return receivedData
      .map((dataStr, index) => {
        let data: ArduinoData;
        try {
          data = JSON.parse(dataStr);
        } catch (e) {
          console.error("Failed to parse JSON:", dataStr);
          return null;
        }
        return {
          time: new Date(
            now - (receivedData.length - 1 - index) * 1000
          ).toISOString(),
          voltage: data.voltage + 6 || 0,
          current:
            Number(((data.current_sense / 6 / 4.7) * 1000).toFixed(2)) || 0,
          loadActive: data.load_active || false,
        };
      })
      .filter((data): data is MeasurementData => data !== null);
  }, [receivedData]);

  const visibleData = useMemo(() => {
    return measurementData.slice(-timeRange);
  }, [measurementData, timeRange]);

  useEffect(() => {
    async function listPorts() {
      const availablePorts = await ipcRenderer.invoke("list-ports");
      setPorts(availablePorts);
    }
    listPorts();

    ipcRenderer.on("serial-data", (_event: any, data: string) => {
      setReceivedData((prev) => [...prev, data]);
      try {
        const parsed: ArduinoData = JSON.parse(data);
        setLoadActive(parsed.load_active);
      } catch (e) {
        console.error("Failed to parse load state:", data);
      }
    });

    return () => {
      ipcRenderer.removeAllListeners("serial-data");
    };
  }, []);

  const handleConnect = async (): Promise<void> => {
    const result: { success: boolean; error?: string } =
      await ipcRenderer.invoke("connect-port", selectedPort);
    if (result.success) {
      setConnected(true);
    } else {
      alert(`Connection failed: ${result.error}`);
    }
  };

  const toggleLoad = async (): Promise<void> => {
    const result: { success: boolean; error?: string } =
      await ipcRenderer.invoke("send-data", "load");
    if (!result.success) {
      alert(`Failed to toggle load: ${result.error}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-gray-800 to-purple-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent blur-3xl"></div>
        </div>
      </div>

      <div className="relative min-h-screen text-gray-100 p-6 font-mono">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-purple-400">
            Arduino Monitor
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">
                Connection
              </h2>
              <div className="flex gap-3">
                <select
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 flex-grow"
                >
                  <option value="">Select Port</option>
                  {ports.map((port) => (
                    <option key={port.path} value={port.path}>
                      {port.path}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleConnect}
                  disabled={connected || !selectedPort}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {connected ? "Connected" : "Connect"}
                </button>
              </div>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">
                Load Control
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-lg">
                  Load Status: {loadActive ? "ON" : "OFF"}
                </span>
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

            <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50 md:col-span-2 pb-20">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">
                Measurements
              </h2>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Time Range: {timeRange} samples
                </label>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
              <div className="space-y-6">
                <MeasurementGraph
                  dataKey="voltage"
                  title="Voltage"
                  units="V"
                  domain={[6, 9.3]}
                  color="#b794f4"
                  data={visibleData}
                />
                <MeasurementGraph
                  dataKey="current"
                  title="Current"
                  units="mA"
                  domain={[0, 100]}
                  color="#4FD1C5"
                  data={visibleData}
                />
              </div>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 shadow-lg border border-gray-700/50 md:col-span-2 h-64 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">
                Log
              </h2>
              <div className="space-y-1">
                {measurementData.map((data, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    {new Date(data.time).toLocaleTimeString()}: Voltage:{" "}
                    {data.voltage.toFixed(3)}V, Current:{" "}
                    {data.current.toFixed(3)}mA, Load:{" "}
                    {data.loadActive ? "ON" : "OFF"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
