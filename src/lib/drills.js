// Σταθερές για τις ασκήσεις και τις φάσεις της προπόνησης.

export const CATEGORIES = {
  warmup: 'Προθέρμανση',
  passing: 'Passing',
  rondo: 'Rondo',
  tactics: 'Τακτική',
  fitness: 'Φυσική κατάσταση',
  finishing: 'Τελειώματα',
  cooldown: 'Αποθεραπεία',
}

export const INTENSITY = {
  low: 'Χαμηλή',
  medium: 'Μέτρια',
  high: 'Υψηλή',
}

export const INTENSITY_COLOR = {
  low: 'text-present',
  medium: 'text-excused',
  high: 'text-absent',
}

export const PHASES = [
  { id: 1, title: 'Προθέρμανση', suggested: ['warmup'] },
  { id: 2, title: 'Κύριο μέρος', suggested: ['passing', 'rondo', 'finishing', 'fitness'] },
  { id: 3, title: 'Τακτική / Δίτερμα', suggested: ['tactics'] },
  { id: 4, title: 'Αποθεραπεία', suggested: ['cooldown'] },
]
