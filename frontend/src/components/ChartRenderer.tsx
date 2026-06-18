import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function ChartRenderer({ chart }: { chart: any }) {
  const type = chart.chart_type?.toLowerCase() || '';
  const data = chart.chart_data;

  if (!data) return <p className="text-muted-foreground text-center py-8">No data available for this chart.</p>;

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const dataKeys = Object.keys(data[0]).filter(k => k !== 'name' && k !== 'x' && k !== 'category');
    const axisKey = data[0].name ? 'name' : (data[0].x ? 'x' : (data[0].category ? 'category' : Object.keys(data[0])[0]));

    if (type.includes('pie')) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey={axisKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (type.includes('scatter')) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid /><XAxis type="number" dataKey="x" name="X" /><YAxis type="number" dataKey="y" name="Y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter name="Data" data={data} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    if (type.includes('line')) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={axisKey} /><YAxis /><Tooltip /><Legend />
            {dataKeys.map((key, idx) => (<Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={axisKey} /><YAxis /><Tooltip /><Legend />
          {dataKeys.map((key, idx) => (<Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (typeof data === 'object' && data !== null) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-muted p-4 rounded-lg border">
            <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-foreground">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}
