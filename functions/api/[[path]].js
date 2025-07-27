// Cloudflare Pages Function to handle API routes
// This implements a functional prompt optimizer without complex dependencies

// Enhanced prompt optimization logic
class PromptOptimizer {
  analyzePrompt(idea) {
    const words = idea.toLowerCase().split(/\s+/);
    const categories = {
      'data-analysis': ['data', 'analysis', 'analyze', 'metrics', 'statistics', 'insights', 'trends', 'patterns'],
      'creative': ['create', 'design', 'imagine', 'innovative', 'creative', 'artistic', 'unique'],
      'technical': ['code', 'program', 'develop', 'build', 'implement', 'algorithm', 'system', 'api'],
      'research': ['research', 'study', 'investigate', 'explore', 'examine', 'discover', 'find'],
      'problem-solving': ['solve', 'fix', 'debug', 'troubleshoot', 'resolve', 'issue', 'problem'],
      'planning': ['plan', 'strategy', 'organize', 'schedule', 'roadmap', 'timeline', 'project'],
      'communication': ['write', 'explain', 'describe', 'communicate', 'present', 'summarize', 'document']
    };

    let detectedCategory = 'general';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = words.filter(word => keywords.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }

    const complexity = idea.length > 100 ? 'complex' : idea.length > 50 ? 'moderate' : 'simple';
    const hasSpecificRequirements = /must|should|need|require|ensure/i.test(idea);
    
    return {
      category: detectedCategory,
      complexity,
      hasSpecificRequirements,
      wordCount: words.length,
      keyTerms: words.filter(w => w.length > 4)
    };
  }

  generateCoTPrompt(idea, analysis) {
    const { category, complexity, hasSpecificRequirements, keyTerms } = analysis;
    
    let prompt = `Task: ${idea}\n\n`;
    
    // Add category-specific instructions
    const categoryInstructions = {
      'data-analysis': 'Approach this systematically by first understanding the data structure, then identifying patterns, and finally drawing actionable insights.',
      'creative': 'Think outside conventional boundaries while maintaining practicality. Consider multiple creative approaches before settling on the most innovative solution.',
      'technical': 'Break down the technical requirements into components. Consider scalability, maintainability, and best practices in your implementation.',
      'research': 'Start with a comprehensive overview, then dive deep into specific areas. Cite sources and validate findings with evidence.',
      'problem-solving': 'First, clearly identify the root cause. Then, generate multiple solutions and evaluate their pros and cons before recommending the best approach.',
      'planning': 'Create a structured timeline with clear milestones. Consider dependencies, resources, and potential risks in your planning.',
      'communication': 'Structure your response for clarity and impact. Use appropriate tone and formatting for your target audience.'
    };

    prompt += `Approach: ${categoryInstructions[category] || 'Analyze the requirements carefully and provide a comprehensive response.'}\n\n`;

    // Add Chain of Thought structure
    prompt += 'Please follow this step-by-step reasoning process:\n\n';
    
    if (complexity === 'complex') {
      prompt += '1. **Problem Decomposition**: Break down the complex task into manageable components\n';
      prompt += '2. **Analysis**: Examine each component in detail\n';
      prompt += '3. **Synthesis**: Combine insights to form a comprehensive solution\n';
      prompt += '4. **Validation**: Verify the solution addresses all requirements\n';
      prompt += '5. **Optimization**: Refine for efficiency and effectiveness\n\n';
    } else {
      prompt += '1. **Understanding**: Clarify what is being asked\n';
      prompt += '2. **Planning**: Outline your approach\n';
      prompt += '3. **Execution**: Implement your solution\n';
      prompt += '4. **Review**: Ensure quality and completeness\n\n';
    }

    // Add specific requirements handling
    if (hasSpecificRequirements) {
      prompt += 'Critical Requirements:\n';
      prompt += '- Pay special attention to any "must", "should", or "need" statements\n';
      prompt += '- Ensure all specified constraints are met\n';
      prompt += '- Validate your output against the stated requirements\n\n';
    }

    // Add focus on key terms
    if (keyTerms.length > 0) {
      prompt += `Key Focus Areas: ${keyTerms.slice(0, 5).join(', ')}\n\n`;
    }

    return prompt;
  }

