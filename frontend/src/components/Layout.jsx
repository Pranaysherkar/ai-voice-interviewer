import { useState } from 'react'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { Menu, X } from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button - floating */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-dark-text shadow-lg hover:bg-background dark:hover:bg-dark-surface transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Theme toggle button - top right corner */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4 h-full flex flex-col">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 bg-card dark:bg-dark-surface border-t border-border dark:border-dark-border flex items-center justify-center text-helper text-text-secondary dark:text-dark-text">
          <p>© 2024 AI Voice Interviewer | Privacy | Terms | Support</p>
        </footer>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout

