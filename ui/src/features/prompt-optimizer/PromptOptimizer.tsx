import React, { useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

interface OptimizedPrompt {
  original: string
  enhanced: string
  metadata: {
    category: string
    complexity: string
    tokens_used: number
    processing_time: number
    confidence: number
  }
  suggestions?: string[]
}

const PromptOptimizer: React.FC = () => {
  const [promptIdea, setPromptIdea] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState<OptimizedPrompt | null>(null)
  const [outputFormat, setOutputFormat] = useState<'natural' | 'json'>('natural')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptimize = useCallback(async () => {
    if (!promptIdea.trim()) {
      setError('Please enter a prompt idea to optimize')
      return
    }

    setLoading(true)
    setError(null)
    setOptimizedPrompt(null)

    try {
      // Call the jsonderulo pipeline for prompt optimization
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: promptIdea,
          outputFormat,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setOptimizedPrompt(result)
    } catch (err: any) {
      console.error('Optimization failed:', err)
      setError(err.message || 'Failed to optimize prompt')
    } finally {
      setLoading(false)
    }
  }, [promptIdea, outputFormat])

  const handleClear = useCallback(() => {
    setPromptIdea('')
    setOptimizedPrompt(null)
    setError(null)
  }, [])

  const handleCopyPrompt = useCallback(async () => {
    if (!optimizedPrompt) return
    
    try {
      await navigator.clipboard.writeText(optimizedPrompt.enhanced)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }, [optimizedPrompt])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleOptimize()
    }
  }, [handleOptimize])

  return (
    <div style={{ 
      maxWidth: '672px', 
      margin: '0 auto', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          color: '#000'
        }}>
          🎵 Jsonderulo Prompt Optimizer
        </h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          Transform your prompt ideas into optimized, structured prompts
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Prompt Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              value={promptIdea}
              onChange={(e) => setPromptIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your prompt idea... e.g., 'I want to analyze customer feedback and extract key insights about product satisfaction'"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease-in-out'
              }}
              onFocus={(e) => e.target.style.borderColor = '#000'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>Output Format:</span>
                <button
                  type="button"
                  onClick={() => setOutputFormat('natural')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: outputFormat === 'natural' ? '#000' : 'white',
                    color: outputFormat === 'natural' ? 'white' : '#666',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Natural Language
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormat('json')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: outputFormat === 'json' ? '#000' : 'white',
                    color: outputFormat === 'json' ? 'white' : '#666',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  JSON
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button 
                variant="primary" 
                onClick={handleOptimize} 
                disabled={loading || !promptIdea.trim()}
                style={{ 
                  flex: 1,
                  background: '#000',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading || !promptIdea.trim() ? 0.6 : 1
                }}
              >
                {loading ? 'Optimizing...' : '✨ Optimize Prompt'}
              </Button>
              <Button 
                onClick={handleClear} 
                disabled={loading}
                style={{
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Clear
              </Button>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              Tip: Press Cmd/Ctrl + Enter to optimize quickly
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card style={{ borderColor: '#dc2626', borderWidth: '1px' }}>
          <CardContent>
            <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ❌ {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Prompt Display */}
      {optimizedPrompt && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Enhanced Prompt</CardTitle>
              <Button 
                onClick={handleCopyPrompt}
                style={{
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                📋 Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Enhanced Prompt Text */}
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {optimizedPrompt.enhanced}
              </div>

              {/* Metadata */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: '#666'
              }}>
                <div>
                  <strong>Category:</strong><br />
                  <span style={{ color: '#000' }}>{optimizedPrompt.metadata.category}</span>
                </div>
                <div>
                  <strong>Complexity:</strong><br />
                  <span style={{ color: '#000' }}>{optimizedPrompt.metadata.complexity}</span>
                </div>
                <div>
                  <strong>Confidence:</strong><br />
                  <span style={{ color: '#000' }}>{Math.round(optimizedPrompt.metadata.confidence * 100)}%</span>
                </div>
                <div>
                  <strong>Processing:</strong><br />
                  <span style={{ color: '#000' }}>{optimizedPrompt.metadata.processing_time}ms</span>
                </div>
              </div>

              {/* Suggestions */}
              {optimizedPrompt.suggestions && optimizedPrompt.suggestions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    💡 Optimization Suggestions:
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '1.25rem', 
                    fontSize: '0.75rem', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {optimizedPrompt.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: '0.25rem' }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PromptOptimizer