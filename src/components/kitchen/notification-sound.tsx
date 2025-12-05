"use client"

import { useEffect, useRef, useState } from "react"

interface NotificationSoundProps {
  shouldPlay: boolean
  onPlayed?: () => void
}

export function NotificationSound({ shouldPlay, onPlayed }: NotificationSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Cargar preferencia de sonido desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("kitchen-sound-enabled")
    if (saved !== null) {
      setSoundEnabled(JSON.parse(saved))
    }
  }, [])

  // Crear el elemento de audio
  useEffect(() => {
    // Crear un beep simple usando Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frecuencia del beep (Hz)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      return new Promise(resolve => {
        setTimeout(resolve, 500)
      })
    }

    if (shouldPlay && soundEnabled) {
      console.log('🔔 Reproduciendo sonido de notificación...')
      createBeepSound()
        .then(() => {
          console.log('✅ Sonido reproducido exitosamente')
          onPlayed?.()
        })
        .catch((error) => {
          console.error('❌ Error al reproducir sonido:', error)
          onPlayed?.()
        })
    }
  }, [shouldPlay, soundEnabled, onPlayed])

  return null // Este componente no renderiza nada
}

// Hook para controlar la configuración de sonido
export function useSoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("kitchen-sound-enabled")
    if (saved !== null) {
      setSoundEnabled(JSON.parse(saved))
    }
  }, [])

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem("kitchen-sound-enabled", JSON.stringify(newValue))
  }

  const playTestSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  return {
    soundEnabled,
    toggleSound,
    playTestSound
  }
}
