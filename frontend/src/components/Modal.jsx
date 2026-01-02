import { useEffect } from 'react'
import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative bg-card dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-lg w-full max-w-md transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-dark-border">
          <h2 className="text-section text-text-primary dark:text-dark-text">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary dark:text-dark-text hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

