import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h')

  // Mock data for analytics
  const costTrends = [
    { date: '00:00', cost: 0.12, requests: 45 },
    { date: '04:00', cost: 0.18, requests: 62 },
    { date: '08:00', cost: 0.34, requests: 89 },
    { date: '12:00', cost: 0.45, requests: 124 },
    { date: '16:00', cost: 0.38, requests: 98 },
    { date: '20:00', cost: 0.28, requests: 76 },
  ]

  const providerBreakdown = [
    { provider: 'Anthropic', cost: 1.23, percentage: 65, requests: 234 },
    { provider: 'OpenAI', cost: 0.67, percentage: 35, requests: 156 },
  ]

  const performanceMetrics = [
    { metric: 'P50 Latency', value: '245ms', change: '-8%', trend: 'down' },
    { metric: 'P95 Latency', value: '892ms', change: '+3%', trend: 'up' },
    { metric: 'P99 Latency', value: '2.1s', change: '-12%', trend: 'down' },
    { metric: 'Throughput', value: '127 req/min', change: '+15%', trend: 'up' },
  ]

  const optimizationSuggestions = [
    {
      type: 'cost',
      priority: 'high',
      title: 'Switch to smaller model for simple queries',
      description: 'Use Claude-3-Haiku for queries under 500 tokens to reduce costs by ~40%',
      estimated_impact: '$0.15/day savings'
    },
    {
      type: 'performance', 
      priority: 'medium',
      title: 'Implement request batching',
      description: 'Batch similar requests to reduce API call overhead',
      estimated_impact: '25% latency reduction'
    },
    {
      type: 'reliability',
      priority: 'medium', 
      title: 'Add retry logic for failed validations',
      description: 'Implement exponential backoff for validation failures',
      estimated_impact: '15% improvement in success rate'
    }
  ]

  const schemaMetrics = [
    { type: 'Inferred', count: 142, percentage: 45 },
    { type: 'Template', count: 98, percentage: 31 },
    { type: 'Explicit', count: 76, percentage: 24 },
  ]

  const COLORS = ['#000000', '#666666', '#999999']

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#000'
      case 'medium': return '#666'
      case 'low': return '#999'
      default: return '#ccc'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      default: return '→'
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
        <h1>Analytics & Insights</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #000' }}>
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: timeRange === range ? '#000' : '#fff',
                  color: timeRange === range ? '#fff' : '#000',
                  border: 'none',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '2rem' }}>
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Cost Trends ({timeRange})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={costTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="date" style={{ fontSize: '0.75rem' }} />
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
                  dataKey="cost" 
                  stroke="#000" 
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  dot={{ fill: '#000', strokeWidth: 2, r: 3 }}
                  name="Cost ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle>Provider Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {providerBreakdown.map((provider, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {provider.provider}
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>
                        ${provider.cost.toFixed(2)}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#f0f0f0',
                      border: '1px solid #ccc'
                    }}>
                      <div style={{
                        width: `${provider.percentage}%`,
                        height: '100%',
                        background: index === 0 ? '#000' : '#666'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      {provider.requests} requests ({provider.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        {performanceMetrics.map((metric, index) => (
          <Card key={index} hover={false}>
            <CardContent>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  {metric.metric}
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: metric.trend === 'down' ? '#000' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}>
                  <span>{getTrendIcon(metric.trend)}</span>
                  <span>{metric.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '2rem' }}>
        {/* Schema Generation Metrics */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Schema Generation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={schemaMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  stroke="#000"
                  strokeWidth={2}
                >
                  {schemaMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #000',
                    borderRadius: 0,
                    fontSize: '0.75rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
              {schemaMetrics.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: COLORS[index],
                    border: '1px solid #000'
                  }} />
                  <span>{entry.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {optimizationSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    border: '1px dashed #ccc',
                    background: suggestion.priority === 'high' ? '#f8f8f8' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: getPriorityColor(suggestion.priority)
                    }}>
                      {suggestion.title}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.125rem 0.5rem',
                      border: `1px solid ${getPriorityColor(suggestion.priority)}`,
                      color: getPriorityColor(suggestion.priority)
                    }}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {suggestion.description}
                  </p>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Impact: {suggestion.estimated_impact}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Detailed Pipeline Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Pipeline</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Executions</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Avg Duration</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Success Rate</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Total Cost</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Cost/Request</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px dashed #ccc' }}>
                  <td style={{ padding: '0.5rem' }}>Standard Flow</td>
                  <td style={{ padding: '0.5rem' }}>234</td>
                  <td style={{ padding: '0.5rem' }}>2.45s</td>
                  <td style={{ padding: '0.5rem' }}>99.1%</td>
                  <td style={{ padding: '0.5rem' }}>$1.23</td>
                  <td style={{ padding: '0.5rem' }}>$0.0053</td>
                </tr>
                <tr style={{ borderBottom: '1px dashed #ccc', background: '#f8f8f8' }}>
                  <td style={{ padding: '0.5rem' }}>Quick Process</td>
                  <td style={{ padding: '0.5rem' }}>156</td>
                  <td style={{ padding: '0.5rem' }}>1.12s</td>
                  <td style={{ padding: '0.5rem' }}>98.7%</td>
                  <td style={{ padding: '0.5rem' }}>$0.67</td>
                  <td style={{ padding: '0.5rem' }}>$0.0043</td>
                </tr>
                <tr style={{ borderBottom: '1px dashed #ccc' }}>
                  <td style={{ padding: '0.5rem' }}>Custom Pipeline</td>
                  <td style={{ padding: '0.5rem' }}>89</td>
                  <td style={{ padding: '0.5rem' }}>3.78s</td>
                  <td style={{ padding: '0.5rem' }}>97.8%</td>
                  <td style={{ padding: '0.5rem' }}>$0.45</td>
                  <td style={{ padding: '0.5rem' }}>$0.0051</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics