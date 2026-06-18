import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartRenderer({ chart }: { chart: any }) {
  if (!chart || !chart.chart_data) return <div className="text-center py-12 text-muted-foreground">No chart data available.</div>;

  const data = chart.chart_data.filter(Boolean);
  const type = (chart.chart_type || 'bar').toLowerCase();
  
  if (data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
     return <pre className="text-xs bg-muted p-4 rounded-lg">{JSON.stringify(data, null, 2)}</pre>;
  }

  const keys = Object.keys(data[0]);
  const nameKey = keys.find(k => ['name', 'category', 'bin', 'label', 'x', 'feature', 'relationship', 'month'].includes(k.toLowerCase())) || keys[0];
  const valueKeys = keys.filter(k => k !== nameKey && typeof data[0][k] === 'number');
  const valueKey = valueKeys[0] || 'value';

  if (type.includes('pie')) {
    const pieData = data.map(d => ({ name: d[nameKey], value: d[valueKey] || d.value || 0 }));
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient key={index} id={`pieGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={color} stopOpacity={0.5}/>
              </linearGradient>
            ))}
          </defs>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name">
            {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % COLORS.length})`} stroke="none" />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type.includes('scatter')) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" dataKey={keys[0]} name={keys[0]} stroke="#64748b" fontSize={12} />
          <YAxis type="number" dataKey={keys[1]} name={keys[1]} stroke="#64748b" fontSize={12} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Data" data={data} fill="#6366f1" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type.includes('area') || type.includes('histogram') || type.includes('distribution') || nameKey === 'bin') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={nameKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={valueKey} stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} layout={data.length > 5 && nameKey === 'feature' ? "vertical" : "horizontal"}>
        <defs>
          {COLORS.map((color, index) => (
            <linearGradient key={index} id={`barGrad${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        {data.length > 5 && nameKey === 'feature' ? (
          <>
            <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={nameKey} type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
        <Legend verticalAlign="top" height={36} />
        {valueKeys.map((key, idx) => (
          <Bar key={key} dataKey={key} fill={`url(#barGrad${idx % COLORS.length})`} radius={[6, 6, 0, 0]} maxBarSize={50} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
