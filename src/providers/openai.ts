import { BaseLLMProvider, ProviderConfig, LLMRequest, LLMResponse } from './base.js';

export class OpenAIProvider extends BaseLLMProvider {
  protected providerName = 'openai';
  protected modelPricing = {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    default: { input: 2.5, output: 10.0 },
  };

  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(config: ProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const model = this.config.model || 'gpt-4o-mini';
    const messages: any[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const requestBody: any = {
      model,
      messages,
      temperature: request.temperature || 0,
      max_tokens: request.maxTokens || 4096,
    };

    // Use structured outputs for JSON mode when available
    if (request.jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    if (request.stopSequences && request.stopSequences.length > 0) {
      requestBody.stop = request.stopSequences;
    }

    try {
      const response = await this.makeRequest('/chat/completions', requestBody);

      const choice = response.choices[0];
      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const costMetrics = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

      return {
        content: choice.message.content,
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model,
        provider: this.providerName,
        costMetrics,
      };
    } catch (error) {
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
  }
}
