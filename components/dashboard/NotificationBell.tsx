'use client'

import { useState, useEffect, useRef } from 'react'
import {
  listNotifications, markAllRead, markRead,
  unreadCount, NOTIF_META, type Notif,
} from '@/lib/notifications'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'Gerade eben'
  if (m < 60) return `Vor ${m} Min.`
  const h = Math.floor(m / 60)
  if (h < 24) return `Vor ${h} Std.`
  return `Vor ${Math.floor(h / 24)} Tag${Math.floor(h / 24) > 1 ? 'en' : ''}`
}

export default function NotificationBell() {
  const [open,   setOpen]   = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [count,  setCount]  = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  function reload() {
    const n = listNotifications()
    setNotifs(n)
    setCount(n.filter((x) => !x.gelesen).length)
  }

  useEffect(() => {
    reload()
  }, [])

  // Außerhalb klicken → schließen
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [open])

  function handleOpen() {
    setOpen((v) => !v)
  }

  function handleMarkAll() {
    markAllRead()
    reload()
  }

  function handleRead(id: string) {
    markRead(id)
    reload()
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
        style={{
          background: open ? '#2d2d2d' : '#252525',
          border: open ? '1px solid #3d3d3d' : '1px solid #2d2d2d',
          color: '#7a7a7a',
          fontSize: '16px',
        }}
        aria-label="Benachrichtigungen"
      >
        🔔
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: '#800020', color: '#ffffff', padding: '0 4px' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{
            background: '#1e1e1e',
            border: '1px solid #2d2d2d',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            top: '100%',
          }}
        >
          {/* Panel-Header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #2d2d2d' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                Benachrichtigungen
              </h3>
              {count > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#5a5a5a' }}>
                  {count} ungelesen
                </p>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs hover:opacity-70 transition-opacity"
                style={{ color: '#800020' }}
              >
                Alle lesen
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm" style={{ color: '#4a4a4a' }}>
                  Keine Benachrichtigungen
                </p>
              </div>
            ) : (
              notifs.map((n, i) => {
                const meta = NOTIF_META[n.typ]
                return (
                  <div
                    key={n.id}
                    className="flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:opacity-80"
                    style={{
                      background: n.gelesen ? 'transparent' : 'rgba(128,0,32,0.04)',
                      borderBottom: i < notifs.length - 1 ? '1px solid #222' : 'none',
                    }}
                    onClick={() => handleRead(n.id)}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{
                        background: `${meta.color}18`,
                        border: `1px solid ${meta.color}30`,
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold leading-snug" style={{ color: n.gelesen ? '#7a7a7a' : '#d4d4d4' }}>
                          {n.titel}
                        </p>
                        {!n.gelesen && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: meta.color }}
                          />
                        )}
                      </div>
                      <p className="text-xs leading-snug mb-1" style={{ color: '#5a5a5a' }}>
                        {n.nachricht}
                      </p>
                      <p className="text-[10px]" style={{ color: '#3a3a3a' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3" style={{ borderTop: '1px solid #222' }}>
            <p className="text-[10px] text-center" style={{ color: '#3a3a3a' }}>
              Push-Benachrichtigungen · Echtzeit-Integration in Vorbereitung
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
