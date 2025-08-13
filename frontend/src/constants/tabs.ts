// Constantes para las pestañas de navegación
export const TABS = {
  WORKOUT: 0,
  EXERCISES: 1,
  EQUIPMENT: 2,
  HISTORY: 3,
  NOTIFICATIONS: 4
} as const

export type TabType = typeof TABS[keyof typeof TABS]
