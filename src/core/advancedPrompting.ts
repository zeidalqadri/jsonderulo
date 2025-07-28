/**
 * Advanced Prompting Patterns for jsonderulo
 * 
 * Implements sophisticated prompting techniques:
 * - Chain of Thought (CoT) for step-by-step reasoning
 * - Tree of Thoughts (ToT) for exploring multiple reasoning paths
 * - Self-Consistency for reliable outputs
 * - Role-based and persona prompting
 */

import { EventEmitter } from 'events';
import { GeneratedSchema } from './schemaGenerator.js';

export type PromptingStrategy = 'cot' | 'tot' | 'self-consistency' | 'role-based' | 'standard';

export interface ThoughtStep {
  step: number;
  thought: string;
  reasoning?: string;
  confidence?: number;
  alternatives?: string[];
}

export interface ThoughtTree {
  root: ThoughtNode;
  bestPath?: ThoughtNode[];
  allPaths: ThoughtNode[][];
}

export interface ThoughtNode {
  id: string;
  thought: string;
  evaluation?: number;
  children: ThoughtNode[];
  parent?: ThoughtNode;
  depth: number;
}

export interface ConsistencyResult {
  outputs: any[];
  consensusOutput?: any;
  confidenceScore: number;
  variations: {
    field: string;
    values: any[];
    consensus?: any;
  }[];
}

export interface RoleDefinition {
  name: string;
  description: string;
  expertise: string[];
  traits: string[];
  constraints?: string[];
}

export interface AdvancedPromptResult {
  strategy: PromptingStrategy;
  prompt: string;
  systemPrompt?: string;
  metadata: {
    steps?: ThoughtStep[];
    tree?: ThoughtTree;
    role?: RoleDefinition;
    expectedReasoning?: string[];
  };
}

