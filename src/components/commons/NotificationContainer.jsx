import Notification from "../sections/Notification";

export default function NotificationContainer({ notifications = [], onClose }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notif) => (
        <div key={notif.id} className="pointer-events-auto animate-in slide-in-from-top-2 duration-200">
          <Notification
            id={notif.id}
            type={notif.type}
            message={notif.message}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
}