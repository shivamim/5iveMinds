import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">FiveMinds</span>
        </Link>
      </div>
    </header>
  )
}
