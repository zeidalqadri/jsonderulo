import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricCard {
  title: string
  value: string | number
  change?: string
  status?: 'up' | 'down' | 'stable'
}

const Monitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([
    { title: 'Requests/Min', value: 127, change: '+12%', status: 'up' },
    { title: 'Avg Latency', value: '245ms', change: '-8%', status: 'down' },
    { title: 'Success Rate', value: '99.2%', change: '+0.1%', status: 'up' },
    { title: 'Error Rate', value: '0.8%', change: '+0.1%', status: 'up' },
  ])

  const [performanceData] = useState([
    { time: '00:00', latency: 200, requests: 120, errors: 2 },
    { time: '00:05', latency: 245, requests: 135, errors: 1 },
    { time: '00:10', latency: 220, requests: 142, errors: 3 },
    { time: '00:15', latency: 190, requests: 128, errors: 0 },
    { time: '00:20', latency: 230, requests: 156, errors: 2 },
    { time: '00:25', latency: 210, requests: 134, errors: 1 },
  ])

  const [componentHealth] = useState([
    { name: 'Idea Input', status: 'up', latency: 45, uptime: '99.9%' },
    { name: 'Query Constructor', status: 'up', latency: 67, uptime: '99.8%' },
    { name: 'Prompt Optimizer', status: 'up', latency: 123, uptime: '99.9%' },
    { name: 'LLM Executor', status: 'degraded', latency: 2340, uptime: '98.2%' },
    { name: 'Output Validator', status: 'up', latency: 23, uptime: '99.9%' },
    { name: 'Feedback Loop', status: 'up', latency: 12, uptime: '100%' },
  ])

  const [recentExecutions] = useState([
    { 
      id: 'exec_001', 
      pipeline: 'Standard Flow', 
      status: 'completed', 
      duration: '2.3s', 
      cost: '$0.0045',
      timestamp: '2 min ago' 
    },
    { 
      id: 'exec_002', 
      pipeline: 'Quick Process', 
      status: 'running', 
      duration: '1.1s', 
      cost: '$0.0021',
      timestamp: '4 min ago' 
    },
    { 
      id: 'exec_003', 
      pipeline: 'Custom Pipeline', 
      status: 'error', 
      duration: '0.8s', 
      cost: '$0.0012',
      timestamp: '7 min ago' 
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return '●'
      case 'down': return '●'
      case 'degraded': return '◐'
      case 'running': return '⚡'
      case 'completed': return '✓'
      case 'error': return '✗'
      default: return '○'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#000'
      case 'down': return '#999'
      case 'degraded': return '#666'
      case 'running': return '#333'
      case 'completed': return '#000'
      case 'error': return '#666'
      default: return '#ccc'
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
        <h1>Pipeline Monitoring</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline">Export Data</Button>
          <Button>Refresh</Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        {metrics.map((metric, index) => (
          <Card key={index} hover={false}>
            <CardContent>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {metric.title}
                </div>
                {metric.change && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: metric.status === 'up' ? '#000' : '#666' 
                  }}>
                    {metric.change}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '2rem' }}>
        {/* Performance Chart */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="time" style={{ fontSize: '0.75rem' }} />
                <YAxis style={{ fontSize: '0.75rem' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #000',
                    borderRadius: 0,
                    fontSize: '0.75rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#000" 
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  dot={{ fill: '#000', strokeWidth: 2, r: 3 }}
                  name="Latency (ms)"
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#666" 
                  strokeWidth={2}
                  dot={{ fill: '#666', strokeWidth: 2, r: 3 }}
                  name="Requests"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Component Health */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Component Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {componentHealth.map((component, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: '1px dashed #ccc',
                    background: component.status === 'degraded' ? '#f8f8f8' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        color: getStatusColor(component.status),
                        marginRight: '0.5rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      {getStatusIcon(component.status)}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>{component.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', textAlign: 'right' }}>
                    <div>{component.latency}ms</div>
                    <div>{component.uptime}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Recent Pipeline Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Execution ID</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Pipeline</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Cost</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentExecutions.map((execution, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px dashed #ccc',
                      background: index % 2 === 0 ? '#f8f8f8' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>
                      {execution.id}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{execution.pipeline}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ color: getStatusColor(execution.status) }}>
                        {getStatusIcon(execution.status)} {execution.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{execution.duration}</td>
                    <td style={{ padding: '0.5rem' }}>{execution.cost}</td>
                    <td style={{ padding: '0.5rem', color: '#666' }}>{execution.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Monitoring