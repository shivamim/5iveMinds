import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function ChartRenderer({ chart }: { chart: any }) {
  if (!chart || !chart.chart_data) return <p className="text-muted-foreground text-center py-8">No chart data available.</p>;

  const data = chart.chart_data;
  const type = (chart.chart_type || 'bar').toLowerCase();
  let normalizedData = Array.isArray(data) ? data : [];
  
  if (normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
    const keys = Object.keys(normalizedData[0]);
    const nameKey = keys.find(k => ['name', 'category', 'bin', 'label', 'x'].includes(k.toLowerCase())) || keys[0];
    const valueKeys = keys.filter(k => k !== nameKey && typeof normalizedData[0][k] === 'number');

    if (type.includes('pie')) {
      const pieData = normalizedData.map(d => ({ name: d[nameKey], value: d[valueKeys[0]] || d.value || 0 }));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {pieData.map((_: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={normalizedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip /><Legend />
          {valueKeys.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}
