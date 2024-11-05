"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Battery, Wifi, Zap, Timer, ZoomIn } from "lucide-react";

const BATTERY_INITIAL_CAPACITY = 500; // mAh

const generatePlaceholderData = (mosfetState: boolean) => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    const time = i;
    const voltage = 9.0 - i * 0.002;
    const current = mosfetState ? 200 : 0;
    data.push({
      time,
      voltage,
      current,
      power: (voltage * current) / 1000,
    });
  }
  return data;
};

const BatteryDashboard = () => {
  const [batteryVoltage, setBatteryVoltage] = useState(9.0);
  const [currentDraw, setCurrentDraw] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [mosfetOn, setMosfetOn] = useState(false);
  const [measurementHistory, setMeasurementHistory] = useState(() =>
    generatePlaceholderData(false)
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingCapacity, setRemainingCapacity] = useState(
    BATTERY_INITIAL_CAPACITY
  );
  const [timeWindow, setTimeWindow] = useState(50); // Default window size

  // Calculate the visible data window
  const visibleData = useMemo(() => {
    const startIndex = Math.max(0, measurementHistory.length - timeWindow);
    return measurementHistory.slice(startIndex);
  }, [measurementHistory, timeWindow]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConnected) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);

        setBatteryVoltage((prev) => {
          const newVoltage = prev - (mosfetOn ? 0.001 : 0.0001);
          return Math.max(6.0, newVoltage);
        });

        setCurrentDraw((prev) => {
          if (!mosfetOn) return 0;
          const fluctuation = (Math.random() - 0.5) * 2;
          return Math.max(195, Math.min(205, prev + fluctuation));
        });

        setMeasurementHistory((prev) => {
          const newEntry = {
            time: elapsedTime,
            voltage: batteryVoltage,
            current: mosfetOn ? currentDraw : 0,
            power: mosfetOn ? (batteryVoltage * currentDraw) / 1000 : 0,
          };
          return [...prev, newEntry];
        });

        if (mosfetOn) {
          setRemainingCapacity((prev) =>
            Math.max(0, prev - currentDraw / 3600)
          );
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, mosfetOn, batteryVoltage, currentDraw, elapsedTime]);

  const handleTimeWindowChange = (value: number[]) => {
    setTimeWindow(value[0]);
  };

  const calculateBatteryPercentage = (voltage: number): number => {
    const percentage = ((voltage - 6.0) / (9.0 - 6.0)) * 100;
    return Math.min(100, Math.max(0, Math.round(percentage)));
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const handleConnect = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      setBatteryVoltage(9.0);
      setCurrentDraw(mosfetOn ? 200 : 0);
      setElapsedTime(0);
      setRemainingCapacity(BATTERY_INITIAL_CAPACITY);
      setMeasurementHistory(generatePlaceholderData(mosfetOn));
    }
  };

  return (
    <div className="w-full bg-background text-foreground p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Battery Monitor</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              mosfetOn ? "bg-primary" : "bg-muted"
            }`}
          />
          <Button
            onClick={() => setMosfetOn(!mosfetOn)}
            variant="default"
            className="min-w-[90px]"
          >
            {mosfetOn ? "Load ON" : "Load OFF"}
          </Button>
          <Wifi className={isConnected ? "text-primary" : "text-muted"} />
          <Button onClick={handleConnect} variant="default">
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">
                Battery Voltage
              </span>
              <Battery className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {batteryVoltage.toFixed(2)}V
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Capacity: {calculateBatteryPercentage(batteryVoltage)}%</div>
              <div>Remaining: {Math.round(remainingCapacity)} mAh</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">
                Current Draw
              </span>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {currentDraw.toFixed(1)}mA
            </div>
            <div className="text-sm text-muted-foreground">
              Power: {((batteryVoltage * currentDraw) / 1000).toFixed(2)}W
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">
                Elapsed Time
              </span>
              <Timer className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-muted-foreground">Since start</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <ZoomIn className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Time Window: {timeWindow} seconds
          </span>
        </div>
        <Slider
          value={[timeWindow]}
          onValueChange={handleTimeWindowChange}
          min={10}
          max={Math.max(100, measurementHistory.length)}
          step={10}
          className="w-full"
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-6">
              Battery Voltage History
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted opacity-10"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-muted-foreground"
                    label={{
                      value: "Time (seconds)",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    className="text-muted-foreground"
                    domain={[6, 9.2]}
                    tickCount={8}
                    label={{
                      value: "Voltage (V)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="voltage"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-6">Load Current History</div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted opacity-10"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-muted-foreground"
                    label={{
                      value: "Time (seconds)",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    className="text-muted-foreground"
                    domain={[0, 250]}
                    tickCount={6}
                    label={{
                      value: "Current (mA)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BatteryDashboard;
