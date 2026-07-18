"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { realtimeService } from "@/lib/realtime"
import { NotificationToast } from "./notification-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
  userId?: string
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }
    setNotifications((prev) => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    if (!userId) return

    const unsubscribe = realtimeService.subscribe(`notifications-${userId}`, (notification) => {
      setNotifications((prev) => [...prev, notification])
    })

    return unsubscribe
  }, [userId])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}

      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} onClose={removeNotification} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
