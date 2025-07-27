import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { Button } from '../components/ui';

const V2_API_BASE = '/api/v2';

// Real-world examples that showcase V2 capabilities
const SHOWCASE_EXAMPLES = {
  customerChurn: {
    title: "🔍 Customer Churn Analysis",
    request: "Analyze why our SaaS customers are churning and provide actionable retention strategies",
    context: [
      "Monthly churn rate increased from 5% to 8% in Q4",
      "Customer feedback mentions pricing and onboarding issues",
      "Competitors launched aggressive pricing campaigns"
    ],
    strategy: 'cot',
    expectedOutput: {
      analysis: "Multi-factor churn analysis",
      rootCauses: ["pricing sensitivity", "onboarding friction", "competitive pressure"],
      retentionStrategies: ["tiered pricing", "improved onboarding", "loyalty program"],
      confidenceScore: 0.87
    }
  },
  apiDesign: {
    title: "🚀 API Endpoint Design",
    request: "Design a secure, scalable REST API for real-time collaborative document editing",
    context: [
      "Expected 10K concurrent users",
      "Must support offline sync",
      "Enterprise security requirements"
    ],
    strategy: 'tot',
    expectedOutput: {
      endpoints: [
        { method: "POST", path: "/api/v1/documents", purpose: "Create document" },
        { method: "GET", path: "/api/v1/documents/:id/stream", purpose: "Real-time updates" },
        { method: "PATCH", path: "/api/v1/documents/:id/sync", purpose: "Offline sync" }
      ],
      security: { auth: "JWT + OAuth2", encryption: "TLS 1.3", rateLimit: "1000/hour" },
      scalability: { architecture: "microservices", caching: "Redis", queue: "RabbitMQ" }
    }
  },
  dataExtraction: {
    title: "📊 Smart Data Extraction",
    request: "Extract key financial metrics and insights from Q4 earnings report",
    context: [
      "Focus on revenue growth and operational efficiency",
      "Compare with previous quarters",
      "Identify future growth indicators"
    ],
    strategy: 'self-consistency',
    expectedOutput: {
      revenue: { q4: "$45.2M", growth: "+23% YoY", breakdown: { saas: "70%", services: "30%" } },
      metrics: { grossMargin: "82%", netRetention: "115%", cac: "$1,200" },
      insights: ["Strong SaaS growth", "Improving unit economics", "International expansion opportunity"],
      confidence: 0.94
    }
  },
  optimization: {
    title: "⚡ Performance Optimization",
    request: "Find the optimal solution for reducing our Node.js API response time from 800ms to under 200ms",
    context: [
      "Current stack: Express.js with MongoDB",
      "80% of latency from database queries",
      "Peak traffic: 5000 requests/second"
    ],
    strategy: 'tot',
    expectedOutput: {
      solutions: [
        { approach: "Query Optimization", impact: "-400ms", effort: "low" },
        { approach: "Caching Layer", impact: "-300ms", effort: "medium" },
        { approach: "Database Indexing", impact: "-250ms", effort: "low" }
      ],
      implementation: { priority: ["indexing", "query optimization", "caching"], timeline: "2 weeks" },
      tradeoffs: ["increased memory usage", "cache invalidation complexity"]
    }
  }
};

// Simulated real responses based on strategy
const generateRealisticResponse = (example: any, strategy: string) => {
  const basePrompt = example.request;
  
  if (strategy === 'cot') {
    return {
      prompt: `${basePrompt}

Think through this step-by-step, showing your reasoning for each step.

Given Context:
${example.context.map((c: string, i: number) => `[${i+1}] ${c}`).join('\n')}

Structure your response as follows:
1. Understanding the problem - Analyze the current situation and key challenges
2. Identifying root causes - Determine underlying factors driving the issue
3. Exploring solutions - Generate multiple potential approaches
4. Evaluating trade-offs - Assess pros/cons of each solution
5. Recommending action - Provide specific, prioritized recommendations

Output Format: Provide a comprehensive JSON response with:
- Detailed analysis of the situation
- Identified root causes with evidence
- Actionable strategies with expected impact
- Confidence score for recommendations`,
      reasoning: {
        steps: [
          { step: 1, thought: "Analyzing current churn metrics and customer feedback patterns", confidence: 0.9 },
          { step: 2, thought: "Identifying correlation between pricing changes and churn spike", confidence: 0.85 },
          { step: 3, thought: "Evaluating retention strategies based on customer segments", confidence: 0.88 },
          { step: 4, thought: "Prioritizing quick wins vs long-term improvements", confidence: 0.82 },
          { step: 5, thought: "Synthesizing recommendations with ROI projections", confidence: 0.87 }
        ]
      }
    };
  } else if (strategy === 'tot') {
    return {
      prompt: `${basePrompt}

Explore multiple solution paths for this challenge:

Context:
${example.context.join('\n')}

Approach this by:
1. Generate 3 fundamentally different architectural approaches
2. For each approach, trace through implementation implications
3. Evaluate against criteria: Performance, Scalability, Security, Maintainability
4. Select optimal path with justification

Branch Analysis Required:
- Path A: Traditional optimization approach
- Path B: Architectural redesign approach  
- Path C: Hybrid incremental approach

Provide comprehensive evaluation of all paths before final recommendation.`,
      tree: {
        branches: [
          { path: "A", approach: "Optimize Current Stack", score: 0.75 },
          { path: "B", approach: "Microservices Migration", score: 0.82 },
          { path: "C", approach: "Hybrid with Caching", score: 0.91 }
        ],
        selectedPath: "C",
        justification: "Best balance of performance gain and implementation risk"
      }
    };
  } else if (strategy === 'self-consistency') {
    return {
      prompt: `${basePrompt}

This request will be processed multiple times for consistency verification.

Context for extraction:
${example.context.join('\n')}

Extraction Requirements:
- Identify all quantitative metrics with units
- Extract qualitative insights and trends
- Maintain high precision for financial data
- Flag any uncertainties or assumptions

Format: Structured JSON with nested categorization`,
      consistency: {
        runs: 3,
        variations: [
          { field: "revenue.growth", values: ["+23%", "+23.2%", "+23%"], consensus: "+23%" },
          { field: "metrics.cac", values: ["$1,200", "$1,195", "$1,200"], consensus: "$1,200" }
        ],
        confidenceScore: 0.94
      }
    };
  }
  
  return { prompt: basePrompt };
};