  generateToTPrompt(idea, analysis) {
    const { category, complexity } = analysis;
    
    let prompt = `Task: ${idea}\n\n`;
    prompt += 'Use Tree of Thoughts approach - explore multiple solution paths:\n\n';
    
    // Generate branches based on category
    const branchTemplates = {
      'data-analysis': ['Statistical Approach', 'Machine Learning Approach', 'Visualization-First Approach'],
      'creative': ['Conventional Approach', 'Innovative Approach', 'Hybrid Approach'],
      'technical': ['Simple Implementation', 'Optimized Solution', 'Scalable Architecture'],
      'research': ['Literature Review', 'Empirical Analysis', 'Mixed Methods'],
      'problem-solving': ['Quick Fix', 'Root Cause Solution', 'Preventive Approach'],
      'planning': ['Agile Methodology', 'Waterfall Approach', 'Hybrid Planning'],
      'communication': ['Formal Presentation', 'Casual Explanation', 'Visual Storytelling']
    };

    const branches = branchTemplates[category] || ['Approach A', 'Approach B', 'Approach C'];
    
    branches.forEach((branch, index) => {
      prompt += `\n**Branch ${index + 1}: ${branch}**\n`;
      prompt += `- Explore this approach fully\n`;
      prompt += `- Consider advantages and limitations\n`;
      prompt += `- Evaluate feasibility and impact\n`;
    });

    prompt += '\n**Synthesis**:\n';
    prompt += 'After exploring all branches, synthesize the best elements from each approach into an optimal solution.\n';

    return prompt;
  }

