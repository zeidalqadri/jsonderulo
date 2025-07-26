import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const SchemaDesigner: React.FC = () => {
  const [selectedSchema, setSelectedSchema] = useState<any>(null)
  const [schemaCode, setSchemaCode] = useState(`{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the item"
    },
    "value": {
      "type": "number",
      "description": "The numeric value"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["name", "value"]
}`)

  const mockSchemas = [
    { id: '1', name: 'User Profile', description: 'Standard user profile schema', version: 1 },
    { id: '2', name: 'Product Catalog', description: 'E-commerce product schema', version: 2 },
    { id: '3', name: 'Analytics Event', description: 'Event tracking schema', version: 1 },
  ]

  const mockTemplates = [
    { id: '1', name: 'Basic Object', category: 'Common' },
    { id: '2', name: 'API Response', category: 'Web' },
    { id: '3', name: 'Configuration', category: 'System' },
  ]

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Schema Designer</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline">Import Schema</Button>
          <Button>Save Schema</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 200px)' }}>
        {/* Schema Library */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card hover={false}>
            <CardHeader>
              <CardTitle>Schema Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mockSchemas.map((schema) => (
                  <div
                    key={schema.id}
                    style={{
                      padding: '0.75rem',
                      border: selectedSchema?.id === schema.id ? '2px solid #000' : '1px dashed #ccc',
                      cursor: 'pointer',
                      background: selectedSchema?.id === schema.id ? '#f8f8f8' : 'transparent'
                    }}
                    onClick={() => setSelectedSchema(schema)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {schema.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {schema.description}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>
                      v{schema.version}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card hover={false}>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mockTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="small"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {template.name}
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#666',
                      marginLeft: 'auto'
                    }}>
                      {template.category}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schema Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Card hover={false} style={{ flex: 1 }}>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Schema Editor</CardTitle>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="small">Visual</Button>
                  <Button size="small">JSON</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent style={{ height: 'calc(100% - 80px)' }}>
              <textarea
                value={schemaCode}
                onChange={(e) => setSchemaCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  border: '1px solid #ccc',
                  padding: '1rem',
                  background: '#f8f8f8',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Schema Properties */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card hover={false}>
            <CardHeader>
              <CardTitle>Schema Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <Input label="Schema Name" value="New Schema" />
              <Input label="Description" value="" />
              <Input label="Version" type="number" value="1" />
              
              <div style={{ marginTop: '1rem' }}>
                <label className="label">
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  Public Schema
                </label>
                <label className="label">
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  Strict Validation
                </label>
              </div>
            </CardContent>
          </Card>

          <Card hover={false}>
            <CardHeader>
              <CardTitle>Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{
                padding: '0.75rem',
                background: '#f8f8f8',
                border: '1px solid #000',
                fontSize: '0.75rem'
              }}>
                <div style={{ color: '#000', marginBottom: '0.5rem' }}>
                  ✓ Schema is valid JSON
                </div>
                <div style={{ color: '#000', marginBottom: '0.5rem' }}>
                  ✓ All required fields present
                </div>
                <div style={{ color: '#666' }}>
                  ⚠ Consider adding examples
                </div>
              </div>
              
              <Button variant="outline" style={{ width: '100%', marginTop: '1rem' }}>
                Test with Sample Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SchemaDesigner