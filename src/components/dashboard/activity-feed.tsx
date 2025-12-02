"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityItem } from "./activity-item"
import type { Activity } from "@/actions/activity"
import { Activity as ActivityIcon } from "lucide-react"

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const router = useRouter()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [router])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones del sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
