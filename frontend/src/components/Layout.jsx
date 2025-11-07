import { Link, useLocation } from 'react-router-dom'
import { Database, FileText, CheckCircle, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import carmaxLogo from '../assets/carmax-logo.png'

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/generate', label: 'Generate', icon: FileText },
  { path: '/review', label: 'Review', icon: CheckCircle },
  { path: '/compliance', label: 'Compliance', icon: Database },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <img src={carmaxLogo} alt="CarMax" className="h-12" />
              <div className="border-l border-gray-300 h-12"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Unity Catalog Description Generator
                </h1>
                <p className="text-sm text-gray-500">
                  AI-Powered Documentation for Compliance
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1 pb-4">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${isActive
                      ? 'bg-databricks-red text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-databricks-red rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Powered by Databricks Foundation Models | Built for CarMax
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Database className="w-4 h-4" />
              <span>Unity Catalog Integration</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
