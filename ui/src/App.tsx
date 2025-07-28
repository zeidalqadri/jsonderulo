import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PromptStudio from './features/prompt-studio/PromptStudio'
import PipelineBuilder from './features/pipeline-builder/PipelineBuilder'
import Monitoring from './features/monitoring/Monitoring'
import SchemaDesigner from './features/schema-designer/SchemaDesigner'
import Testing from './features/testing/Testing'
import Analytics from './features/analytics/Analytics'
import V2Demo from './pages/V2Demo'

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Unified Prompt Engineering Studio */}
        <Route path="/" element={<PromptStudio />} />
        <Route path="/studio" element={<PromptStudio />} />
        
        {/* Legacy redirects to unified studio */}
        <Route path="/optimizer" element={<Navigate to="/studio" replace />} />
        <Route path="/execute" element={<Navigate to="/studio" replace />} />
        
        {/* Pipeline and Infrastructure */}
        <Route path="/builder" element={<PipelineBuilder />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/schemas" element={<SchemaDesigner />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Advanced Features */}
        <Route path="/v2-demo" element={<V2Demo />} />
        
        {/* Catch-all route - redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App