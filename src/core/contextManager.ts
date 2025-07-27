/**
 * Advanced Context Manager for jsonderulo
 * 
 * Provides sophisticated context management with:
 * - Episodic memory for conversation history
 * - Semantic relevance scoring
 * - Dynamic context window optimization
 * - Priority-based context selection
 */

import { EventEmitter } from 'events';

export interface ContextEntry {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user_input' | 'assistant_output' | 'system' | 'reference';
  metadata: {
    tokens?: number;
    relevanceScore?: number;
    priority?: number;
    tags?: string[];
    embeddings?: number[];
  };
}

export interface ContextWindow {
  entries: ContextEntry[];
  totalTokens: number;
  maxTokens: number;
  compressionRatio?: number;
}

export interface ContextConfig {
  maxTokens: number;
  maxEntries?: number;
  compressionEnabled?: boolean;
  semanticSearchEnabled?: boolean;
  priorityThreshold?: number;
}

export interface RetrievalOptions {
  query?: string;
  maxResults?: number;
  minRelevance?: number;
  types?: ContextEntry['type'][];
  tags?: string[];
}

export class ContextManager extends EventEmitter {
  private entries: Map<string, ContextEntry> = new Map();
  private entryOrder: string[] = [];
  private config: ContextConfig;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config: ContextConfig) {
    super();
    this.config = {
      maxEntries: 1000,
      compressionEnabled: true,
      semanticSearchEnabled: true,
      priorityThreshold: 0.3,
      ...config,
    };
  }

  /**
   * Add a new context entry
   */
  addEntry(entry: Omit<ContextEntry, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const timestamp = new Date();
    
    const fullEntry: ContextEntry = {
      ...entry,
      id,
      timestamp,
      metadata: {
        tokens: this.estimateTokens(entry.content),
        priority: 1.0,
        ...entry.metadata,
      },
    };

    this.entries.set(id, fullEntry);
    this.entryOrder.push(id);

    // Maintain size limit
    if (this.config.maxEntries && this.entryOrder.length > this.config.maxEntries) {
      const oldestId = this.entryOrder.shift()!;
      this.entries.delete(oldestId);
      this.embeddingCache.delete(oldestId);
    }

    this.emit('entry-added', fullEntry);
    return id;
  }

  /**
   * Retrieve relevant context based on options
   */
  async retrieveContext(options: RetrievalOptions = {}): Promise<ContextEntry[]> {
    let entries = Array.from(this.entries.values());

    // Filter by type
    if (options.types && options.types.length > 0) {
      entries = entries.filter(e => options.types!.includes(e.type));
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      entries = entries.filter(e => 
        e.metadata.tags?.some(tag => options.tags!.includes(tag))
      );
    }

    // Semantic search if query provided
    if (options.query && this.config.semanticSearchEnabled) {
      entries = await this.semanticSearch(entries, options.query, options.maxResults);
    }

    // Apply relevance threshold
    if (options.minRelevance) {
      entries = entries.filter(e => 
        (e.metadata.relevanceScore || 0) >= options.minRelevance!
      );
    }

    // Sort by relevance and recency
    entries.sort((a, b) => {
      const scoreA = this.calculateSortScore(a);
      const scoreB = this.calculateSortScore(b);
      return scoreB - scoreA;
    });

    // Limit results
    if (options.maxResults) {
      entries = entries.slice(0, options.maxResults);
    }

    return entries;
  }

  /**
   * Build optimized context window
   */
  async buildContextWindow(
    query: string,
    additionalContext?: string[]
  ): Promise<ContextWindow> {
    const relevantEntries = await this.retrieveContext({
      query,
      maxResults: 50, // Get more than needed for optimization
    });

    // Add additional context if provided
    const allEntries = [...relevantEntries];
    if (additionalContext) {
      additionalContext.forEach(content => {
        allEntries.push({
          id: this.generateId(),
          content,
          timestamp: new Date(),
          type: 'reference',
          metadata: {
            tokens: this.estimateTokens(content),
            priority: 0.8,
          },
        });
      });
    }

    // Optimize for token limit
    const optimized = this.optimizeForTokenLimit(allEntries, this.config.maxTokens);

    // Apply compression if needed
    let finalEntries = optimized;
    let compressionRatio = 1.0;
    
    if (this.config.compressionEnabled && this.needsCompression(optimized)) {
      const compressed = await this.compressEntries(optimized);
      finalEntries = compressed.entries;
      compressionRatio = compressed.ratio;
    }

    const totalTokens = finalEntries.reduce(
      (sum, e) => sum + (e.metadata.tokens || 0),
      0
    );

    return {
      entries: finalEntries,
      totalTokens,
      maxTokens: this.config.maxTokens,
      compressionRatio,
    };
  }

  /**
   * Update relevance scores based on usage
   */
  updateRelevance(entryId: string, wasUseful: boolean): void {
    const entry = this.entries.get(entryId);
    if (!entry) return;

    const currentScore = entry.metadata.relevanceScore || 0.5;
    const adjustment = wasUseful ? 0.1 : -0.05;
    
    entry.metadata.relevanceScore = Math.max(0, Math.min(1, currentScore + adjustment));
    
    this.emit('relevance-updated', { entryId, newScore: entry.metadata.relevanceScore });
  }

  /**
   * Clear old entries based on age or relevance
   */
  pruneEntries(options: {
    maxAge?: number; // milliseconds
    minRelevance?: number;
  }): number {
    const now = Date.now();
    const idsToRemove: string[] = [];

    this.entries.forEach((entry, id) => {
      const age = now - entry.timestamp.getTime();
      const relevance = entry.metadata.relevanceScore || 0.5;

      if (
        (options.maxAge && age > options.maxAge) ||
        (options.minRelevance && relevance < options.minRelevance)
      ) {
        idsToRemove.push(id);
      }
    });

    idsToRemove.forEach(id => {
      this.entries.delete(id);
      this.embeddingCache.delete(id);
      const index = this.entryOrder.indexOf(id);
      if (index > -1) {
        this.entryOrder.splice(index, 1);
      }
    });

    this.emit('entries-pruned', { count: idsToRemove.length });
    return idsToRemove.length;
  }

  /**
   * Export context for persistence
   */
  exportContext(): {
    entries: ContextEntry[];
    metadata: {
      totalEntries: number;
      exportDate: Date;
    };
  } {
    return {
      entries: Array.from(this.entries.values()),
      metadata: {
        totalEntries: this.entries.size,
        exportDate: new Date(),
      },
    };
  }

  /**
   * Import context from export
   */
  importContext(data: { entries: ContextEntry[] }): void {
    data.entries.forEach(entry => {
      this.entries.set(entry.id, entry);
      if (!this.entryOrder.includes(entry.id)) {
        this.entryOrder.push(entry.id);
      }
    });

    this.emit('context-imported', { count: data.entries.length });
  }

  // Private methods

  private async semanticSearch(
    entries: ContextEntry[],
    query: string,
    maxResults?: number
  ): Promise<ContextEntry[]> {
    // In a real implementation, this would use embeddings
    // For now, use keyword-based similarity
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scoredEntries = entries.map(entry => {
      const entryWords = entry.content.toLowerCase().split(/\s+/);
      const commonWords = queryWords.filter(qw => 
        entryWords.some(ew => ew.includes(qw) || qw.includes(ew))
      );
      
      const score = commonWords.length / queryWords.length;
      
      return {
        entry: {
          ...entry,
          metadata: {
            ...entry.metadata,
            relevanceScore: score,
          },
        },
        score,
      };
    });

    scoredEntries.sort((a, b) => b.score - a.score);
    
    const results = scoredEntries.map(se => se.entry);
    return maxResults ? results.slice(0, maxResults) : results;
  }

  private optimizeForTokenLimit(
    entries: ContextEntry[],
    maxTokens: number
  ): ContextEntry[] {
    const optimized: ContextEntry[] = [];
    let currentTokens = 0;

    // Sort by priority and relevance
    const sorted = [...entries].sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    });

    for (const entry of sorted) {
      const entryTokens = entry.metadata.tokens || 0;
      if (currentTokens + entryTokens <= maxTokens * 0.9) { // Leave 10% buffer
        optimized.push(entry);
        currentTokens += entryTokens;
      }
    }

    return optimized;
  }

  private needsCompression(entries: ContextEntry[]): boolean {
    const totalTokens = entries.reduce((sum, e) => sum + (e.metadata.tokens || 0), 0);
    return totalTokens > this.config.maxTokens * 0.8;
  }

  private async compressEntries(
    entries: ContextEntry[]
  ): Promise<{ entries: ContextEntry[]; ratio: number }> {
    // Simple compression: summarize older entries
    const compressed = entries.map((entry, index) => {
      const age = Date.now() - entry.timestamp.getTime();
      const ageHours = age / (1000 * 60 * 60);
      
      // Compress older entries more aggressively
      if (ageHours > 24 && entry.content.length > 200) {
        const summary = this.summarizeContent(entry.content);
        return {
          ...entry,
          content: summary,
          metadata: {
            ...entry.metadata,
            tokens: this.estimateTokens(summary),
            compressed: true,
          },
        };
      }
      
      return entry;
    });

    const originalTokens = entries.reduce((sum, e) => sum + (e.metadata.tokens || 0), 0);
    const compressedTokens = compressed.reduce((sum, e) => sum + (e.metadata.tokens || 0), 0);
    
    return {
      entries: compressed,
      ratio: compressedTokens / originalTokens,
    };
  }

  private summarizeContent(content: string): string {
    // Simple summarization: keep first and last sentences, extract key phrases
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length <= 2) return content;

    const first = sentences[0];
    const last = sentences[sentences.length - 1];
    const keyPhrases = this.extractKeyPhrases(content);

    return `${first}. Key points: ${keyPhrases.join(', ')}. ${last}.`;
  }

  private extractKeyPhrases(content: string): string[] {
    // Extract important phrases (simplified)
    const important = ['must', 'should', 'required', 'important', 'critical'];
    const sentences = content.split(/[.!?]+/);
    
    const keyPhrases = sentences
      .filter(s => important.some(word => s.toLowerCase().includes(word)))
      .map(s => s.trim().substring(0, 50))
      .slice(0, 3);

    return keyPhrases.length > 0 ? keyPhrases : [content.substring(0, 50) + '...'];
  }

  private calculateSortScore(entry: ContextEntry): number {
    const recencyScore = this.calculateRecencyScore(entry.timestamp);
    const relevanceScore = entry.metadata.relevanceScore || 0.5;
    const priorityScore = entry.metadata.priority || 0.5;
    
    return (relevanceScore * 0.5) + (recencyScore * 0.3) + (priorityScore * 0.2);
  }

  private calculatePriorityScore(entry: ContextEntry): number {
    const priority = entry.metadata.priority || 0.5;
    const relevance = entry.metadata.relevanceScore || 0.5;
    const recency = this.calculateRecencyScore(entry.timestamp);
    
    return (priority * 0.4) + (relevance * 0.4) + (recency * 0.2);
  }

  private calculateRecencyScore(timestamp: Date): number {
    const age = Date.now() - timestamp.getTime();
    const hoursSinceCreation = age / (1000 * 60 * 60);
    
    // Exponential decay: recent entries have higher scores
    return Math.exp(-hoursSinceCreation / 24);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private generateId(): string {
    return `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters

  getEntryCount(): number {
    return this.entries.size;
  }

  getEntry(id: string): ContextEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): ContextEntry[] {
    return this.entryOrder.map(id => this.entries.get(id)!).filter(Boolean);
  }

  getConfig(): ContextConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config-updated', this.config);
  }
}