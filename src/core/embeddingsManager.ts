/**
 * Embeddings Manager for Semantic Context Retrieval
 * 
 * Provides semantic search and context retrieval using embeddings:
 * - Text embedding generation
 * - Similarity search
 * - Clustering and categorization
 * - Efficient vector storage and retrieval
 */

import { EventEmitter } from 'events';

export interface EmbeddingVector {
  id: string;
  vector: number[];
  metadata: {
    text: string;
    type?: string;
    timestamp?: Date;
    tokens?: number;
    category?: string;
  };
}

export interface SimilarityResult {
  id: string;
  score: number;
  metadata: EmbeddingVector['metadata'];
}

export interface ClusterInfo {
  id: string;
  centroid: number[];
  members: string[];
  label?: string;
  coherence: number;
}

export interface EmbeddingConfig {
  dimensions?: number;
  provider?: 'openai' | 'local' | 'mock';
  model?: string;
  cacheEnabled?: boolean;
  maxCacheSize?: number;
  similarityThreshold?: number;
}

export class EmbeddingsManager extends EventEmitter {
  private embeddings: Map<string, EmbeddingVector> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();
  private clusters: Map<string, ClusterInfo> = new Map();
  private config: Required<EmbeddingConfig>;
  private textIndex: Map<string, Set<string>> = new Map(); // For fast text lookup

  constructor(config: EmbeddingConfig = {}) {
    super();
    this.config = {
      dimensions: 1536, // Default for OpenAI ada-002
      provider: 'mock',
      model: 'text-embedding-ada-002',
      cacheEnabled: true,
      maxCacheSize: 10000,
      similarityThreshold: 0.7,
      ...config,
    };
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.embeddingCache.get(text);
      if (cached) {
        this.emit('cache-hit', { text });
        return cached;
      }
    }

    let embedding: number[];

    switch (this.config.provider) {
      case 'openai':
        embedding = await this.generateOpenAIEmbedding(text);
        break;
      case 'local':
        embedding = await this.generateLocalEmbedding(text);
        break;
      case 'mock':
      default:
        embedding = this.generateMockEmbedding(text);
        break;
    }

    // Cache the result
    if (this.config.cacheEnabled) {
      this.addToCache(text, embedding);
    }

