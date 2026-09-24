'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  /** 'bars'(既定): カテゴリを縦に並べた横棒グラフ。'columns': カテゴリを横に並べた縦棒グラフ。 */
  orientation?: 'bars' | 'columns';
  /**
   * グループが1つだけのときに、カテゴリ(棒)ごとに個別の色を指定する
   * (dataの並び順に対応、未指定の要素はgroups[0].colorを使う)。
   */
  cellColors?: (string | undefined)[];
}

export default function GroupedBarChart({
  data,
  groups,
  categoryKey,
  valueSuffix = '',
  height,
  orientation = 'bars',
  cellColors,
}: GroupedBarChartProps) {
  const isColumns = orientation === 'columns';
  const chartHeight = height ?? (isColumns ? 220 : Math.max(280, data.length * 40 + 60));

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
        layout={isColumns ? 'horizontal' : 'vertical'}
        margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        barCategoryGap={isColumns ? '30%' : undefined}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={!isColumns}
          vertical={isColumns}
          stroke="#eee"
        />
        {isColumns ? (
          <>
            <XAxis dataKey={categoryKey} type="category" fontSize={12} />
            <YAxis
              type="number"
              tickFormatter={(v: number) => `${v}${valueSuffix}`}
              fontSize={12}
              width={36}
              allowDecimals={false}
            />
          </>
        ) : (
          <>
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
          </>
        )}
        <Tooltip formatter={(value) => `${value}${valueSuffix}`} />
        {groups.length > 1 && <Legend />}
        {groups.map((g) => (
          <Bar
            key={g.key}
            dataKey={g.key}
            name={g.label}
            fill={g.color}
            radius={isColumns ? [4, 4, 0, 0] : [0, 4, 4, 0]}
            maxBarSize={isColumns ? 40 : 28}
          >
            {groups.length === 1 &&
              cellColors &&
              data.map((_, i) => (
                <Cell key={i} fill={cellColors[i] ?? g.color} />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
