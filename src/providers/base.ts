export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface CostMetrics {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  provider: string;
  model: string;
  timestamp: Date;
}

export interface LLMResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  costMetrics: CostMetrics;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  stopSequences?: string[];
}

export abstract class BaseLLMProvider {
  protected config: ProviderConfig;
  protected abstract providerName: string;
  protected abstract modelPricing: Record<string, { input: number; output: number }>;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract generateCompletion(request: LLMRequest): Promise<LLMResponse>;

  protected calculateCost(model: string, inputTokens: number, outputTokens: number): CostMetrics {
    const pricing = this.modelPricing[model] || this.modelPricing['default'];
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      provider: this.providerName,
      model,
      timestamp: new Date(),
    };
  }

  getProviderName(): string {
    return this.providerName;
  }

  abstract isAvailable(): Promise<boolean>;
  abstract getAvailableModels(): string[];
}