export class AdvancedPrompting extends EventEmitter {
  private roleLibrary: Map<string, RoleDefinition> = new Map();
  private thoughtPatterns: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.initializeRoles();
    this.initializeThoughtPatterns();
  }

  private initializeRoles(): void {
    const roles: RoleDefinition[] = [
      {
        name: 'data-analyst',
        description: 'Expert data analyst with strong analytical skills',
        expertise: ['data analysis', 'statistics', 'pattern recognition', 'visualization'],
        traits: ['methodical', 'detail-oriented', 'objective'],
        constraints: ['Base conclusions on data', 'Quantify uncertainty'],
      },
      {
        name: 'api-designer',
        description: 'Experienced API designer focused on clean interfaces',
        expertise: ['REST APIs', 'GraphQL', 'schema design', 'documentation'],
        traits: ['systematic', 'user-focused', 'consistent'],
        constraints: ['Follow REST principles', 'Ensure backward compatibility'],
      },
      {
        name: 'domain-expert',
        description: 'Subject matter expert with deep domain knowledge',
        expertise: ['domain modeling', 'business logic', 'best practices'],
        traits: ['knowledgeable', 'practical', 'thorough'],
      },
      {
        name: 'quality-assurance',
        description: 'QA specialist focused on correctness and edge cases',
        expertise: ['testing', 'validation', 'error handling', 'edge cases'],
        traits: ['critical', 'thorough', 'systematic'],
        constraints: ['Consider all edge cases', 'Validate assumptions'],
      },
    ];

    roles.forEach(role => this.roleLibrary.set(role.name, role));
  }

  private initializeThoughtPatterns(): void {
    this.thoughtPatterns.set('analysis', [
      'First, let me understand what is being asked...',
      'Breaking down the key components...',
      'Analyzing the relationships between elements...',
      'Considering potential edge cases...',
      'Synthesizing the findings...',
    ]);

    this.thoughtPatterns.set('problem-solving', [
      'Identifying the core problem...',
      'Exploring possible approaches...',
      'Evaluating pros and cons of each approach...',
      'Selecting the optimal solution...',
      'Planning the implementation...',
    ]);

    this.thoughtPatterns.set('classification', [
      'Examining the characteristics...',
      'Comparing against known categories...',
      'Identifying distinguishing features...',
      'Making the classification decision...',
      'Verifying the classification...',
    ]);

    this.thoughtPatterns.set('generation', [
      'Understanding the requirements...',
      'Structuring the output format...',
      'Generating each component...',
      'Ensuring consistency and completeness...',
      'Validating against constraints...',
    ]);
  }

  /**
   * Generate Chain of Thought prompt
   */
  generateCoTPrompt(
    task: string,
    schema?: GeneratedSchema | any,
    options: {
      steps?: string[];
      explicitReasoning?: boolean;
      structured?: boolean;
    } = {}
  ): AdvancedPromptResult {
    const steps = options.steps || this.inferSteps(task);
    
    let prompt = task + '\n\n';
    
    if (options.explicitReasoning) {
      prompt += 'Think through this step-by-step, showing your reasoning for each step.\n\n';
    }

    if (options.structured) {
      prompt += 'Structure your response as follows:\n';
      steps.forEach((step, index) => {
        prompt += `${index + 1}. ${step}\n`;
      });
      prompt += '\n';
    } else {
      prompt += "Let's work through this step-by-step:\n\n";
    }

    if (schema) {
      prompt += `\nFinal output must conform to this JSON schema:\n${
        typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      }\n`;
    }

    const systemPrompt = this.generateCoTSystemPrompt(options.explicitReasoning);

    return {
      strategy: 'cot',
      prompt,
      systemPrompt,
      metadata: {
        steps: steps.map((step, index) => ({
          step: index + 1,
          thought: step,
        })),
        expectedReasoning: steps,
      },
    };
  }

  /**
   * Generate Tree of Thoughts prompt
   */
  generateToTPrompt(
    task: string,
    schema?: GeneratedSchema | any,
    options: {
      branches?: number;
      depth?: number;
      evaluationCriteria?: string[];
    } = {}
  ): AdvancedPromptResult {
    const branches = options.branches || 3;
    const depth = options.depth || 3;
    const criteria = options.evaluationCriteria || this.inferEvaluationCriteria(task);

    let prompt = `${task}\n\n`;
    prompt += 'Explore multiple approaches to solving this problem:\n\n';
    
    prompt += `1. Generate ${branches} different initial approaches\n`;
    prompt += '2. For each approach, think through the implications\n';
    prompt += '3. Evaluate each path using these criteria:\n';
    criteria.forEach(criterion => {
      prompt += `   - ${criterion}\n`;
    });
    prompt += '4. Select the most promising path and develop it further\n';
    prompt += '5. Provide your final solution based on the best approach\n\n';

    if (schema) {
      prompt += `Final output must conform to this JSON schema:\n${
        typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      }\n`;
    }

    const systemPrompt = this.generateToTSystemPrompt();

    return {
      strategy: 'tot',
      prompt,
      systemPrompt,
      metadata: {
        tree: {
          root: {
            id: 'root',
            thought: task,
            children: [],
            depth: 0,
          },
          allPaths: [],
        },
      },
    };
  }

  /**
   * Generate self-consistency prompt for multiple outputs
   */
  generateSelfConsistencyPrompt(
    task: string,
    schema?: GeneratedSchema | any,
    options: {
      temperature?: number;
      variations?: number;
    } = {}
  ): AdvancedPromptResult[] {
    const variations = options.variations || 3;
    const baseTemp = options.temperature || 0.7;
    
    const prompts: AdvancedPromptResult[] = [];

    // Generate variations with different phrasings
    const phrasings = [
      task,
      this.rephraseTask(task, 'formal'),
      this.rephraseTask(task, 'detailed'),
    ];

    for (let i = 0; i < variations; i++) {
      const prompt = phrasings[i % phrasings.length];
      
      prompts.push({
        strategy: 'self-consistency',
        prompt: schema 
          ? `${prompt}\n\nProvide your response as JSON conforming to this schema:\n${
              typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
            }`
          : prompt,
        systemPrompt: 'You are a helpful assistant. Provide accurate and complete responses.',
        metadata: {},
      });
    }

    return prompts;
  }

  /**
   * Generate role-based prompt
   */
  generateRoleBasedPrompt(
    task: string,
    roleName: string,
    schema?: GeneratedSchema | any,
    customRole?: Partial<RoleDefinition>
  ): AdvancedPromptResult {
    const baseRole = this.roleLibrary.get(roleName);
    const role: RoleDefinition = baseRole 
      ? { ...baseRole, ...customRole }
      : this.createCustomRole(roleName, customRole);

    let prompt = `As ${role.description}, ${task}\n\n`;
    
    if (role.expertise.length > 0) {
      prompt += `Apply your expertise in: ${role.expertise.join(', ')}\n\n`;
    }

    if (role.constraints && role.constraints.length > 0) {
      prompt += 'Constraints:\n';
      role.constraints.forEach(constraint => {
        prompt += `- ${constraint}\n`;
      });
      prompt += '\n';
    }

    if (schema) {
      prompt += `Provide your response as JSON conforming to this schema:\n${
        typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      }\n`;
    }

    const systemPrompt = this.generateRoleSystemPrompt(role);

    return {
      strategy: 'role-based',
      prompt,
      systemPrompt,
      metadata: { role },
    };
  }

  /**
   * Analyze outputs for self-consistency
   */
  analyzeConsistency(outputs: any[]): ConsistencyResult {
    if (outputs.length === 0) {
      return {
        outputs: [],
        confidenceScore: 0,
        variations: [],
      };
    }

    // Find common structure
    const fields = this.extractCommonFields(outputs);
    const variations: ConsistencyResult['variations'] = [];

    fields.forEach(field => {
      const values = outputs.map(output => this.getNestedValue(output, field));
      const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))];
      
      if (uniqueValues.length > 1) {
        const consensus = this.findConsensus(values);
        variations.push({
          field,
          values: uniqueValues.map(v => JSON.parse(v)),
          consensus,
        });
      }
    });

    // Calculate consensus output
    const consensusOutput = this.buildConsensusOutput(outputs, variations);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConsistencyScore(outputs, variations);

    return {
      outputs,
      consensusOutput,
      confidenceScore,
      variations,
    };
  }

  /**
   * Combine strategies for maximum effectiveness
   */
  combineStrategies(
    task: string,
    strategies: PromptingStrategy[],
    schema?: GeneratedSchema | any
  ): AdvancedPromptResult {
    let combinedPrompt = task + '\n\n';
    let metadata: any = {};

    if (strategies.includes('cot')) {
      const cotResult = this.generateCoTPrompt(task, undefined, { structured: true });
      combinedPrompt += 'Step-by-step approach:\n' + cotResult.metadata.steps!
        .map(s => `${s.step}. ${s.thought}`)
        .join('\n') + '\n\n';
      metadata.steps = cotResult.metadata.steps;
    }

    if (strategies.includes('role-based')) {
      const role = this.selectBestRole(task);
      const roleResult = this.generateRoleBasedPrompt(task, role, undefined);
      metadata.role = roleResult.metadata.role;
    }

    if (schema) {
      combinedPrompt += `Final output must be JSON conforming to:\n${
        typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      }\n`;
    }

    return {
      strategy: 'standard', // Combined strategy
      prompt: combinedPrompt,
      systemPrompt: this.generateCombinedSystemPrompt(strategies, metadata.role),
      metadata,
    };
  }

  // Private helper methods

  private inferSteps(task: string): string[] {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('analyze')) {
      return this.thoughtPatterns.get('analysis') || [];
    } else if (taskLower.includes('solve') || taskLower.includes('fix')) {
      return this.thoughtPatterns.get('problem-solving') || [];
    } else if (taskLower.includes('classify') || taskLower.includes('categorize')) {
      return this.thoughtPatterns.get('classification') || [];
    } else if (taskLower.includes('generate') || taskLower.includes('create')) {
      return this.thoughtPatterns.get('generation') || [];
    }

    // Default steps
    return [
      'Understanding the requirements',
      'Planning the approach',
      'Executing the solution',
      'Validating the result',
    ];
  }

  private inferEvaluationCriteria(task: string): string[] {
    const taskLower = task.toLowerCase();
    const criteria: string[] = ['Correctness', 'Completeness'];

    if (taskLower.includes('efficient') || taskLower.includes('optimize')) {
      criteria.push('Efficiency');
    }
    if (taskLower.includes('secure') || taskLower.includes('safe')) {
      criteria.push('Security');
    }
    if (taskLower.includes('maintain') || taskLower.includes('scale')) {
      criteria.push('Maintainability');
    }
    if (taskLower.includes('user') || taskLower.includes('friendly')) {
      criteria.push('Usability');
    }

    return criteria;
  }

  private rephraseTask(task: string, style: 'formal' | 'detailed'): string {
    if (style === 'formal') {
      return `Please ${task.toLowerCase()}. Ensure accuracy and completeness in your response.`;
    } else {
      return `${task} Provide a comprehensive response covering all relevant aspects.`;
    }
  }

  private createCustomRole(name: string, custom?: Partial<RoleDefinition>): RoleDefinition {
    return {
      name,
      description: custom?.description || `A ${name} specialist`,
      expertise: custom?.expertise || [],
      traits: custom?.traits || ['professional', 'knowledgeable'],
      constraints: custom?.constraints,
    };
  }

  private selectBestRole(task: string): string {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('data') || taskLower.includes('analyze')) {
      return 'data-analyst';
    } else if (taskLower.includes('api') || taskLower.includes('endpoint')) {
      return 'api-designer';
    } else if (taskLower.includes('test') || taskLower.includes('validate')) {
      return 'quality-assurance';
    }
    
    return 'domain-expert';
  }

  private extractCommonFields(outputs: any[]): string[] {
    if (outputs.length === 0) return [];
    
    const fields = new Set<string>();
    
    const extractFields = (obj: any, prefix = ''): void => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        fields.add(path);
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          extractFields(obj[key], path);
        }
      });
    };
    
    outputs.forEach(output => extractFields(output));
    return Array.from(fields);
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private findConsensus(values: any[]): any {
    const valueCounts = new Map<string, number>();
    
    values.forEach(value => {
      const key = JSON.stringify(value);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    });
    
    let maxCount = 0;
    let consensus: any;
    
    valueCounts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        consensus = JSON.parse(key);
      }
    });
    
    return maxCount > values.length / 2 ? consensus : undefined;
  }

  private buildConsensusOutput(
    outputs: any[],
    variations: ConsistencyResult['variations']
  ): any {
    if (outputs.length === 0) return null;
    
    // Start with the first output as base
    const consensus = JSON.parse(JSON.stringify(outputs[0]));
    
    // Update fields with consensus values
    variations.forEach(variation => {
      if (variation.consensus !== undefined) {
        this.setNestedValue(consensus, variation.field, variation.consensus);
      }
    });
    
    return consensus;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  private calculateConsistencyScore(
    outputs: any[],
    variations: ConsistencyResult['variations']
  ): number {
    if (outputs.length <= 1) return 1.0;
    
    const totalFields = this.extractCommonFields(outputs).length;
    const inconsistentFields = variations.length;
    
    const consistencyRatio = 1 - (inconsistentFields / totalFields);
    
    // Weight by consensus strength
    let consensusStrength = 0;
    variations.forEach(variation => {
      if (variation.consensus !== undefined) {
        consensusStrength += 1;
      }
    });
    
    const consensusRatio = variations.length > 0 
      ? consensusStrength / variations.length 
      : 1;
    
    return (consistencyRatio * 0.7) + (consensusRatio * 0.3);
  }

  // System prompt generators

  private generateCoTSystemPrompt(explicitReasoning?: boolean): string {
    let prompt = 'You are an AI assistant that thinks step-by-step through problems.';
    
    if (explicitReasoning) {
      prompt += ' Always show your reasoning process explicitly, explaining why you make each decision.';
    }
    
    prompt += ' Break down complex tasks into manageable steps and work through them systematically.';
    
    return prompt;
  }

  private generateToTSystemPrompt(): string {
    return 'You are an AI assistant that explores multiple solution paths before selecting the best approach. ' +
           'Consider different perspectives, evaluate trade-offs, and justify your final choice based on clear criteria.';
  }

  private generateRoleSystemPrompt(role: RoleDefinition): string {
    let prompt = `You are ${role.description}.`;
    
    if (role.traits.length > 0) {
      prompt += ` You are ${role.traits.join(', ')}.`;
    }
    
    if (role.expertise.length > 0) {
      prompt += ` Your areas of expertise include ${role.expertise.join(', ')}.`;
    }
    
    prompt += ' Approach all tasks from this perspective, applying your specialized knowledge and experience.';
    
    return prompt;
  }

  private generateCombinedSystemPrompt(
    strategies: PromptingStrategy[],
    role?: RoleDefinition
  ): string {
    let prompt = 'You are an advanced AI assistant';
    
    if (role) {
      prompt += ` with the perspective of ${role.description}`;
    }
    
    prompt += '.';
    
    if (strategies.includes('cot')) {
      prompt += ' Think step-by-step through problems.';
    }
    
    if (strategies.includes('tot')) {
      prompt += ' Consider multiple approaches before deciding.';
    }
    
    prompt += ' Provide well-reasoned, comprehensive responses.';
    
    return prompt;
  }
}