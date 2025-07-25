import AjvModule from 'ajv';
import type { ErrorObject } from 'ajv';
import { GeneratedSchema } from './schemaGenerator.js';

// Handle both CommonJS and ES module exports
const Ajv = (AjvModule as any).default || AjvModule;

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  suggestions?: string[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params: any;
}

export class JsonValidator {
  private ajv: any;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      addUsedSchema: false,
    });
  }

  validate(data: any, schema: GeneratedSchema | any): ValidationResult {
    try {
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      const valid = this.ajv.validate(schema, jsonData);

      if (valid) {
        return { valid: true };
      }

      const errors = this.formatErrors(this.ajv.errors || []);
      const suggestions = this.generateSuggestions(errors, schema, jsonData);

      return {
        valid: false,
        errors,
        suggestions,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: 'Invalid JSON syntax',
              keyword: 'parse',
              params: { error: error.message },
            },
          ],
          suggestions: [
            'Ensure your response is valid JSON format',
            'Check for missing quotes, commas, or brackets',
          ],
        };
      }
      throw error;
    }
  }

  private formatErrors(ajvErrors: ErrorObject[]): ValidationError[] {
    return ajvErrors.map(error => ({
      path: error.instancePath || '/',
      message: error.message || 'Validation error',
      keyword: error.keyword,
      params: error.params,
    }));
  }

  private generateSuggestions(errors: ValidationError[], schema: any, data: any): string[] {
    const suggestions: string[] = [];

    errors.forEach(error => {
      switch (error.keyword) {
        case 'required':
          suggestions.push(`Add missing required field: ${error.params.missingProperty}`);
          break;

        case 'enum':
          suggestions.push(
            `Change value at ${error.path} to one of: ${error.params.allowedValues.join(', ')}`
          );
          break;

        case 'type':
          suggestions.push(`Change ${error.path} from ${typeof data} to ${error.params.type}`);
          break;

        case 'minLength':
          suggestions.push(
            `Increase length of ${error.path} to at least ${error.params.limit} characters`
          );
          break;

        case 'maxLength':
          suggestions.push(
            `Reduce length of ${error.path} to at most ${error.params.limit} characters`
          );
          break;

        case 'minimum':
        case 'maximum':
          suggestions.push(
            `Adjust value at ${error.path} to be ${error.keyword === 'minimum' ? 'at least' : 'at most'} ${error.params.limit}`
          );
          break;

        case 'additionalProperties':
          suggestions.push(`Remove unexpected property: ${error.params.additionalProperty}`);
          break;

        case 'pattern':
          suggestions.push(
            `Ensure ${error.path} matches the required pattern: ${error.params.pattern}`
          );
          break;
      }
    });

    return suggestions;
  }

  repairJson(invalidJson: string): string | null {
    try {
      // First try to parse as-is
      JSON.parse(invalidJson);
      return invalidJson;
    } catch {
      // Continue with repair attempts
    }

    try {
      // Common JSON errors and fixes
      let repaired = invalidJson
        // Fix missing quotes around keys (but not inside already quoted strings)
        .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
        // Fix single quotes to double quotes (but not inside already double-quoted strings)
        .replace(/'/g, '"')
        // Remove trailing commas
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        // Add missing closing brackets
        .trim();

      // Count brackets to detect missing ones
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/]/g) || []).length;

      // Add missing closing brackets
      repaired += '}'.repeat(Math.max(0, openBraces - closeBraces));
      repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

      // Validate the repaired JSON
      JSON.parse(repaired);
      return repaired;
    } catch {
      return null;
    }
  }

  generateRecoveryPrompt(
    originalPrompt: string,
    invalidResponse: string,
    validationResult: ValidationResult,
    schema: any
  ): string {
    const errorSummary = validationResult.errors
      ?.map(err => `- ${err.message} at ${err.path}`)
      .join('\n');

    const suggestionList = validationResult.suggestions?.map(sug => `- ${sug}`).join('\n');

    return `The previous JSON generation attempt failed validation.

Original request:
${originalPrompt}

Validation errors:
${errorSummary}

Suggestions to fix:
${suggestionList}

Schema:
${JSON.stringify(schema, null, 2)}

Please generate a corrected JSON response that:
1. Fixes all validation errors
2. Strictly follows the schema
3. Maintains the intent of the original request

Return only the corrected JSON object.`;
  }
}
