'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GroupDef } from '@/lib/analysis';

interface GroupedBarChartProps {
  data: Record<string, string | number>[];
  groups: GroupDef[];
  categoryKey: string;
  valueSuffix?: string;
  height?: number;
}

export default function GroupedBarChart({
  data,
  groups,
  categoryKey,
  valueSuffix = '',
  height,
}: GroupedBarChartProps) {
  const chartHeight = height ?? Math.max(280, data.length * 40 + 60);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-black/40">
        表示できるデータがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v}${valueSuffix}`}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey={categoryKey}
          width={140}
          fontSize={12}
          interval={0}
        />
        <Tooltip formatter={(value) => `${value}${valueSuffix}`} />
        {groups.length > 1 && <Legend />}
        {groups.map((g) => (
          <Bar key={g.key} dataKey={g.key} name={g.label} fill={g.color} radius={[0, 4, 4, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
