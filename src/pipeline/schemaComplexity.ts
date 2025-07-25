/**
 * Schema Complexity Analyzer
 *
 * Analyzes JSON schemas to determine their complexity level,
 * which helps in cost estimation and execution planning.
 */

export type SchemaComplexity = 'simple' | 'medium' | 'complex';

export interface ComplexityFactors {
  depth: number;
  fieldCount: number;
  arrayCount: number;
  nestedObjectCount: number;
  constraintCount: number;
  enumCount: number;
  patternCount: number;
  conditionalCount: number;
}

export class SchemaComplexityAnalyzer {
  /**
   * Analyze a JSON schema and return its complexity level
   */
  analyze(schema: any): SchemaComplexity {
    const factors = this.calculateComplexityFactors(schema);
    return this.determineComplexityLevel(factors);
  }

  /**
   * Get detailed complexity analysis
   */
  analyzeDetailed(schema: any): {
    complexity: SchemaComplexity;
    factors: ComplexityFactors;
    score: number;
    recommendations: string[];
  } {
    const factors = this.calculateComplexityFactors(schema);
    const complexity = this.determineComplexityLevel(factors);
    const score = this.calculateComplexityScore(factors);
    const recommendations = this.generateRecommendations(factors, complexity);

    return {
      complexity,
      factors,
      score,
      recommendations,
    };
  }

  /**
   * Calculate complexity factors from schema
   */
  private calculateComplexityFactors(schema: any, depth = 0): ComplexityFactors {
    const factors: ComplexityFactors = {
      depth: 0,
      fieldCount: 0,
      arrayCount: 0,
      nestedObjectCount: 0,
      constraintCount: 0,
      enumCount: 0,
      patternCount: 0,
      conditionalCount: 0,
    };

    this.traverseSchema(schema, factors, depth);
    return factors;
  }

  /**
   * Recursively traverse schema to collect complexity factors
   */
  private traverseSchema(schema: any, factors: ComplexityFactors, currentDepth: number): void {
    if (!schema || typeof schema !== 'object') return;

    // Update max depth
    factors.depth = Math.max(factors.depth, currentDepth);

    // Count schema type
    if (schema.type === 'array') {
      factors.arrayCount++;
      if (schema.items) {
        this.traverseSchema(schema.items, factors, currentDepth + 1);
      }
    } else if (schema.type === 'object') {
      if (currentDepth > 0) {
        factors.nestedObjectCount++;
      }

      if (schema.properties) {
        const propertyCount = Object.keys(schema.properties).length;
        factors.fieldCount += propertyCount;

        Object.values(schema.properties).forEach(prop => {
          this.traverseSchema(prop, factors, currentDepth + 1);
        });
      }
    }

    // Count constraints
    if (schema.minimum !== undefined || schema.maximum !== undefined) factors.constraintCount++;
    if (schema.minLength !== undefined || schema.maxLength !== undefined) factors.constraintCount++;
    if (schema.minItems !== undefined || schema.maxItems !== undefined) factors.constraintCount++;
    if (schema.required && Array.isArray(schema.required)) {
      factors.constraintCount += schema.required.length;
    }
    if (schema.enum) {
      factors.enumCount++;
      factors.constraintCount++;
    }
    if (schema.pattern) {
      factors.patternCount++;
      factors.constraintCount++;
    }
    if (schema.if || schema.then || schema.else || schema.oneOf || schema.anyOf || schema.allOf) {
      factors.conditionalCount++;
    }

    // Handle composition schemas
    ['oneOf', 'anyOf', 'allOf'].forEach(keyword => {
      if (schema[keyword] && Array.isArray(schema[keyword])) {
        schema[keyword].forEach((subSchema: any) => {
          this.traverseSchema(subSchema, factors, currentDepth);
        });
      }
    });
  }

  /**
   * Determine complexity level based on factors
   */
  private determineComplexityLevel(factors: ComplexityFactors): SchemaComplexity {
    const score = this.calculateComplexityScore(factors);

    if (score <= 10) return 'simple';
    if (score <= 25) return 'medium';
    return 'complex';
  }

  /**
   * Calculate numerical complexity score
   */
  private calculateComplexityScore(factors: ComplexityFactors): number {
    return (
      factors.depth * 3 +
      factors.fieldCount * 1 +
      factors.arrayCount * 2 +
      factors.nestedObjectCount * 3 +
      factors.constraintCount * 1.5 +
      factors.enumCount * 1 +
      factors.patternCount * 2 +
      factors.conditionalCount * 4
    );
  }

  /**
   * Generate recommendations based on complexity
   */
  private generateRecommendations(
    factors: ComplexityFactors,
    complexity: SchemaComplexity
  ): string[] {
    const recommendations: string[] = [];

    if (complexity === 'complex') {
      recommendations.push('Consider breaking down the schema into smaller, focused schemas');

      if (factors.depth > 4) {
        recommendations.push('Deep nesting detected - consider flattening the structure');
      }

      if (factors.conditionalCount > 2) {
        recommendations.push('Multiple conditional schemas - consider simplifying logic');
      }

      if (factors.fieldCount > 20) {
        recommendations.push('High field count - consider grouping related fields');
      }
    }

    if (complexity === 'medium' && factors.arrayCount > 3) {
      recommendations.push('Multiple arrays detected - ensure clear item schemas');
    }

    if (factors.patternCount > 2) {
      recommendations.push('Multiple regex patterns - consider using enums where possible');
    }

    return recommendations;
  }

  /**
   * Estimate token usage based on schema complexity
   */
  estimateTokenUsage(
    schema: any,
    includeExamples: boolean = false
  ): {
    schemaTokens: number;
    exampleTokens: number;
    totalTokens: number;
  } {
    const factors = this.calculateComplexityFactors(schema);

    // Base estimation
    let schemaTokens = 50; // Base tokens for structure
    schemaTokens += factors.fieldCount * 10;
    schemaTokens += factors.constraintCount * 5;
    schemaTokens += factors.depth * 20;

    let exampleTokens = 0;
    if (includeExamples) {
      exampleTokens = factors.fieldCount * 15;
      exampleTokens += factors.arrayCount * 30;
      exampleTokens += factors.nestedObjectCount * 25;
    }

    return {
      schemaTokens,
      exampleTokens,
      totalTokens: schemaTokens + exampleTokens,
    };
  }
}
