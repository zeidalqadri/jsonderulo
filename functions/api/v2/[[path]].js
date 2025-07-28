// Enhanced Cloudflare Pages Function for jsonderulo V2
// Includes all the advanced prompt engineering features

// Enhanced Mock implementation with V2 features
class EnhancedJsonderuloV2Mock {
  constructor() {
    this.contextEntries = [];
    this.qualityMetrics = {
      totalPrompts: 0,
      avgScore: 0.85,
      improvements: []
    };
  }

  async speakEnhanced(request, schemaDescription, options = {}) {
    const startTime = Date.now();
    
    // Build context if enabled
    let contextText = '';
    if (options.enableContext && this.contextEntries.length > 0) {
      const relevantContext = this.contextEntries
        .slice(-5) // Last 5 entries
        .map(entry => `[${entry.type}]: ${entry.content}`)
        .join('\n');
      contextText = `Given the following context:\n${relevantContext}\n\n`;
    }

    // Apply prompting strategy
    let enhancedPrompt = request;
    let reasoningSteps = [];
    
    if (options.strategy === 'cot' || options.enableCoT) {
      enhancedPrompt = `${request}

Think through this step-by-step, showing your reasoning for each step.

Structure your response as follows:
1. Understanding the requirements
2. Planning the approach
3. Executing the solution
4. Validating the result`;
      
      reasoningSteps = [
        { step: 1, thought: "Understanding the requirements" },
        { step: 2, thought: "Planning the approach" },
        { step: 3, thought: "Executing the solution" },
        { step: 4, thought: "Validating the result" }
      ];
    } else if (options.strategy === 'tot') {
      enhancedPrompt = `${request}

Explore multiple approaches to solving this problem:
1. Generate 3 different initial approaches
2. Evaluate each path
3. Select the most promising approach
4. Provide your final solution`;
    } else if (options.strategy === 'role-based') {
      enhancedPrompt = `As an expert data analyst with strong analytical skills, ${request}

Apply your expertise in: data analysis, statistics, pattern recognition`;
    }

    // Generate schema
    const schema = schemaDescription ? 
      (typeof schemaDescription === 'string' ? JSON.parse(schemaDescription) : schemaDescription) :
      this.generateDefaultSchema(request);

    // Add schema to prompt
    const finalPrompt = `${contextText}${enhancedPrompt}

JSON Schema:
${JSON.stringify(schema, null, 2)}

Requirements:
1. Your response MUST be valid JSON
2. Your response MUST conform to the provided schema
3. Include all required fields`;

    // Calculate quality metrics
    const quality = options.trackQuality ? {
      score: {
        overall: 0.87,
        breakdown: {
          effectiveness: 0.89,
          efficiency: 0.82,
          quality: 0.88,
          satisfaction: 0.85
        },
        strengths: ["Clear structure", "Well-defined schema"],
        weaknesses: [],
        recommendations: ["Add more specific constraints", "Include examples"]
      },
      metrics: {
        clarityScore: 0.88,
        specificityScore: 0.85,
        consistencyScore: 0.90
      }
    } : undefined;

    this.qualityMetrics.totalPrompts++;

    return {
      prompt: finalPrompt,
      schema,
      systemPrompt: "You are an advanced AI assistant with prompt engineering capabilities.",
      context: options.enableContext ? {
        entries: this.contextEntries.slice(-5),
        totalTokens: Math.ceil(contextText.length / 4)
      } : undefined,
      reasoning: {
        steps: reasoningSteps
      },
      quality,
      metadata: {
        strategy: options.strategy || 'standard',
        tokensUsed: Math.ceil(finalPrompt.length / 4),
        processingTime: Date.now() - startTime,
        contextRetrieved: this.contextEntries.length
      }
    };
  }

