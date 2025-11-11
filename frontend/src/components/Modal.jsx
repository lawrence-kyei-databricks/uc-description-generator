import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "default" }) => {
  if (!isOpen) return null

  const typeStyles = {
    default: {
      bg: 'from-databricks-red to-red-600',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      buttonBg: 'bg-databricks-red hover:bg-red-700',
    },
    warning: {
      bg: 'from-yellow-500 to-yellow-600',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      bg: 'from-red-500 to-red-600',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    info: {
      bg: 'from-blue-500 to-blue-600',
      icon: Info,
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const style = typeStyles[type] || typeStyles.default
  const Icon = style.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${style.bg} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-lg">{message}</p>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white ${style.buttonBg} transition-colors shadow-lg`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export const AlertModal = ({ isOpen, onClose, title, message, type = "info" }) => {
  if (!isOpen) return null

  const typeStyles = {
    success: {
      bg: 'from-green-500 to-green-600',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      bg: 'from-red-500 to-red-600',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      bg: 'from-yellow-500 to-yellow-600',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      bg: 'from-blue-500 to-blue-600',
      icon: Info,
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const style = typeStyles[type] || typeStyles.info
  const Icon = style.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${style.bg} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-lg">{message}</p>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white ${style.buttonBg} transition-colors shadow-lg`}
              >
                OK
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
