import { useStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Moon, Sun, Bell, Menu } from 'lucide-react'

export function Header() {
  const { theme, setTheme, sidebarOpen, setSidebarOpen, currentRun } = useStore()

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {currentRun && (
          <div className="flex items-center gap-3">
            <Badge variant={getBadgeVariant(currentRun.status)}>
              {currentRun.status}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {currentRun.dataset_name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