    this.emit('embedding-generated', { text, dimensions: embedding.length });
    return embedding;
  }

  /**
   * Add text with embedding to the store
   */
  async addText(
    text: string,
    metadata: Partial<EmbeddingVector['metadata']> = {}
  ): Promise<string> {
    const id = this.generateId();
    const embedding = await this.generateEmbedding(text);

    const vector: EmbeddingVector = {
      id,
      vector: embedding,
      metadata: {
        text,
        timestamp: new Date(),
        tokens: this.estimateTokens(text),
        ...metadata,
      },
    };

    this.embeddings.set(id, vector);
    this.updateTextIndex(id, text);

    this.emit('text-added', { id, text });
    return id;
  }

  /**
   * Find similar texts using cosine similarity
   */
  async findSimilar(
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      filter?: (metadata: EmbeddingVector['metadata']) => boolean;
    } = {}
  ): Promise<SimilarityResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const threshold = options.threshold || this.config.similarityThreshold;
    const maxResults = options.maxResults || 10;

    const results: SimilarityResult[] = [];

    this.embeddings.forEach((vector, id) => {
      if (options.filter && !options.filter(vector.metadata)) {
        return;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, vector.vector);
      
      if (similarity >= threshold) {
        results.push({
          id,
          score: similarity,
          metadata: vector.metadata,
        });
      }
    });

    // Sort by similarity score
    results.sort((a, b) => b.score - a.score);

    // Limit results
    const limited = results.slice(0, maxResults);

    this.emit('similarity-search', { 
      query, 
      results: limited.length,
      threshold,
    });

    return limited;
  }

  /**
   * Find similar embeddings using vector similarity
   */
  findSimilarByVector(
    vector: number[],
    options: {
      maxResults?: number;
      threshold?: number;
      excludeIds?: string[];
    } = {}
  ): SimilarityResult[] {
    const threshold = options.threshold || this.config.similarityThreshold;
    const maxResults = options.maxResults || 10;
    const excludeIds = new Set(options.excludeIds || []);

    const results: SimilarityResult[] = [];

    this.embeddings.forEach((embedding, id) => {
      if (excludeIds.has(id)) return;

      const similarity = this.cosineSimilarity(vector, embedding.vector);
      
      if (similarity >= threshold) {
        results.push({
          id,
          score: similarity,
          metadata: embedding.metadata,
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  /**
   * Cluster embeddings for categorization
   */
  async clusterEmbeddings(options: {
    numClusters?: number;
    minClusterSize?: number;
    maxIterations?: number;
  } = {}): Promise<ClusterInfo[]> {
    const numClusters = options.numClusters || 5;
    const minClusterSize = options.minClusterSize || 2;
    const maxIterations = options.maxIterations || 50;

    if (this.embeddings.size < numClusters) {
      return [];
    }

    // Simple k-means clustering
    const clusters = this.kMeansClustering(
      Array.from(this.embeddings.values()),
      numClusters,
      maxIterations
    );

    // Filter out small clusters
    const validClusters = clusters.filter(c => c.members.length >= minClusterSize);

    // Store clusters
    validClusters.forEach(cluster => {
      this.clusters.set(cluster.id, cluster);
    });

    // Auto-label clusters based on common terms
    for (const cluster of validClusters) {
      cluster.label = this.generateClusterLabel(cluster);
    }

    this.emit('clustering-complete', { 
      clusters: validClusters.length,
      totalEmbeddings: this.embeddings.size,
    });

    return validClusters;
  }

  /**
   * Get embeddings by category/cluster
   */
  getByCategory(category: string): EmbeddingVector[] {
    const results: EmbeddingVector[] = [];

    this.embeddings.forEach(vector => {
      if (vector.metadata.category === category) {
        results.push(vector);
      }
    });

    return results;
  }

  /**
   * Update embedding metadata
   */
  updateMetadata(id: string, updates: Partial<EmbeddingVector['metadata']>): boolean {
    const embedding = this.embeddings.get(id);
    if (!embedding) return false;

    embedding.metadata = { ...embedding.metadata, ...updates };
    this.emit('metadata-updated', { id, updates });
    return true;
  }

  /**
   * Remove embedding
   */
  removeEmbedding(id: string): boolean {
    const embedding = this.embeddings.get(id);
    if (!embedding) return false;

    this.embeddings.delete(id);
    this.removeFromTextIndex(id, embedding.metadata.text);
    
    this.emit('embedding-removed', { id });
    return true;
  }

  /**
   * Export embeddings for persistence
   */
  exportEmbeddings(): {
    embeddings: EmbeddingVector[];
    clusters: ClusterInfo[];
    metadata: {
      totalEmbeddings: number;
      dimensions: number;
      exportDate: Date;
    };
  } {
    return {
      embeddings: Array.from(this.embeddings.values()),
      clusters: Array.from(this.clusters.values()),
      metadata: {
        totalEmbeddings: this.embeddings.size,
        dimensions: this.config.dimensions,
        exportDate: new Date(),
      },
    };
  }

  /**
   * Import embeddings from export
   */
  importEmbeddings(data: {
    embeddings: EmbeddingVector[];
    clusters?: ClusterInfo[];
  }): void {
    data.embeddings.forEach(embedding => {
      this.embeddings.set(embedding.id, embedding);
      this.updateTextIndex(embedding.id, embedding.metadata.text);
    });

    if (data.clusters) {
      data.clusters.forEach(cluster => {
        this.clusters.set(cluster.id, cluster);
      });
    }

    this.emit('embeddings-imported', { count: data.embeddings.length });
  }

  // Private methods

  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    // In a real implementation, this would call OpenAI's API
    // For now, return mock embedding
    return this.generateMockEmbedding(text);
  }

  private async generateLocalEmbedding(text: string): Promise<number[]> {
    // In a real implementation, this would use a local model
    // For now, return mock embedding
    return this.generateMockEmbedding(text);
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on text
    const embedding = new Array(this.config.dimensions).fill(0);
    
    // Use text characteristics to generate pseudo-embedding
    const words = text.toLowerCase().split(/\s+/);
    const charSum = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    for (let i = 0; i < this.config.dimensions; i++) {
      const wordIndex = i % words.length;
      const word = words[wordIndex] || '';
      const wordSum = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      
      // Create varied values based on text properties
      embedding[i] = Math.sin(wordSum * (i + 1) + charSum) * 
                     Math.cos(text.length * (i + 1)) * 
                     (1 + (i % 10) / 10);
    }

    // Normalize the vector
    return this.normalizeVector(embedding);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      return vector;
    }

    return vector.map(val => val / magnitude);
  }

  private kMeansClustering(
    embeddings: EmbeddingVector[],
    k: number,
    maxIterations: number
  ): ClusterInfo[] {
    if (embeddings.length < k) return [];

    // Initialize centroids randomly
    const centroids = this.initializeCentroids(embeddings, k);
    const clusters: Map<number, string[]> = new Map();

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Clear previous assignments
      clusters.clear();
      for (let i = 0; i < k; i++) {
        clusters.set(i, []);
      }

      // Assign embeddings to nearest centroid
      embeddings.forEach(embedding => {
        let minDistance = Infinity;
        let assignedCluster = 0;

        centroids.forEach((centroid, idx) => {
          const distance = this.euclideanDistance(embedding.vector, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            assignedCluster = idx;
          }
        });

        clusters.get(assignedCluster)!.push(embedding.id);
      });

      // Update centroids
      let converged = true;
      for (let i = 0; i < k; i++) {
        const clusterMembers = clusters.get(i)!;
        if (clusterMembers.length === 0) continue;

        const newCentroid = this.calculateCentroid(
          clusterMembers.map(id => this.embeddings.get(id)!.vector)
        );

        if (!this.vectorsEqual(centroids[i], newCentroid)) {
          converged = false;
          centroids[i] = newCentroid;
        }
      }

      if (converged) break;
    }

    // Convert to ClusterInfo format
    const clusterInfos: ClusterInfo[] = [];
    clusters.forEach((members, idx) => {
      if (members.length > 0) {
        clusterInfos.push({
          id: `cluster-${idx}`,
          centroid: centroids[idx],
          members,
          coherence: this.calculateClusterCoherence(members, centroids[idx]),
        });
      }
    });

    return clusterInfos;
  }

  private initializeCentroids(embeddings: EmbeddingVector[], k: number): number[][] {
    // K-means++ initialization
    const centroids: number[][] = [];
    const indices = new Set<number>();

    // Choose first centroid randomly
    const firstIdx = Math.floor(Math.random() * embeddings.length);
    centroids.push([...embeddings[firstIdx].vector]);
    indices.add(firstIdx);

    // Choose remaining centroids
    for (let i = 1; i < k; i++) {
      const distances = embeddings.map((emb, idx) => {
        if (indices.has(idx)) return 0;

        const minDist = centroids.reduce((min, centroid) => {
          const dist = this.euclideanDistance(emb.vector, centroid);
          return Math.min(min, dist);
        }, Infinity);

        return minDist * minDist; // Square for probability weighting
      });

      const sumDistances = distances.reduce((sum, d) => sum + d, 0);
      let random = Math.random() * sumDistances;
      
      for (let j = 0; j < embeddings.length; j++) {
        random -= distances[j];
        if (random <= 0 && !indices.has(j)) {
          centroids.push([...embeddings[j].vector]);
          indices.add(j);
          break;
        }
      }
    }

    return centroids;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];
    
    const dimensions = vectors[0].length;
    const centroid = new Array(dimensions).fill(0);

    vectors.forEach(vector => {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    });

    return centroid.map(val => val / vectors.length);
  }

  private vectorsEqual(a: number[], b: number[], epsilon = 1e-6): boolean {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) return false;
    }
    
    return true;
  }

  private calculateClusterCoherence(memberIds: string[], centroid: number[]): number {
    if (memberIds.length === 0) return 0;

    let totalSimilarity = 0;
    memberIds.forEach(id => {
      const embedding = this.embeddings.get(id);
      if (embedding) {
        totalSimilarity += this.cosineSimilarity(embedding.vector, centroid);
      }
    });

    return totalSimilarity / memberIds.length;
  }

  private generateClusterLabel(cluster: ClusterInfo): string {
    // Extract common words from cluster members
    const wordFreq = new Map<string, number>();

    cluster.members.forEach(id => {
      const embedding = this.embeddings.get(id);
      if (embedding) {
        const words = embedding.metadata.text
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3); // Filter short words

        words.forEach(word => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
      }
    });

    // Get top 3 most common words
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    return sortedWords.join('-') || 'cluster';
  }

  private updateTextIndex(id: string, text: string): void {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    words.forEach(word => {
      if (!this.textIndex.has(word)) {
        this.textIndex.set(word, new Set());
      }
      this.textIndex.get(word)!.add(id);
    });
  }

  private removeFromTextIndex(id: string, text: string): void {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    words.forEach(word => {
      const ids = this.textIndex.get(word);
      if (ids) {
        ids.delete(id);
        if (ids.size === 0) {
          this.textIndex.delete(word);
        }
      }
    });
  }

  private addToCache(text: string, embedding: number[]): void {
    this.embeddingCache.set(text, embedding);

    // Maintain cache size limit
    if (this.embeddingCache.size > this.config.maxCacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private generateId(): string {
    return `emb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters

  getEmbeddingCount(): number {
    return this.embeddings.size;
  }

  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  getClusterCount(): number {
    return this.clusters.size;
  }

  getEmbedding(id: string): EmbeddingVector | undefined {
    return this.embeddings.get(id);
  }

  getCluster(id: string): ClusterInfo | undefined {
    return this.clusters.get(id);
  }
}