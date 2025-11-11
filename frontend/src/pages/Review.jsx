import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Edit2,
  Database,
  Table,
  Columns,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { descriptionService } from '../services/api'
import { ConfirmModal, AlertModal } from '../components/Modal'

const ReviewCard = ({ item, onReview, isSubmitting, isProcessingItem, onShowAlert, onShowConfirm }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState(item.ai_generated_description)
  const [reviewer, setReviewer] = useState('')

  const isTable = item.object_type === 'TABLE'
  const isProcessing = isProcessingItem === item.id

  const handleApprove = async () => {
    if (!reviewer.trim()) {
      onShowAlert({
        title: 'Reviewer Required',
        message: 'Please enter your name or email as reviewer',
        type: 'warning'
      })
      return
    }
    await onReview(item.id, 'APPROVED', editedDescription, reviewer)
  }

  const handleReject = async () => {
    if (!reviewer.trim()) {
      onShowAlert({
        title: 'Reviewer Required',
        message: 'Please enter your name or email as reviewer',
        type: 'warning'
      })
      return
    }
    onShowConfirm({
      message: 'Are you sure you want to reject this description?',
      onConfirm: () => onReview(item.id, 'REJECTED', null, reviewer)
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card hover:shadow-lg transition-all relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {isTable ? (
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Table className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Columns className="w-5 h-5 text-purple-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              {item.object_type}
            </p>
            <p className="font-mono text-sm font-bold text-gray-900 break-all">
              {item.object_path}
            </p>
          </div>
        </div>
        <span className="badge badge-pending flex-shrink-0 ml-2">PENDING</span>
      </div>

      {/* Column Type (if column) */}
      {!isTable && item.column_data_type && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Data Type</p>
          <code className="text-sm font-semibold text-gray-900">{item.column_data_type}</code>
        </div>
      )}

      {/* AI Generated Description */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            AI Generated Description
          </label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-databricks-red hover:text-red-700 flex items-center space-x-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
            rows="4"
          />
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-gray-900 break-words">{editedDescription}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          Generated: {new Date(item.generated_at).toLocaleString()}
        </span>
        <span className="font-mono">Model: {item.model_used?.split('-').pop()}</span>
      </div>

      {/* Reviewer Input */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Reviewer Name/Email *
        </label>
        <input
          type="text"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="Enter your name or email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-databricks-red focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          onClick={handleApprove}
          disabled={isProcessing}
          className={`flex-1 btn btn-success flex items-center justify-center space-x-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          onClick={handleReject}
          disabled={isProcessing}
          className={`flex-1 btn btn-danger flex items-center justify-center space-x-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <XCircle className="w-4 h-4" />
          <span>Reject</span>
        </motion.button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-databricks-red mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Updating...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function Review() {
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState('ALL')
  const [processingItemId, setProcessingItemId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: () => {} })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-reviews', page],
    queryFn: () => descriptionService.getPendingReviews(page, 20),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, description, reviewer }) =>
      descriptionService.updateReview(id, {
        status,
        approved_description: description,
        reviewer,
      }),
    onMutate: async ({ id }) => {
      // Set processing state
      setProcessingItemId(id)

      // Cancel outgoing refetches
      await queryClient.cancelQueries(['pending-reviews'])

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['pending-reviews', page])

      // Optimistically update - remove item from list
      queryClient.setQueryData(['pending-reviews', page], (old) => ({
        ...old,
        pending: old?.pending?.filter(item => item.id !== id) || []
      }))

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['pending-reviews', page], context.previousData)
      setProcessingItemId(null)
    },
    onSuccess: () => {
      // Clear processing state on success
      setProcessingItemId(null)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['pending-reviews'])
      queryClient.invalidateQueries(['stats'])
    },
  })

  const handleReview = (id, status, description, reviewer) => {
    reviewMutation.mutate({ id, status, description, reviewer })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-databricks-red"></div>
      </div>
    )
  }

  const items = data?.pending || []
  const filteredItems = filterType === 'ALL'
    ? items
    : items.filter(item => item.object_type === filterType)

  return (
    <div className="space-y-6">
      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title="Confirm Rejection"
        message={confirmModal.message}
        confirmText="Reject"
        type="danger"
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Header */}
      <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Review Queue</h2>
            <p className="text-green-100">
              Review and approve AI-generated descriptions before applying to Unity Catalog
            </p>
          </div>
          <CheckCircle className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-2">
              {['ALL', 'TABLE', 'COLUMN'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${filterType === type
                      ? 'bg-databricks-red text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{filteredItems.length}</p>
            <p className="text-sm text-gray-500">Items pending review</p>
          </div>
        </div>
      </div>

      {/* Review Cards */}
      {filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">No descriptions pending review at the moment.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  onReview={handleReview}
                  isProcessingItem={processingItemId}
                  onShowAlert={(alert) => setAlertModal({ ...alert, isOpen: true })}
                  onShowConfirm={(confirm) => setConfirmModal({ ...confirm, isOpen: true })}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {items.length === 20 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-gray-600">Page {page}</span>

              <button
                onClick={() => setPage(page + 1)}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Bulk Actions (future enhancement) */}
      <div className="card bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Need to review in bulk?</h4>
            <p className="text-sm text-gray-600">
              Export pending reviews to CSV and use SQL to bulk approve after review
            </p>
          </div>
          <button className="btn btn-secondary" disabled>
            Export CSV (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
