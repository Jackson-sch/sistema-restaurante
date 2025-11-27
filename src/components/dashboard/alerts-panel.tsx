"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertItem, Alert } from "./alert-item"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts: initialAlerts }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState(initialAlerts)

  const handleDismiss = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const criticalCount = alerts.filter(a => a.type === "critical").length
  const warningCount = alerts.filter(a => a.type === "warning").length

  // Temporarily show even when empty for debugging
  // if (alerts.length === 0) {
  //   return null
  // }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Alertas
              {criticalCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalCount} críticas
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  {warningCount} advertencias
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Problemas que requieren atención
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              ✓ No hay alertas - Todo funcionando correctamente
              <br />
              <span className="text-xs">(Debug: alerts array length = {alerts.length})</span>
            </p>
          ) : (
            alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
