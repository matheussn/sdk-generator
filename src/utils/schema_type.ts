import { OpenApiSchema } from '../types/OpenApi'

export const isEnumType = (schema: OpenApiSchema): boolean =>
  schema.type == 'string' && schema.enum !== undefined

export const isSimpleTypeSchemaType = (schemaType: string): boolean =>
  ['boolean', 'number', 'string', 'integer'].includes(schemaType)

export const isArrayType = (schema: OpenApiSchema): boolean => schema.type === 'array'
