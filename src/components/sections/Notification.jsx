import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

const Notification = ({ id, type, message, onClose }) => {
  useEffect(() => {
    // The notification will automatically disappear after 5 seconds.
    const timer = setTimeout(() => {
      if (onClose) onClose(id);
    }, 5000);

    return () => clearTimeout(timer)
  }, [id, onClose])

  let bgColor, Icon;

  switch (type) {
    case 'success':
      
      bgColor = 'bg-gradient-to-r from-green-500 to-green-600';
      Icon = CheckCircle;
      break;
    case 'error':
      bgColor = 'bg-gradient-to-r from-red-500 to-red-600';
      Icon = AlertCircle;
      break;
    case 'info':
    default: 
      bgColor = 'bg-gradient-to-r from-blue-500 to-blue-600';
      Icon = Info; 
      break;
  }

  return (
    <div
      
      className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={() => onClose(id)} className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Notification
