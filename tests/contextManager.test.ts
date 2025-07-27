import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextManager, ContextEntry } from '../src/core/contextManager.js';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager({
      maxTokens: 1000,
      maxEntries: 100,
      compressionEnabled: true,
      semanticSearchEnabled: true,
    });
  });

  describe('Entry Management', () => {
    it('should add context entries', () => {
      const id = contextManager.addEntry({
        content: 'Test content',
        type: 'user_input',
        metadata: {
          tags: ['test'],
        },
      });

      expect(id).toBeDefined();
      expect(contextManager.getEntryCount()).toBe(1);
    });

    it('should retrieve entry by id', () => {
      const id = contextManager.addEntry({
        content: 'Test content',
        type: 'user_input',
      });

      const entry = contextManager.getEntry(id);
      expect(entry).toBeDefined();
      expect(entry?.content).toBe('Test content');
    });

    it('should maintain max entries limit', () => {
      const manager = new ContextManager({
        maxTokens: 1000,
        maxEntries: 3,
      });

      const ids = [];
      for (let i = 0; i < 5; i++) {
        ids.push(manager.addEntry({
          content: `Entry ${i}`,
          type: 'user_input',
        }));
      }

      expect(manager.getEntryCount()).toBe(3);
      expect(manager.getEntry(ids[0])).toBeUndefined(); // First entries removed
      expect(manager.getEntry(ids[4])).toBeDefined(); // Last entry exists
    });
  });

  describe('Context Retrieval', () => {
    it('should retrieve entries by type', async () => {
      contextManager.addEntry({ content: 'User input 1', type: 'user_input' });
      contextManager.addEntry({ content: 'System message', type: 'system' });
      contextManager.addEntry({ content: 'User input 2', type: 'user_input' });

      const userEntries = await contextManager.retrieveContext({
        types: ['user_input'],
      });

      expect(userEntries.length).toBe(2);
      expect(userEntries.every(e => e.type === 'user_input')).toBe(true);
    });

    it('should retrieve entries by tags', async () => {
      contextManager.addEntry({
        content: 'Tagged content',
        type: 'reference',
        metadata: { tags: ['important', 'api'] },
      });
      contextManager.addEntry({
        content: 'Other content',
        type: 'reference',
        metadata: { tags: ['general'] },
      });

      const taggedEntries = await contextManager.retrieveContext({
        tags: ['api'],
      });

      expect(taggedEntries.length).toBe(1);
      expect(taggedEntries[0].content).toBe('Tagged content');
    });

    it('should perform semantic search', async () => {
      contextManager.addEntry({ content: 'Machine learning algorithms', type: 'reference' });
      contextManager.addEntry({ content: 'Deep neural networks', type: 'reference' });
      contextManager.addEntry({ content: 'Weather forecast today', type: 'user_input' });

      const results = await contextManager.retrieveContext({
        query: 'artificial intelligence',
        maxResults: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
      // ML and DNN entries should rank higher than weather
      expect(results[0].metadata.relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Context Window Building', () => {
    it('should build optimized context window', async () => {
      // Add entries with different priorities
      for (let i = 0; i < 10; i++) {
        contextManager.addEntry({
          content: `Entry ${i} with some content`,
          type: 'reference',
          metadata: {
            priority: i % 2 === 0 ? 0.8 : 0.3,
          },
        });
      }

      const window = await contextManager.buildContextWindow('test query');

      expect(window).toBeDefined();
      expect(window.totalTokens).toBeLessThanOrEqual(window.maxTokens);
      expect(window.entries.length).toBeGreaterThan(0);
    });

    it('should include additional context', async () => {
      contextManager.addEntry({ content: 'Existing entry', type: 'reference' });

      const window = await contextManager.buildContextWindow(
        'test query',
        ['Additional context 1', 'Additional context 2']
      );

      expect(window.entries.length).toBeGreaterThanOrEqual(3);
    });

    it('should compress entries when needed', async () => {
      const manager = new ContextManager({
        maxTokens: 200,
        compressionEnabled: true,
      });

      // Add large entries
      for (let i = 0; i < 5; i++) {
        manager.addEntry({
          content: 'This is a very long entry that contains a lot of text and will need to be compressed. '.repeat(10),
          type: 'reference',
        });
      }

      const window = await manager.buildContextWindow('query');

      expect(window.compressionRatio).toBeLessThan(1);
      expect(window.totalTokens).toBeLessThanOrEqual(window.maxTokens);
    });
  });

  describe('Relevance Management', () => {
    it('should update relevance scores', () => {
      const id = contextManager.addEntry({
        content: 'Test content',
        type: 'reference',
      });

      contextManager.updateRelevance(id, true);
      const entry = contextManager.getEntry(id);
      expect(entry?.metadata.relevanceScore).toBeGreaterThan(0.5);

      contextManager.updateRelevance(id, false);
      const updatedEntry = contextManager.getEntry(id);
      expect(updatedEntry?.metadata.relevanceScore).toBeLessThan(entry!.metadata.relevanceScore!);
    });
  });

  describe('Pruning', () => {
    it('should prune old entries', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      
      // Mock old entry
      const entry: ContextEntry = {
        id: 'old-entry',
        content: 'Old content',
        timestamp: oldDate,
        type: 'reference',
        metadata: {},
      };

      // Add directly to test pruning
      contextManager['entries'].set(entry.id, entry);
      contextManager['entryOrder'].push(entry.id);

      // Add new entry
      contextManager.addEntry({ content: 'New content', type: 'reference' });

      const prunedCount = contextManager.pruneEntries({
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      expect(prunedCount).toBe(1);
      expect(contextManager.getEntry('old-entry')).toBeUndefined();
    });

    it('should prune low relevance entries', () => {
      const id1 = contextManager.addEntry({
        content: 'Low relevance',
        type: 'reference',
        metadata: { relevanceScore: 0.2 },
      });

      const id2 = contextManager.addEntry({
        content: 'High relevance',
        type: 'reference',
        metadata: { relevanceScore: 0.9 },
      });

      const prunedCount = contextManager.pruneEntries({
        minRelevance: 0.5,
      });

      expect(prunedCount).toBe(1);
      expect(contextManager.getEntry(id1)).toBeUndefined();
      expect(contextManager.getEntry(id2)).toBeDefined();
    });
  });

  describe('Import/Export', () => {
    it('should export context', () => {
      contextManager.addEntry({ content: 'Entry 1', type: 'user_input' });
      contextManager.addEntry({ content: 'Entry 2', type: 'assistant_output' });

      const exported = contextManager.exportContext();

      expect(exported.entries.length).toBe(2);
      expect(exported.metadata.totalEntries).toBe(2);
      expect(exported.metadata.exportDate).toBeInstanceOf(Date);
    });

    it('should import context', () => {
      const entries: ContextEntry[] = [
        {
          id: 'imported-1',
          content: 'Imported entry',
          timestamp: new Date(),
          type: 'reference',
          metadata: {},
        },
      ];

      contextManager.importContext({ entries });

      expect(contextManager.getEntryCount()).toBe(1);
      expect(contextManager.getEntry('imported-1')).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit entry-added event', () => {
      const handler = vi.fn();
      contextManager.on('entry-added', handler);

      contextManager.addEntry({ content: 'Test', type: 'user_input' });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('id');
      expect(handler.mock.calls[0][0]).toHaveProperty('content', 'Test');
    });

    it('should emit config-updated event', () => {
      const handler = vi.fn();
      contextManager.on('config-updated', handler);

      contextManager.updateConfig({ maxTokens: 2000 });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('maxTokens', 2000);
    });
  });
});