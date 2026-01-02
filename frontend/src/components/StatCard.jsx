const StatCard = ({ title, value, change, changeType = 'positive', icon: Icon }) => {
  const changeColor = changeType === 'positive' 
    ? 'text-success dark:text-dark-success' 
    : 'text-danger dark:text-dark-danger'

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-helper text-text-secondary dark:text-dark-text mb-2">{title}</p>
          <p className="text-4xl font-bold text-text-primary dark:text-dark-text mb-2">{value}</p>
          {change && (
            <p className={`text-helper ${changeColor}`}>
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary/10 dark:bg-dark-primary/20 rounded-lg">
            <Icon className="w-6 h-6 text-primary dark:text-dark-primary" />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard

