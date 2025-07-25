import { BaseLLMProvider, ProviderConfig, LLMRequest, LLMResponse } from './base.js';

export class AnthropicProvider extends BaseLLMProvider {
  protected providerName = 'anthropic';
  protected modelPricing = {
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    default: { input: 3.0, output: 15.0 },
  };

  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor(config: ProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const model = this.config.model || 'claude-3-5-haiku-20241022';

    const requestBody: any = {
      model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    };

    if (request.systemPrompt) {
      requestBody.system = request.systemPrompt;
    }

    if (request.stopSequences && request.stopSequences.length > 0) {
      requestBody.stop_sequences = request.stopSequences;
    }

    try {
      const response = await this.makeRequest('/messages', requestBody);

      const content = response.content[0]?.text || '';
      const usage = response.usage || {
        input_tokens: 0,
        output_tokens: 0,
      };

      const costMetrics = this.calculateCost(model, usage.input_tokens, usage.output_tokens);

      return {
        content,
        finishReason: response.stop_reason,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
        model,
        provider: this.providerName,
        costMetrics,
      };
    } catch (error) {
      throw new Error(
        `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
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
      // Anthropic doesn't have a simple health check endpoint, so we'll try a minimal request
      const response = await this.generateCompletion({
        prompt: 'Hello',
        maxTokens: 1,
        temperature: 0,
      });
      return !!response;
    } catch {
      return false;
    }
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
}
