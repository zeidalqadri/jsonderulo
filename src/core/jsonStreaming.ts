/**
 * Advanced JSON Streaming with Progressive Validation
 * 
 * Provides streaming JSON generation with:
 * - Progressive schema validation
 * - Partial object construction
 * - Error recovery during streaming
 * - Incremental updates
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

export type StreamState = 'idle' | 'streaming' | 'completed' | 'error';

export interface StreamToken {
  type: 'object-start' | 'object-end' | 'array-start' | 'array-end' | 'property' | 'value' | 'separator';
  value?: any;
  propertyName?: string;
  path: string[];
  isValid?: boolean;
  error?: string;
}

export interface StreamingOptions {
  validatePartial?: boolean;
  maxDepth?: number;
  bufferSize?: number;
  strictMode?: boolean;
  recoveryEnabled?: boolean;
}

export interface StreamingResult {
  partial: any;
  complete: boolean;
  errors: StreamingError[];
  path: string[];
  tokens: number;
}

export interface StreamingError {
  path: string[];
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

export interface SchemaNode {
  path: string[];
  schema: z.ZodType<any>;
  required: boolean;
  parent?: SchemaNode;
  children: Map<string, SchemaNode>;
}

export class JsonStreamingValidator extends EventEmitter {
  private state: StreamState = 'idle';
  private buffer: StreamToken[] = [];
  private currentObject: any = {};
  private objectStack: any[] = [];
  private pathStack: string[][] = [[]];
  private errors: StreamingError[] = [];
  private schemaTree?: SchemaNode;
  private options: Required<StreamingOptions>;

  constructor(options: StreamingOptions = {}) {
    super();
    this.options = {
      validatePartial: true,
      maxDepth: 20,
      bufferSize: 100,
      strictMode: false,
      recoveryEnabled: true,
      ...options,
    };
  }

  /**
   * Initialize streaming with a schema
   */
  initializeStream(schema?: z.ZodType<any>): void {
    this.state = 'streaming';
    this.buffer = [];
    this.currentObject = {};
    this.objectStack = [this.currentObject];
    this.pathStack = [[]];
    this.errors = [];

    if (schema) {
      this.schemaTree = this.buildSchemaTree(schema);
    }

    this.emit('stream-initialized', { schema: !!schema });
  }

  /**
   * Process a streaming token
   */
  processToken(token: StreamToken): StreamingResult {
    if (this.state !== 'streaming') {
      throw new Error('Stream not initialized');
    }

    // Add to buffer
    this.buffer.push(token);
    if (this.buffer.length > this.options.bufferSize) {
      this.buffer.shift();
    }

    // Process based on token type
    switch (token.type) {
      case 'object-start':
        this.handleObjectStart(token);
        break;
      case 'object-end':
        this.handleObjectEnd(token);
        break;
      case 'array-start':
        this.handleArrayStart(token);
        break;
      case 'array-end':
        this.handleArrayEnd(token);
        break;
      case 'property':
        this.handleProperty(token);
        break;
      case 'value':
        this.handleValue(token);
        break;
    }

    // Validate if enabled
    if (this.options.validatePartial && this.schemaTree) {
      this.validatePartial();
    }

    const result: StreamingResult = {
      partial: this.objectStack[0],
      complete: false,
      errors: [...this.errors],
      path: [...this.getCurrentPath()],
      tokens: this.buffer.length,
    };

    this.emit('token-processed', { token, result });
    return result;
  }

  /**
   * Process JSON text stream
   */
  async processTextStream(
    textStream: AsyncIterable<string>,
    schema?: z.ZodType<any>
  ): AsyncIterable<StreamingResult> {
    this.initializeStream(schema);

    let buffer = '';
    let inString = false;
    let escapeNext = false;
    let depth = 0;
    let propertyName: string | null = null;
    let expectingValue = false;

    for await (const chunk of textStream) {
      buffer += chunk;

      while (buffer.length > 0) {
        const char = buffer[0];
        buffer = buffer.slice(1);

        // Handle string content
        if (inString) {
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          if (char === '"') {
            inString = false;
          }
          continue;
        }

        // Skip whitespace
        if (/\s/.test(char)) continue;

        // Process JSON structure
        switch (char) {
          case '"':
            inString = true;
            const stringEnd = this.findStringEnd(buffer);
            if (stringEnd !== -1) {
              const value = buffer.slice(0, stringEnd);
              buffer = buffer.slice(stringEnd + 1);
              inString = false;

              if (expectingValue) {
                yield this.processToken({
                  type: 'value',
                  value,
                  path: this.getCurrentPath(),
                });
                expectingValue = false;
              } else if (propertyName === null) {
                propertyName = value;
              }
            }
            break;

          case '{':
            yield this.processToken({
              type: 'object-start',
              propertyName: propertyName || undefined,
              path: this.getCurrentPath(),
            });
            propertyName = null;
            depth++;
            break;

          case '}':
            yield this.processToken({
              type: 'object-end',
              path: this.getCurrentPath(),
            });
            depth--;
            if (depth === 0) {
              this.state = 'completed';
              yield this.getFinalResult();
              return;
            }
            break;

          case '[':
            yield this.processToken({
              type: 'array-start',
              propertyName: propertyName || undefined,
              path: this.getCurrentPath(),
            });
            propertyName = null;
            depth++;
            break;

          case ']':
            yield this.processToken({
              type: 'array-end',
              path: this.getCurrentPath(),
            });
            depth--;
            break;

          case ':':
            if (propertyName !== null) {
              yield this.processToken({
                type: 'property',
                propertyName,
                path: this.getCurrentPath(),
              });
              expectingValue = true;
            }
            break;

          case ',':
            expectingValue = false;
            propertyName = null;
            break;

          default:
            // Handle numbers, booleans, null
            const valueMatch = buffer.match(/^(true|false|null|-?\d+\.?\d*)/);
            if (valueMatch) {
              const value = this.parseValue(char + valueMatch[0]);
              buffer = buffer.slice(valueMatch[0].length);
              
              yield this.processToken({
                type: 'value',
                value,
                propertyName: propertyName || undefined,
                path: this.getCurrentPath(),
              });
              
              expectingValue = false;
              propertyName = null;
            }
            break;
        }
      }
    }
  }

  /**
   * Complete the stream and get final result
   */
  completeStream(): StreamingResult {
    if (this.state !== 'streaming') {
      throw new Error('Stream not in progress');
    }

    this.state = 'completed';
    
    // Final validation
    if (this.schemaTree) {
      this.validateComplete();
    }

    const result = this.getFinalResult();
    this.emit('stream-completed', result);
    return result;
  }

  /**
   * Attempt to recover from streaming errors
   */
  async recoverFromError(error: StreamingError): Promise<StreamToken[]> {
    if (!this.options.recoveryEnabled || !error.recoverable) {
      return [];
    }

    const recoveryTokens: StreamToken[] = [];

    // Determine recovery strategy based on error type
    if (error.message.includes('missing required')) {
      // Add missing required fields with defaults
      const missingField = this.extractMissingField(error.message);
      if (missingField) {
        recoveryTokens.push({
          type: 'property',
          propertyName: missingField,
          path: error.path,
        });
        recoveryTokens.push({
          type: 'value',
          value: this.getDefaultValue(error.path.concat(missingField)),
          path: error.path.concat(missingField),
        });
      }
    } else if (error.message.includes('invalid type')) {
      // Attempt type conversion
      const suggestion = this.suggestTypeConversion(error);
      if (suggestion) {
        recoveryTokens.push({
          type: 'value',
          value: suggestion,
          path: error.path,
        });
      }
    }

    this.emit('recovery-attempted', { error, tokens: recoveryTokens });
    return recoveryTokens;
  }

  // Private methods

  private handleObjectStart(token: StreamToken): void {
    const newObject = {};
    
    if (this.isInArray()) {
      this.getCurrentArray().push(newObject);
    } else if (token.propertyName) {
      this.setProperty(token.propertyName, newObject);
    }

    this.objectStack.push(newObject);
    this.pathStack.push([...this.getCurrentPath(), token.propertyName || `${this.getCurrentArray()?.length || 0}`]);
  }

  private handleObjectEnd(token: StreamToken): void {
    this.objectStack.pop();
    this.pathStack.pop();
  }

  private handleArrayStart(token: StreamToken): void {
    const newArray: any[] = [];
    
    if (token.propertyName) {
      this.setProperty(token.propertyName, newArray);
    }

    this.objectStack.push(newArray);
    this.pathStack.push([...this.getCurrentPath(), token.propertyName || '']);
  }

  private handleArrayEnd(token: StreamToken): void {
    this.objectStack.pop();
    this.pathStack.pop();
  }

  private handleProperty(token: StreamToken): void {
    if (!token.propertyName) return;
    
    // Update current path
    const currentPath = this.getCurrentPath();
    currentPath.push(token.propertyName);
  }

  private handleValue(token: StreamToken): void {
    const value = token.value;
    const current = this.getCurrentObject();

    if (this.isInArray()) {
      this.getCurrentArray().push(value);
    } else {
      const path = this.getCurrentPath();
      const propertyName = path[path.length - 1];
      if (propertyName) {
        this.setProperty(propertyName, value);
        path.pop(); // Remove property from path after setting
      }
    }
  }

  private getCurrentObject(): any {
    return this.objectStack[this.objectStack.length - 1];
  }

  private getCurrentArray(): any[] | null {
    const current = this.getCurrentObject();
    return Array.isArray(current) ? current : null;
  }

  private isInArray(): boolean {
    return Array.isArray(this.getCurrentObject());
  }

  private getCurrentPath(): string[] {
    return this.pathStack[this.pathStack.length - 1];
  }

  private setProperty(name: string, value: any): void {
    const current = this.getCurrentObject();
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current[name] = value;
    }
  }

  private validatePartial(): void {
    if (!this.schemaTree) return;

    const current = this.objectStack[0];
    const path = this.getCurrentPath();
    
    try {
      // Find relevant schema node
      const schemaNode = this.findSchemaNode(path);
      if (!schemaNode) return;

      // Validate current value
      const partialSchema = this.createPartialSchema(schemaNode.schema);
      partialSchema.parse(current);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.handleValidationError(error, path);
      }
    }
  }

  private validateComplete(): void {
    if (!this.schemaTree) return;

    try {
      this.schemaTree.schema.parse(this.objectStack[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.handleValidationError(error, []);
      }
    }
  }

  private handleValidationError(error: z.ZodError, basePath: string[]): void {
    error.issues.forEach(issue => {
      const errorPath = basePath.concat(issue.path.map(p => String(p)));
      
      this.errors.push({
        path: errorPath,
        message: issue.message,
        recoverable: this.isRecoverable(issue),
        suggestion: this.getSuggestion(issue),
      });
    });
  }

  private isRecoverable(issue: z.ZodIssue): boolean {
    // Determine if error can be automatically recovered
    return ['invalid_type', 'missing'].includes(issue.code);
  }

  private getSuggestion(issue: z.ZodIssue): string | undefined {
    switch (issue.code) {
      case 'invalid_type':
        return `Expected ${issue.expected}, got ${issue.received}`;
      case 'too_small':
        return `Value must be at least ${(issue as any).minimum}`;
      case 'too_big':
        return `Value must be at most ${(issue as any).maximum}`;
      default:
        return undefined;
    }
  }

  private buildSchemaTree(schema: z.ZodType<any>, path: string[] = []): SchemaNode {
    const node: SchemaNode = {
      path,
      schema,
      required: !schema.isOptional(),
      children: new Map(),
    };

    // Extract children for object schemas
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      Object.entries(shape).forEach(([key, childSchema]) => {
        const childNode = this.buildSchemaTree(
          childSchema as z.ZodType<any>,
          [...path, key]
        );
        childNode.parent = node;
        node.children.set(key, childNode);
      });
    }

    return node;
  }

  private findSchemaNode(path: string[]): SchemaNode | null {
    if (!this.schemaTree) return null;

    let current = this.schemaTree;
    for (const segment of path) {
      const child = current.children.get(segment);
      if (!child) return current;
      current = child;
    }

    return current;
  }

  private createPartialSchema(schema: z.ZodType<any>): z.ZodType<any> {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const partialShape: Record<string, z.ZodType<any>> = {};
      
      Object.entries(shape).forEach(([key, value]) => {
        partialShape[key] = (value as z.ZodType<any>).optional();
      });

      return z.object(partialShape);
    }

    return schema;
  }

  private findStringEnd(buffer: string): number {
    let i = 0;
    let escapeNext = false;

    while (i < buffer.length) {
      if (escapeNext) {
        escapeNext = false;
      } else if (buffer[i] === '\\') {
        escapeNext = true;
      } else if (buffer[i] === '"') {
        return i;
      }
      i++;
    }

    return -1;
  }

  private parseValue(text: string): any {
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text === 'null') return null;
    
    const num = Number(text);
    if (!isNaN(num)) return num;
    
    return text;
  }

  private extractMissingField(message: string): string | null {
    const match = message.match(/field "(\w+)" is required/);
    return match ? match[1] : null;
  }

  private getDefaultValue(path: string[]): any {
    const schemaNode = this.findSchemaNode(path);
    if (!schemaNode) return null;

    // Infer default based on schema type
    const schema = schemaNode.schema;
    
    if (schema instanceof z.ZodString) return '';
    if (schema instanceof z.ZodNumber) return 0;
    if (schema instanceof z.ZodBoolean) return false;
    if (schema instanceof z.ZodArray) return [];
    if (schema instanceof z.ZodObject) return {};
    
    return null;
  }

  private suggestTypeConversion(error: StreamingError): any {
    // Extract expected and actual types from error message
    const match = error.message.match(/Expected (\w+), got (\w+)/);
    if (!match) return null;

    const [, expected, actual] = match;
    const currentValue = this.getValueAtPath(error.path);

    // Attempt conversion
    try {
      switch (expected) {
        case 'number':
          return Number(currentValue);
        case 'string':
          return String(currentValue);
        case 'boolean':
          return Boolean(currentValue);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private getValueAtPath(path: string[]): any {
    let current = this.objectStack[0];
    
    for (const segment of path) {
      if (current && typeof current === 'object') {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private getFinalResult(): StreamingResult {
    return {
      partial: this.objectStack[0],
      complete: this.state === 'completed',
      errors: this.errors,
      path: [],
      tokens: this.buffer.length,
    };
  }

  // Public getters

  getState(): StreamState {
    return this.state;
  }

  getErrors(): StreamingError[] {
    return [...this.errors];
  }

  getBuffer(): StreamToken[] {
    return [...this.buffer];
  }

  getCurrentPartial(): any {
    return this.objectStack[0];
  }
}