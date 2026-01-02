import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import UploadModal from '../components/UploadModal'
import { Plus } from 'lucide-react'

const QuestionBanks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const questionBanks = [
    { name: 'Java Developer', questions: 27, difficulty: 'B:9, I:9, A:9' },
    { name: '.NET Developer', questions: 27, difficulty: 'B:9, I:9, A:9' },
    { name: 'Chatbot Developer', questions: 27, difficulty: 'B:9, I:9, A:9' },
  ]

  const handleUpload = (file) => {
    // TODO: Implement question bank upload logic
    console.log('Uploading question bank:', file.name)
    // Here you would call your API to upload the question bank file
    // Example: await uploadQuestionBank(file)
  }

  return (
    <div>
      <PageHeader title="Question Banks" showBack />
      
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Question Bank
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-dark-border">
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Name</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Questions</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Difficulty Levels</th>
              <th className="text-left py-3 px-4 text-card-title text-text-primary dark:text-dark-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questionBanks.map((bank, index) => (
              <tr key={index} className="border-b border-border dark:border-dark-border hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200">
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{bank.name}</td>
                <td className="py-3 px-4 text-body text-text-primary dark:text-dark-text">{bank.questions}</td>
                <td className="py-3 px-4 text-body text-text-secondary dark:text-dark-text">{bank.difficulty}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-helper font-normal">View Questions</button>
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
        title="Upload Question Bank"
        accept=".csv,.json,.xlsx,.xls,.pdf"
        acceptTypes={[
          'text/csv',
          'application/json',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/pdf'
        ]}
        maxSizeMB={5}
        supportedFormats="CSV, JSON, Excel, PDF"
        onUpload={handleUpload}
      />
    </div>
  )
}

export default QuestionBanks

