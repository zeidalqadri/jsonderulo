/**
 * Unified Prompt Engineering Studio
 * Consolidates PromptOptimizer, IdeaExecutor, and test-optimizer functionality
 * into a comprehensive prompt engineering workspace
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { default as Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Copy, 
  Wand2, 
  RefreshCw, 
  Settings, 
  History, 
  BookOpen, 
  GitCompare as Compare,
  Download,
  Save,
  Trash2,
  Play,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

// Types
interface PromptResult {
  enhancedPrompt: string;
  originalIdea: string;
  analysis?: {
    category: string;
    complexity: string;
    keywords: string[];
    suggestedStrategy: string;
  };
  reasoning?: {
    type: string;
    steps?: Array<{ title: string; description: string }>;
    tree?: any[];
  };
  suggestions?: string[];
  schema?: any;
  outputFormat: string;
  metadata?: {
    strategy: string;
    processingTime?: number;
    timestamp: string;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
}

interface ComparisonResult {
  original: PromptResult;
  enhanced: PromptResult;
  improvement: number;
  recommendation: string;
}

// Quick example templates
const QUICK_TEMPLATES: Template[] = [
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Analyze datasets and extract insights',
    prompt: 'analyze customer feedback data to identify trends and improvement opportunities',
    category: 'data-analysis'
  },
  {
    id: 'technical-solution',
    name: 'Technical Solution',
    description: 'Design technical architectures and solutions',
    prompt: 'design a scalable microservices architecture for an e-commerce platform',
    category: 'technical'
  },
  {
    id: 'creative-content',
    name: 'Creative Content',
    description: 'Generate creative and engaging content',
    prompt: 'create an innovative marketing campaign for a sustainable fashion brand',
    category: 'creative'
  },
  {
    id: 'business-strategy',
    name: 'Business Strategy',
    description: 'Develop business strategies and plans',
    prompt: 'develop a go-to-market strategy for a new AI-powered productivity tool',
    category: 'business'
  },
  {
    id: 'research-plan',
    name: 'Research Plan',
    description: 'Plan comprehensive research studies',
    prompt: 'design a research study to understand remote work productivity factors',
    category: 'research'
  }
];

const STRATEGIES = [
  { id: 'chain-of-thought', name: 'Chain of Thought', description: 'Step-by-step reasoning' },
  { id: 'tree-of-thoughts', name: 'Tree of Thoughts', description: 'Multi-path exploration' },
  { id: 'role-based', name: 'Role-Based', description: 'Expert persona adoption' },
  { id: 'self-consistency', name: 'Self-Consistency', description: 'Multiple consensus runs' }
];

const OUTPUT_FORMATS = [
  { id: 'enhanced', name: 'Enhanced Natural Language', description: 'Improved natural language prompts' },
  { id: 'json', name: 'Structured JSON', description: 'JSON with schema validation' }
];

export default function PromptStudio() {
  // State management
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('chain-of-thought');
  const [outputFormat, setOutputFormat] = useState('enhanced');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  
  // History and templates
  const [promptHistory, setPromptHistory] = useState<PromptResult[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);

  // Settings
  const [settings, setSettings] = useState({
    autoOptimize: false,
    showAdvancedMetrics: true,
    defaultStrategy: 'chain-of-thought',
    autoSaveHistory: true
  });

  // Load saved data on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('jsonderulo-prompt-history');
    const savedUserTemplates = localStorage.getItem('jsonderulo-user-templates');
    
    if (savedHistory) {
      try {
        setPromptHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.warn('Failed to load prompt history');
      }
    }
    
    if (savedUserTemplates) {
      try {
        setSavedTemplates(JSON.parse(savedUserTemplates));
      } catch (e) {
        console.warn('Failed to load user templates');
      }
    }
  }, []);

  // Auto-save history
  useEffect(() => {
    if (settings.autoSaveHistory && promptHistory.length > 0) {
      localStorage.setItem('jsonderulo-prompt-history', JSON.stringify(promptHistory.slice(0, 50)));
    }
  }, [promptHistory, settings.autoSaveHistory]);

  // Main optimization function
  const optimizePrompt = useCallback(async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to optimize');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: currentPrompt,
          outputFormat,
          strategy: selectedStrategy,
          options: {
            includeMetrics: settings.showAdvancedMetrics
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const newResult: PromptResult = {
        ...data,
        metadata: {
          ...data.metadata,
          timestamp: new Date().toISOString()
        }
      };
      
      setResult(newResult);
      
      // Add to history
      if (settings.autoSaveHistory) {
        setPromptHistory(prev => [newResult, ...prev.slice(0, 49)]);
      }
      
    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize prompt');
    } finally {
      setIsLoading(false);
    }
  }, [currentPrompt, outputFormat, selectedStrategy, settings]);

  // Comparison mode function
  const runComparison = useCallback(async () => {
    if (!currentPrompt.trim()) return;

    setIsLoading(true);
    try {
      // Run A/B test between current strategy and auto-suggested
      const response = await fetch('/api/abtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseRequest: currentPrompt,
          variants: [
            { strategy: 'tree-of-thoughts', request: currentPrompt },
            { strategy: 'role-based', request: currentPrompt }
          ],
          config: { rounds: 1 }
        })
      });

      const data = await response.json();
      
      // Mock comparison result for now
      const comparison: ComparisonResult = {
        original: result!,
        enhanced: { ...result!, enhancedPrompt: data.winner?.prompt || result!.enhancedPrompt },
        improvement: parseFloat(data.winner?.improvement?.replace('%', '') || '0'),
        recommendation: data.recommendation || 'No significant improvement detected'
      };
      
      setComparisonResults(comparison);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPrompt, result]);

  // Utility functions
  const loadTemplate = (template: Template) => {
    setCurrentPrompt(template.prompt);
    setSelectedStrategy(template.category === 'technical' ? 'tree-of-thoughts' : 'chain-of-thought');
  };

  const saveAsTemplate = () => {
    if (!currentPrompt.trim()) return;
    
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: `Custom Template ${savedTemplates.length + 1}`,
      description: 'User-created template',
      prompt: currentPrompt,
      category: result?.analysis?.category || 'general'
    };
    
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('jsonderulo-user-templates', JSON.stringify(updated));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  const exportResult = () => {
    if (!result) return;
    
    const exportData = {
      prompt: result.enhancedPrompt,
      analysis: result.analysis,
      metadata: result.metadata,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        optimizePrompt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [optimizePrompt]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="h-8 w-8 text-blue-600" />
              Prompt Engineering Studio
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced prompt optimization with multiple strategies and comprehensive analysis
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComparisonMode(!comparisonMode)}
              className={comparisonMode ? 'bg-blue-100' : ''}
            >
              <Compare className="h-4 w-4 mr-2" />
              {comparisonMode ? 'Exit Compare' : 'Compare Mode'}
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <Compare className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Prompt Input</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveAsTemplate}
                          disabled={!currentPrompt.trim()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPrompt('')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={currentPrompt}
                      onChange={(e) => setCurrentPrompt(e.target.value)}
                      placeholder="Enter your prompt idea here... (Cmd/Ctrl + Enter to optimize)"
                      className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Strategy:</label>
                          <select
                            value={selectedStrategy}
                            onChange={(e) => setSelectedStrategy(e.target.value)}
                            className="ml-2 p-1 border rounded"
                          >
                            {STRATEGIES.map(strategy => (
                              <option key={strategy.id} value={strategy.id}>
                                {strategy.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Output:</label>
                          <select
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            className="ml-2 p-1 border rounded"
                          >
                            {OUTPUT_FORMATS.map(format => (
                              <option key={format.id} value={format.id}>
                                {format.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <Button
                        onClick={optimizePrompt}
                        disabled={isLoading || !currentPrompt.trim()}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {isLoading ? 'Optimizing...' : 'Optimize'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Panel */}
                {(result || error) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Optimized Result</span>
                        {result && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(result.enhancedPrompt)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportResult}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600">{error}</p>
                        </div>
                      ) : result ? (
                        <div className="space-y-4">
                          {/* Enhanced Prompt */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Enhanced Prompt:</h4>
                            <div className="p-3 bg-gray-50 border rounded-lg">
                              <pre className="whitespace-pre-wrap text-sm">{result.enhancedPrompt}</pre>
                            </div>
                          </div>

                          {/* Schema (for JSON output) */}
                          {result.schema && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Generated Schema:</h4>
                              <div className="p-3 bg-gray-50 border rounded-lg">
                                <pre className="text-sm">{JSON.stringify(result.schema, null, 2)}</pre>
                              </div>
                            </div>
                          )}

                          {/* Suggestions */}
                          {result.suggestions && result.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Suggestions:
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {result.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Quick Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {QUICK_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => loadTemplate(template)}
                          className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Metadata */}
                {result?.analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Category:</span>
                          <Badge variant="outline">{result.analysis.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Complexity:</span>
                          <Badge variant="outline">{result.analysis.complexity}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Strategy:</span>
                          <Badge variant="outline">{result.analysis.suggestedStrategy}</Badge>
                        </div>
                        {result.analysis.keywords && (
                          <div>
                            <span className="text-sm text-gray-600">Keywords:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.analysis.keywords.slice(0, 5).map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...QUICK_TEMPLATES, ...savedTemplates].map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 p-2 rounded">
                      {template.prompt.slice(0, 100)}...
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          loadTemplate(template);
                          setActiveTab('create');
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              {promptHistory.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No prompt history yet. Start optimizing prompts to see them here!</p>
                  </CardContent>
                </Card>
              ) : (
                promptHistory.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {new Date(item.metadata?.timestamp || '').toLocaleDateString()}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.analysis?.category}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentPrompt(item.originalIdea);
                              setResult(item);
                              setActiveTab('create');
                            }}
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Original:</strong> {item.originalIdea.slice(0, 100)}...
                      </div>
                      <div className="text-sm text-gray-800">
                        <strong>Enhanced:</strong> {item.enhancedPrompt.slice(0, 150)}...
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Compare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Compare different optimization strategies for the same prompt
                  </p>
                  {result ? (
                    <Button onClick={runComparison} disabled={isLoading}>
                      {isLoading ? 'Comparing...' : 'Run Comparison'}
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Optimize a prompt first to enable comparisons
                    </p>
                  )}
                </div>
                
                {comparisonResults && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Original Strategy</h4>
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                          {comparisonResults.original.enhancedPrompt.slice(0, 300)}...
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Alternative Strategy</h4>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                          {comparisonResults.enhanced.enhancedPrompt.slice(0, 300)}...
                        </pre>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm">{comparisonResults.recommendation}</p>
                        {comparisonResults.improvement > 0 && (
                          <p className="text-sm font-medium text-green-600 mt-2">
                            Improvement: +{comparisonResults.improvement}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}