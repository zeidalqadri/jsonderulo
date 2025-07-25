export function parseJsonSafe(json: string): any | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function formatJson(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, null, indent);
}

export function extractJsonFromText(text: string): string | null {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  return null;
}

export function mergeSchemas(schema1: any, schema2: any): any {
  const merged = { ...schema1 };

  if (schema2.properties) {
    merged.properties = { ...merged.properties, ...schema2.properties };
  }

  if (schema2.required) {
    merged.required = [...new Set([...(merged.required || []), ...schema2.required])];
  }

  return merged;
}

export function generateExampleValue(type: string, constraints?: any): any {
  switch (type) {
    case 'string':
      if (constraints?.enum) return constraints.enum[0];
      if (constraints?.pattern?.includes('@')) return 'example@email.com';
      if (constraints?.minLength) return 'a'.repeat(constraints.minLength);
      return 'example';

    case 'number':
      if (constraints?.minimum !== undefined) return constraints.minimum;
      if (constraints?.maximum !== undefined) return constraints.maximum;
      return 0;

    case 'boolean':
      return true;

    case 'array':
      return [];

    case 'object':
      return {};

    default:
      return null;
  }
}
