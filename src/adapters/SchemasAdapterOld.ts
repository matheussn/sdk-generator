import { exit } from 'process'
import { OpenApiSchema } from '../types/OpenApi'
import { renderTemplateToString } from '../renders'
import { PropertyAdapter } from './PropertyAdapter'
import { SimpleSchema } from '../schemas/SimpleSchema'
import { ObjectSchema } from '../schemas/ObjectSchema'

export class SchemasAdapterOld {
  private imports: Record<string, string>
  private models: Record<string, any | SimpleSchema>
  constructor(private readonly rawSchemas: Record<string, OpenApiSchema>) {
    this.imports = {}
    this.models = {}
  }

  getModels() {
    return this.models
  }

  getImports() {
    return this.imports
  }

  exec() {
    Object.entries(this.rawSchemas).map(([key, value]) => {
      if (this.models[key]) {
        console.warn(`Schema ${key} already exists!`)
        exit(-1)
      }
      const buildedSchema = this.buildSchema(key, value)
      if (buildedSchema) {
        this.models[key] = buildedSchema
      }
    })
  }

  private buildSchema(name: string, schema: any) {
    const schemaType = schema.type
    if (this.isSimpleTypeSchemaType(schemaType)) {
      return new SimpleSchema(name, this.getTypeFromSimpleType(schemaType, schema), schema.description)
    }

    if (schemaType === 'array') {
      return new SimpleSchema(name, this.getTypeFromArrayType(schema, name), schema.description)
    }

    if (schema.$ref) {
      this.handleRef(schema)
      return
    }

    const properties = []
    this.handleProperties(properties, schema)
    return new ObjectSchema(name, properties, schema.description)
  }

  private isSimpleTypeSchemaType(schemaType: string): boolean {
    return ['boolean', 'number', 'string', 'integer'].includes(schemaType)
  }

  private getTypeFromSimpleType(
    schemaType: string,
    schema?: any,
    isArray?: boolean,
  ): string {
    switch (schemaType) {
      case 'boolean':
        return 'boolean'
      case 'integer':
      case 'number':
        return 'number'
      default:
        return this.getTypeFromStringType(schema, isArray)
    }
  }

  private getTypeFromStringType(schema: any, isArray: boolean): string {
    if (schema.enum) {
      const type = `'${schema.enum.join("' | '")}'`
      return isArray ? `(${type})` : type
    }
    if (schema.format && schema.format === 'date-time') {
      return 'Date'
    }
    return 'string'
  }

  private getTypeFromArrayType(arraySchemaObject: any, name?: string) {
    const schema = arraySchemaObject
    const { items } = schema

    if (items.$ref) {
      const type = this.handleRef(items)
      return `${type}[]`
    }

    const isSimpleType = this.isSimpleTypeSchemaType(items.type)
    if (isSimpleType) {
      const itemsType = items.type
      const type = this.getTypeFromSimpleType(itemsType, items, true)
      return `${type}[]`
    }
    const isArrayType = items.type === 'array'
    if (isArrayType) {
      const type = this.getTypeFromArrayType(items, name)
      return `${type}[]`
    }

    const isAnyOf = items.anyOf !== undefined
    if (isAnyOf) {
      const nestedProperties = this.handleOfProperties(items)
      return nestedProperties.map(prop => `${prop}[]`)
    }

    const nestedProperties = []
    this.handleProperties(nestedProperties, items)
    const type = renderTemplateToString('object-type.njk', {
      properties: nestedProperties,
    })
    const newType = type.endsWith('\n') ? type.replace(/\n/g, '') : type
    return `${newType}[]`
  }

  private getTypeFromReference(reference: string): string {
    // reference format: #/components/schemas/<type>
    return reference.split('/').pop()
  }

  private handleRef(schema: any): string {
    const refName = this.getTypeFromReference(schema.$ref)
    if (schema.$ref.includes('.yaml')) {
      const name = refName.split('.')[0]
      if (this.imports[name] === undefined) {
        this.imports[name] = name
      }
      return name
    } else {
      return refName
    }
  }

  private handleOfProperties(schema: any) {
    const prop = []

    if (schema.anyOf !== undefined) {
      schema.anyOf.forEach(anySchema => {
        if (anySchema.$ref) {
          prop.push(this.handleRef(anySchema))
        }
      })
    }

    return prop
  }

  private handleProperties(properties: PropertyAdapter[], schema: any) {
    const objectProperties =
      schema.properties !== undefined && schema.properties !== undefined
        ? schema.properties
        : {}
    const hasRequired = schema.required !== null && schema.required !== undefined

    Object.keys(objectProperties).forEach(propertyName => {
      const property = objectProperties[propertyName]

      // Verificando se a propriedade é requerida no schema
      const isRequired = hasRequired ? schema.required.includes(propertyName) : false
      // Adicionando o '?' no final do nome da propriedade caso ela não seja requerida
      const propertyNameTs = `${propertyName}${isRequired ? '' : '?'}`

      // Verificando se a propriedade é um $ref
      // Se for, adiciona uma propriedade com o nome e o tipo do $ref
      if (property.$ref) {
        properties.push(new PropertyAdapter(propertyNameTs, this.handleRef(property)))
      }

      const isSimpleType = this.isSimpleTypeSchemaType(property.type)
      // Verificando se a propriedade é um tipo simples, se for, adiciona uma propriedade com o nome e o tipo
      if (isSimpleType) {
        const type = this.getTypeFromSimpleType(property.type, property)
        properties.push(new PropertyAdapter(propertyNameTs, type))
      }

      const isArrayType = property.type === 'array'
      // Verificando se a propriedade é um array, se for, adiciona uma propriedade com o nome e o tipo do array
      if (isArrayType) {
        const type = this.getTypeFromArrayType(property, propertyNameTs)
        properties.push(new PropertyAdapter(propertyNameTs, type))
      }

      const isObjectType = property.type === 'object'
      // Verificando se a propriedade é um objeto e não possui propriedades filha, se for, adiciona uma propriedade com o nome e o tipo do objeto
      if (isObjectType && !property.properties) {
        properties.push(new PropertyAdapter(propertyNameTs, 'Object'))
      }

      // Verificando se a propriedade é um objeto e possui propriedades filha, se for, adiciona uma propriedade com o nome e a renderização do objeto
      if (isObjectType && property.properties) {
        const nestedProperties = []
        this.handleProperties(nestedProperties, property)
        const type = renderTemplateToString('object-type.njk', {
          properties: nestedProperties,
        })
        properties.push(new PropertyAdapter(propertyNameTs, type))
      }
    })
  }
}
