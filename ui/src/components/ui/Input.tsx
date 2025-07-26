import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  const inputClasses = ['input', className].filter(Boolean).join(' ')

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input 
        className={inputClasses}
        style={{
          width: '100%',
          borderColor: error ? '#666' : '#000'
        }}
        {...props} 
      />
      {error && (
        <div className="error" style={{ marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default Input