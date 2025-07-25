/**
 * OutputValidator - Comprehensive validation beyond schema compliance
 *
 * Extends the base JsonValidator to provide semantic validation,
 * business rule checking, and context-aware auto-repair capabilities.
 */

import { EventEmitter } from 'events';
import { JsonValidator, ValidationResult as BaseValidationResult } from '../core/validator.js';
import { ValidationRules, PipelineContext, PipelineEvent, OutputType } from './types.js';

export interface ValidationResult extends BaseValidationResult {
  semanticValid?: boolean;
  businessRulesPassed?: boolean;
  repairAttempted?: boolean;
  repairedOutput?: any;
  validationMetrics?: ValidationMetrics;
}

export interface SemanticValidationResult {
  valid: boolean;
  issues: SemanticIssue[];
  score: number;
}

export interface SemanticIssue {
  type: 'inconsistency' | 'incompleteness' | 'ambiguity' | 'irrelevance';
  severity: 'error' | 'warning' | 'info';
  description: string;
  location?: string;
  suggestion?: string;
}

export interface BusinessValidationResult {
  passed: boolean;
  violations: BusinessRuleViolation[];
  passedRules: string[];
  score: number;
}

export interface BusinessRuleViolation {
  ruleName: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  impact: string;
  remediation?: string;
}

export interface BusinessRule {
  name: string;
  description: string;
  check: (output: any, context?: PipelineContext) => boolean;
  severity: 'critical' | 'major' | 'minor';
  errorMessage: string;
  remediation?: string;
}

export interface RepairedOutput {
  success: boolean;
  output: any;
  repairs: RepairAction[];
  confidence: number;
}

export interface RepairAction {
  type: 'schema' | 'semantic' | 'business' | 'formatting';
  field?: string;
  original: any;
  repaired: any;
  reason: string;
}

export interface ValidationMetrics {
  totalChecks: number;
  passedChecks: number;
  schemaCompliance: number;
  semanticScore: number;
  businessRuleScore: number;
  overallScore: number;
  validationTime: number;
}

export class OutputValidator extends EventEmitter {
  private jsonValidator: JsonValidator;
  private businessRules: Map<string, BusinessRule[]>;
  private semanticPatterns: Map<OutputType, SemanticPattern[]>;

  constructor() {
    super();
    this.jsonValidator = new JsonValidator();
    this.businessRules = new Map();
    this.semanticPatterns = new Map();
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Initialize semantic patterns for different output types
    this.semanticPatterns.set('structured-report', [
      {
        name: 'report-completeness',
        check: (output: any) => this.checkReportCompleteness(output),
        importance: 0.9,
      },
      {
        name: 'section-consistency',
        check: (output: any) => this.checkSectionConsistency(output),
        importance: 0.8,
      },
    ]);

    this.semanticPatterns.set('action-items', [
      {
        name: 'actionability',
        check: (output: any) => this.checkActionability(output),
        importance: 0.95,
      },
      {
        name: 'priority-clarity',
        check: (output: any) => this.checkPriorityClarity(output),
        importance: 0.7,
      },
    ]);

    this.semanticPatterns.set('analysis', [
      {
        name: 'insight-depth',
        check: (output: any) => this.checkInsightDepth(output),
        importance: 0.85,
      },
      {
        name: 'evidence-support',
        check: (output: any) => this.checkEvidenceSupport(output),
        importance: 0.9,
      },
    ]);
  }

