export interface ProductContentPhoto {
    id?: string
    url: string
    name?: string
    alt?: string
    orden?: number
}

export interface ProductContent {
    article_id: string
    slug: string
    published: boolean
    sort_order?: number
    featured?: boolean
    featured_order?: number
    name: string
    short_description?: string
    description?: string
    origin?: string
    badge?: string
    price: number | null
    club_price?: number | null
    previous_price?: number | null
    photos?: ProductContentPhoto[]
    presentation?: Array<Record<string, any>>
    certifications?: Array<Record<string, any> | string>
    related_products?: Array<{ id?: string } | string>
    sensory_profile?: Record<string, any>
    preparation?: Record<string, any>
    ingredients?: Array<Record<string, any> | string>
    benefits?: Array<Record<string, any> | string>
    differentials?: Array<Record<string, any>>
    seo_title?: string
    seo_description?: string
    previous_slugs?: string[]
    [key: string]: any
}
