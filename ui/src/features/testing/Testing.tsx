import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const Testing: React.FC = () => {
  const [selectedPipeline, setSelectedPipeline] = useState('standard-flow')
  const [testInput, setTestInput] = useState(`{
  "idea": "Create a user authentication system",
  "context": "Building a web application that needs secure user login",
  "requirements": [
    "JWT tokens",
    "Password hashing",
    "Role-based access"
  ]
}`)
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const mockPipelines = [
    { id: 'standard-flow', name: 'Standard Flow', description: 'Complete pipeline with all nodes' },
    { id: 'quick-process', name: 'Quick Process', description: 'Simplified pipeline for rapid testing' },
    { id: 'custom-pipeline', name: 'Custom Pipeline', description: 'User-defined pipeline configuration' },
  ]

  const mockTestHistory = [
    {
      id: 'test_001',
      pipeline: 'Standard Flow',
      status: 'passed',
      duration: '2.34s',
      timestamp: '2 minutes ago',
      input_size: '245 chars'
    },
    {
      id: 'test_002',
      pipeline: 'Quick Process',
      status: 'failed',
      duration: '1.12s',
      timestamp: '15 minutes ago',
      input_size: '182 chars'
    },
    {
      id: 'test_003',
      pipeline: 'Standard Flow',
      status: 'passed',
      duration: '3.45s',
      timestamp: '1 hour ago',
      input_size: '467 chars'
    },
  ]

  const runTest = async () => {
    setIsRunning(true)
    setTestResults(null)

    // Simulate test execution
    setTimeout(() => {
      setTestResults({
        status: 'completed',
        duration: '2.45s',
        total_cost: '$0.0067',
        nodes_executed: 7,
        output: {
          "authentication_system": {
            "components": [
              "User registration endpoint",
              "Login/logout functionality", 
              "JWT token generation",
              "Password hashing with bcrypt",
              "Role-based middleware"
            ],
            "schema": {
              "user": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "email": { "type": "string" },
                  "role": { "type": "string", "enum": ["user", "admin"] },
                  "created_at": { "type": "string", "format": "date-time" }
                }
              }
            },
            "estimated_complexity": "medium",
            "implementation_time": "4-6 hours"
          }
        },
        validation: {
          schema_valid: true,
          required_fields_present: true,
          data_types_correct: true,
          errors: []
        }
      })
      setIsRunning(false)
    }, 2450)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#000'
      case 'failed': return '#666'
      case 'running': return '#333'
      default: return '#ccc'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✓'
      case 'failed': return '✗'
      case 'running': return '⚡'
      default: return '○'
    }
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Pipeline Testing</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline">Load Sample</Button>
          <Button variant="outline">Save Test</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 200px)' }}>
        {/* Test Configuration */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card hover={false}>
            <CardHeader>
              <CardTitle>Pipeline Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mockPipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    style={{
                      padding: '0.75rem',
                      border: selectedPipeline === pipeline.id ? '2px solid #000' : '1px dashed #ccc',
                      cursor: 'pointer',
                      background: selectedPipeline === pipeline.id ? '#f8f8f8' : 'transparent'
                    }}
                    onClick={() => setSelectedPipeline(pipeline.id)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {pipeline.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {pipeline.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card hover={false}>
            <CardHeader>
              <CardTitle>Test Input</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: '100%',
                  height: '200px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  border: '1px solid #ccc',
                  padding: '0.75rem',
                  background: '#f8f8f8',
                  resize: 'vertical',
                  outline: 'none'
                }}
                placeholder="Enter test data in JSON format..."
              />
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Button 
                  variant="primary" 
                  onClick={runTest}
                  disabled={isRunning}
                  style={{ flex: 1 }}
                >
                  {isRunning ? (
                    <>
                      <span className="loading" style={{ marginRight: '0.5rem' }}></span>
                      Running...
                    </>
                  ) : (
                    'Run Test'
                  )}
                </Button>
                <Button variant="outline">Clear</Button>
              </div>
            </CardContent>
          </Card>

          <Card hover={false}>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {mockTestHistory.map((test) => (
                  <div
                    key={test.id}
                    style={{
                      padding: '0.5rem',
                      border: '1px dashed #ccc',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{test.id}</span>
                      <span style={{ color: getStatusColor(test.status) }}>
                        {getStatusIcon(test.status)} {test.status}
                      </span>
                    </div>
                    <div style={{ color: '#666' }}>
                      {test.pipeline} • {test.duration} • {test.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div style={{ flex: 1 }}>
          <Card hover={false} style={{ height: '100%' }}>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              {!testResults && !isRunning && (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '0.875rem'
                }}>
                  Run a test to see results here
                </div>
              )}

              {isRunning && (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div className="loading" style={{ width: '32px', height: '32px' }}></div>
                  <div>Executing pipeline...</div>
                </div>
              )}

              {testResults && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Test Summary */}
                  <div style={{
                    padding: '1rem',
                    background: '#f8f8f8',
                    border: '2px solid #000'
                  }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Test Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Status</div>
                        <div style={{ fontWeight: 600 }}>✓ {testResults.status}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Duration</div>
                        <div style={{ fontWeight: 600 }}>{testResults.duration}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Cost</div>
                        <div style={{ fontWeight: 600 }}>{testResults.total_cost}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Nodes</div>
                        <div style={{ fontWeight: 600 }}>{testResults.nodes_executed}/7</div>
                      </div>
                    </div>
                  </div>

                  {/* Output */}
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Pipeline Output</h3>
                    <pre style={{
                      background: '#f8f8f8',
                      border: '1px solid #ccc',
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(testResults.output, null, 2)}
                    </pre>
                  </div>

                  {/* Validation */}
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Validation Results</h3>
                    <div style={{
                      padding: '1rem',
                      border: '1px solid #ccc',
                      background: '#f8f8f8'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                        <div>✓ Schema Valid: {testResults.validation.schema_valid ? 'Yes' : 'No'}</div>
                        <div>✓ Required Fields: {testResults.validation.required_fields_present ? 'Present' : 'Missing'}</div>
                        <div>✓ Data Types: {testResults.validation.data_types_correct ? 'Correct' : 'Invalid'}</div>
                        <div>Errors: {testResults.validation.errors.length} found</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Testing