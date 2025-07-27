import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Prompt Optimizer', icon: '✨' },
    { path: '/execute', label: 'Idea Executor', icon: '🎵' },
    { path: '/builder', label: 'Pipeline Builder', icon: '⚡' },
    { path: '/monitoring', label: 'Monitoring', icon: '📊' },
    { path: '/schemas', label: 'Schema Designer', icon: '🔧' },
    { path: '/testing', label: 'Testing', icon: '🧪' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        borderRight: '2px solid #000',
        padding: '1rem',
        background: '#ffffff'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            jsonderulo
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
            Pipeline Studio
          </p>
        </div>

        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                textDecoration: 'none',
                color: '#000',
                border: location.pathname === item.path ? '2px solid #000' : '1px dashed #ccc',
                background: location.pathname === item.path ? '#f8f8f8' : 'transparent',
                fontFamily: 'inherit'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          fontSize: '0.75rem',
          color: '#666',
          borderTop: '1px solid #ccc',
          paddingTop: '1rem'
        }}>
          <div>Status: <span style={{ color: '#000' }}>●</span> Online</div>
          <div>Version: 1.0.0</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        overflow: 'auto',
        background: '#ffffff'
      }}>
        {children}
      </main>
    </div>
  )
}

export default Layout