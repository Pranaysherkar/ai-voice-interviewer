import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { 
  Download, 
  CheckCircle, 
  ClipboardList, 
  AlertCircle, 
  MessageSquare,
  Award,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react'

// Mock data - replace with API call
const mockFeedbackData = [
  {
    id: '1',
    candidateName: 'John Doe',
    position: 'Java Developer',
    interviewDate: 'Jan 20, 2024',
    duration: '45 minutes',
    overallScore: 7.5,
    technicalSkills: 8,
    communication: 6,
    problemSolving: 8,
    status: 'Qualified',
    questions: [
      { question: 'What is Spring Boot?', answer: 'Good' },
      { question: 'Explain dependency injection', answer: 'Average' },
      { question: 'Design a REST API', answer: 'Excellent' }
    ],
    aiFeedback: 'Candidate demonstrated strong technical knowledge in Java and Spring Boot. Good understanding of core concepts. Communication could be improved. Overall, a qualified candidate for the position.'
  },
  {
    id: '2',
    candidateName: 'Jane Smith',
    position: '.NET Developer',
    interviewDate: 'Jan 21, 2024',
    duration: '50 minutes',
    overallScore: 8.2,
    technicalSkills: 9,
    communication: 8,
    problemSolving: 8,
    status: 'Qualified',
    questions: [
      { question: 'What is .NET Core?', answer: 'Excellent' },
      { question: 'Explain async/await', answer: 'Good' },
      { question: 'Design a microservice', answer: 'Good' }
    ],
    aiFeedback: 'Excellent candidate with strong technical skills and good communication. Demonstrates deep understanding of .NET ecosystem and modern development practices.'
  },
  {
    id: '3',
    candidateName: 'Bob Wilson',
    position: 'Chatbot Developer',
    interviewDate: 'Jan 19, 2024',
    duration: '40 minutes',
    overallScore: 6.5,
    technicalSkills: 7,
    communication: 6,
    problemSolving: 6,
    status: 'Pending',
    questions: [
      { question: 'What is NLP?', answer: 'Good' },
      { question: 'Explain transformer models', answer: 'Average' },
      { question: 'Design a chatbot flow', answer: 'Average' }
    ],
    aiFeedback: 'Candidate shows basic understanding but lacks depth in advanced concepts. Communication needs improvement. May need additional training.'
  },
  {
    id: '4',
    candidateName: 'Alice Johnson',
    position: 'Java Developer',
    interviewDate: 'Jan 18, 2024',
    duration: '55 minutes',
    overallScore: 9.0,
    technicalSkills: 10,
    communication: 9,
    problemSolving: 9,
    status: 'Qualified',
    questions: [
      { question: 'What is Spring Boot?', answer: 'Excellent' },
      { question: 'Explain dependency injection', answer: 'Excellent' },
      { question: 'Design a REST API', answer: 'Excellent' }
    ],
    aiFeedback: 'Outstanding candidate with exceptional technical skills and excellent communication. Highly recommended for the position.'
  }
]

const FeedbackList = ({ feedbacks, onSelectFeedback, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'All' || feedback.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Calculate statistics
  const totalFeedbacks = feedbacks.length
  const qualifiedCount = feedbacks.filter(f => f.status === 'Qualified').length
  const averageScore = feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / totalFeedbacks
  const pendingCount = feedbacks.filter(f => f.status === 'Pending').length

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Section - Summary Statistics */}
      <div className="flex-shrink-0 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1.5">Total Feedback</p>
                <p className="text-3xl font-bold text-text-primary dark:text-dark-text mb-1">{totalFeedbacks}</p>
              </div>
              <div className="p-2 bg-primary/10 dark:bg-dark-primary/20 rounded-lg">
                <ClipboardList className="w-5 h-5 text-primary dark:text-dark-primary" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1.5">Qualified</p>
                <p className="text-3xl font-bold text-text-primary dark:text-dark-text mb-1">{qualifiedCount}</p>
                <p className="text-helper text-success dark:text-dark-success">
                  {((qualifiedCount / totalFeedbacks) * 100).toFixed(0)}% success rate
                </p>
              </div>
              <div className="p-2 bg-success/10 dark:bg-dark-success/20 rounded-lg">
                <Award className="w-5 h-5 text-success dark:text-dark-success" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1.5">Average Score</p>
                <p className="text-3xl font-bold text-text-primary dark:text-dark-text mb-1">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-helper text-text-secondary dark:text-dark-text">out of 10</p>
              </div>
              <div className="p-2 bg-info/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1.5">Pending Review</p>
                <p className="text-3xl font-bold text-text-primary dark:text-dark-text mb-1">{pendingCount}</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-dark-text" />
            <input
              type="text"
              placeholder="Search by candidate name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border dark:border-dark-border rounded-lg bg-card dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-secondary dark:text-dark-text" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-border dark:border-dark-border rounded-lg bg-card dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            >
              <option>All</option>
              <option>Qualified</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Section - Feedback List */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {filteredFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            onClick={() => onSelectFeedback(feedback.id)}
            className="card cursor-pointer hover:shadow-md transition-all duration-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-card-title text-text-primary dark:text-dark-text mb-1">
                  {feedback.candidateName}
                </h3>
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1.5">
                  {feedback.position}
                </p>
                <div className="flex items-center gap-3 text-helper text-text-secondary dark:text-dark-text">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{feedback.interviewDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{feedback.duration}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-helper ${
                feedback.status === 'Qualified' 
                  ? 'bg-success/20 text-success dark:bg-dark-success/20 dark:text-dark-success'
                  : feedback.status === 'Pending'
                  ? 'bg-warning/20 text-warning'
                  : 'bg-danger/20 text-danger dark:text-dark-danger/20 dark:text-dark-danger'
              }`}>
                {feedback.status}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-success dark:text-dark-success" />
                  <span className="text-body font-medium text-text-primary dark:text-dark-text">
                    Overall Score
                  </span>
                </div>
                <span className="text-body font-bold text-text-primary dark:text-dark-text">
                  {feedback.overallScore}/10
                </span>
              </div>
              <div className="w-full bg-background dark:bg-dark-surface rounded-full h-1.5">
                <div 
                  className="bg-success dark:bg-dark-success h-1.5 rounded-full" 
                  style={{ width: `${feedback.overallScore * 10}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <p className="text-helper text-text-secondary dark:text-dark-text mb-0.5">Technical</p>
                <p className="text-body font-medium text-text-primary dark:text-dark-text">
                  {feedback.technicalSkills}/10
                </p>
              </div>
              <div>
                <p className="text-helper text-text-secondary dark:text-dark-text mb-0.5">Communication</p>
                <p className="text-body font-medium text-text-primary dark:text-dark-text">
                  {feedback.communication}/10
                </p>
              </div>
              <div>
                <p className="text-helper text-text-secondary dark:text-dark-text mb-0.5">Problem Solving</p>
                <p className="text-body font-medium text-text-primary dark:text-dark-text">
                  {feedback.problemSolving}/10
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border dark:border-dark-border">
              <p className="text-helper text-text-secondary dark:text-dark-text line-clamp-2">
                {feedback.aiFeedback}
              </p>
            </div>
          </div>
        ))}
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-body text-text-secondary dark:text-dark-text">
              No feedback found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const FeedbackDetail = ({ feedback, onBack }) => {
  if (!feedback) return null

  const getAnswerStatus = (answer) => {
    if (answer === 'Excellent') return { label: 'Excellent', color: 'text-success dark:text-dark-success', bg: 'bg-success dark:bg-dark-success' }
    if (answer === 'Good') return { label: 'Good', color: 'text-success dark:text-dark-success', bg: 'bg-success dark:bg-dark-success' }
    if (answer === 'Average') return { label: 'Average', color: 'text-warning', bg: 'bg-warning' }
    return { label: 'Poor', color: 'text-danger dark:text-dark-danger', bg: 'bg-danger dark:bg-dark-danger' }
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-success dark:text-dark-success'
    if (score >= 6) return 'text-warning'
    return 'text-danger dark:text-dark-danger'
  }

  const getScoreBarColor = (score) => {
    if (score >= 8) return 'bg-success dark:bg-dark-success'
    if (score >= 6) return 'bg-warning'
    return 'bg-danger dark:bg-dark-danger'
  }

  const getStatusColor = (status) => {
    if (status === 'Qualified') return 'text-success dark:text-dark-success'
    if (status === 'Pending') return 'text-warning'
    return 'text-danger dark:text-dark-danger'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="btn-secondary p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-title text-text-primary dark:text-dark-text">Interview Feedback</h1>
              <p className="text-body text-text-secondary dark:text-dark-text mt-1">
                {feedback.candidateName} • {feedback.position}
              </p>
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2 mb-8 mr-4">
            <Download className="w-5 h-5" />
            Download Report
          </button>
        </div>

        {/* Interview Information Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border">
                <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Interview Date</th>
                <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Duration</th>
                <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border dark:border-dark-border">
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary dark:text-dark-text" />
                    {feedback.interviewDate}
                  </div>
                </td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-text-secondary dark:text-dark-text" />
                    {feedback.duration}
                  </div>
                </td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">
                  <span className={`font-medium ${getStatusColor(feedback.status)}`}>
                    {feedback.status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-6">
        {/* Overall Score Section */}
        <div className="card mb-6">
          <div className="border-b border-border dark:border-dark-border pb-4 mb-6">
            <h2 className="text-section text-text-primary dark:text-dark-text">Overall Assessment</h2>
            <p className="text-helper text-text-secondary dark:text-dark-text mt-1">Comprehensive evaluation score</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore.toFixed(1)}
                </span>
                <span className="text-body text-text-secondary dark:text-dark-text">/ 10</span>
              </div>
              <div className="w-full bg-background dark:bg-dark-surface rounded-lg h-2">
                <div 
                  className={`h-2 rounded-lg transition-all duration-200 ${getScoreBarColor(feedback.overallScore)}`}
                  style={{ width: `${feedback.overallScore * 10}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 dark:bg-dark-primary/20 rounded-lg">
                <Award className="w-6 h-6 text-primary dark:text-dark-primary" />
              </div>
              <div className="ml-4">
                <p className="text-helper text-text-secondary dark:text-dark-text mb-1">Performance Level</p>
                <p className={`text-card-title font-medium ${getScoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore >= 8 ? 'Excellent' : feedback.overallScore >= 6 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Breakdown Table */}
        <div className="card mb-6">
          <div className="border-b border-border dark:border-dark-border pb-4 mb-6">
            <h2 className="text-section text-text-primary dark:text-dark-text">Skill Assessment</h2>
            <p className="text-helper text-text-secondary dark:text-dark-text mt-1">Detailed breakdown by competency</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-dark-border">
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Skill</th>
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Score</th>
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="py-4 px-4 text-body text-text-primary dark:text-dark-text font-medium">Technical Skills</td>
                  <td className="py-4 px-4">
                    <span className={`text-card-title font-semibold ${getScoreColor(feedback.technicalSkills)}`}>
                      {feedback.technicalSkills}/10
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-full bg-background dark:bg-dark-surface rounded-lg h-2">
                      <div 
                        className={`h-2 rounded-lg transition-all duration-200 ${getScoreBarColor(feedback.technicalSkills)}`}
                        style={{ width: `${feedback.technicalSkills * 10}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="py-4 px-4 text-body text-text-primary dark:text-dark-text font-medium">Communication</td>
                  <td className="py-4 px-4">
                    <span className={`text-card-title font-semibold ${getScoreColor(feedback.communication)}`}>
                      {feedback.communication}/10
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-full bg-background dark:bg-dark-surface rounded-lg h-2">
                      <div 
                        className={`h-2 rounded-lg transition-all duration-200 ${getScoreBarColor(feedback.communication)}`}
                        style={{ width: `${feedback.communication * 10}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-body text-text-primary dark:text-dark-text font-medium">Problem Solving</td>
                  <td className="py-4 px-4">
                    <span className={`text-card-title font-semibold ${getScoreColor(feedback.problemSolving)}`}>
                      {feedback.problemSolving}/10
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-full bg-background dark:bg-dark-surface rounded-lg h-2">
                      <div 
                        className={`h-2 rounded-lg transition-all duration-200 ${getScoreBarColor(feedback.problemSolving)}`}
                        style={{ width: `${feedback.problemSolving * 10}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Questions Table */}
        <div className="card mb-6">
          <div className="border-b border-border dark:border-dark-border pb-4 mb-6">
            <h2 className="text-section text-text-primary dark:text-dark-text">Interview Questions</h2>
            <p className="text-helper text-text-secondary dark:text-dark-text mt-1">Questions and responses evaluation</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-dark-border">
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text w-12">#</th>
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Question</th>
                  <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {feedback.questions.map((q, index) => {
                  const status = getAnswerStatus(q.answer)
                  return (
                    <tr key={index} className="border-b border-border dark:border-dark-border last:border-b-0">
                      <td className="py-4 px-4 text-body text-text-secondary dark:text-dark-text font-medium">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 text-body text-text-primary dark:text-dark-text">
                        {q.question}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {status.label === 'Excellent' || status.label === 'Good' ? (
                            <CheckCircle className={`w-4 h-4 ${status.color}`} />
                          ) : (
                            <AlertCircle className={`w-4 h-4 ${status.color}`} />
                          )}
                          <span className={`text-body font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Feedback Section */}
        <div className="card mb-6">
          <div className="border-b border-border dark:border-dark-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary dark:text-dark-primary" />
              <h2 className="text-section text-text-primary dark:text-dark-text">Detailed Feedback</h2>
            </div>
            <p className="text-helper text-text-secondary dark:text-dark-text mt-1">AI-generated comprehensive assessment</p>
          </div>
          
          <div className="p-4 bg-background dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg">
            <p className="text-body leading-relaxed text-text-primary dark:text-dark-text whitespace-pre-wrap">
              {feedback.aiFeedback}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pb-4">
          <button className="btn-success">Qualify Candidate</button>
          <button className="btn-danger">Reject Candidate</button>
          <button className="btn-secondary">Reschedule Interview</button>
        </div>
      </div>
    </div>
  )
}

const Feedback = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  // Find selected feedback
  const selectedFeedback = id ? mockFeedbackData.find(f => f.id === id) : null

  const handleSelectFeedback = (feedbackId) => {
    navigate(`/feedback/${feedbackId}`)
  }

  const handleBack = () => {
    navigate('/feedback')
  }

  return (
    <div className="flex flex-col h-full">
      {selectedFeedback ? (
        <FeedbackDetail feedback={selectedFeedback} onBack={handleBack} />
      ) : (
        <>
          <div className="flex-shrink-0 mb-6">
            <PageHeader title="Interview Feedback" showBack />
          </div>
          <div className="flex-1 min-h-0">
            <FeedbackList
              feedbacks={mockFeedbackData}
              onSelectFeedback={handleSelectFeedback}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Feedback