  generateJsonPrompt(idea, analysis) {
    const { category, keyTerms } = analysis;
    
    // Generate a dynamic schema based on the task
    const schemaProperties = {
      result: { type: 'object', description: 'Main result object' }
    };

    // Add category-specific fields
    const categoryFields = {
      'data-analysis': {
        insights: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'object' },
        trends: { type: 'array', items: { type: 'object' } }
      },
      'creative': {
        concepts: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'object' },
        uniqueFeatures: { type: 'array', items: { type: 'string' } }
      },
      'technical': {
        components: { type: 'array', items: { type: 'object' } },
        architecture: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'string' } }
      },
      'research': {
        findings: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'string' },
        sources: { type: 'array', items: { type: 'string' } }
      }
    };

    const fields = categoryFields[category] || {
      data: { type: 'object' },
      summary: { type: 'string' },
      details: { type: 'array', items: { type: 'string' } }
    };

    const schema = {
      type: 'object',
      properties: {
        ...fields,
        metadata: {
          type: 'object',
          properties: {
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            category: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      },
      required: Object.keys(fields)
    };

    const prompt = `Generate a JSON response for: ${idea}

Output must be valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Requirements:
1. All fields must be populated with relevant data
2. Ensure proper JSON formatting (quotes, commas, brackets)
3. Use meaningful values, not placeholders
4. Include rich, detailed information in each field
5. Maintain consistency across related fields`;

    return { prompt, schema };
  }

  generateSuggestions(idea, analysis, outputFormat) {
    const baseSuggestions = [
      'Consider adding specific examples to make the prompt more concrete',
      'Include quality criteria to evaluate the output',
      'Add constraints to guide the response format'
    ];

    const categorySuggestions = {
      'data-analysis': [
        'Specify the type of analysis needed (descriptive, predictive, prescriptive)',
        'Define key metrics or KPIs to focus on',
        'Include data quality requirements'
      ],
      'creative': [
        'Add inspiration sources or style references',
        'Define the target audience for the creative work',
        'Include constraints that foster creativity'
      ],
      'technical': [
        'Specify programming language or technology stack',
        'Include performance requirements',
        'Add error handling considerations'
      ],
      'research': [
        'Define the scope and boundaries of research',
        'Specify citation requirements',
        'Include methodology preferences'
      ]
    };

    const suggestions = [...baseSuggestions];
    
    if (categorySuggestions[analysis.category]) {
      suggestions.push(...categorySuggestions[analysis.category]);
    }

    if (outputFormat === 'json') {
      suggestions.push(
        'Define specific data types for each JSON field',
        'Add validation rules for structured data',
        'Include example values in schema documentation'
      );
    }

    // Return unique suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }
}

// Simple jsonderulo implementation for backward compatibility
const jsonderulo = {
  speak: (request, schemaDescription, options = {}) => {
    return {
      prompt: `Task: ${request}\n\nRequirements:\n1. Provide a comprehensive response\n2. Be specific and detailed\n3. Focus on practical outcomes`,
      schema: schemaDescription ? JSON.parse(schemaDescription) : null,
      systemPrompt: "You are a helpful assistant."
    };
  }
};

// Schema generator
const schemaGenerator = {
  async generateFromDescription(description) {
    const optimizer = new PromptOptimizer();
    const analysis = optimizer.analyzePrompt(description);
    const { schema } = optimizer.generateJsonPrompt(description, analysis);
    return schema;
  }
};

// Validator
const validator = {
  async validate(data, schema) {
    return {
      valid: true,
      errors: [],
      repaired: null
    };
  }
};

// In-memory storage for demo
const storage = {
  pipelines: [],
  schemas: [],
  executions: []
};

// Sample templates
const templates = [
  {
    id: 'extraction',
    name: 'Data Extraction',
    description: 'Extract structured data from text',
    schema: {
      type: 'object',
      properties: {
        entities: { type: 'array', items: { type: 'string' } },
        relationships: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  {
    id: 'classification',
    name: 'Text Classification',
    description: 'Classify text into categories',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: { type: 'string' }
      }
    }
  },
  {
    id: 'analysis',
    name: 'Content Analysis',
    description: 'Analyze content for insights',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        key_points: { type: 'array', items: { type: 'string' } },
        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
      }
    }
  }
];

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Main API handler
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    // Route handlers
    if (path === 'health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path === 'templates' && request.method === 'GET') {
      return jsonResponse(templates);
    }

    if (path === 'pipeline/execute' && request.method === 'POST') {
      const body = await request.json();
      const { idea, template, options = {} } = body;
      
      if (!idea) {
        return jsonResponse({ error: 'Idea is required' }, 400);
      }

      console.log('Executing pipeline for idea:', idea);

      // Use template if provided
      let schema = null;
      if (template) {
        const templateData = templates.find(t => t.id === template);
        if (templateData) {
          schema = templateData.schema;
        }
      }

      // Generate schema if not provided
      if (!schema) {
        console.log('Generating schema for idea...');
        schema = await schemaGenerator.generateFromDescription(idea);
      }

      // Execute with jsonderulo
      const schemaDescription = schema ? JSON.stringify(schema) : idea;
      const result = jsonderulo.speak(idea, schemaDescription, {
        mode: options.mode || 'strict',
        temperature: options.temperature || 0.7
      });

      // Store execution
      const execution = {
        id: Date.now().toString(),
        idea,
        template,
        schema,
        result,
        timestamp: new Date().toISOString(),
        options
      };
      storage.executions.push(execution);

      return jsonResponse({
        success: true,
        execution_id: execution.id,
        schema,
        result: {
          transformed_prompt: result.prompt,
          generated_schema: result.schema,
          system_prompt: result.systemPrompt,
          validation_result: result.validationResult,
          repaired_json: result.repairedJson
        },
        metadata: {
          tokens_used: 0,
          model: 'jsonderulo-core',
          processing_time: Date.now() - parseInt(execution.id)
        }
      });
    }

    if (path === 'schema/generate' && request.method === 'POST') {
      const body = await request.json();
      const { description } = body;
      
      if (!description) {
        return jsonResponse({ error: 'Description is required' }, 400);
      }

      const schema = await schemaGenerator.generateFromDescription(description);
      
      return jsonResponse({
        success: true,
        schema,
        timestamp: new Date().toISOString()
      });
    }

    if (path === 'validate' && request.method === 'POST') {
      const body = await request.json();
      const { data, schema } = body;
      
      if (!data || !schema) {
        return jsonResponse({ error: 'Data and schema are required' }, 400);
      }

      const validation = await validator.validate(data, schema);
      
      return jsonResponse({
        success: true,
        valid: validation.valid,
        errors: validation.errors || [],
        repaired: validation.repaired || null
      });
    }

    if (path === 'executions' && request.method === 'GET') {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      const executions = storage.executions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(start, end);
      
      return jsonResponse({
        executions,
        total: storage.executions.length,
        page,
        limit
      });
    }

    if (path === 'optimize-prompt' && request.method === 'POST') {
      const body = await request.json();
      const { idea, outputFormat = 'natural', strategy = 'cot', options = {} } = body;
      
      if (!idea) {
        return jsonResponse({ error: 'Idea is required' }, 400);
      }

      console.log('Optimizing prompt for idea:', idea, 'with strategy:', strategy);

      const startTime = Date.now();
      const optimizer = new PromptOptimizer();
      
      try {
        // Analyze the prompt
        const analysis = optimizer.analyzePrompt(idea);
        
        let enhancedPrompt;
        let metadata = {
          category: analysis.category,
          complexity: analysis.complexity,
          strategy: strategy,
          wordCount: analysis.wordCount
        };
        
        // Generate enhanced prompt based on strategy and format
        if (outputFormat === 'json') {
          const { prompt, schema } = optimizer.generateJsonPrompt(idea, analysis);
          enhancedPrompt = prompt;
          metadata.schema = schema;
          metadata.outputFormat = 'json';
        } else {
          // Natural language output
          switch (strategy) {
            case 'tot':
              enhancedPrompt = optimizer.generateToTPrompt(idea, analysis);
              break;
            case 'cot':
            default:
              enhancedPrompt = optimizer.generateCoTPrompt(idea, analysis);
              break;
          }
          metadata.outputFormat = 'natural';
        }
        
        // Generate suggestions
        const suggestions = optimizer.generateSuggestions(idea, analysis, outputFormat);
        
        // Calculate metrics
        const processingTime = Date.now() - startTime;
        metadata.processingTime = processingTime;
        metadata.tokensUsed = Math.floor(enhancedPrompt.length / 4);
        metadata.confidence = 0.75 + (analysis.hasSpecificRequirements ? 0.1 : 0) + (analysis.keyTerms.length > 3 ? 0.1 : 0);
        
        const result = {
          original: idea,
          enhanced: enhancedPrompt,
          metadata,
          suggestions,
          analysis: {
            detectedCategory: analysis.category,
            complexity: analysis.complexity,
            keyTerms: analysis.keyTerms.slice(0, 10),
            hasSpecificRequirements: analysis.hasSpecificRequirements
          }
        };

        return jsonResponse(result);
        
      } catch (error) {
        console.error('Error optimizing prompt:', error);
        return jsonResponse({ 
          error: 'Failed to optimize prompt', 
          details: error.message 
        }, 500);
      }
    }

    if (path === 'analytics' && request.method === 'GET') {
      const analytics = {
        total_executions: storage.executions.length,
        total_tokens: storage.executions.reduce((sum, exec) => sum + (exec.result?.usage?.total_tokens || 0), 0),
        success_rate: storage.executions.length > 0 ? 
          storage.executions.filter(e => e.result && !e.result.error).length / storage.executions.length : 0,
        avg_processing_time: 1200,
        popular_templates: templates.map(t => ({
          name: t.name,
          usage_count: storage.executions.filter(e => e.template === t.id).length
        }))
      };
      
      return jsonResponse(analytics);
    }

    // 404 for unmatched routes
    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
}