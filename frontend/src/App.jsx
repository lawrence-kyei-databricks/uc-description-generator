import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import Review from './pages/Review'
import Compliance from './pages/Compliance'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/review" element={<Review />} />
        <Route path="/compliance" element={<Compliance />} />
      </Routes>
    </Layout>
  )
}

export default App