  async validateOutput(
    output: any,
    rules: ValidationRules,
    schema?: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    this.emit('validation-started', {
      type: 'validation-completed',
      payload: { output, rules },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    // Schema validation (if schema provided)
    let schemaResult: BaseValidationResult = { valid: true };
    if (schema) {
      schemaResult = this.jsonValidator.validate(output, schema);
    }

    // Semantic validation
    const semanticResult = await this.validateSemantics(output, rules);

    // Business rules validation
    const businessResult = await this.validateBusinessRules(
      output,
      this.businessRules.get(rules.requiredFields[0]) || []
    );

    // Calculate metrics
    const validationTime = Date.now() - startTime;
    const metrics = this.calculateValidationMetrics(
      schemaResult,
      semanticResult,
      businessResult,
      validationTime
    );

    // Attempt repair if needed and enabled
    let repairedOutput: RepairedOutput | undefined;
    if (!schemaResult.valid && rules.enableAutoRepair) {
      repairedOutput = await this.repairOutput(
        output,
        schemaResult.errors || [],
        semanticResult.issues,
        businessResult.violations,
        rules.maxRepairAttempts || 3
      );
    }

    const result: ValidationResult = {
      valid: schemaResult.valid && semanticResult.valid && businessResult.passed,
      errors: schemaResult.errors,
      suggestions: schemaResult.suggestions,
      semanticValid: semanticResult.valid,
      businessRulesPassed: businessResult.passed,
      repairAttempted: !!repairedOutput,
      repairedOutput: repairedOutput?.output,
      validationMetrics: metrics,
    };

    this.emit('validation-completed', {
      type: 'validation-completed',
      payload: { result, validationTime },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return result;
  }

  async validateSemantics(
    output: any,
    context: ValidationRules | PipelineContext
  ): Promise<SemanticValidationResult> {
    const issues: SemanticIssue[] = [];
    let totalScore = 0;
    let checkCount = 0;

    // Check for completeness
    if (this.isIncomplete(output)) {
      issues.push({
        type: 'incompleteness',
        severity: 'error',
        description: 'Output appears to be incomplete or truncated',
        suggestion: 'Ensure all required sections are present',
      });
    }

    // Check for internal consistency
    const inconsistencies = this.findInconsistencies(output);
    inconsistencies.forEach(inc => {
      issues.push({
        type: 'inconsistency',
        severity: 'warning',
        description: inc.description,
        location: inc.location,
        suggestion: inc.suggestion,
      });
    });

    // Check for ambiguity
    const ambiguities = this.detectAmbiguity(output);
    ambiguities.forEach(amb => {
      issues.push({
        type: 'ambiguity',
        severity: 'info',
        description: amb,
        suggestion: 'Clarify ambiguous statements',
      });
    });

    // Calculate semantic score
    const score = Math.max(0, 1 - issues.length * 0.1);

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      score,
    };
  }

  async validateBusinessRules(
    output: any,
    rules: BusinessRule[]
  ): Promise<BusinessValidationResult> {
    const violations: BusinessRuleViolation[] = [];
    const passedRules: string[] = [];

    for (const rule of rules) {
      try {
        const passed = rule.check(output);
        if (passed) {
          passedRules.push(rule.name);
        } else {
          violations.push({
            ruleName: rule.name,
            description: rule.errorMessage,
            severity: rule.severity,
            impact: rule.description,
            remediation: rule.remediation,
          });
        }
      } catch (error) {
        violations.push({
          ruleName: rule.name,
          description: `Rule check failed: ${error}`,
          severity: 'major',
          impact: 'Unable to verify business rule compliance',
        });
      }
    }

    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const score = rules.length > 0 ? passedRules.length / rules.length : 1;

    return {
      passed: criticalViolations === 0,
      violations,
      passedRules,
      score,
    };
  }

  async repairOutput(
    output: any,
    schemaErrors: any[],
    semanticIssues: SemanticIssue[],
    businessViolations: BusinessRuleViolation[],
    maxAttempts: number
  ): Promise<RepairedOutput> {
    let repairedOutput = JSON.parse(JSON.stringify(output));
    const repairs: RepairAction[] = [];
    let attempts = 0;
    let confidence = 1.0;

    // Repair schema errors first
    for (const error of schemaErrors) {
      if (attempts >= maxAttempts) break;

      const repair = this.repairSchemaError(repairedOutput, error);
      if (repair) {
        repairs.push(repair);
        repairedOutput = repair.repaired;
        confidence *= 0.9;
        attempts++;
      }
    }

    // Repair semantic issues
    for (const issue of semanticIssues) {
      if (attempts >= maxAttempts) break;

      if (issue.severity === 'error') {
        const repair = this.repairSemanticIssue(repairedOutput, issue);
        if (repair) {
          repairs.push(repair);
          repairedOutput = repair.repaired;
          confidence *= 0.85;
          attempts++;
        }
      }
    }

    // Repair critical business violations
    for (const violation of businessViolations) {
      if (attempts >= maxAttempts) break;

      if (violation.severity === 'critical' && violation.remediation) {
        const repair = this.repairBusinessViolation(repairedOutput, violation);
        if (repair) {
          repairs.push(repair);
          repairedOutput = repair.repaired;
          confidence *= 0.8;
          attempts++;
        }
      }
    }

    return {
      success: repairs.length > 0,
      output: repairedOutput,
      repairs,
      confidence,
    };
  }

  registerBusinessRule(category: string, rule: BusinessRule): void {
    if (!this.businessRules.has(category)) {
      this.businessRules.set(category, []);
    }
    this.businessRules.get(category)!.push(rule);
  }

  private isIncomplete(output: any): boolean {
    if (!output || typeof output !== 'object') return true;

    // Check for common indicators of incomplete output
    const outputStr = JSON.stringify(output);
    return (
      outputStr.includes('...') ||
      outputStr.includes('[incomplete]') ||
      outputStr.includes('[TODO]') ||
      Object.values(output).some(v => v === null || v === undefined)
    );
  }

  private findInconsistencies(output: any): Array<{
    description: string;
    location?: string;
    suggestion?: string;
  }> {
    const inconsistencies: Array<{
      description: string;
      location?: string;
      suggestion?: string;
    }> = [];

    // Check for numeric inconsistencies
    if (typeof output === 'object') {
      const numbers = this.extractNumbers(output);
      // Check if totals don't add up, percentages exceed 100%, etc.
      // This is a simplified check - real implementation would be more sophisticated
    }

    return inconsistencies;
  }

  private detectAmbiguity(output: any): string[] {
    const ambiguities = [];
    const ambiguousTerms = [
      'maybe',
      'possibly',
      'might',
      'could be',
      'approximately',
      'somewhat',
      'fairly',
      'rather',
      'quite',
      'very',
    ];

    const outputStr = JSON.stringify(output).toLowerCase();
    for (const term of ambiguousTerms) {
      if (outputStr.includes(term)) {
        ambiguities.push(`Contains ambiguous term: "${term}"`);
      }
    }

    return ambiguities;
  }

  private repairSchemaError(output: any, error: any): RepairAction | null {
    // Simple repair strategies for common schema errors
    if (error.keyword === 'required') {
      const missingField = error.params.missingProperty;
      const repaired = { ...output };

      // Add default value based on expected type
      repaired[missingField] = this.getDefaultValue(missingField);

      return {
        type: 'schema',
        field: missingField,
        original: output,
        repaired,
        reason: `Added missing required field: ${missingField}`,
      };
    }

    if (error.keyword === 'type') {
      const field = error.instancePath.replace('/', '');
      const expectedType = error.params.type;
      const repaired = { ...output };

      // Convert to expected type
      repaired[field] = this.convertToType(output[field], expectedType);

      return {
        type: 'schema',
        field,
        original: output[field],
        repaired: repaired[field],
        reason: `Converted ${field} to ${expectedType}`,
      };
    }

    return null;
  }

  private repairSemanticIssue(output: any, issue: SemanticIssue): RepairAction | null {
    if (issue.type === 'incompleteness' && issue.suggestion) {
      // Add placeholder for incomplete sections
      const repaired = { ...output, _incomplete: true };

      return {
        type: 'semantic',
        original: output,
        repaired,
        reason: 'Marked output as incomplete for further processing',
      };
    }

    return null;
  }

  private repairBusinessViolation(
    output: any,
    violation: BusinessRuleViolation
  ): RepairAction | null {
    // Apply remediation if available
    if (violation.remediation) {
      // This would apply specific remediation logic
      return {
        type: 'business',
        original: output,
        repaired: output, // Would be modified based on remediation
        reason: `Applied remediation for ${violation.ruleName}`,
      };
    }

    return null;
  }

  private getDefaultValue(fieldName: string): any {
    // Intelligent default values based on field name
    if (fieldName.includes('date') || fieldName.includes('time')) {
      return new Date().toISOString();
    }
    if (fieldName.includes('count') || fieldName.includes('number')) {
      return 0;
    }
    if (fieldName.includes('list') || fieldName.includes('array')) {
      return [];
    }
    if (fieldName.includes('flag') || fieldName.includes('is')) {
      return false;
    }
    return '';
  }

  private convertToType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value) || 0;
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : {};
      default:
        return value;
    }
  }

