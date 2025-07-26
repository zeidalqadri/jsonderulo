import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

interface PipelineNodeData {
  label: string
  nodeType: string
  status?: 'idle' | 'running' | 'completed' | 'error'
  metrics?: {
    duration?: number
    cost?: number
    tokens?: number
  }
}

const PipelineNode: React.FC<NodeProps<PipelineNodeData>> = ({ data, selected }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return '#666'
      case 'completed': return '#000'
      case 'error': return '#999'
      default: return '#ccc'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running': return '⚡'
      case 'completed': return '✓'
      case 'error': return '✗'
      default: return '○'
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: selected ? '3px solid #000' : '2px solid #000',
        borderRadius: 0,
        padding: '12px 16px',
        minWidth: '160px',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        boxShadow: selected ? '4px 4px 0px #000' : '2px 2px 0px #000',
        transition: 'all 0.1s ease'
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        style={{
          background: '#000',
          border: '1px solid #000',
          width: '8px',
          height: '8px'
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <span 
          style={{ 
            color: getStatusColor(data.status),
            marginRight: '6px',
            fontSize: '12px'
          }}
        >
          {getStatusIcon(data.status)}
        </span>
        <strong style={{ fontSize: '0.75rem' }}>{data.label}</strong>
      </div>
      
      <div style={{ 
        fontSize: '0.7rem', 
        color: '#666',
        borderTop: '1px dashed #ccc',
        paddingTop: '4px',
        marginTop: '4px'
      }}>
        {data.nodeType}
      </div>

      {data.metrics && (
        <div style={{
          fontSize: '0.6rem',
          color: '#999',
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {data.metrics.duration && <span>{data.metrics.duration}ms</span>}
          {data.metrics.cost && <span>${data.metrics.cost.toFixed(4)}</span>}
          {data.metrics.tokens && <span>{data.metrics.tokens}tk</span>}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{
          background: '#000',
          border: '1px solid #000',
          width: '8px',
          height: '8px'
        }}
      />
    </div>
  )
}

export default PipelineNode