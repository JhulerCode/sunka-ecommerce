import type { Product } from '@/types/api'

export function buildCatalogLineas(productos: Product[]) {
    const lineas: Array<Record<string, any>> = []

    for (const producto of productos) {
        if (!producto.linea1) continue

        const index = lineas.findIndex((linea) => linea.id == producto.linea)
        if (index === -1) {
            lineas.push({
                ...producto.linea1,
                nombre: producto.linea1.nombre ?? producto.linea1.name ?? '',
            })
        }
    }

    const collator = new Intl.Collator('es', { sensitivity: 'base' })
    lineas.sort((a, b) => collator.compare(a.nombre ?? a.name ?? '', b.nombre ?? b.name ?? ''))

    return lineas
}