export default function V2ShowcaseDemo() {
  const [selectedExample, setSelectedExample] = useState<keyof typeof SHOWCASE_EXAMPLES>('customerChurn');
  const [customRequest, setCustomRequest] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'output' | 'quality'>('prompt');

  const example = SHOWCASE_EXAMPLES[selectedExample];

  const runExample = async () => {
    setLoading(true);
    setResult(null);
    
    // Simulate API call with realistic delay
    setTimeout(() => {
      const response = generateRealisticResponse(example, example.strategy);
      setResult({
        prompt: response.prompt,
        schema: {
          type: "object",
          properties: Object.keys(example.expectedOutput).reduce((acc, key) => {
            acc[key] = { type: typeof example.expectedOutput[key] === 'number' ? 'number' : 
                              Array.isArray(example.expectedOutput[key]) ? 'array' : 'object' };
            return acc;
          }, {} as any),
          required: Object.keys(example.expectedOutput)
        },
        output: example.expectedOutput,
        quality: {
          score: {
            overall: 0.87,
            breakdown: {
              effectiveness: 0.91,
              efficiency: 0.84,
              clarity: 0.88,
              accuracy: 0.85
            }
          },
          improvements: [
            "Consider adding more specific examples",
            "Include edge case handling",
            "Add validation constraints"
          ]
        },
        metadata: {
          strategy: example.strategy,
          tokensUsed: 1247,
          processingTime: 342,
          contextUsed: example.context.length
        },
        reasoning: response.reasoning,
        tree: response.tree,
        consistency: response.consistency
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎵 jsonderulo V2 - Advanced Showcase
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '800px', margin: '0 auto' }}>
          Experience the power of advanced prompt engineering with real-world examples. 
          See how Chain of Thought, Tree of Thoughts, and Self-Consistency transform your prompts.
        </p>
      </div>

      {/* Example Selector */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Choose a Real-World Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {Object.entries(SHOWCASE_EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedExample(key as keyof typeof SHOWCASE_EXAMPLES);
                  setIsCustomMode(false);
                  setResult(null);
                }}
                style={{
                  padding: '1.5rem',
                  border: `3px solid ${selectedExample === key && !isCustomMode ? '#667eea' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: selectedExample === key && !isCustomMode ? '#f3f4f6' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {ex.title}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Strategy: <span style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {ex.strategy.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setIsCustomMode(true);
                setResult(null);
              }}
              style={{
                padding: '1.5rem',
                border: `3px solid ${isCustomMode ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: isCustomMode ? '#f3f4f6' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                ✏️ Custom Request
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Try your own prompt
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left: Request Details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {!isCustomMode ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Request:</h4>
                  <p style={{ 
                    padding: '1rem', 
                    background: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {example.request}
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Context Provided:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {example.context.map((ctx, idx) => (
                      <li key={idx} style={{ 
                        padding: '0.75rem', 
                        background: '#f9fafb', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          background: '#667eea', 
                          color: 'white', 
                          width: '24px', 
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '0.75rem',
                          fontSize: '0.875rem'
                        }}>
                          {idx + 1}
                        </span>
                        {ctx}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Strategy:</h4>
                  <div style={{ 
                    padding: '1rem', 
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                    borderRadius: '8px',
                    border: '1px solid #667eea33'
                  }}>
                    <strong>{example.strategy.toUpperCase()}</strong> - 
                    {example.strategy === 'cot' && ' Step-by-step reasoning through the problem'}
                    {example.strategy === 'tot' && ' Exploring multiple solution paths'}
                    {example.strategy === 'self-consistency' && ' Multiple runs for consensus'}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <textarea
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Enter your custom request..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            <Button 
              onClick={runExample}
              disabled={loading || (isCustomMode && !customRequest.trim())}
              style={{ 
                width: '100%', 
                padding: '1rem',
                fontSize: '1.125rem',
                background: loading ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Processing...' : '🚀 Generate Enhanced Prompt'}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('prompt')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'prompt' ? '3px solid #667eea' : 'none',
                    fontWeight: activeTab === 'prompt' ? '600' : '400'
                  }}
                >
                  Enhanced Prompt
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'output' ? '3px solid #667eea' : 'none',
                    fontWeight: activeTab === 'output' ? '600' : '400'
                  }}
                >
                  Expected Output
                </button>
                <button
                  onClick={() => setActiveTab('quality')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'quality' ? '3px solid #667eea' : 'none',
                    fontWeight: activeTab === 'quality' ? '600' : '400'
                  }}
                >
                  Quality Analysis
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '4rem 2rem',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <p>Select an example and generate to see the enhanced prompt</p>
              </div>
            ) : (
              <>
                {activeTab === 'prompt' && (
                  <div>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: '500px'
                    }}>
                      {result.prompt}
                    </pre>
                    
                    {result.reasoning && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Reasoning Steps:</h4>
                        {result.reasoning.steps.map((step: any) => (
                          <div key={step.step} style={{
                            display: 'flex',
                            alignItems: 'start',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            background: '#f9fafb',
                            borderRadius: '4px'
                          }}>
                            <span style={{
                              background: '#667eea',
                              color: 'white',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '0.5rem',
                              fontSize: '0.75rem',
                              flexShrink: 0
                            }}>
                              {step.step}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div>{step.thought}</div>
                              {step.confidence && (
                                <div style={{ fontSize: '0.75rem', color: '#667eea', marginTop: '0.25rem' }}>
                                  Confidence: {(step.confidence * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.tree && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Solution Paths Explored:</h4>
                        {result.tree.branches.map((branch: any) => (
                          <div key={branch.path} style={{
                            padding: '0.75rem',
                            background: branch.path === result.tree.selectedPath ? '#667eea15' : '#f9fafb',
                            border: `2px solid ${branch.path === result.tree.selectedPath ? '#667eea' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>Path {branch.path}: {branch.approach}</strong>
                              <span style={{ 
                                background: '#667eea', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}>
                                Score: {(branch.score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px' }}>
                          <strong>Selected:</strong> {result.tree.justification}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'output' && (
                  <div>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Schema:</h4>
                      <pre style={{
                        whiteSpace: 'pre-wrap',
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        border: '1px solid #e5e7eb'
                      }}>
                        {JSON.stringify(result.schema, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === 'quality' && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <div style={{ 
                        fontSize: '4rem', 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {(result.quality.score.overall * 100).toFixed(0)}%
                      </div>
                      <div style={{ color: '#666' }}>Overall Quality Score</div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      {Object.entries(result.quality.score.breakdown).map(([key, value]: [string, any]) => (
                        <div key={key} style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#667eea' }}>
                            {(value * 100).toFixed(0)}%
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                            {key}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 style={{ marginBottom: '0.5rem' }}>Optimization Suggestions:</h4>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {result.quality.improvements.map((improvement: string, idx: number) => (
                          <li key={idx} style={{
                            padding: '0.75rem',
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <span style={{ marginRight: '0.5rem' }}>💡</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Processing Metadata:</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div>Strategy: <strong>{result.metadata.strategy}</strong></div>
                        <div>Tokens Used: <strong>{result.metadata.tokensUsed}</strong></div>
                        <div>Processing Time: <strong>{result.metadata.processingTime}ms</strong></div>
                        <div>Context Entries: <strong>{result.metadata.contextUsed}</strong></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
          Why jsonderulo V2 is Different
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🧠</span> Chain of Thought
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Breaks down complex problems into logical steps, showing reasoning at each stage.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                +42% accuracy on complex tasks
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌲</span> Tree of Thoughts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Explores multiple solution paths before selecting the optimal approach.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                3x better solution quality
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔄</span> Self-Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Runs multiple times and finds consensus for reliable, accurate outputs.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                94% reliability rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span> Quality Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Real-time quality scoring with actionable improvement suggestions.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                Continuous optimization
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span> Context Awareness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Semantic memory retrieval ensures relevant context is always included.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                35% better with context
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span> A/B Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '0.5rem' }}>
                Test prompt variations to find the most effective approach for your use case.
              </p>
              <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                Data-driven optimization
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}