import React, { useState } from 'react'
import { Node } from 'reactflow'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

interface NodeConfigPanelProps {
  node: Node
  onUpdateNode: (nodeId: string, data: any) => void
  onClose: () => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdateNode, onClose }) => {
  const [config, setConfig] = useState(node.data.config || {})

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdateNode(node.id, { config: newConfig })
  }

  const getNodeSpecificConfig = () => {
    switch (node.data.nodeType) {
      case 'idea-input':
        return (
          <div>
            <Input
              label="Input Format"
              value={config.inputFormat || 'text'}
              onChange={(e) => handleConfigChange('inputFormat', e.target.value)}
            />
            <Input
              label="Max Length"
              type="number"
              value={config.maxLength || 1000}
              onChange={(e) => handleConfigChange('maxLength', parseInt(e.target.value))}
            />
            <label className="label">
              <input
                type="checkbox"
                checked={config.requireValidation || false}
                onChange={(e) => handleConfigChange('requireValidation', e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Require Validation
            </label>
          </div>
        )

      case 'query-construction':
        return (
          <div>
            <Input
              label="Query Template"
              value={config.queryTemplate || ''}
              onChange={(e) => handleConfigChange('queryTemplate', e.target.value)}
            />
            <Input
              label="Max Tokens"
              type="number"
              value={config.maxTokens || 2048}
              onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
            />
          </div>
        )

      case 'llm-execution':
        return (
          <div>
            <label className="label">Provider</label>
            <select
              value={config.provider || 'anthropic'}
              onChange={(e) => handleConfigChange('provider', e.target.value)}
              className="input"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="local">Local</option>
            </select>

            <Input
              label="Model"
              value={config.model || 'claude-3-sonnet'}
              onChange={(e) => handleConfigChange('model', e.target.value)}
            />

            <Input
              label="Temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.temperature || 0.7}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            />
          </div>
        )

      case 'output-validation':
        return (
          <div>
            <Input
              label="Schema ID"
              value={config.schemaId || ''}
              onChange={(e) => handleConfigChange('schemaId', e.target.value)}
            />
            <label className="label">
              <input
                type="checkbox"
                checked={config.strictValidation || true}
                onChange={(e) => handleConfigChange('strictValidation', e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Strict Validation
            </label>
          </div>
        )

      default:
        return (
          <div>
            <Input
              label="Custom Config (JSON)"
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setConfig(parsed)
                  onUpdateNode(node.id, { config: parsed })
                } catch (err) {
                  // Invalid JSON, don't update
                }
              }}
            />
          </div>
        )
    }
  }

  return (
    <div style={{ height: '100%', padding: '1rem' }}>
      <Card hover={false}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>Configure Node</CardTitle>
            <Button variant="outline" size="small" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0.75rem', 
              background: '#f8f8f8', 
              border: '1px solid #ccc',
              marginBottom: '1rem'
            }}>
              <strong>{node.data.label}</strong>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                Type: {node.data.nodeType}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                ID: {node.id}
              </div>
            </div>

            <Input
              label="Node Label"
              value={node.data.label}
              onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
            />
          </div>

          <div style={{
            borderTop: '1px solid #ccc',
            paddingTop: '1rem',
            marginTop: '1rem'
          }}>
            <h4 style={{ marginBottom: '1rem' }}>Node Configuration</h4>
            {getNodeSpecificConfig()}
          </div>

          <div style={{
            borderTop: '1px solid #ccc',
            paddingTop: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="small">
                Test Node
              </Button>
              <Button variant="outline" size="small">
                Reset Config
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Metrics */}
      {node.data.metrics && (
        <Card hover={false} style={{ marginTop: '1rem' }}>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              {node.data.metrics.duration && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Duration:</span>
                  <span>{node.data.metrics.duration}ms</span>
                </div>
              )}
              {node.data.metrics.cost && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cost:</span>
                  <span>${node.data.metrics.cost.toFixed(4)}</span>
                </div>
              )}
              {node.data.metrics.tokens && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tokens:</span>
                  <span>{node.data.metrics.tokens}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NodeConfigPanel