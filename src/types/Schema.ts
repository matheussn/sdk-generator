export interface Schema {
    description: string
    type: string
    title: string
    properties: Map<string, Schema>
    example?: string
    readonly?: boolean
    format?: string
    default?: boolean | string | number | object
    enum?: string[]
}