import { useEffect, useState } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // Minimum distance in pixels to trigger swipe
  edgeThreshold?: number // Distance from edge to start detecting swipe
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  edgeThreshold = 50,
}: SwipeGestureOptions) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isEdgeSwipe, setIsEdgeSwipe] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)

  // Touch events (mobile)
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.targetTouches[0]
    setTouchEnd(null)
    setTouchStart(touch.clientX)

    // Check if touch started near the right edge
    const windowWidth = window.innerWidth
    if (touch.clientX >= windowWidth - edgeThreshold) {
      setIsEdgeSwipe(true)
    } else {
      setIsEdgeSwipe(false)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.targetTouches[0]
    setTouchEnd(touch.clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !isEdgeSwipe) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }

    setTouchStart(null)
    setTouchEnd(null)
    setIsEdgeSwipe(false)
  }

  // Mouse events (desktop)
  const handleMouseDown = (e: MouseEvent) => {
    setTouchEnd(null)
    setTouchStart(e.clientX)
    setIsMouseDown(true)

    // Check if mouse down started near the right edge
    const windowWidth = window.innerWidth
    if (e.clientX >= windowWidth - edgeThreshold) {
      setIsEdgeSwipe(true)
    } else {
      setIsEdgeSwipe(false)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isMouseDown) return
    setTouchEnd(e.clientX)
  }

  const handleMouseUp = () => {
    if (!isMouseDown || !touchStart || !touchEnd || !isEdgeSwipe) {
      setIsMouseDown(false)
      return
    }

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }

    setTouchStart(null)
    setTouchEnd(null)
    setIsEdgeSwipe(false)
    setIsMouseDown(false)
  }

  useEffect(() => {
    // Touch events
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    // Mouse events
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      // Touch events
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)

      // Mouse events
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [touchStart, touchEnd, isEdgeSwipe, isMouseDown])

  return null
}
