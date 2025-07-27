import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { apiService } from '../../services/api'

interface ExecutionResult {
  success: boolean
  execution_id: string
  schema: any
  result: any
  metadata: {
    tokens_used: number
    model: string
    processing_time: number
  }
}

const IdeaExecutor: React.FC = () => {
  const [idea, setIdea] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load templates on component mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateData = await apiService.getTemplates()
        setTemplates(templateData.templates)
      } catch (err) {
        console.error('Failed to load templates:', err)
        // Set default templates if API fails
        setTemplates([
          { id: 'extraction', name: 'Data Extraction', description: 'Extract structured data from text' },
          { id: 'classification', name: 'Text Classification', description: 'Classify text into categories' },
          { id: 'analysis', name: 'Content Analysis', description: 'Analyze content for insights' }
        ])
      }
    }
    loadTemplates()
  }, [])

  const handleExecute = async () => {
    if (!idea.trim()) {
      setError('Please enter an idea to execute')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await apiService.executeIdea(
        idea,
        selectedTemplate || undefined,
        {
          mode: 'validated',
          temperature: 0.7
        }
      )
      console.log('API Response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Execution failed:', err)
      setError(err.response?.data?.details || err.message || 'Failed to execute idea')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setIdea('')
    setSelectedTemplate('')
    setResult(null)
    setError(null)
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🎵 Jsonderulo Idea Executor
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Transform your ideas into structured JSON that LLMs love
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Describe your idea:
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., Analyze customer feedback to identify pain points and improvement opportunities"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Template (optional):
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  background: 'white'
                }}
              >
                <option value="">Auto-detect (recommended)</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button 
                variant="primary" 
                onClick={handleExecute} 
                disabled={loading || !idea.trim()}
                style={{ flex: 1 }}
              >
                {loading ? 'Executing...' : '🎵 Execute Idea'}
              </Button>
              <Button onClick={handleClear} disabled={loading}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card style={{ borderColor: '#dc2626' }}>
          <CardContent>
            <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
              ❌ Error: {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Execution Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Execution ID:</strong><br />
                  <code>{result.execution_id}</code>
                </div>
                <div>
                  <strong>Tokens Used:</strong><br />
                  {result.metadata.tokens_used}
                </div>
                <div>
                  <strong>Model:</strong><br />
                  {result.metadata.model}
                </div>
                <div>
                  <strong>Status:</strong><br />
                  <span style={{ color: '#059669', fontWeight: 'bold' }}>
                    ✅ Success
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Schema */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Generated JSON Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre style={{
                background: '#f8f8f8',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.4'
              }}>
                {result.schema ? JSON.stringify(result.schema, null, 2) : 'No schema generated'}
              </pre>
            </CardContent>
          </Card>

          {/* LLM Result */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Structured Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre style={{
                background: '#f0fdf4',
                padding: '1rem',
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.4'
              }}>
                {result.result ? JSON.stringify(result.result, null, 2) : 'No results generated'}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default IdeaExecutor