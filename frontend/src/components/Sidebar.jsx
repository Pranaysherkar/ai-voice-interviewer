import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  HelpCircle, 
  Calendar, 
  MessageSquare,
  Building2
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/candidates', icon: Users, label: 'Candidates' },
  { path: '/job-descriptions', icon: FileText, label: 'Job Descriptions' },
  { path: '/question-banks', icon: HelpCircle, label: 'Question Banks' },
  { path: '/interviews', icon: Calendar, label: 'Interviews' },
  { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
]

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-60 bg-background dark:bg-dark-surface
          border-r border-border dark:border-dark-border
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border dark:border-dark-border">
            <Building2 className="w-6 h-6 text-primary dark:text-dark-primary" />
            <h1 className="text-xl font-bold text-primary dark:text-dark-primary">
              AI Interviewer
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-white dark:bg-dark-primary dark:text-white'
                        : 'text-text-primary dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-surface'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

