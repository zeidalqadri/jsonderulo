import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PipelineBuilder from './features/pipeline-builder/PipelineBuilder'
import Monitoring from './features/monitoring/Monitoring'
import SchemaDesigner from './features/schema-designer/SchemaDesigner'
import Testing from './features/testing/Testing'
import Analytics from './features/analytics/Analytics'

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PipelineBuilder />} />
        <Route path="/builder" element={<PipelineBuilder />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/schemas" element={<SchemaDesigner />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="/analytics" element={<Analytics />} />
        {/* Catch-all route - redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App