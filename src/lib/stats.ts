import { useSyncExternalStore } from 'react'

export interface Stats {
  petitions: number
  denials: number
  approvals: number
  prophecies: number
  queueReached: number
  contradictions: number
}

const stats: Stats = {
  petitions: 0,
  denials: 0,
  approvals: 0,
  prophecies: 0,
  queueReached: 0,
  contradictions: 0,
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot(): Stats {
  return stats
}

export function useStats(): Stats {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export function record(key: keyof Stats, amount = 1) {
  stats[key] += amount
  emit()
}

export function isApproved(): boolean {
  return stats.approvals > stats.denials
}