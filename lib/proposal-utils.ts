export interface ProposalData {
  option1: string
  option2: string
  duration: number
}

export function formatProposalMessage(data: ProposalData): string {
  const fDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    })
  }
  return [
    "Propuesta de agendamiento",
    `Opción 1: ${fDate(data.option1)}`,
    `Opción 2: ${fDate(data.option2)}`,
    `Duración: ${data.duration} min`,
  ].join("\n")
}

export function parseProposalMessage(content: string): ProposalData | null {
  const lines = content.split("\n")
  if (lines.length < 4 || !lines[0].startsWith("Propuesta de agendamiento")) return null

  const opt1Match = lines.find((l) => l.startsWith("Opción 1:"))?.match(/^Opción 1:\s*(.+)$/)
  const opt2Match = lines.find((l) => l.startsWith("Opción 2:"))?.match(/^Opción 2:\s*(.+)$/)
  const durMatch = lines.find((l) => l.startsWith("Duración:"))?.match(/^Duración:\s*(\d+)/)

  if (!opt1Match || !opt2Match || !durMatch) return null

  return {
    option1: opt1Match[1].trim(),
    option2: opt2Match[1].trim(),
    duration: parseInt(durMatch[1], 10),
  }
}

export function formatAcceptanceMessage(selectedOption: string, date: string): string {
  return [
    "Aceptación de propuesta",
    `Opción seleccionada: ${selectedOption === "option1" ? "Opción 1" : "Opción 2"}`,
    `Fecha: ${date}`,
  ].join("\n")
}

export function isProposalMessage(content: string): boolean {
  return content.startsWith("Propuesta de agendamiento")
}

export function isAcceptanceMessage(content: string): boolean {
  return content.startsWith("Aceptación de propuesta")
}