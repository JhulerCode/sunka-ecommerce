import type { Product } from '@/types/api'
import { getLineaByName } from '@/data/content/lineas'
import { formatProductPrice } from '@/lib/utils/currency'
import { getProductPrice, hasClubPrice } from '@/lib/catalog/pricing'
import { slugifyProductName } from '@/lib/catalog/product-slug'

export const PRODUCT_ID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ProductDetailView {
    producto: Product
    canonicalSlug: string
    pageTitle: string
    pageDescription: string
    isAuthenticated: boolean
    fotos: Array<Record<string, any>>
    fotoPrincipal?: string
    presentacion: Array<{ label: string; value: string }>
    presentationGridClass: string
    certificaciones: string[]
    perfilSensorial: Record<string, any>
    notas: string[]
    momentos: string[]
    atributos: Array<{ label: string; value: string; percentage: number }>
    hasPerfilSensorial: boolean
    linea: string
    lineaTiendaHref: string
    diferenciales: Array<Record<string, any>>
    precio: string
    precioRegular: string
    precioClub: string
    mostrarComparacion: boolean
    preparacion: Record<string, any>
    pasosPreparacion: Array<{ titulo: string; descripcion: string }>
    hasPreparacion: boolean
    relacionados: Product[]
    cartProduct: string
    eyebrowClass: string
    sectionTitleClass: string
}

function normalizeTextList(value: unknown): string[] {
    if (!Array.isArray(value)) return []

    return value
        .map((item) =>
            typeof item === 'string'
                ? item
                : (item?.nombre ?? item?.name ?? item?.label ?? item?.titulo),
        )
        .filter(Boolean)
}

function normalizePairs(value: unknown): Array<{ label: string; value: string }> {
    if (!Array.isArray(value)) return []

    return value
        .map((item) => {
            if (Array.isArray(item)) return { label: item[0], value: item[1] }
            if (!item || typeof item !== 'object') return null

            return {
                label: item.label ?? item.nombre ?? item.titulo,
                value: item.value ?? item.valor ?? item.descripcion,
            }
        })
        .filter(
            (item): item is { label: string; value: string } =>
                Boolean(item?.label && item?.value !== undefined && item?.value !== null),
        )
}

export function resolveProductSlug(rawSlug: string) {
    return PRODUCT_ID_PATTERN.test(rawSlug) ? rawSlug.toLowerCase() : slugifyProductName(rawSlug)
}

export function getRelatedArticleIds(producto: Product, limit = 3) {
    const currentArticleId = String(producto.article_id ?? producto.id)
    if (!Array.isArray(producto.related_products)) return []

    return [
        ...new Set(
            producto.related_products
                .map((item: Record<string, any> | string) =>
                    typeof item === 'string' ? item : item?.id,
                )
                .filter((id): id is string => Boolean(id) && id !== currentArticleId),
        ),
    ].slice(0, limit)
}

export function buildProductDetailView({
    producto,
    isAuthenticated,
    relacionados = [],
}: {
    producto: Product
    isAuthenticated: boolean
    relacionados?: Product[]
}): ProductDetailView {
    const fotos = Array.isArray(producto.photos)
        ? producto.photos.filter((foto: Record<string, any>) => foto?.url)
        : []
    const presentacion = normalizePairs(producto.presentation)
    const presentationGridClass =
        presentacion.length >= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : presentacion.length === 3
              ? 'grid-cols-3'
              : presentacion.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'
    const certificaciones = normalizeTextList(producto.certifications)

    const perfilSensorial =
        producto.sensory_profile && typeof producto.sensory_profile === 'object'
            ? producto.sensory_profile
            : {}
    const notas = normalizeTextList(perfilSensorial.notes ?? perfilSensorial.notas)
    const momentos = normalizeTextList(perfilSensorial.moments ?? perfilSensorial.momentos)
    const atributos = normalizePairs(
        perfilSensorial.attributes ?? perfilSensorial.atributos,
    ).map((atributo) => ({
        ...atributo,
        percentage: Math.min(100, Math.max(0, Number.parseFloat(atributo.value) || 0)),
    }))
    const hasPerfilSensorial = Boolean(
        perfilSensorial.title ||
        perfilSensorial.description ||
        notas.length ||
        atributos.length ||
        momentos.length,
    )

    const lineaConfig = getLineaByName(producto.line?.name)
    const diferenciales: Array<Record<string, any>> = lineaConfig?.diferenciales ?? []

    const preparacion =
        producto.preparation && typeof producto.preparation === 'object'
            ? producto.preparation
            : {}
    const configuredSteps = Array.isArray(preparacion.steps) ? preparacion.steps : []
    const pasosPreparacion: Array<{ titulo: string; descripcion: string }> = configuredSteps.length
        ? configuredSteps
              .map((step: Record<string, any>) => ({
                  titulo: step?.title ?? step?.titulo ?? '',
                  descripcion: step?.description ?? step?.descripcion ?? '',
              }))
              .filter(
                  (step: { titulo: string; descripcion: string }) =>
                      step.titulo || step.descripcion,
              )
        : [
              {
                  titulo: 'Calienta',
                  descripcion: 'Utiliza 200 ml de agua a 90–95 °C.',
              },
              {
                  titulo: 'Infusiona',
                  descripcion: 'Deja el saquito entre 3 y 5 minutos.',
              },
              {
                  titulo: 'Personaliza',
                  descripcion: 'Disfrútalo solo o con un toque de leche caliente.',
              },
          ]
    const hasPreparacion = pasosPreparacion.length > 0 || Boolean(preparacion.pairing)

    const linea = producto.line?.name ?? ''
    const lineaTiendaHref = linea
        ? `/tienda?linea=${encodeURIComponent(lineaConfig?.slug ?? linea)}`
        : ''
    const precio = formatProductPrice(getProductPrice(producto, isAuthenticated))
    const precioRegular = formatProductPrice(producto.price)
    const precioClub = formatProductPrice(producto.club_price)
    const mostrarComparacion = hasClubPrice(producto)
    const pageTitle = producto.seo_title || `${producto.name} | SUNKA`
    const pageDescription =
        producto.seo_description ||
        producto.short_description ||
        producto.description ||
        producto.name
    const cartProduct = JSON.stringify({
        ...producto,
        regular_price: producto.price,
        price: getProductPrice(producto, isAuthenticated),
    })

    return {
        producto,
        canonicalSlug: String(producto.slug),
        pageTitle,
        pageDescription,
        isAuthenticated,
        fotos,
        fotoPrincipal: fotos[0]?.url ?? producto.photo,
        presentacion,
        presentationGridClass,
        certificaciones,
        perfilSensorial,
        notas,
        momentos,
        atributos,
        hasPerfilSensorial,
        linea,
        lineaTiendaHref,
        diferenciales,
        precio,
        precioRegular,
        precioClub,
        mostrarComparacion,
        preparacion,
        pasosPreparacion,
        hasPreparacion,
        relacionados,
        cartProduct,
        eyebrowClass:
            'text-[11px] font-semibold uppercase tracking-[0.24em] text-sunka-brass',
        sectionTitleClass:
            'mt-3 font-heading text-3xl font-semibold leading-tight text-sunka-ink md:text-4xl',
    }
}
