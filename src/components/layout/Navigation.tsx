import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { MessageCircle, Settings, Menu, X, Bot, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const navItems = [
  { path: '/', label: '채팅', icon: MessageCircle },
  { path: '/settings', label: '설정', icon: Settings },
]

export function Navigation() {
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-blue-500 rounded-xl shadow group-hover:shadow-md transition-shadow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
              ChatBot
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  style={!active ? { color: 'var(--muted-fg)' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ color: 'var(--muted-fg)' }}
              title={isDark ? '라이트 모드' : '다크 모드'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ color: 'var(--muted-fg)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-2 border-t" style={{ borderColor: 'var(--nav-border)' }}>
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  style={!active ? { color: 'var(--fg)' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
