import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export function FeatureImportanceChart({ data }: { data: { name: string; importance: number }[] }) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.importance - a.importance).slice(0, 10), [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Importance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ModelComparisonChart({ data }: { data: { model: string; accuracy: number; f1: number; cv: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="model" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="f1" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cv" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function CorrelationHeatmap({ data }: { data: { x: string; y: string; value: number }[] }) {
  const uniqueX = useMemo(() => [...new Set(data.map(d => d.x))], [data])
  const uniqueY = useMemo(() => [...new Set(data.map(d => d.y))], [data])

  const getColor = (value: number) => {
    const intensity = Math.abs(value)
    if (value > 0) return `rgba(59, 130, 246, ${intensity})`
    return `rgba(239, 68, 68, ${intensity})`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Correlation Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(${uniqueX.length}, minmax(40px, 1fr))` }}>
            <div></div>
            {uniqueX.map(x => (
              <div key={x} className="text-xs text-center p-1 text-muted-foreground truncate max-w-[80px]">{x}</div>
            ))}
            {uniqueY.map(y => (
              <React.Fragment key={`row-${y}`}>
                <div className="text-xs text-right p-1 text-muted-foreground truncate max-w-[80px]">{y}</div>
                {uniqueX.map(x => {
                  const point = data.find(d => d.x === x && d.y === y)
                  const value = point?.value ?? 0
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square flex items-center justify-center text-xs font-medium rounded"
                      style={{ backgroundColor: getColor(value), color: Math.abs(value) > 0.5 ? 'white' : 'inherit' }}
                      title={`${x} vs ${y}: ${value.toFixed(2)}`}
                    >
                      {value.toFixed(1)}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DistributionChart({ data }: { data: { bin: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function MetricsRadar({ data }: { data: { metric: string; value: number; fullMark: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function PieChartComponent({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
