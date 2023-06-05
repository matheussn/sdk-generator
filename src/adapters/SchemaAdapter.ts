import {
  BaseField,
  BaseSchema,
  EnumSchema,
  ObjectSchema,
  SchemaType,
  SimpleSchema,
} from '../schemas/BaseSchema'
import { OpenApiSchema } from '../types/OpenApi'

export class SchemaAdapter {
  private imports: Record<string, string> = {}
  private dependencies: BaseSchema[] = []
  private model: BaseSchema

  constructor(
    private readonly rawSchema: OpenApiSchema,
    private readonly folder: boolean,
    private readonly name: string,
  ) {
    this.model = undefined
    this.buildSchema()
  }

  getImports() {
    return this.imports
  }

  hasModel(): boolean {
    return this.model !== undefined
  }

  getDependencies(): BaseSchema[] {
    return this.dependencies
  }

  getModel(): BaseSchema {
    return this.model
  }

  getSchemas() {
    return [this.model]
  }

  private buildSchema() {
    const schemaType = this.rawSchema.type

    if (this.isEnumType(this.rawSchema)) {
      this.model = {
        name: this.name,
        type: SchemaType.ENUM,
        description: this.rawSchema?.description,
        content: this.rawSchema.enum.map((value: string) => ({
          name: value.toUpperCase(),
          value,
        })),
      } as EnumSchema
      return
    }

    if (this.isSimpleTypeSchemaType(schemaType)) {
      this.model = {
        name: this.name,
        type: SchemaType.SIMPLE,
        description: this.rawSchema?.description,
        content: this.getTypeFromSimpleType(schemaType, this.rawSchema),
      } as SimpleSchema
      return
    }

    if (schemaType === 'array') {
      this.model = {
        name: this.name,
        type: SchemaType.SIMPLE,
        description: this.rawSchema?.description,
        content: this.getTypeFromArrayType(this.rawSchema, this.rawSchema.title),
      } as SimpleSchema
      return
    }

    if (this.rawSchema.$ref) {
      this.handleRef(this.rawSchema)
      return
    }

    const properties: BaseField[] = []
    this.handleProperties(properties, this.rawSchema)
    this.model = {
      name: this.name,
      type: SchemaType.OBJECT,
      description: this.rawSchema?.description,
      content: properties,
    } as ObjectSchema
  }

  private isEnumType(schema: OpenApiSchema): boolean {
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

  private getTypeFromArrayType(
    arraySchemaObject: OpenApiSchema,
    name?: string,
  ): string | string[] {
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
      return nestedProperties.map(prop => `${prop}[]`).join(' | ')
    }

    // const nestedProperties = []
    // this.handleProperties(nestedProperties, items)
    // const type = renderTemplateToString('object-type.njk', {
    //   properties: nestedProperties,
    // })
    // const newType = type.endsWith('\n') ? type.replace(/\n/g, '') : type
    return 'any[]' //`${newType}[]`
  }

  private getTypeFromReference(reference: string): string {
    // reference format: #/components/schemas/<type>
    return reference.split('/').pop()
  }

  private handleRef(schema: any): string {
    const refName = this.getTypeFromReference(schema.$ref)
    if (schema.$ref.includes('.yaml')) {
      const importName = refName.split('.')[0]
      if (!this.imports[importName]) {
        this.imports[importName] = this.folder
          ? `../${importName.toLowerCase()}/${importName}`
          : `./${importName}`
      }
      return importName
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

  private handleProperties(properties: BaseField[], schema: OpenApiSchema) {
    const objectProperties =
      schema.properties !== undefined && schema.properties !== undefined
        ? schema.properties
        : {}
    const hasRequired = schema.required !== null && schema.required !== undefined

    Object.keys(objectProperties).forEach(propertyName => {
      const property = objectProperties[propertyName]

      // Verificando se a propriedade é requerida no schema
      const isRequired = hasRequired ? schema.required.includes(propertyName) : false

      // Verificando se a propriedade é um $ref
      // Se for, adiciona uma propriedade com o nome e o tipo do $ref
      if (property.$ref) {
        properties.push({
          name: propertyName,
          description: property?.description,
          isRequired,
          type: this.handleRef(property),
        } as BaseField)
      }

      const isSimpleType = this.isSimpleTypeSchemaType(property.type)
      // Verificando se a propriedade é um tipo simples, se for, adiciona uma propriedade com o nome e o tipo
      if (isSimpleType) {
        const type = this.getTypeFromSimpleType(property.type, property)
        properties.push({
          name: propertyName,
          description: property?.description,
          isRequired,
          type,
        } as BaseField)
      }

      const isArrayType = property.type === 'array'
      // Verificando se a propriedade é um array, se for, adiciona uma propriedade com o nome e o tipo do array
      if (isArrayType) {
        const type = this.getTypeFromArrayType(property, propertyName)
        properties.push({
          name: propertyName,
          description: property?.description,
          isRequired,
          type,
        } as BaseField)
      }

      const isObjectType = property.type === 'object'
      // Verificando se a propriedade é um objeto e não possui propriedades filha, se for, adiciona uma propriedade com o nome e o tipo do objeto
      if (isObjectType && !property.properties) {
        properties.push({
          name: propertyName,
          description: property?.description,
          isRequired,
          type: 'Object',
        } as BaseField)
      }

      // Verificando se a propriedade é um objeto e possui propriedades filha, se for, adiciona uma propriedade com o nome e a renderização do objeto
      if (isObjectType && property.properties) {
        const dependentObject = new SchemaAdapter(
          property,
          this.folder,
          propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
        )
        this.imports = { ...this.imports, ...dependentObject.getImports() }
        const model = dependentObject.getModel()
        this.dependencies.push(model, ...dependentObject.getDependencies())
        properties.push({
          name: propertyName,
          description: property?.description,
          isRequired,
          type: model.name,
        } as BaseField)
      }
    })
  }
}
