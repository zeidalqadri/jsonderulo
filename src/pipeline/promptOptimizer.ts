/**
 * PromptOptimizer - Fine-tunes prompts for maximum LLM performance
 *
 * This component optimizes prompts based on model capabilities,
 * adds examples, constructs reasoning chains, and manages token usage.
 */

import { EventEmitter } from 'events';
import { PipelineEvent } from './types.js';
import { StructuredQuery } from './queryConstructor.js';

export interface OptimizedPrompt {
  prompt: string;
  systemPrompt?: string;
  examples?: Example[];
  reasoningSteps?: string[];
  metadata: PromptMetadata;
  optimizations: string[];
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
  relevance: number;
}

export interface EnhancedPrompt extends OptimizedPrompt {
  exampleStrategy: 'few-shot' | 'one-shot' | 'zero-shot';
  exampleCount: number;
}

export interface ReasoningStep {
  step: number;
  instruction: string;
  purpose: string;
  expectedOutput?: string;
}

export interface ChainPrompt extends OptimizedPrompt {
  reasoningChain: ReasoningStep[];
  chainType: 'linear' | 'branching' | 'iterative';
}

export interface CompressedPrompt extends OptimizedPrompt {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  preservedElements: string[];
}

export interface PromptMetadata {
  estimatedTokens: number;
  complexity: 'simple' | 'moderate' | 'complex';
  optimizationScore: number;
  targetModel?: string;
  targetProvider?: string;
}

interface ModelCapabilities {
  maxTokens: number;
  supportsSystemPrompt: boolean;
  reasoningCapability: 'basic' | 'intermediate' | 'advanced';
  exampleHandling: 'poor' | 'good' | 'excellent';
  compressionTolerance: number;
}

export class PromptOptimizer extends EventEmitter {
  private modelCapabilities: Map<string, ModelCapabilities> = new Map();
  private exampleBank: Map<string, Example[]> = new Map();
  private compressionStrategies: CompressionStrategy[] = [];

  constructor() {
    super();
    this.initializeModelCapabilities();
    this.initializeCompressionStrategies();
  }

  private initializeModelCapabilities(): void {
    // OpenAI models
    this.modelCapabilities.set('gpt-4o', {
      maxTokens: 128000,
      supportsSystemPrompt: true,
      reasoningCapability: 'advanced',
      exampleHandling: 'excellent',
      compressionTolerance: 0.8,
    });

    this.modelCapabilities.set('gpt-4o-mini', {
      maxTokens: 128000,
      supportsSystemPrompt: true,
      reasoningCapability: 'intermediate',
      exampleHandling: 'good',
      compressionTolerance: 0.7,
    });

    this.modelCapabilities.set('gpt-3.5-turbo', {
      maxTokens: 16384,
      supportsSystemPrompt: true,
      reasoningCapability: 'intermediate',
      exampleHandling: 'good',
      compressionTolerance: 0.6,
    });

    // Anthropic models
    this.modelCapabilities.set('claude-3-5-sonnet', {
      maxTokens: 200000,
      supportsSystemPrompt: true,
      reasoningCapability: 'advanced',
      exampleHandling: 'excellent',
      compressionTolerance: 0.9,
    });

    this.modelCapabilities.set('claude-3-5-haiku', {
      maxTokens: 200000,
      supportsSystemPrompt: true,
      reasoningCapability: 'intermediate',
      exampleHandling: 'good',
      compressionTolerance: 0.7,
    });
  }

  private initializeCompressionStrategies(): void {
    this.compressionStrategies = [
      {
        name: 'remove-redundancy',
        apply: (text: string) => this.removeRedundancy(text),
        impact: 0.1,
      },
      {
        name: 'abbreviate-common-terms',
        apply: (text: string) => this.abbreviateCommonTerms(text),
        impact: 0.15,
      },
      {
        name: 'simplify-structure',
        apply: (text: string) => this.simplifyStructure(text),
        impact: 0.2,
      },
      {
        name: 'extract-key-points',
        apply: (text: string) => this.extractKeyPoints(text),
        impact: 0.3,
      },
    ];
  }

