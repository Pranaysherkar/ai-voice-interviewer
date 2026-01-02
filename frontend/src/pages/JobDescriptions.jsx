import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import UploadModal from '../components/UploadModal'
import { Plus } from 'lucide-react'

const JobDescriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const jobDescriptions = [
    { position: 'Java Developer', techStack: 'Java, Spring Boot', candidates: 12 },
    { position: '.NET Developer', techStack: '.NET, C#', candidates: 8 },
    { position: 'Chatbot Developer', techStack: 'NLP, Python', candidates: 5 },
  ]

  const handleUpload = (file) => {
    // TODO: Implement file upload logic
    console.log('Uploading file:', file.name)
    // Here you would call your API to upload the file
    // Example: await uploadJobDescription(file)
  }

  return (
    <div>
      <PageHeader title="Job Descriptions" showBack />
      
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Job Description
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-dark-border">
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Position</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Tech Stack</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Candidates</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobDescriptions.map((jd, index) => (
              <tr key={index} className="border-b border-border dark:border-dark-border hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200">
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{jd.position}</td>
                <td className="py-3 px-4 text-body text-text-secondary dark:text-dark-text">{jd.techStack}</td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{jd.candidates} candidates</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-helper font-normal">View</button>
                    <button className="btn-secondary text-helper font-normal">Edit</button>
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
        title="Upload Job Description"
        accept=".pdf"
        onUpload={handleUpload}
      />
    </div>
  )
}

export default JobDescriptions

