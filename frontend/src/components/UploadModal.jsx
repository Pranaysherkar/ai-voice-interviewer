import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import Modal from './Modal'

const UploadModal = ({ isOpen, onClose, title, accept = '.pdf', acceptTypes = ['application/pdf'], maxSizeMB = 10, supportedFormats = 'PDF', onUpload }) => {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    
    // Check file type
    const isValidType = acceptTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return selectedFile.type.startsWith(baseType)
      }
      return selectedFile.type === type
    })
    
    // Check file extension
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase()
    const isValidExtension = accept.includes(fileExtension)
    
    if (!isValidType && !isValidExtension) {
      alert(`Please upload a ${supportedFormats} file`)
      return
    }
    
    // Check file size
    const fileSizeMB = selectedFile.size / 1024 / 1024
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }
    
    setFile(selectedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileSelect(droppedFile)
  }

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0]
    handleFileSelect(selectedFile)
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (file) {
      onUpload(file)
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging
              ? 'border-primary dark:border-dark-primary bg-primary/5 dark:bg-dark-primary/10'
              : 'border-border dark:border-dark-border hover:border-primary dark:hover:border-dark-primary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-background dark:bg-dark-surface rounded-lg">
                <FileText className="w-8 h-8 text-primary dark:text-dark-primary" />
                <div className="flex-1 text-left">
                  <p className="text-body font-medium text-text-primary dark:text-dark-text">
                    {file.name}
                  </p>
                  <p className="text-helper text-text-secondary dark:text-dark-text">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-2 rounded-lg text-text-secondary dark:text-dark-text hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 dark:bg-dark-primary/20 rounded-lg">
                  <Upload className="w-8 h-8 text-primary dark:text-dark-primary" />
                </div>
              </div>
              <div>
                <p className="text-body text-text-primary dark:text-dark-text mb-1">
                  Drag and drop your file here
                </p>
                <p className="text-helper text-text-secondary dark:text-dark-text mb-4">
                  or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Select File
                </button>
              </div>
              <p className="text-helper text-text-secondary dark:text-dark-text">
                Supported format: {supportedFormats} (Max {maxSizeMB}MB)
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border dark:border-dark-border">
          <button
            onClick={handleClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UploadModal

