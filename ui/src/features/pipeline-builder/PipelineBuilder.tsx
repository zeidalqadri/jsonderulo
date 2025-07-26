import React, { useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'

import PipelineNode from './PipelineNode'
import NodePalette from './NodePalette'
import NodeConfigPanel from './NodeConfigPanel'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PipelineNodeType } from '../../types/pipeline'

const nodeTypes = {
  pipeline: PipelineNode,
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const PipelineBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline')

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'default',
      style: { stroke: '#000', strokeWidth: 2, strokeDasharray: '5,5' }
    }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addNode = useCallback((type: PipelineNodeType) => {
    const id = `node_${Date.now()}`
    const newNode: Node = {
      id,
      type: 'pipeline',
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: type.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        nodeType: type,
        status: 'idle'
      },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    )
  }, [setNodes])

  const savePipeline = useCallback(() => {
    const pipeline = {
      name: pipelineName,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source!,
        target: edge.target!,
        type: 'dashed'
      }))
    }
    console.log('Saving pipeline:', pipeline)
    // TODO: Implement API call to save pipeline
  }, [pipelineName, nodes, edges])

  const executePipeline = useCallback(() => {
    console.log('Executing pipeline with nodes:', nodes)
    // TODO: Implement pipeline execution
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, status: 'running' }
      }))
    )
  }, [nodes, setNodes])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '2px solid #000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1>Pipeline Builder</h1>
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.875rem',
              color: '#666',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={savePipeline}>Save Pipeline</Button>
          <Button variant="primary" onClick={executePipeline}>
            Execute
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Node Palette */}
        <div style={{ 
          width: '280px', 
          borderRight: '1px solid #ccc',
          padding: '1rem',
          background: '#f8f8f8'
        }}>
          <NodePalette onAddNode={addNode} />
        </div>

        {/* Flow Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#ffffff' }}
          >
            <Controls />
            <MiniMap 
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #000'
              }}
              nodeColor="#000"
              nodeStrokeWidth={2}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1}
              color="#ccc"
            />
          </ReactFlow>
        </div>

        {/* Configuration Panel */}
        {selectedNode && (
          <div style={{ 
            width: '320px', 
            borderLeft: '1px solid #ccc',
            background: '#ffffff'
          }}>
            <NodeConfigPanel 
              node={selectedNode} 
              onUpdateNode={updateNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PipelineBuilder