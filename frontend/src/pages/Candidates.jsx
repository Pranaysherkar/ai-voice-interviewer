import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import UploadModal from '../components/UploadModal'
import { Plus, Search } from 'lucide-react'

const Candidates = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const candidates = [
    { name: 'John Doe', email: 'john@example.com', position: 'Java Developer', status: 'Qualified' },
    { name: 'Jane Smith', email: 'jane@example.com', position: '.NET Developer', status: 'Scheduled' },
    { name: 'Bob Wilson', email: 'bob@example.com', position: 'Chatbot Developer', status: 'Pending' },
  ]

  const handleUpload = (file) => {
    // TODO: Implement resume upload logic
    console.log('Uploading resume:', file.name)
    // Here you would call your API to upload the resume
    // Example: await uploadCandidateResume(file)
  }

  return (
    <div>
      <PageHeader title="Candidates" showBack />
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-dark-text" />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full pl-10 pr-4 py-2 border border-border dark:border-dark-border rounded-lg bg-card dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
          />
        </div>
        <select className="px-4 py-2 border border-border dark:border-dark-border rounded-lg bg-card dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary">
          <option>All Status</option>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>Qualified</option>
        </select>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Candidate
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-dark-border">
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Name</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Email</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Position</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Status</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={index} className="border-b border-border dark:border-dark-border hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200">
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{candidate.name}</td>
                <td className="py-3 px-4 text-body text-text-secondary dark:text-dark-text">{candidate.email}</td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{candidate.position}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-helper ${
                    candidate.status === 'Qualified' 
                      ? 'bg-success/20 text-success dark:bg-dark-success/20 dark:text-dark-success'
                      : candidate.status === 'Scheduled'
                      ? 'bg-info/20 text-info'
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {candidate.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-helper font-normal">View</button>
                    <button className="btn-primary text-helper font-normal">Schedule</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Candidate Resume"
        accept=".pdf"
        acceptTypes={['application/pdf']}
        maxSizeMB={10}
        supportedFormats="PDF"
        onUpload={handleUpload}
      />
    </div>
  )
}

export default Candidates