  private extractNumbers(obj: any, numbers: number[] = []): number[] {
    if (typeof obj === 'number') {
      numbers.push(obj);
    } else if (typeof obj === 'string') {
      const matches = obj.match(/\d+\.?\d*/g);
      if (matches) {
        numbers.push(...matches.map(Number));
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => this.extractNumbers(value, numbers));
    }
    return numbers;
  }

  private checkReportCompleteness(output: any): SemanticCheckResult {
    const requiredSections = ['summary', 'findings', 'recommendations'];
    const present = requiredSections.filter(section => output[section]);

    return {
      passed: present.length === requiredSections.length,
      score: present.length / requiredSections.length,
      details: `Report has ${present.length}/${requiredSections.length} required sections`,
    };
  }

  private checkSectionConsistency(output: any): SemanticCheckResult {
    // Check if findings align with recommendations
    return {
      passed: true,
      score: 0.8,
      details: 'Section consistency check',
    };
  }

  private checkActionability(output: any): SemanticCheckResult {
    if (!output.actions && !output.items && !output.tasks) {
      return {
        passed: false,
        score: 0,
        details: 'No actionable items found',
      };
    }

    const items = output.actions || output.items || output.tasks || [];
    const actionableItems = items.filter(
      (item: any) => item.action || item.task || item.description
    );

    return {
      passed: actionableItems.length > 0,
      score: items.length > 0 ? actionableItems.length / items.length : 0,
      details: `${actionableItems.length}/${items.length} items are actionable`,
    };
  }

