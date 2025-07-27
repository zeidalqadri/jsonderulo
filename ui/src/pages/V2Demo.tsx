import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { Button, Input } from '../components/ui';

const V2_API_BASE = '/api/v2';

export default function V2Demo() {
  const [request, setRequest] = useState('');
  const [strategy, setStrategy] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const strategies = [
    { value: 'standard', label: 'Standard' },
    { value: 'cot', label: 'Chain of Thought' },
    { value: 'tot', label: 'Tree of Thoughts' },
    { value: 'self-consistency', label: 'Self-Consistency' }
  ];

  const handleSubmit = async () => {
    if (!request.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${V2_API_BASE}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          options: {
            strategy,
            trackQuality: true,
            enableCoT: strategy === 'cot',
            enableToT: strategy === 'tot',
            selfConsistency: strategy === 'self-consistency'
          }
        })
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async (feature: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${V2_API_BASE}/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature })
      });

      const data = await response.json();
      if (data.demo) {
        setRequest(data.demo.request);
        setStrategy(data.demo.options.strategy || 'standard');
        setResult(data.demo.result);
      }
    } catch (error) {
      console.error('Error running demo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🎵 jsonderulo V2 - Enhanced Demo
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#666' }}>
          Experience advanced prompt engineering with reasoning strategies and quality tracking
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Input Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Prompt Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Your Request
                </label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Enter your request here..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Prompting Strategy
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {strategies.map(strat => (
                    <button
                      key={strat.value}
                      onClick={() => setStrategy(strat.value)}
                      style={{
                        padding: '0.75rem',
                        border: `2px solid ${strategy === strat.value ? '#8b5cf6' : '#e5e5e5'}`,
                        borderRadius: '4px',
                        background: strategy === strat.value ? '#f3e8ff' : 'white',
                        cursor: 'pointer',
                        fontWeight: strategy === strat.value ? '600' : '400'
                      }}
                    >
                      {strat.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || !request.trim()}
                style={{ width: '100%' }}
              >
                {loading ? 'Processing...' : '✨ Generate Enhanced Prompt'}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          {result && (
            <Card style={{ marginTop: '2rem' }}>
              <CardHeader>
                <CardTitle>Generated Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Enhanced Prompt:</h4>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    background: '#f5f5f5', 
                    padding: '1rem', 
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    overflow: 'auto'
                  }}>
                    {result.prompt}
                  </pre>
                </div>

                {result.schema && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>JSON Schema:</h4>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      background: '#f5f5f5', 
                      padding: '1rem', 
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(result.schema, null, 2)}
                    </pre>
                  </div>
                )}

                {result.quality && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Quality Score:</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                      {(result.quality.score.overall * 100).toFixed(0)}%
                    </div>
                  </div>
                )}

                {result.metadata && (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Metadata:</h4>
                    <div style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px' }}>
                      <div>Strategy: {result.metadata.strategy}</div>
                      <div>Tokens: {result.metadata.tokensUsed}</div>
                      <div>Processing Time: {result.metadata.processingTime}ms</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Demos</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button onClick={() => runDemo('cot')} style={{ width: '100%', textAlign: 'left' }}>
                  🧠 Chain of Thought Demo
                </Button>
                <Button onClick={() => runDemo('tot')} style={{ width: '100%', textAlign: 'left' }}>
                  🌲 Tree of Thoughts Demo
                </Button>
                <Button onClick={() => runDemo('context')} style={{ width: '100%', textAlign: 'left' }}>
                  🔍 Context-Aware Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card style={{ marginTop: '1rem' }}>
            <CardHeader>
              <CardTitle>V2 Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                  <strong>✓ Context Awareness</strong>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Semantic memory & retrieval</div>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <strong>✓ Advanced Reasoning</strong>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>CoT, ToT, Self-consistency</div>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <strong>✓ Quality Tracking</strong>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Metrics & recommendations</div>
                </li>
                <li>
                  <strong>✓ A/B Testing</strong>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Optimize prompt variations</div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}