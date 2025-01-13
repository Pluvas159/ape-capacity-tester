import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { GraphProps } from "./types";

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

export default MeasurementGraph;
