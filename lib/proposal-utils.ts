export interface ProposalData {
  option1: string
  option2: string
  duration: number
}

export function formatProposalMessage(data: ProposalData): string {
  return [
    "📅 Propuesta de agendamiento",
    `Opción 1: ${data.option1}`,
    `Opción 2: ${data.option2}`,
    `Duración: ${data.duration} min`,
  ].join("\n")
}

export function parseProposalMessage(content: string): ProposalData | null {
  const lines = content.split("\n")
  if (lines.length < 4 || !lines[0].startsWith("📅 Propuesta de agendamiento")) return null

  const opt1Match = lines.find((l) => l.startsWith("Opción 1:"))?.match(/^Opción 1:\s*(.+)$/)
  const opt2Match = lines.find((l) => l.startsWith("Opción 2:"))?.match(/^Opción 2:\s*(.+)$/)
  const durMatch = lines.find((l) => l.startsWith("Duración:"))?.match(/^Duración:\s*(\d+)/)

  if (!opt1Match || !opt2Match || !durMatch) return null

  const option1 = opt1Match[1].trim()
  const option2 = opt2Match[1].trim()
  const duration = parseInt(durMatch[1], 10)

  if (isNaN(duration)) return null

  return { option1, option2, duration }
}
