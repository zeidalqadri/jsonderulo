import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'medium', 
  children, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'btn'
  const variantClasses = {
    default: '',
    primary: 'btn-primary',
    outline: 'btn-outline'
  }
  const sizeClasses = {
    small: 'text-small',
    medium: '',
    large: 'p-6'
  }

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button