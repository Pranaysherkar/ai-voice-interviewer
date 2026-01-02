import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-text-primary dark:text-dark-text hover:bg-background dark:hover:bg-dark-surface border border-border dark:border-dark-border shadow-sm transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  )
}

export default ThemeToggle

