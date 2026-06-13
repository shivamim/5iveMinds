import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores/appStore'
import { Sun, Moon, Monitor, LogOut, AlertTriangle } from 'lucide-react'

export function SettingsPage() {
  const { theme, setTheme, user, setUser, setIsAuthenticated } = useStore()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>
              Current API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000 (default)'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Set the <code className="px-1 py-0.5 rounded bg-muted">VITE_API_URL</code> environment variable
            to point to your backend API (e.g., https://your-backend.up.railway.app).
          </p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user ? user.email : 'Not logged in'}
              </p>
              <p className="text-sm text-muted-foreground">
                {user ? 'Manage your account settings' : 'Log in to access account settings'}
              </p>
            </div>
            {user && (
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
