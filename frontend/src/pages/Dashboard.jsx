import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Award,
  AlertCircle,
  TrendingUp,
  User,
  FileText,
  HelpCircle
} from 'lucide-react'

const Dashboard = () => {
  const stats = [
    { title: 'Total Candidates', value: '45', change: '+5 this week', icon: Users },
    { title: 'Scheduled Interviews', value: '12', change: '3 today', icon: Calendar },
    { title: 'Completed Interviews', value: '28', change: '+8 this week', icon: CheckCircle },
    { title: 'Qualified Candidates', value: '15', change: '+3 today', icon: Award },
  ]

  const upcomingInterviews = [
    { candidate: 'John Doe', position: 'Java Developer', date: 'Jan 20, 10:00 AM' },
    { candidate: 'Jane Smith', position: '.NET Developer', date: 'Jan 21, 2:00 PM' },
    { candidate: 'Bob Wilson', position: 'Chatbot Developer', date: 'Jan 22, 11:00 AM' },
  ]

  const recentActivity = [
    { type: 'success', icon: CheckCircle, text: 'Interview completed: John Doe (Java Developer)', time: '2 hours ago' },
    { type: 'info', icon: User, text: 'New candidate added: Jane Smith', time: '5 hours ago' },
    { type: 'info', icon: FileText, text: 'Job description uploaded: Senior Java Developer', time: '1 day ago' },
    { type: 'info', icon: HelpCircle, text: 'Question bank updated: Java Developer Questions', time: '2 days ago' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Upcoming Interviews */}
        <div className="card">
          <h2 className="text-section text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Upcoming Interviews (Next 7 Days)
          </h2>
          <div className="space-y-4">
            {upcomingInterviews.map((interview, index) => (
              <div
                key={index}
                className="p-4 border border-border dark:border-dark-border rounded-lg hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary dark:text-dark-text">
                      {interview.candidate}
                    </p>
                    <p className="text-helper text-text-secondary dark:text-dark-text">
                      {interview.position}
                    </p>
                    <p className="text-helper text-text-secondary dark:text-dark-text mt-1">
                      {interview.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-helper font-normal">View</button>
                    <button className="btn-primary text-helper font-normal">Join</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-section text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border border-border dark:border-dark-border rounded-lg"
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    activity.type === 'success' 
                      ? 'text-success dark:text-dark-success' 
                      : 'text-info'
                  }`} />
                  <div className="flex-1">
                    <p className="text-body text-text-primary dark:text-dark-text">
                      {activity.text}
                    </p>
                    <p className="text-helper text-text-secondary dark:text-dark-text mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Interview Statistics */}
      <div className="card">
        <h2 className="text-section text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Interview Statistics
        </h2>
        <div className="h-64 flex items-center justify-center border border-border dark:border-dark-border rounded-lg bg-background dark:bg-dark-surface">
          <p className="text-text-secondary dark:text-dark-text">
            Chart placeholder - Interview completion rate over time
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

