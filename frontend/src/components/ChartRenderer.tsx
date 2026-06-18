import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function ChartRenderer({ chart }: { chart: any }) {
  if (!chart || !chart.chart_data) return <p className="text-muted-foreground text-center py-8">No chart data available.</p>;

  const data = chart.chart_data;
  const type = (chart.chart_type || 'bar').toLowerCase();
  
  // 🛡️ Filter out any null/undefined items to prevent Object.keys(null) crash
  let normalizedData = Array.isArray(data) ? data.filter(Boolean) : [];
  
  if (normalizedData.length > 0 && typeof normalizedData[0] === 'object' && normalizedData[0] !== null) {
    const keys = Object.keys(normalizedData[0]);
    const nameKey = keys.find(k => ['name', 'category', 'bin', 'label', 'x', 'feature', 'relationship'].includes(k.toLowerCase())) || keys[0];
    const valueKeys = keys.filter(k => k !== nameKey && typeof normalizedData[0][k] === 'number');
    const valueKey = valueKeys[0] || 'value';

    if (type.includes('pie')) {
      const pieData = normalizedData.map(d => ({ name: d[nameKey], value: d[valueKey] || d.value || 0 }));
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
        <BarChart data={normalizedData} layout={normalizedData.length > 5 && nameKey === 'feature' ? "vertical" : "horizontal"}>
          <CartesianGrid strokeDasharray="3 3" />
          {normalizedData.length > 5 && nameKey === 'feature' ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey={nameKey} type="category" tick={{ fontSize: 12 }} width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip /><Legend />
          <Bar dataKey={valueKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}
