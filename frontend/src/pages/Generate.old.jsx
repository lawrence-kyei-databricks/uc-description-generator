import { useState } from 'react'
import { useMutation, useQueryClient } from '@antml:query'
import { motion } from 'framer-motion'
import { Sparkles, Database, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { descriptionService } from '../services/api'

export default function Generate() {
  const [catalog, setCatalog] = useState('main')
  const [schema, setSchema] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [results, setResults] = useState(null)
  const queryClient = useQueryClient()

  const generateMutation = useMutation({
    mutationFn: (params) => descriptionService.generate(params),
    onSuccess: (data) => {
      setResults(data.results)
      queryClient.invalidateQueries(['stats'])
      queryClient.invalidateQueries(['pending-reviews'])
    },
  })

  const handleGenerate = () => {
    if (!catalog.trim()) {
      alert('Please enter a catalog name')
      return
    }

    if (confirm(`Generate descriptions for ${batchSize} tables in ${catalog}${schema ? `.${schema}` : ''}?`)) {
      setResults(null)
      generateMutation.mutate({
        catalog,
        schema: schema || null,
        batch_size: batchSize,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Generate Descriptions</h2>
            <p className="text-purple-100">
              Use AI to automatically generate table and column descriptions at scale
            </p>
          </div>
          <Sparkles className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Configuration</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catalog Name *
            </label>
            <input
              type="text"
              value={catalog}
              onChange={(e) => setCatalog(e.target.value)}
              placeholder="e.g., main"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              The Unity Catalog catalog containing tables to document
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Schema Name (Optional)
            </label>
            <input
              type="text"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder="Leave empty for all schemas"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Specific schema to process, or leave empty to process all schemas
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Batch Size
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
              min="1"
              max="100"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of tables to process in this batch (1-100)
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 py-4 text-lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Descriptions</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Results */}
      {generateMutation.isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-red-50 border border-red-200"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">Error</h4>
              <p className="text-red-800">{generateMutation.error.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">Generation Complete</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{results.total_found}</p>
              <p className="text-sm text-gray-600">Tables Found</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{results.processing}</p>
              <p className="text-sm text-gray-600">Processed</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{results.generated}</p>
              <p className="text-sm text-gray-600">Generated</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{results.errors}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>

          {results.items && results.items.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Sample Generated Descriptions</h4>
              <div className="space-y-3">
                {results.items.slice(0, 5).map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      {item.type === 'TABLE' ? (
                        <Database className="w-4 h-4 text-blue-600" />
                      ) : (
                        <div className="w-4 h-4 text-purple-600">•</div>
                      )}
                      <code className="text-sm font-mono font-bold">{item.path}</code>
                    </div>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              <strong>Next Step:</strong> Navigate to the Review page to approve these descriptions
              before applying them to Unity Catalog.
            </p>
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <div className="card bg-gray-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-databricks-red text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">Metadata Extraction</p>
              <p className="text-sm text-gray-600">
                Extracts table and column metadata from Unity Catalog, including data types and sample data
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-databricks-red text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-gray-900">AI Generation</p>
              <p className="text-sm text-gray-600">
                Calls Databricks Foundation Model API (Llama 3.1 70B) with context-rich prompts
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-databricks-red text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-gray-900">Storage & Review</p>
              <p className="text-sm text-gray-600">
                Stores descriptions in governance table for human review and approval
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
