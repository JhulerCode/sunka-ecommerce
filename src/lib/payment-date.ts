export function formatPaymentDate(value: string | null | undefined) {
    const text = String(value || '').trim()
    if (!text) return ''

    // Niubiz devuelve YYMMDDhhmmss o ISO sin zona; ambos son hora de Lima.
    const compact = text.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
    let parsed: Date
    if (compact) {
        const [, yy, mm, dd, hh, mi, ss] = compact
        parsed = new Date(`20${yy}-${mm}-${dd}T${hh}:${mi}:${ss}-05:00`)
    } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(text)) {
        parsed = new Date(`${text.replace(' ', 'T')}-05:00`)
    } else {
        parsed = new Date(text)
    }
    if (Number.isNaN(parsed.getTime())) return text

    return parsed.toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Lima',
    })
}