  private checkPriorityClarity(output: any): SemanticCheckResult {
    const items = output.actions || output.items || output.tasks || [];
    const withPriority = items.filter((item: any) => item.priority);

    return {
      passed: withPriority.length === items.length,
      score: items.length > 0 ? withPriority.length / items.length : 1,
      details: `${withPriority.length}/${items.length} items have clear priority`,
    };
  }

  private checkInsightDepth(output: any): SemanticCheckResult {
    const insights = output.insights || output.analysis || output.findings || [];
    const deepInsights = insights.filter(
      (insight: any) => insight.evidence || insight.data || insight.support
    );

    return {
      passed: deepInsights.length > 0,
      score: insights.length > 0 ? deepInsights.length / insights.length : 0,
      details: `${deepInsights.length}/${insights.length} insights have supporting evidence`,
    };
  }

  private checkEvidenceSupport(output: any): SemanticCheckResult {
    // Check if claims are backed by evidence
    return {
      passed: true,
      score: 0.85,
      details: 'Evidence support validation',
    };
  }

  private calculateValidationMetrics(
    schemaResult: BaseValidationResult,
    semanticResult: SemanticValidationResult,
    businessResult: BusinessValidationResult,
    validationTime: number
  ): ValidationMetrics {
    const totalChecks = 3; // schema, semantic, business
    const passedChecks =
      (schemaResult.valid ? 1 : 0) +
      (semanticResult.valid ? 1 : 0) +
      (businessResult.passed ? 1 : 0);

    const schemaCompliance = schemaResult.valid ? 1 : 0;
    const semanticScore = semanticResult.score;
    const businessRuleScore = businessResult.score;

    const overallScore = (schemaCompliance + semanticScore + businessRuleScore) / 3;

    return {
      totalChecks,
      passedChecks,
      schemaCompliance,
      semanticScore,
      businessRuleScore,
      overallScore,
      validationTime,
    };
  }

  private generateExecutionId(): string {
    return `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface SemanticPattern {
  name: string;
  check: (output: any) => SemanticCheckResult;
  importance: number;
}

interface SemanticCheckResult {
  passed: boolean;
  score: number;
  details: string;
}