  async optimizeForModel(
    prompt: string,
    provider: string,
    model: string
  ): Promise<OptimizedPrompt> {
    const startTime = Date.now();

    this.emit('optimization-started', {
      type: 'processing-started',
      payload: { prompt, provider, model },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    const modelKey = model.toLowerCase();
    const capabilities = this.modelCapabilities.get(modelKey) || this.getDefaultCapabilities();

    let optimizedPrompt = prompt;
    const optimizations: string[] = [];

    // Model-specific optimizations
    if (capabilities.reasoningCapability === 'advanced') {
      optimizedPrompt = this.enhanceForAdvancedReasoning(optimizedPrompt);
      optimizations.push('Enhanced for advanced reasoning');
    }

    // Add system prompt if supported
    let systemPrompt: string | undefined;
    if (capabilities.supportsSystemPrompt) {
      systemPrompt = this.generateSystemPrompt(provider, model);
      optimizations.push('Added optimized system prompt');
    }

    // Token estimation
    const estimatedTokens = this.estimateTokens(optimizedPrompt);

    // Compress if needed
    if (estimatedTokens > capabilities.maxTokens * 0.8) {
      const compressed = await this.compressPrompt(optimizedPrompt, capabilities.maxTokens * 0.7);
      optimizedPrompt = compressed.prompt;
      optimizations.push(
        `Compressed to fit token limit (${compressed.compressionRatio.toFixed(2)}x)`
      );
    }

    const metadata: PromptMetadata = {
      estimatedTokens: this.estimateTokens(optimizedPrompt),
      complexity: this.assessPromptComplexity(optimizedPrompt),
      optimizationScore: this.calculateOptimizationScore(prompt, optimizedPrompt),
      targetModel: model,
      targetProvider: provider,
    };

    const result: OptimizedPrompt = {
      prompt: optimizedPrompt,
      systemPrompt,
      metadata,
      optimizations,
    };

    const processingTime = Date.now() - startTime;

    this.emit('optimization-completed', {
      type: 'processing-started',
      payload: { result, processingTime },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return result;
  }

  async addExamples(prompt: string, examples: Example[]): Promise<EnhancedPrompt> {
    // Determine example strategy based on count and quality
    const exampleStrategy = this.determineExampleStrategy(examples);

    // Select best examples
    const selectedExamples = this.selectBestExamples(examples, prompt);

    // Format examples into prompt
    const enhancedPrompt = this.formatExamplesIntoPrompt(prompt, selectedExamples, exampleStrategy);

    const metadata: PromptMetadata = {
      estimatedTokens: this.estimateTokens(enhancedPrompt),
      complexity: 'moderate',
      optimizationScore: 0.85,
    };

    return {
      prompt: enhancedPrompt,
      examples: selectedExamples,
      metadata,
      optimizations: [
        `Added ${selectedExamples.length} examples using ${exampleStrategy} strategy`,
      ],
      exampleStrategy,
      exampleCount: selectedExamples.length,
    };
  }

  async addReasoningChain(prompt: string, steps: ReasoningStep[]): Promise<ChainPrompt> {
    const chainType = this.determineChainType(steps);
    const formattedChain = this.formatReasoningChain(steps, chainType);

    const enhancedPrompt = `${prompt}\n\nPlease follow these reasoning steps:\n${formattedChain}`;

    const metadata: PromptMetadata = {
      estimatedTokens: this.estimateTokens(enhancedPrompt),
      complexity: 'complex',
      optimizationScore: 0.9,
    };

    return {
      prompt: enhancedPrompt,
      reasoningChain: steps,
      chainType,
      metadata,
      optimizations: [`Added ${steps.length}-step ${chainType} reasoning chain`],
    };
  }

  async compressPrompt(prompt: string, targetTokens: number): Promise<CompressedPrompt> {
    const originalTokens = this.estimateTokens(prompt);

    if (originalTokens <= targetTokens) {
      return {
        prompt,
        originalTokens,
        compressedTokens: originalTokens,
        compressionRatio: 1.0,
        preservedElements: ['all'],
        metadata: {
          estimatedTokens: originalTokens,
          complexity: 'simple',
          optimizationScore: 1.0,
        },
        optimizations: ['No compression needed'],
      };
    }

    let compressedPrompt = prompt;
    const preservedElements: string[] = [];
    const appliedStrategies: string[] = [];

    // Apply compression strategies progressively
    for (const strategy of this.compressionStrategies) {
      if (this.estimateTokens(compressedPrompt) <= targetTokens) {
        break;
      }

      const beforeTokens = this.estimateTokens(compressedPrompt);
      compressedPrompt = strategy.apply(compressedPrompt);
      const afterTokens = this.estimateTokens(compressedPrompt);

      if (afterTokens < beforeTokens) {
        appliedStrategies.push(strategy.name);
      }
    }

    // Preserve critical elements
    preservedElements.push(...this.identifyPreservedElements(prompt, compressedPrompt));

    const compressedTokens = this.estimateTokens(compressedPrompt);
    const compressionRatio = compressedTokens / originalTokens;

    const metadata: PromptMetadata = {
      estimatedTokens: compressedTokens,
      complexity: this.assessPromptComplexity(compressedPrompt),
      optimizationScore: this.calculateCompressionQuality(prompt, compressedPrompt),
    };

    return {
      prompt: compressedPrompt,
      originalTokens,
      compressedTokens,
      compressionRatio,
      preservedElements,
      metadata,
      optimizations: appliedStrategies.map(s => `Applied ${s}`),
    };
  }

  storeExamples(category: string, examples: Example[]): void {
    this.exampleBank.set(category, examples);
  }

  getStoredExamples(category: string): Example[] {
    return this.exampleBank.get(category) || [];
  }

  private enhanceForAdvancedReasoning(prompt: string): string {
    // Add reasoning markers for advanced models
    const markers = [
      "Let's approach this step-by-step:",
      'Consider the following aspects:',
      'Break down the problem:',
    ];

    const selectedMarker = markers[Math.floor(Math.random() * markers.length)];
    return `${prompt}\n\n${selectedMarker}`;
  }

  private generateSystemPrompt(provider: string, model: string): string {
    const basePrompt =
      'You are a helpful AI assistant specialized in structured data generation and JSON output.';

    const providerSpecific: Record<string, string> = {
      openai: 'Follow OpenAI usage policies and provide accurate, helpful responses.',
      anthropic: 'Be helpful, harmless, and honest in your responses.',
    };

    const modelSpecific: Record<string, string> = {
      'gpt-4o': 'Leverage your advanced reasoning capabilities for complex tasks.',
      'claude-3-5-sonnet':
        'Use your strong analytical abilities to provide comprehensive solutions.',
    };

    const parts = [basePrompt, providerSpecific[provider] || '', modelSpecific[model] || ''].filter(
      Boolean
    );

    return parts.join(' ');
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private assessPromptComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
    const tokens = this.estimateTokens(prompt);
    const sentences = prompt.split(/[.!?]+/).length;
    const hasMultipleParts = prompt.includes('\n\n');

    if (tokens < 100 && sentences < 3) return 'simple';
    if (tokens > 500 || sentences > 10 || hasMultipleParts) return 'complex';
    return 'moderate';
  }

  private calculateOptimizationScore(original: string, optimized: string): number {
    const originalTokens = this.estimateTokens(original);
    const optimizedTokens = this.estimateTokens(optimized);

    // Score based on clarity improvement and token efficiency
    const tokenEfficiency = Math.min(optimizedTokens / originalTokens, 1);
    const clarityImprovement =
      optimized.includes('step-by-step') || optimized.includes('specifically') ? 0.1 : 0;

    return Math.min(0.7 + clarityImprovement + (1 - tokenEfficiency) * 0.2, 1);
  }

  private determineExampleStrategy(examples: Example[]): 'few-shot' | 'one-shot' | 'zero-shot' {
    if (examples.length === 0) return 'zero-shot';
    if (examples.length === 1) return 'one-shot';
    return 'few-shot';
  }

  private selectBestExamples(examples: Example[], prompt: string): Example[] {
    // Sort by relevance and select top examples
    const scoredExamples = examples.map(example => ({
      example,
      score: this.calculateExampleRelevance(example, prompt),
    }));

    scoredExamples.sort((a, b) => b.score - a.score);

    // Select top 3-5 examples based on quality
    const maxExamples = Math.min(5, Math.max(3, Math.floor(examples.length * 0.3)));
    return scoredExamples.slice(0, maxExamples).map(se => se.example);
  }

  private calculateExampleRelevance(example: Example, prompt: string): number {
    // Calculate relevance based on keyword overlap
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const exampleWords = (example.input + ' ' + example.output).toLowerCase().split(/\s+/);

    const overlap = promptWords.filter(word => exampleWords.includes(word)).length;
    const overlapScore = overlap / promptWords.length;

    return overlapScore * 0.7 + example.relevance * 0.3;
  }

  private formatExamplesIntoPrompt(
    prompt: string,
    examples: Example[],
    strategy: 'few-shot' | 'one-shot' | 'zero-shot'
  ): string {
    if (strategy === 'zero-shot') return prompt;

    const exampleSection = examples
      .map(
        (ex, idx) =>
          `Example ${idx + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}${
            ex.explanation ? `\nExplanation: ${ex.explanation}` : ''
          }`
      )
      .join('\n\n');

    return `${prompt}\n\nHere are some examples:\n\n${exampleSection}\n\nNow, please process the following:`;
  }

  private determineChainType(steps: ReasoningStep[]): 'linear' | 'branching' | 'iterative' {
    // Analyze step dependencies
    const hasConditionals = steps.some(
      s => s.instruction.includes('if') || s.instruction.includes('otherwise')
    );
    const hasLoops = steps.some(
      s => s.instruction.includes('repeat') || s.instruction.includes('iterate')
    );

    if (hasLoops) return 'iterative';
    if (hasConditionals) return 'branching';
    return 'linear';
  }

  private formatReasoningChain(
    steps: ReasoningStep[],
    chainType: 'linear' | 'branching' | 'iterative'
  ): string {
    const formatted = steps
      .map(
        step =>
          `${step.step}. ${step.instruction} (${step.purpose})${
            step.expectedOutput ? `\n   Expected: ${step.expectedOutput}` : ''
          }`
      )
      .join('\n');

    const prefix = {
      linear: 'Follow these steps in order:',
      branching: 'Follow these steps, choosing the appropriate path:',
      iterative: 'Follow these steps, repeating as necessary:',
    };

    return `${prefix[chainType]}\n${formatted}`;
  }

  private removeRedundancy(text: string): string {
    // Remove repeated phrases and redundant words
    const words = text.split(/\s+/);
    const seen = new Set<string>();
    const filtered: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const phrase = words
        .slice(i, i + 3)
        .join(' ')
        .toLowerCase();
      if (!seen.has(phrase) || words[i].length > 10) {
        filtered.push(words[i]);
        seen.add(phrase);
      }
    }

    return filtered.join(' ');
  }

  private abbreviateCommonTerms(text: string): string {
    const abbreviations: Record<string, string> = {
      'for example': 'e.g.',
      'that is': 'i.e.',
      'and so on': 'etc.',
      versus: 'vs.',
      approximately: '~',
    };

    let abbreviated = text;
    Object.entries(abbreviations).forEach(([full, abbr]) => {
      abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbr);
    });

    return abbreviated;
  }

  private simplifyStructure(text: string): string {
    // Simplify complex sentence structures
    return text
      .replace(/\s+which\s+/g, ' that ')
      .replace(/\s+in order to\s+/g, ' to ')
      .replace(/\s+due to the fact that\s+/g, ' because ')
      .replace(/\s+at this point in time\s+/g, ' now ');
  }

  private extractKeyPoints(text: string): string {
    // Extract main points from verbose text
    const sentences = text.split(/[.!?]+/);
    const keyWords = ['must', 'should', 'important', 'key', 'main', 'primary', 'critical'];

    const keySentences = sentences.filter(sentence =>
      keyWords.some(word => sentence.toLowerCase().includes(word))
    );

    return keySentences.length > 0
      ? keySentences.join('. ') + '.'
      : sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
  }

  private identifyPreservedElements(original: string, compressed: string): string[] {
    const preserved: string[] = [];

    // Check for preserved key terms
    const keyTerms = ['must', 'required', 'specific', 'exact', 'format'];
    keyTerms.forEach(term => {
      if (original.includes(term) && compressed.includes(term)) {
        preserved.push(`key term: ${term}`);
      }
    });

    // Check for preserved structures
    if (original.includes('```') && compressed.includes('```')) {
      preserved.push('code blocks');
    }
    if (original.includes('1.') && compressed.includes('1.')) {
      preserved.push('numbered lists');
    }

    return preserved;
  }

  private calculateCompressionQuality(original: string, compressed: string): number {
    // Measure how well the compression preserves meaning
    const originalKeywords = this.extractKeywords(original);
    const compressedKeywords = this.extractKeywords(compressed);

    const preserved = compressedKeywords.filter(kw => originalKeywords.includes(kw)).length;

    const preservationRate = preserved / originalKeywords.length;
    const compressionRate = compressed.length / original.length;

    // Balance between compression and preservation
    return preservationRate * 0.7 + (1 - compressionRate) * 0.3;
  }

  private extractKeywords(text: string): string[] {
    // Extract important words (simple implementation)
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20);
  }

  private getDefaultCapabilities(): ModelCapabilities {
    return {
      maxTokens: 4096,
      supportsSystemPrompt: true,
      reasoningCapability: 'basic',
      exampleHandling: 'good',
      compressionTolerance: 0.5,
    };
  }

  private generateExecutionId(): string {
    return `optimizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface CompressionStrategy {
  name: string;
  apply: (text: string) => string;
  impact: number;
}
