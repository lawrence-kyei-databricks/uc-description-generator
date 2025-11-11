import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Users, Clock, Download, CheckCircle2, Upload } from 'lucide-react'
import { descriptionService } from '../services/api'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']

export default function Compliance() {
  const [isApplying, setIsApplying] = useState(false)
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: descriptionService.getStats,
  })

  const { data: schemaProgress } = useQuery({
    queryKey: ['schema-progress'],
    queryFn: descriptionService.getSchemaProgress,
  })

  const { data: reviewActivity } = useQuery({
    queryKey: ['review-activity'],
    queryFn: descriptionService.getReviewActivity,
  })

  const applyMutation = useMutation({
    mutationFn: descriptionService.applyDescriptions,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['stats'])
      queryClient.invalidateQueries(['schema-progress'])
      alert(`Successfully applied ${data.results?.applied_count || 0} descriptions to Unity Catalog!`)
      setIsApplying(false)
    },
    onError: (error) => {
      alert(`Failed to apply descriptions: ${error.message}`)
      setIsApplying(false)
    },
  })

  const handleApply = async () => {
    if (!statsData.approved || statsData.approved === 0) {
      alert('No approved descriptions to apply')
      return
    }

    if (confirm(`Apply ${statsData.approved} approved descriptions to Unity Catalog?`)) {
      setIsApplying(true)
      applyMutation.mutate()
    }
  }

  const statsData = stats?.stats || {}
  const schemas = schemaProgress?.schema_progress || []

  // Prepare pie chart data
  const pieData = [
    { name: 'Applied', value: statsData.applied || 0, color: COLORS[0] },
    { name: 'Approved', value: statsData.approved || 0, color: COLORS[1] },
    { name: 'Pending', value: statsData.pending || 0, color: COLORS[2] },
    { name: 'Rejected', value: statsData.rejected || 0, color: COLORS[3] },
  ].filter(item => item.value > 0)

  // Compliance score
  const complianceScore = statsData.total
    ? ((statsData.applied / statsData.total) * 100).toFixed(1)
    : 0

  const complianceGrade =
    complianceScore >= 90 ? 'A' :
    complianceScore >= 80 ? 'B' :
    complianceScore >= 70 ? 'C' :
    complianceScore >= 60 ? 'D' : 'F'

  const gradeColor =
    complianceGrade === 'A' ? 'text-green-600' :
    complianceGrade === 'B' ? 'text-blue-600' :
    complianceGrade === 'C' ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Compliance Dashboard</h2>
            <p className="text-blue-100">
              Track documentation coverage and compliance status across Unity Catalog
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: isApplying ? 1 : 1.05 }}
              whileTap={{ scale: isApplying ? 1 : 0.95 }}
              onClick={handleApply}
              disabled={isApplying || !statsData.approved || statsData.approved === 0}
              className={`
                px-6 py-3 rounded-lg font-semibold shadow-lg
                flex items-center space-x-2 transition-all
                ${isApplying || !statsData.approved || statsData.approved === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Apply {statsData.approved || 0} Approved</span>
                </>
              )}
            </motion.button>
            <Shield className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card bg-gradient-to-br from-white to-gray-50"
        >
          <div className="text-center">
            <Shield className="w-12 h-12 text-databricks-red mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Compliance Score
            </p>
            <div className={`text-6xl font-bold ${gradeColor} mb-2`}>
              {complianceGrade}
            </div>
            <p className="text-2xl font-bold text-gray-900">{complianceScore}%</p>
            <p className="text-sm text-gray-500 mt-2">
              {statsData.applied} / {statsData.total} items documented
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tables Documented
              </p>
              <p className="text-4xl font-bold text-gray-900">{statsData.tables || 0}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
            <span>All tables being tracked</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Columns Documented
              </p>
              <p className="text-4xl font-bold text-gray-900">{statsData.columns || 0}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
            <span>Column-level documentation</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schema Completion */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Schema Completion Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schemas.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="schema_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pct_complete" fill="#FF3621" name="% Complete" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Schema Progress Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Schema Progress Details</h3>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700">Schema</th>
                <th className="text-right p-4 font-semibold text-gray-700">Total Items</th>
                <th className="text-right p-4 font-semibold text-gray-700">Completed</th>
                <th className="text-right p-4 font-semibold text-gray-700">Pending</th>
                <th className="text-right p-4 font-semibold text-gray-700">Progress</th>
                <th className="text-center p-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {schemas.map((schema, index) => (
                <motion.tr
                  key={schema.schema_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <code className="font-mono text-sm font-semibold">{schema.schema_name}</code>
                  </td>
                  <td className="p-4 text-right">{schema.total}</td>
                  <td className="p-4 text-right text-green-600 font-semibold">
                    {schema.completed}
                  </td>
                  <td className="p-4 text-right text-yellow-600 font-semibold">
                    {schema.pending}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-databricks-red to-red-600"
                          style={{ width: `${schema.pct_complete}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{schema.pct_complete}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {schema.pct_complete === 100 ? (
                      <span className="badge badge-applied">Complete</span>
                    ) : schema.pct_complete >= 75 ? (
                      <span className="badge badge-approved">On Track</span>
                    ) : schema.pct_complete >= 50 ? (
                      <span className="badge badge-pending">In Progress</span>
                    ) : (
                      <span className="badge badge-rejected">Needs Attention</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Recommendations */}
      <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
        <div className="flex items-start space-x-4">
          <Shield className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Compliance Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {complianceScore < 100 && (
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>
                    <strong>{statsData.pending || 0}</strong> descriptions pending review - prioritize review workflow
                  </span>
                </li>
              )}
              {schemas.some(s => s.pct_complete < 50) && (
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>
                    Some schemas have low completion rates - consider generating more descriptions
                  </span>
                </li>
              )}
              <li className="flex items-start space-x-2">
                <span className="text-green-600">•</span>
                <span>
                  All descriptions are tracked with full audit trail for compliance purposes
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
