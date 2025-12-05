"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Settings2, Volume2, VolumeX } from "lucide-react"
import { useSoundSettings } from "./notification-sound"

export function NotificationSettings() {
  const { soundEnabled, toggleSound, playTestSound } = useSoundSettings()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Configuración de Notificaciones</h4>
            <p className="text-sm text-muted-foreground">
              Personaliza las alertas de nuevos pedidos
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="sound-toggle" className="flex flex-col space-y-1">
              <span>Sonido de Alerta</span>
              <span className="font-normal text-xs text-muted-foreground">
                Reproducir sonido cuando lleguen nuevos pedidos
              </span>
            </Label>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={toggleSound}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={playTestSound}
            disabled={!soundEnabled}
            className="w-full"
          >
            <Volume2 className="mr-2 h-4 w-4" />
            Probar Sonido
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
