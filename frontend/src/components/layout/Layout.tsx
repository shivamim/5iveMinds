import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

export function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