  addContext(content, type = 'reference', metadata = {}) {
    const entry = {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: new Date(),
      metadata: {
        tokens: Math.ceil(content.length / 4),
        ...metadata
      }
    };
    
    this.contextEntries.push(entry);
    
    // Keep only last 100 entries
    if (this.contextEntries.length > 100) {
      this.contextEntries = this.contextEntries.slice(-100);
    }
    
    return entry.id;
  }

  async processWithConsistency(request, mockResponses, options = {}) {
    const rounds = options.consistencyRounds || 3;
    const outputs = [];
    
    // Simulate multiple runs
    for (let i = 0; i < rounds; i++) {
      outputs.push({
        result: "success",
        data: { iteration: i + 1, confidence: 0.85 + Math.random() * 0.1 }
      });
    }

    // Analyze consistency
    const consistency = {
      outputs,
      consensusOutput: outputs[0],
      confidenceScore: 0.92,
      variations: []
    };

    return {
      success: true,
      data: consistency.consensusOutput,
      consistency,
      attempts: rounds
    };
  }

  async findSimilarContext(query, maxResults = 5) {
    // Simple keyword-based similarity
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scored = this.contextEntries.map(entry => {
      const entryWords = entry.content.toLowerCase().split(/\s+/);
      const commonWords = queryWords.filter(qw => 
        entryWords.some(ew => ew.includes(qw) || qw.includes(ew))
      );
      
      return {
        id: entry.id,
        score: commonWords.length / queryWords.length,
        metadata: {
          text: entry.content,
          type: entry.type
        }
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .filter(item => item.score > 0);
  }

  getQualityMetrics() {
    return {
      avgQualityScore: this.qualityMetrics.avgScore,
      totalPrompts: this.qualityMetrics.totalPrompts,
      improvements: [
        "Use Chain of Thought for complex tasks",
        "Add context for better results",
        "Include specific examples in prompts"
      ]
    };
  }

  generateDefaultSchema(request) {
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('analyze') || requestLower.includes('analysis')) {
      return {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          findings: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['analysis', 'findings']
      };
    }
    
    if (requestLower.includes('extract') || requestLower.includes('parse')) {
      return {
        type: 'object',
        properties: {
          extracted_data: { type: 'array', items: { type: 'object' } },
          summary: { type: 'string' },
          metadata: { type: 'object' }
        },
        required: ['extracted_data']
      };
    }
    
    // Default schema
    return {
      type: 'object',
      properties: {
        result: { type: 'string' },
        data: { type: 'object' },
        status: { type: 'string' }
      },
      required: ['result']
    };
  }
}

// Initialize enhanced jsonderulo
const jsonderulo = new EnhancedJsonderuloV2Mock();

// Helper function for JSON responses
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

// Main V2 API handler
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v2/', '');
  
  // Handle CORS
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
    // V2 Routes
    if (path === 'health' && request.method === 'GET') {
      return jsonResponse({ 
        status: 'ok', 
        version: '2.0',
        features: ['context-aware', 'cot', 'tot', 'self-consistency', 'quality-tracking'],
        timestamp: new Date().toISOString() 
      });
    }

    // Enhanced speak endpoint
    if (path === 'speak' && request.method === 'POST') {
      const body = await request.json();
      const { request: userRequest, schemaDescription, options = {} } = body;
      
      if (!userRequest) {
        return jsonResponse({ error: 'Request is required' }, 400);
      }

      const result = await jsonderulo.speakEnhanced(userRequest, schemaDescription, options);
      
      return jsonResponse({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    }

    // Context management endpoints
    if (path === 'context/add' && request.method === 'POST') {
      const body = await request.json();
      const { content, type = 'reference', metadata = {} } = body;
      
      if (!content) {
        return jsonResponse({ error: 'Content is required' }, 400);
      }

      const entryId = jsonderulo.addContext(content, type, metadata);
      
      return jsonResponse({
        success: true,
        entryId,
        message: 'Context entry added successfully'
      });
    }

    if (path === 'context/search' && request.method === 'POST') {
      const body = await request.json();
      const { query, maxResults = 5 } = body;
      
      if (!query) {
        return jsonResponse({ error: 'Query is required' }, 400);
      }

      const results = await jsonderulo.findSimilarContext(query, maxResults);
      
      return jsonResponse({
        success: true,
        results,
        query
      });
    }

    // Self-consistency endpoint
    if (path === 'consistency' && request.method === 'POST') {
      const body = await request.json();
      const { request: userRequest, options = {} } = body;
      
      if (!userRequest) {
        return jsonResponse({ error: 'Request is required' }, 400);
      }

      const result = await jsonderulo.processWithConsistency(
        userRequest,
        [], // Mock responses
        options
      );
      
      return jsonResponse({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    }

    // Quality metrics endpoint
    if (path === 'quality/metrics' && request.method === 'GET') {
      const metrics = jsonderulo.getQualityMetrics();
      
      return jsonResponse({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    }

    // A/B Testing endpoint (mock)
    if (path === 'abtest' && request.method === 'POST') {
      const body = await request.json();
      const { baseRequest, variants, config = {} } = body;
      
      if (!baseRequest || !variants) {
        return jsonResponse({ error: 'Base request and variants are required' }, 400);
      }

      const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return jsonResponse({
        success: true,
        testId,
        status: 'started',
        message: 'A/B test initiated',
        config: {
          variants: variants.length,
          sampleSize: config.sampleSize || 20
        }
      });
    }

    // Feature showcase endpoint
    if (path === 'features' && request.method === 'GET') {
      return jsonResponse({
        version: '2.0',
        features: {
          contextManagement: {
            name: 'Advanced Context Management',
            description: 'Semantic memory with intelligent retrieval',
            endpoints: ['/context/add', '/context/search']
          },
          promptingStrategies: {
            name: 'Advanced Prompting Strategies',
            description: 'CoT, ToT, and self-consistency prompting',
            available: ['cot', 'tot', 'self-consistency', 'role-based']
          },
          qualityTracking: {
            name: 'Quality Tracking',
            description: 'Monitor and improve prompt effectiveness',
            endpoints: ['/quality/metrics']
          },
          streaming: {
            name: 'JSON Streaming',
            description: 'Progressive validation during generation',
            status: 'coming-soon'
          },
          abTesting: {
            name: 'A/B Testing',
            description: 'Test prompt variations for optimization',
            endpoints: ['/abtest']
          }
        }
      });
    }

    // Demo endpoint
    if (path === 'demo' && request.method === 'POST') {
      const body = await request.json();
      const { feature = 'cot' } = body;
      
      let demoRequest, demoOptions;
      
      switch (feature) {
        case 'cot':
          demoRequest = 'Analyze why customer churn is increasing';
          demoOptions = { strategy: 'cot', enableCoT: true, trackQuality: true };
          break;
        case 'tot':
          demoRequest = 'Find the best solution for optimizing API performance';
          demoOptions = { strategy: 'tot', trackQuality: true };
          break;
        case 'context':
          // Add demo context
          jsonderulo.addContext('Customer feedback shows pricing concerns', 'user_input');
          jsonderulo.addContext('Previous analysis identified onboarding issues', 'reference');
          demoRequest = 'Create a customer retention strategy';
          demoOptions = { enableContext: true, trackQuality: true };
          break;
        default:
          demoRequest = 'Generate a product roadmap';
          demoOptions = { trackQuality: true };
      }
      
      const result = await jsonderulo.speakEnhanced(demoRequest, null, demoOptions);
      
      return jsonResponse({
        success: true,
        demo: {
          feature,
          request: demoRequest,
          options: demoOptions,
          result
        }
      });
    }

    // 404 for unmatched routes
    return jsonResponse({ error: 'Not found', path }, 404);

  } catch (error) {
    console.error('V2 API Error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
}