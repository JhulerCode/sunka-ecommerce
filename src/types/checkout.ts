export type PromotionItem = Record<string, any> & {
    quantity?: number
    unit_price?: number
}

export type PromotionRequirement = {
    line: string
    presentation: number
    quantity: number
}

export type PromotionRule = {
    key: string
    name: string
    audience: 'general' | 'club'
    requirements: PromotionRequirement[]
    mysteryBox?: boolean
}

export type PromotionBenefit = {
    type: 'envio_gratis' | 'caja_sorpresa'
    label: string
    quantity?: number
}
