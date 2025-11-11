import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Database,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { descriptionService } from '../services/api'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ConfirmModal, AlertModal } from '../components/Modal'

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="card"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
          {label}
        </p>
        <p className="text-4xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
        {trend && (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
)

export default function Dashboard() {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: () => {} })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: descriptionService.getStats,
    refetchInterval: 10000, // Refresh every 10s
  })

  const { data: schemaProgress } = useQuery({
    queryKey: ['schema-progress'],
    queryFn: descriptionService.getSchemaProgress,
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-databricks-red"></div>
      </div>
    )
  }

  const completionRate = stats?.stats?.total
    ? ((stats.stats.applied / stats.stats.total) * 100).toFixed(1)
    : 0

  const chartData = schemaProgress?.schema_progress?.slice(0, 10).map(schema => ({
    name: schema.schema_name,
    completed: schema.completed,
    pending: schema.pending,
    total: schema.total,
  })) || []

  return (
    <div className="space-y-8">
      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title="Apply to Unity Catalog"
        message={confirmModal.message}
        confirmText="Apply"
        type="info"
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Hero Section */}
      <div className="card bg-gradient-to-r from-databricks-red to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/carmax-logo.png"
              alt="CarMax Logo"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h2 className="text-3xl font-bold mb-2">Unity Catalog Description Generator</h2>
              <p className="text-red-100 text-lg">
                AI-powered table and column documentation for compliance and governance
              </p>
            </div>
          </div>
          <Database className="w-20 h-20 opacity-50" />
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Database}
          label="Total Items"
          value={stats?.stats?.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={stats?.stats?.pending}
          color="bg-yellow-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Approved"
          value={stats?.stats?.approved}
          color="bg-green-500"
        />
        <StatCard
          icon={FileText}
          label="Applied to UC"
          value={stats?.stats?.applied}
          color="bg-purple-500"
          trend={`${completionRate}% complete`}
        />
      </div>

      {/* Progress Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Overall Progress</h3>
          <span className="text-3xl font-bold text-databricks-red">{completionRate}%</span>
        </div>

        <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-databricks-red to-red-600 rounded-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.stats?.tables || 0}</p>
            <p className="text-sm text-gray-500">Tables</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.stats?.columns || 0}</p>
            <p className="text-sm text-gray-500">Columns</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.stats?.rejected || 0}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
        </div>
      </div>

      {/* Schema Progress Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Progress by Schema</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/generate">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-databricks-red"
          >
            <FileText className="w-12 h-12 text-databricks-red mb-4" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">Generate Descriptions</h4>
            <p className="text-sm text-gray-600">
              Use AI to generate table and column descriptions
            </p>
          </motion.div>
        </Link>

        <Link to="/review">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-databricks-red"
          >
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">Review Queue</h4>
            <p className="text-sm text-gray-600">
              Review and approve AI-generated descriptions
            </p>
          </motion.div>
        </Link>

        <Link to="/compliance">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-databricks-red"
          >
            <Database className="w-12 h-12 text-blue-600 mb-4" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">Compliance Dashboard</h4>
            <p className="text-sm text-gray-600">
              View documentation coverage and compliance status
            </p>
          </motion.div>
        </Link>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-databricks-red"
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              message: 'Apply all approved descriptions to Unity Catalog?',
              onConfirm: async () => {
                try {
                  await descriptionService.applyDescriptions()
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Descriptions applied successfully!',
                    type: 'success'
                  })
                  window.location.reload()
                } catch (error) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Error',
                    message: error.message,
                    type: 'error'
                  })
                }
              }
            })
          }}
        >
          <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
          <h4 className="text-lg font-bold text-gray-900 mb-2">Apply to UC</h4>
          <p className="text-sm text-gray-600">
            Apply approved descriptions to Unity Catalog
          </p>
        </motion.div>
      </div>

      {/* Alert if setup needed */}
      {stats?.stats?.total === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-yellow-50 border border-yellow-200"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-bold text-yellow-900 mb-2">Getting Started</h4>
              <p className="text-yellow-800 mb-4">
                No data found. Initialize the governance table to begin tracking descriptions.
              </p>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await descriptionService.setup()
                    setAlertModal({
                      isOpen: true,
                      title: 'Setup Complete',
                      message: 'Setup complete! Navigate to Generate to start creating descriptions.',
                      type: 'success'
                    })
                    window.location.reload()
                  } catch (error) {
                    setAlertModal({
                      isOpen: true,
                      title: 'Error',
                      message: error.message,
                      type: 'error'
                    })
                  }
                }}
              >
                Initialize Setup
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
