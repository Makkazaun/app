/**
 * Edelzaun – Benachrichtigungssystem (Mock-Up)
 * Push-Nachrichten werden lokal in localStorage gespeichert.
 * Für echte Push-Benachrichtigungen: Web Push API mit VAPID-Keys integrieren.
 */

export type NotifTyp =
  | 'neues_angebot'
  | 'auftrag_bestaetigt'
  | 'rechnung_verfuegbar'
  | 'montagetermin_festgelegt'

export interface Notif {
  id:        string
  typ:       NotifTyp
  titel:     string
  nachricht: string
  createdAt: string
  gelesen:   boolean
  refId?:    string   // Angebots-/Auftrags-ID
}

export const NOTIF_META: Record<NotifTyp, { icon: string; color: string; label: string }> = {
  neues_angebot:           { icon: '📄', color: '#c9a84c', label: 'Neues Angebot'       },
  auftrag_bestaetigt:      { icon: '✅', color: '#5bc97a', label: 'Auftrag bestätigt'   },
  rechnung_verfuegbar:     { icon: '🧾', color: '#5b9bd5', label: 'Rechnung verfügbar'  },
  montagetermin_festgelegt:{ icon: '🗓️', color: '#b07bdc', label: 'Montagetermin'        },
}

const NOTIF_KEY = 'ez_notifications'

function genId(): string {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function seedDemo(): Notif[] {
  const now = Date.now()
  const demo: Notif[] = [
    {
      id: genId(), typ: 'neues_angebot',
      titel: 'Neues Angebot verfügbar',
      nachricht: 'Angebot ANG-2025-0031 (4.890,00 €) wartet auf Ihre Unterschrift.',
      createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
      gelesen: false, refId: 'ANG-2025-0031',
    },
    {
      id: genId(), typ: 'montagetermin_festgelegt',
      titel: 'Montagetermin festgelegt',
      nachricht: 'Ihr Montagetermin wurde auf den 22. April 2025 gelegt. Team Schulz.',
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      gelesen: false, refId: 'AUF-2025-0011',
    },
    {
      id: genId(), typ: 'rechnung_verfuegbar',
      titel: 'Rechnung verfügbar',
      nachricht: 'RE-2025-00234 (2.760,00 €) steht jetzt zum Download bereit.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      gelesen: true, refId: 'RE-2025-00234',
    },
    {
      id: genId(), typ: 'auftrag_bestaetigt',
      titel: 'Auftrag bestätigt',
      nachricht: 'Ihr Auftrag AUF-2025-0011 wurde von uns bestätigt und freigegeben.',
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      gelesen: true, refId: 'AUF-2025-0011',
    },
  ]
  saveAll(demo)
  return demo
}

function saveAll(notifs: Notif[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs))
}

export function listNotifications(): Notif[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (raw) return JSON.parse(raw) as Notif[]
  } catch { /* ignore */ }
  return seedDemo()
}

export function markAllRead(): void {
  saveAll(listNotifications().map((n) => ({ ...n, gelesen: true })))
}

export function markRead(id: string): void {
  saveAll(listNotifications().map((n) => n.id === id ? { ...n, gelesen: true } : n))
}

export function addNotification(
  notif: Omit<Notif, 'id' | 'createdAt' | 'gelesen'>,
): void {
  const neu: Notif = {
    ...notif,
    id: genId(),
    createdAt: new Date().toISOString(),
    gelesen: false,
  }
  saveAll([neu, ...listNotifications()])
}

export function unreadCount(): number {
  return listNotifications().filter((n) => !n.gelesen).length
}
