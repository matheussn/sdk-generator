export interface Imports {
  filePath: string
  import: string
}

export interface BaseField {
  name: string
  description: string
  isRequired: boolean
  type: string | string[]
}

export interface BaseEnumField {
  name: string
  value: string
}

export enum SchemaType {
  OBJECT = 'object',
  ENUM = 'enum',
  SIMPLE = 'simple',
  IMPORTS = 'imports',
}

export interface BaseSchema {
  name: string
  description: string
  type: SchemaType
}

export interface EnumSchema extends BaseSchema {
  content: BaseEnumField[]
}

export interface ObjectSchema extends BaseSchema {
  content: BaseField[]
}

export interface SimpleSchema extends BaseSchema {
  content: string
}
