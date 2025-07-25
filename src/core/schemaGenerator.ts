import { z } from 'zod';

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  items?: SchemaField;
  properties?: SchemaField[];
}

export interface GeneratedSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties: boolean;
}

export class SchemaGenerator {
  private typePatterns = {
    string: /\b(text|string|name|title|description|content|message|id|url|email|address)\b/i,
    number: /\b(number|count|amount|score|rating|price|age|quantity|total|percentage)\b/i,
    boolean: /\b(is|has|can|should|will|enabled|disabled|active|verified|completed)\b/i,
    array: /\b(list|array|items|collection|multiple|several)\b/i,
    object: /\b(object|details|info|data|metadata|properties)\b/i,
    date: /\b(date|time|timestamp|datetime|created|updated|modified)\b/i,
  };

  private constraintPatterns = {
    required: /\b(required|mandatory|must have|needed|both required)\b/i,
    optional: /\b(optional|may have|can have)\b/i,
    minLength: /\b(at least|minimum) (\d+) (characters?|chars?)\b/i,
    maxLength: /\b(at most|maximum|up to) (\d+) (characters?|chars?)\b/i,
    enum: /\b(one of|choose from|options?|choices?|can be)[:\s]+([^.]+)/i,
  };

  generateFromDescription(description: string): GeneratedSchema {
    const fields = this.extractFields(description);
    const schema: GeneratedSchema = {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    };

    fields.forEach(field => {
      const jsonSchemaField = this.convertToJsonSchema(field);
      schema.properties[field.name] = jsonSchemaField;
      if (field.required && schema.required) {
        schema.required.push(field.name);
      }
    });

    // If no specific fields were found, allow additional properties
    if (Object.keys(schema.properties).length === 0) {
      schema.additionalProperties = true;
    }

    return schema;
  }

