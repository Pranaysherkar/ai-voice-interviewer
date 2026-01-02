import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import JobDescriptions from './pages/JobDescriptions'
import QuestionBanks from './pages/QuestionBanks'
import Interviews from './pages/Interviews'
import Feedback from './pages/Feedback'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/job-descriptions" element={<JobDescriptions />} />
            <Route path="/question-banks" element={<QuestionBanks />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/feedback/:id?" element={<Feedback />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App

