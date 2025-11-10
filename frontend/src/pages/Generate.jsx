import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, Database, Loader, CheckCircle, AlertCircle, Shield, Table as TableIcon } from 'lucide-react'
import { descriptionService } from '../services/api'

export default function Generate() {
  const [catalog, setCatalog] = useState('')
  const [schema, setSchema] = useState('')
  const [selectedTables, setSelectedTables] = useState([])
  const [results, setResults] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const queryClient = useQueryClient()

  // Fetch catalogs
  const { data: catalogsData } = useQuery({
    queryKey: ['catalogs'],
    queryFn: descriptionService.getCatalogs,
  })

  // Fetch schemas when catalog changes
  const { data: schemasData, refetch: refetchSchemas } = useQuery({
    queryKey: ['schemas', catalog],
    queryFn: () => descriptionService.getSchemas(catalog),
    enabled: !!catalog,
  })

  // Fetch tables when schema changes
  const { data: tablesData, refetch: refetchTables } = useQuery({
    queryKey: ['tables', catalog, schema],
    queryFn: () => descriptionService.getTables(catalog, schema),
    enabled: !!catalog && !!schema,
  })

  // Check permissions when catalog/schema changes
  const checkPermissionsMutation = useMutation({
    mutationFn: (params) => descriptionService.checkPermissions(params),
    onSuccess: (data) => {
      setPermissions(data.permissions)
    },
  })

  useEffect(() => {
    if (catalog && schema) {
      checkPermissionsMutation.mutate({ catalog, schema })
    }
  }, [catalog, schema])

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: (params) => descriptionService.generate(params),
    onSuccess: (data) => {
      setResults(data.results)
      queryClient.invalidateQueries(['stats'])
      queryClient.invalidateQueries(['pending-reviews'])
    },
  })

  const handleCatalogChange = (newCatalog) => {
    setCatalog(newCatalog)
    setSchema('')
    setSelectedTables([])
    setPermissions(null)
  }

  const handleSchemaChange = (newSchema) => {
    setSchema(newSchema)
    setSelectedTables([])
  }

  const handleTableToggle = (tableName) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    )
  }

  const handleSelectAll = () => {
    if (tablesData?.tables) {
      setSelectedTables(tablesData.tables.map(t => t.table_name))
    }
  }

  const handleDeselectAll = () => {
    setSelectedTables([])
  }

  const handleGenerate = () => {
    if (!catalog || !schema) {
      alert('Please select catalog and schema')
      return
    }

    if (!permissions?.can_modify) {
      alert('You do not have permission to modify tables in this schema')
      return
    }

    if (selectedTables.length === 0) {
      alert('Please select at least one table')
      return
    }

    const params = {
      catalog,
      schema,
      tables: selectedTables,
    }

    const confirmMsg = `Generate descriptions for ${selectedTables.length} selected table(s)?`

    if (confirm(confirmMsg)) {
      setResults(null)
      generateMutation.mutate(params)
    }
  }

  const tables = tablesData?.tables || []
  const canGenerate = catalog && schema && permissions?.can_modify

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Generate Descriptions</h2>
            <p className="text-purple-100">
              Select catalog, schema, and tables - then use AI to generate descriptions
            </p>
          </div>
          <Sparkles className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Selection Form */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Select Target</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Catalog Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catalog *
            </label>
            <select
              value={catalog}
              onChange={(e) => handleCatalogChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
            >
              <option value="">-- Select Catalog --</option>
              {catalogsData?.catalogs?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Schema Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Schema *
            </label>
            <select
              value={schema}
              onChange={(e) => handleSchemaChange(e.target.value)}
              disabled={!catalog}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Select Schema --</option>
              {schemasData?.schemas?.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permissions Display */}
        {permissions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg border ${
              permissions.can_modify
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <Shield className={`w-5 h-5 flex-shrink-0 ${
                permissions.can_modify ? 'text-green-600' : 'text-red-600'
              }`} />
              <div className="flex-1">
                <p className={`font-semibold ${
                  permissions.can_modify ? 'text-green-900' : 'text-red-900'
                }`}>
                  {permissions.can_modify ? 'Access Granted' : 'Insufficient Permissions'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  User: {permissions.user}
                </p>
                {permissions.errors && permissions.errors.length > 0 && (
                  <ul className="text-sm text-red-800 mt-2 space-y-1">
                    {permissions.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
                {permissions.can_modify && (
                  <p className="text-sm text-green-700 mt-2">
                    ✓ You have SELECT and MODIFY permissions for this schema
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table Selection */}
      {catalog && schema && permissions?.can_modify && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">2. Select Tables</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="btn btn-secondary text-sm"
                disabled={tables.length === 0}
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="btn btn-secondary text-sm"
                disabled={selectedTables.length === 0}
              >
                Deselect All
              </button>
            </div>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading tables from {catalog}.{schema}...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map((table) => (
              <label
                key={table.table_name}
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.table_name)}
                  onChange={() => handleTableToggle(table.table_name)}
                  className="w-5 h-5 text-databricks-red rounded focus:ring-2 focus:ring-databricks-red"
                />
                <div className="ml-4 flex-1">
                  <p className="font-mono font-semibold text-gray-900">
                    {table.table_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {table.column_count} columns
                    {table.current_comment && ' • Has description'}
                  </p>
                </div>
                {table.current_comment && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Already documented
                  </span>
                )}
              </label>
            ))}
            </div>
          )}

          {tables.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900">
                <strong>{selectedTables.length}</strong> of <strong>{tables.length}</strong> table(s) selected
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !canGenerate || selectedTables.length === 0}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 py-4 text-lg mt-6"
          >
            {generateMutation.isPending ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate for {selectedTables.length} Table(s)</span>
              </>
            )}
          </motion.button>
        </div>
      )}

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
    </div>
  )
}
