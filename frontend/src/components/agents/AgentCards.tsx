import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AgentExecution } from '@/types'
import { getQualityColor, getQualityBg, formatDuration } from '@/lib/utils'
import {
  Database,
  BarChart3,
  Brain,
  Lightbulb,
  Palette,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react'

const agentIcons: Record<string, React.ElementType> = {
  data_engineer: Database,
  statistician: BarChart3,
  ml_engineer: Brain,
  strategist: Lightbulb,
  designer: Palette,
}

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  pending: Clock,
}

const statusColors: Record<string, string> = {
  completed: 'text-emerald-500',
  failed: 'text-red-500',
  running: 'text-blue-500',
  pending: 'text-muted-foreground',
}

interface AgentCardProps {
  execution: AgentExecution
  index: number
}

export function AgentCard({ execution, index }: AgentCardProps) {
  const Icon = agentIcons[execution.agent_name] || Database
  const StatusIcon = statusIcons[execution.status] || Clock
  const isRunning = execution.status === 'running'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`border-l-4 ${execution.quality_score ? getQualityBg(execution.quality_score) : 'border-l-muted'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${isRunning ? 'agent-pulse' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold capitalize">{execution.agent_name.replace('_', ' ')}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className={`h-4 w-4 ${statusColors[execution.status]} ${isRunning ? 'animate-spin' : ''}`} />
                  <span className="text-sm text-muted-foreground capitalize">{execution.status}</span>
                  {execution.execution_time_ms && (
                    <span className="text-xs text-muted-foreground">{formatDuration(execution.execution_time_ms)}</span>
                  )}
                </div>
              </div>
            </div>

            {execution.quality_score && (
              <Badge variant="outline" className={getQualityColor(execution.quality_score)}>
                {execution.quality_score.toFixed(1)}
              </Badge>
            )}
          </div>

          {isRunning && (
            <div className="mt-3">
              <Progress value={execution.output_data?.progress || 0} max={100} />
            </div>
          )}

          {execution.error_message && (
            <div className="mt-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-2">
              {execution.error_message}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AgentPipeline({ executions }: { executions: AgentExecution[] }) {
  return (
    <div className="space-y-3">
      {executions.map((exec, i) => (
        <AgentCard key={exec.id} execution={exec} index={i} />
      ))}
    </div>
  )
}
