import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = true, style = {} }) => {
  const classes = ['card', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={{ 
      transition: hover ? 'all 0.1s ease' : 'none',
      cursor: hover ? 'pointer' : 'default',
      ...style
    }}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
}

const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
    {children}
  </div>
)

interface CardContentProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

const CardContent: React.FC<CardContentProps> = ({ children, style = {} }) => (
  <div style={style}>{children}</div>
)

interface CardTitleProps {
  children: React.ReactNode
}

const CardTitle: React.FC<CardTitleProps> = ({ children }) => (
  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{children}</h3>
)

export { Card, CardHeader, CardContent, CardTitle }