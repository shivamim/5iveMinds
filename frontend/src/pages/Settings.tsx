import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Server, BrainCircuit, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://your-backend.up.railway.app';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" /> System Settings
        </h1>
        <p className="text-muted-foreground mt-2">Configuration and environment status for your FiveMinds platform.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5" /> API Configuration</CardTitle>
            <CardDescription>Connection details for the backend orchestrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backend API URL</p>
                <p className="font-mono text-sm">{apiUrl}</p>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Database Status</CardTitle>
            <CardDescription>Supabase PostgreSQL connection pooler status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connection Mode</p>
                <p className="font-mono text-sm">Session Mode (Port 5432)</p>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Optimal
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="w-5 h-5" /> AI Models</CardTitle>
            <CardDescription>Active LLM configurations for the 5-agent pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Strategist & Data Engineer</p>
                <p className="font-semibold">Llama 3 70B (via Groq)</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Statistician & ML Engineer</p>
                <p className="font-semibold">Llama 3 8B (via Groq)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
