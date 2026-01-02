import PageHeader from '../components/PageHeader'
import { Plus } from 'lucide-react'

const Interviews = () => {
  const interviews = [
    { candidate: 'John Doe', position: 'Java Developer', date: 'Jan 20, 10:00 AM', status: 'Done' },
    { candidate: 'Jane Smith', position: '.NET Developer', date: 'Jan 21, 2:00 PM', status: 'Scheduled' },
    { candidate: 'Bob Wilson', position: 'Chatbot Developer', date: 'Jan 19, 3:00 PM', status: 'In Progress' },
  ]

  return (
    <div>
      <PageHeader title="Interviews" showBack />
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-4 py-2 rounded-lg bg-primary text-white text-helper">All</button>
        <button className="px-4 py-2 rounded-lg bg-background dark:bg-dark-surface text-text-primary dark:text-dark-text border border-border dark:border-dark-border text-helper">Scheduled</button>
        <button className="px-4 py-2 rounded-lg bg-background dark:bg-dark-surface text-text-primary dark:text-dark-text border border-border dark:border-dark-border text-helper">In Progress</button>
        <button className="px-4 py-2 rounded-lg bg-background dark:bg-dark-surface text-text-primary dark:text-dark-text border border-border dark:border-dark-border text-helper">Completed</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-dark-border">
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Candidate</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Position</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Date/Time</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Status</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview, index) => (
              <tr key={index} className="border-b border-border dark:border-dark-border hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200">
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{interview.candidate}</td>
                <td className="py-3 px-4 text-body text-text-secondary dark:text-dark-text">{interview.position}</td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{interview.date}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-helper ${
                    interview.status === 'Done' 
                      ? 'bg-success/20 text-success dark:bg-dark-success/20 dark:text-dark-success'
                      : interview.status === 'Scheduled'
                      ? 'bg-info/20 text-info'
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {interview.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-helper font-normal">View</button>
                    {interview.status === 'In Progress' && (
                      <button className="btn-primary text-helper font-normal">Join</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Interviews

