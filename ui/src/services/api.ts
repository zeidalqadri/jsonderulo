import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  Pipeline, 
  PipelineExecution, 
  PipelineMetrics, 
  ComponentHealth, 
  Schema, 
  Template, 
  CostMetric, 
  AnalyticsData 
} from '../types/pipeline'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, name: string, password: string, organization?: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/register', { 
      email, 
      name, 
      password, 
      organization_name: organization 
    })
    return response.data
  }

  // Pipeline methods (these would need to be implemented in the backend)
  async getPipelines(): Promise<Pipeline[]> {
    const response = await this.api.get('/pipelines')
    return response.data
  }

  async createPipeline(pipeline: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>): Promise<Pipeline> {
    const response = await this.api.post('/pipelines', pipeline)
    return response.data
  }

  async updatePipeline(id: string, pipeline: Partial<Pipeline>): Promise<Pipeline> {
    const response = await this.api.put(`/pipelines/${id}`, pipeline)
    return response.data
  }

  async deletePipeline(id: string): Promise<void> {
    await this.api.delete(`/pipelines/${id}`)
  }

  async executePipeline(id: string, input_data: any): Promise<PipelineExecution> {
    const response = await this.api.post(`/pipelines/${id}/execute`, { input_data })
    return response.data
  }

  async getPipelineExecutions(pipelineId?: string): Promise<PipelineExecution[]> {
    const url = pipelineId ? `/pipelines/${pipelineId}/executions` : '/executions'
    const response = await this.api.get(url)
    return response.data
  }

  async getPipelineMetrics(): Promise<PipelineMetrics> {
    const response = await this.api.get('/metrics/pipeline')
    return response.data
  }

  async getComponentHealth(): Promise<ComponentHealth[]> {
    const response = await this.api.get('/health/components')
    return response.data
  }

  // Schema methods
  async getSchemas(limit = 50, offset = 0): Promise<{ schemas: Schema[]; total: number }> {
    const response = await this.api.get('/schemas', { params: { limit, offset } })
    return response.data
  }

  async getSchema(id: string): Promise<Schema> {
    const response = await this.api.get(`/schemas/${id}`)
    return response.data
  }

  async createSchema(schema: Omit<Schema, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Schema> {
    const response = await this.api.post('/schemas', schema)
    return response.data
  }

  async updateSchema(id: string, schema: Partial<Schema>): Promise<Schema> {
    const response = await this.api.put(`/schemas/${id}`, schema)
    return response.data
  }

  async deleteSchema(id: string): Promise<void> {
    await this.api.delete(`/schemas/${id}`)
  }

  async validateSchema(id: string, data: any): Promise<{ valid: boolean; errors?: any[] }> {
    const response = await this.api.post(`/schemas/${id}/validate`, { data })
    return response.data
  }

  // Template methods
  async getTemplates(limit = 50, offset = 0): Promise<{ templates: Template[]; total: number }> {
    const response = await this.api.get('/templates', { params: { limit, offset } })
    return response.data
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await this.api.get(`/templates/${id}`)
    return response.data
  }

  async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Template> {
    const response = await this.api.post('/templates', template)
    return response.data
  }

  async useTemplate(id: string, variables: Record<string, any>): Promise<{ result: string }> {
    const response = await this.api.post(`/templates/${id}/use`, { variables })
    return response.data
  }

  // Analytics methods
  async getCostAnalytics(hours = 24): Promise<any> {
    const response = await this.api.get('/analytics/costs', { params: { hours } })
    return response.data
  }

  async getUsageAnalytics(): Promise<any> {
    const response = await this.api.get('/analytics/usage')
    return response.data
  }

  async recordCostMetric(metric: Omit<CostMetric, 'id' | 'created_at'>): Promise<CostMetric> {
    const response = await this.api.post('/analytics/costs', metric)
    return response.data
  }

  // Utility method for testing connection
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.api.get('/health')
    return response.data
  }
}

export const apiService = new ApiService()
export default ApiService