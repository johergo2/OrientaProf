export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ")
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateUsername(email: string): string {
  const prefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${prefix}_${suffix}`
}

export function calculateCost(ratePerMinute: number, durationMinutes: number): number {
  return ratePerMinute * durationMinutes
}

export function calculatePlatformFee(totalCost: number): number {
  return Math.round(totalCost * 0.05)
}

export function calculateProfessionalPayout(totalCost: number): number {
  return totalCost - calculatePlatformFee(totalCost)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function generateVideoRoomId(): string {
  return `orientaprof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
