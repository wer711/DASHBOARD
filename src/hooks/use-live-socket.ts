'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface LiveEvent {
  type: 'pageview' | 'event' | 'heartbeat' | 'leave'
  websiteId?: string
  sessionId?: string
  visitorId?: string
  path?: string
  title?: string | null
  name?: string
  category?: string | null
  label?: string | null
  country?: string | null
  countryCode?: string | null
  city?: string | null
  device?: string | null
  browser?: string | null
  os?: string | null
  referrerDomain?: string | null
  utmSource?: string | null
  utmCampaign?: string | null
  timestamp: string
}

interface LiveState {
  connected: boolean
  events: LiveEvent[]
  recentEvents: LiveEvent[] // آخر 50 حدث للأداة
}

/**
 * يتصل بخدمة WebSocket على المنفذ 3003 (عبر بوابة Caddy)
 * ويعرض الأحداث اللحظية الواردة.
 */
export function useLiveSocket() {
  const [state, setState] = useState<LiveState>({
    connected: false,
    events: [],
    recentEvents: [],
  })
  const socketRef = useRef<Socket | null>(null)
  const eventsRef = useRef<LiveEvent[]>([])

  const connect = useCallback(() => {
    if (socketRef.current) return
    try {
      // إن وُجد NEXT_PUBLIC_LIVE_SERVICE_URL (للإنتاج)، اتصل به مباشرة
      // وإلا استخدم بوابة Caddy المحلية (XTransformPort=3003)
      const liveUrl = process.env.NEXT_PUBLIC_LIVE_SERVICE_URL
      let socket: Socket
      if (liveUrl) {
        socket = io(liveUrl, {
          path: '/',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
        })
      } else {
        socket = io('/?XTransformPort=3003', {
          path: '/',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
        })
      }
      socketRef.current = socket

      socket.on('connect', () => {
        setState((s) => ({ ...s, connected: true }))
      })

      socket.on('disconnect', () => {
        setState((s) => ({ ...s, connected: false }))
      })

      socket.on('connect_error', () => {
        setState((s) => ({ ...s, connected: false }))
      })

      // الترحيب + السجل عند الاتصال
      socket.on('welcome', () => {
        // الخادم سيرسل analytics:history بعدها
      })

      socket.on('analytics:history', (history: LiveEvent[]) => {
        if (Array.isArray(history)) {
          eventsRef.current = history.slice(0, 50)
          setState((s) => ({ ...s, recentEvents: eventsRef.current }))
        }
      })

      socket.on('analytics:event', (event: LiveEvent) => {
        if (!event) return
        // نتخطى نبضات القلب في العرض اللحظي
        if (event.type === 'heartbeat') return
        eventsRef.current = [event, ...eventsRef.current].slice(0, 50)
        setState((s) => ({
          ...s,
          events: [event, ...s.events].slice(0, 100),
          recentEvents: eventsRef.current,
        }))
      })
    } catch (err) {
      console.error('[live] connect error:', err)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [connect])

  return state
}
