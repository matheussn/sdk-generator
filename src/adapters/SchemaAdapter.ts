import { renderTemplateToString } from '../renders'
import { PropertyAdapter } from './PropertyAdapter'
import { ObjectSchema } from '../schemas/ObjectSchema'
import { SimpleSchema } from '../schemas/SimpleSchema'
import { EnumSchema } from '../schemas/EnumSchema'

export class SchemaAdapter {
  private imports: Record<string, string>
  private model: ObjectSchema | SimpleSchema | EnumSchema
  constructor(
    private readonly name: string,
    private readonly rawSchema: Record<string, any>,
    private readonly folder: boolean,
  ) {
    this.imports = {}
    this.model = undefined
    this.buildSchema()
  }

  getImports() {
    return this.imports
  }

  hasModel(): boolean {
    return this.model !== undefined
  }

  getModel(): ObjectSchema | SimpleSchema | EnumSchema {
    return this.model
  }

  getSchemas() {
    return [this.model]
  }

  private buildSchema() {
    const schemaType = this.rawSchema.type

    if(this.isEnumType(this.rawSchema)) {
      this.model = new EnumSchema(this.name, this.rawSchema.enum, this.rawSchema.description)
      return
    }

    if (this.isSimpleTypeSchemaType(schemaType)) {
      this.model = new SimpleSchema(
        this.name,
        this.getTypeFromSimpleType(schemaType, this.rawSchema),
        this.rawSchema.description,
      )
      return
    }

    if (schemaType === 'array') {
      this.model = new SimpleSchema(
        this.name,
        this.getTypeFromArrayType(this.rawSchema, this.name),
        this.rawSchema.description,
      )
      return
    }

    if (this.rawSchema.$ref) {
      this.handleRef(this.rawSchema)
      return
    }

    const properties = []
    this.handleProperties(properties, this.rawSchema)
    this.model = new ObjectSchema(this.name, properties, this.rawSchema.description)
  }

  private isEnumType(schema: Record<string, any>): boolean {
    return schema.type == 'string' && schema.enum !== undefined
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
        this.imports[name] = this.folder
          ? `../${name.toLowerCase()}/${name}`
          : `./${name}`
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
