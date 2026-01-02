import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const PageHeader = ({ title, showBack = false }) => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-4 mb-4">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-primary dark:text-dark-text hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-title text-text-primary dark:text-dark-text">{title}</h1>
    </div>
  )
}

export default PageHeader

