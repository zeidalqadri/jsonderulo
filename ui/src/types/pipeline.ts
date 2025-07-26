export type PipelineNodeType = 
  | 'idea-input'
  | 'query-construction' 
  | 'prompt-optimization'
  | 'structure-layer'
  | 'llm-execution'
  | 'output-validation'
  | 'feedback-loop'

export interface PipelineNode {
  id: string
  type: PipelineNodeType
  position: { x: number; y: number }
  data: {
    label: string
    config?: Record<string, any>
    status?: 'idle' | 'running' | 'completed' | 'error'
    metrics?: {
      duration?: number
      cost?: number
      tokens?: number
    }
  }
}

export interface PipelineEdge {
  id: string
  source: string
  target: string
  type?: 'dashed' | 'solid'
}

export interface Pipeline {
  id: string
  name: string
  description?: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
  created_at: Date
  updated_at: Date
}

export interface PipelineExecution {
  id: string
  pipeline_id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  started_at: Date
  completed_at?: Date
  input_data: any
  output_data?: any
  error_message?: string
  metrics: {
    total_duration: number
    total_cost: number
    total_tokens: number
    nodes_executed: number
  }
}

export interface PipelineMetrics {
  requests_per_minute: number
  average_latency: number
  error_rate: number
  cost_per_request: number
  total_cost_today: number
  success_rate: number
  p50_latency: number
  p95_latency: number
  p99_latency: number
}

export interface ComponentHealth {
  component: string
  status: 'up' | 'down' | 'degraded'
  error_rate: number
  response_time: number
  last_check: Date
}

export interface Schema {
  id: string
  name: string
  description?: string
  schema: any
  version: number
  tags: string[]
  is_public: boolean
  usage_count: number
  created_at: Date
  updated_at: Date
}

export interface Template {
  id: string
  name: string
  description: string
  template: string
  variables: string[]
  category: string
  is_public: boolean
  usage_count: number
  created_at: Date
  updated_at: Date
}

export interface CostMetric {
  id: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_cost: number
  operation_type: 'schema_generation' | 'prompt_creation' | 'validation'
  created_at: Date
}

export interface AnalyticsData {
  cost_trends: {
    daily_costs: Array<{ date: string; cost: number }>
    provider_breakdown: Array<{ provider: string; cost: number; percentage: number }>
    model_breakdown: Array<{ model: string; cost: number; requests: number }>
  }
  performance_metrics: {
    response_times: Array<{ timestamp: Date; p50: number; p95: number; p99: number }>
    throughput: Array<{ timestamp: Date; requests_per_second: number }>
    success_rates: Array<{ timestamp: Date; success_rate: number }>
  }
  optimization_suggestions: Array<{
    type: 'cost' | 'performance' | 'reliability'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    estimated_impact: string
  }>
}