  private extractFields(description: string): SchemaField[] {
    const fields: SchemaField[] = [];

    // Try multiple patterns to extract fields
    const patterns = [
      // "A name field and an age field"
      /\b(\w+)\s+(?:field|property|attribute)/gi,
      // "username (string), age (number)"
      /\b(\w+)\s*\(([^)]+)\)/gi,
      // "name, email, and age"
      /(?:^|,|\band\b)\s*(?:a |an |the )?(\w+)(?=\s*(?:\(|,|and|$|field|that|which))/gi,
    ];

    const descLower = description.toLowerCase();

    // First check for enum patterns and exclude those values from field extraction
    const enumPattern = /(?:can be|one of:?)\s+([^.]+)/gi;
    const enumMatches = [...description.matchAll(enumPattern)];
    const enumValues = new Set();
    enumMatches.forEach(match => {
      const values = match[1].split(/,|or/).map(v => v.trim().toLowerCase());
      values.forEach(v => enumValues.add(v));
    });

    patterns.forEach((pattern, index) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(description)) !== null) {
        const fieldName = this.camelCase(match[1]);

        // Skip if this looks like an enum value
        if (enumValues.has(match[1].toLowerCase())) {
          continue;
        }

        if (!fields.find(f => f.name === fieldName)) {
          // Extract the context around the field name for better type inference
          const fieldContext = description.slice(
            Math.max(0, match.index - 20),
            match.index + match[0].length + 30
          );

          // For pattern with type hints in parentheses
          let explicitType: SchemaField['type'] | undefined;
          if (index === 1 && match[2]) {
            const typeHint = match[2].toLowerCase().trim();
            if (typeHint.includes('string')) explicitType = 'string';
            else if (typeHint.includes('number') || typeHint.includes('int'))
              explicitType = 'number';
            else if (typeHint.includes('bool')) explicitType = 'boolean';
            else if (typeHint.includes('array') || typeHint.includes('list'))
              explicitType = 'array';
            else if (typeHint.includes('object')) explicitType = 'object';
          }

          const field: SchemaField = {
            name: fieldName,
            type: explicitType || this.inferType(fieldContext + ' ' + fieldName),
            required: false, // Will be set later based on full context
          };

          // Get full context for constraint extraction
          const fullFieldContext = description.slice(
            Math.max(0, description.toLowerCase().indexOf(match[1].toLowerCase()) - 50),
            Math.min(
              description.length,
              description.toLowerCase().indexOf(match[1].toLowerCase()) + match[1].length + 100
            )
          );
          this.extractConstraints(fullFieldContext, field);
          fields.push(field);
        }
      }
    });

    if (fields.length === 0) {
      fields.push(...this.inferFieldsFromContext(description));
    }

    return fields;
  }

  private inferType(text: string): SchemaField['type'] {
    // Check for date pattern first, but return 'string' type
    if (this.typePatterns.date.test(text)) {
      return 'string';
    }

    for (const [type, pattern] of Object.entries(this.typePatterns)) {
      if (type !== 'date' && pattern.test(text)) {
        return type as SchemaField['type'];
      }
    }
    return 'string';
  }

  private isRequired(text: string): boolean {
    return this.constraintPatterns.required.test(text);
  }

  private extractConstraints(text: string, field: SchemaField): void {
    const fullText = text;

    // Check if field is required
    if (this.constraintPatterns.required.test(text)) {
      field.required = true;
    }

    const minLengthMatch = text.match(this.constraintPatterns.minLength);
    if (minLengthMatch) {
      field.minLength = parseInt(minLengthMatch[2]);
    }

    const maxLengthMatch = text.match(this.constraintPatterns.maxLength);
    if (maxLengthMatch) {
      field.maxLength = parseInt(maxLengthMatch[2]);
    }

    // Check for enum values - improved pattern
    const simpleEnumMatch =
      text.match(/can be one of:\s*([^.]+)/i) ||
      text.match(/(?:that )?(?:can be|one of:?)\s+([^.]+)/i);
    if (simpleEnumMatch) {
      const enumStr = simpleEnumMatch[1];
      const options = enumStr
        .split(/,|\s+or\s+/)
        .map(opt =>
          opt
            .trim()
            .replace(/['"]/g, '')
            .replace(/^\s*and\s+/, '')
        )
        .filter(opt => opt.length > 0 && opt.length < 50 && !opt.includes(' '));
      if (options.length > 0 && options.length < 20) {
        field.enum = options;
      }
    } else {
      // Try the complex pattern as fallback
      const enumMatch = text.match(this.constraintPatterns.enum);
      if (enumMatch && enumMatch[2]) {
        const enumStr = enumMatch[2];
        const options = enumStr
          .split(/,|\s+or\s+/)
          .map(opt =>
            opt
              .trim()
              .replace(/['"]/g, '')
              .replace(/^\s*and\s+/, '')
          )
          .filter(opt => opt.length > 0 && opt.length < 50 && !opt.includes(' '));
        if (options.length > 0 && options.length < 20) {
          field.enum = options;
        }
      }
    }

    if (text.includes('@') || field.name.toLowerCase().includes('email')) {
      field.pattern = '^[\\w.-]+@[\\w.-]+\\.\\w+$';
    }

    // Set format for date fields
    if (this.typePatterns.date.test(text)) {
      field.format = 'date-time';
    }
  }

  private inferFieldsFromContext(description: string): SchemaField[] {
    const fields: SchemaField[] = [];
    const commonPatterns = [
      { pattern: /user\s+information/i, fields: ['name', 'email', 'phone'] },
      { pattern: /sentiment\s+analysis/i, fields: ['sentiment', 'confidence', 'explanation'] },
      { pattern: /classification/i, fields: ['category', 'subcategories', 'confidence'] },
      { pattern: /extraction/i, fields: ['entities', 'relationships', 'summary'] },
    ];

    for (const { pattern, fields: fieldNames } of commonPatterns) {
      if (pattern.test(description)) {
        fieldNames.forEach(name => {
          fields.push({
            name,
            type: this.inferType(name),
            required: true,
          });
        });
        break;
      }
    }

    return fields;
  }

  private convertToJsonSchema(field: SchemaField): any {
    const schema: any = {
      type: field.type,
      description: field.description,
    };

    if (field.enum) {
      schema.enum = field.enum;
      // If we have enum values, the type should be string (unless explicitly set otherwise)
      if (field.type === 'boolean' && field.enum.length > 0) {
        schema.type = 'string';
      }
    }

    if (field.type === 'string') {
      if (field.minLength) schema.minLength = field.minLength;
      if (field.maxLength) schema.maxLength = field.maxLength;
      if (field.pattern) schema.pattern = field.pattern;
      if (field.format) schema.format = field.format;
    }

    if (field.type === 'number') {
      if (field.minimum !== undefined) schema.minimum = field.minimum;
      if (field.maximum !== undefined) schema.maximum = field.maximum;
    }

    if (field.type === 'array' && field.items) {
      schema.items = this.convertToJsonSchema(field.items);
    }

    if (field.type === 'object' && field.properties) {
      schema.properties = {};
      schema.required = [];
      field.properties.forEach(prop => {
        schema.properties[prop.name] = this.convertToJsonSchema(prop);
        if (prop.required) {
          schema.required.push(prop.name);
        }
      });
      schema.additionalProperties = false;
    }

    return schema;
  }

  private camelCase(str: string): string {
    // If already camelCase or contains uppercase, preserve it
    if (/[A-Z]/.test(str) && !/[^a-zA-Z0-9]/.test(str)) {
      // Ensure first letter is lowercase for camelCase
      return str.charAt(0).toLowerCase() + str.slice(1);
    }

    // Otherwise convert to camelCase
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}
