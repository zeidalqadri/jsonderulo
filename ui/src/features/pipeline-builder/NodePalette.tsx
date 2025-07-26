import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PipelineNodeType } from '../../types/pipeline'

interface NodePaletteProps {
  onAddNode: (type: PipelineNodeType) => void
}

const nodeDefinitions: Array<{
  type: PipelineNodeType
  label: string
  icon: string
  description: string
}> = [
  {
    type: 'idea-input',
    label: 'Idea Input',
    icon: '💡',
    description: 'Captures and processes initial ideas or requirements'
  },
  {
    type: 'query-construction',
    label: 'Query Constructor',
    icon: '🔍',
    description: 'Builds optimized queries from input data'
  },
  {
    type: 'prompt-optimization',
    label: 'Prompt Optimizer',
    icon: '⚡',
    description: 'Optimizes prompts for better LLM performance'
  },
  {
    type: 'structure-layer',
    label: 'Structure Layer',
    icon: '🏗️',
    description: 'Applies JSON schema structure (jsonderulo core)'
  },
  {
    type: 'llm-execution',
    label: 'LLM Executor',
    icon: '🤖',
    description: 'Executes LLM calls with structured prompts'
  },
  {
    type: 'output-validation',
    label: 'Output Validator',
    icon: '✅',
    description: 'Validates and ensures output quality'
  },
  {
    type: 'feedback-loop',
    label: 'Feedback Loop',
    icon: '🔄',
    description: 'Collects feedback and optimization insights'
  }
]

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  return (
    <div>
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Pipeline Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem' }}>
            Drag or click to add nodes to your pipeline
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {nodeDefinitions.map((node) => (
              <div
                key={node.type}
                style={{
                  border: '1px dashed #ccc',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  background: '#ffffff'
                }}
                onClick={() => onAddNode(node.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderStyle = 'solid'
                  e.currentTarget.style.background = '#f8f8f8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderStyle = 'dashed'
                  e.currentTarget.style.background = '#ffffff'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>
                    {node.icon}
                  </span>
                  <strong style={{ fontSize: '0.75rem' }}>{node.label}</strong>
                </div>
                <p style={{ 
                  fontSize: '0.65rem', 
                  color: '#666',
                  lineHeight: 1.3,
                  margin: 0
                }}>
                  {node.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card hover={false} style={{ marginTop: '1rem' }}>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button variant="outline" size="small">
              📋 Standard Flow
            </Button>
            <Button variant="outline" size="small">
              🚀 Quick Process
            </Button>
            <Button variant="outline" size="small">
              🔧 Custom Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NodePalette