import { renderTemplateToString } from '../renders'
import { PropertyAdapter } from './PropertyAdapter'

export interface OmmitAdapter {
  type: string
  fields: string[]
}

export interface Import {
  to: string
  from: string
}

export class SchemaAdapter {
  readonly description: string
  readonly isSimpleType: boolean
  readonly isArrayType: boolean
  extends: string[]
  ommit: OmmitAdapter
  type: string
  imports: Import[]
  importsV2: Record<string, string>
  properties: any[]

  constructor(
    readonly name: string,
    readonly schema: any,
    readonly context?: any,
    readonly schemaMap?: Map<string, string>,
  ) {
    this.imports = []
    this.importsV2 = {}
    this.extends = []
    this.description = schema.description
    const schemaType = schema.type
    this.isSimpleType = this.isSimpleTypeSchemaType(schemaType)
    this.isArrayType = schemaType === 'array'

    if (schema.allOf) {
      let extendedModelSchema = schema
      const hasTypeChange = schema.allOf.some(elem => elem.required !== undefined)
      schema.allOf.forEach(allOfSchema => {
        if (hasTypeChange) {
          this.buildOmmitProperties(allOfSchema)
        } else if (allOfSchema.$ref) {
          this.extends.push(this.getTypeFromReference(allOfSchema.$ref))
        } else {
          extendedModelSchema = allOfSchema
        }
      })
      this.schema = extendedModelSchema
    } else if (this.isSimpleType) {
      this.schema = schema
      this.type = this.getTypeFromSimpleType(schemaType)
    } else {
      this.schema = schema
      this.type = this.isArrayType ? this.getTypeFromArrayType(schema, name) : undefined
    }

    if (schema.$ref) {
      this.handleRef(schema)
    } else {
      this.properties = this.setProperties()
    }
  }

  hasDescription() {
    return this.description !== undefined
  }

  hasOmmit() {
    return this.ommit !== undefined
  }

  getImports() {
    return this.importsV2 ? Object.values(this.importsV2) : []
  }

  getOmmitProperties() {
    const properties = []
    const ommitContext = JSON.parse(JSON.stringify(this.context[this.ommit.type]))
    let newProp = {}
    Object.keys(ommitContext.properties).forEach(prop => {
      if (this.ommit.fields.includes(prop)) {
        newProp = { ...newProp, [prop]: ommitContext.properties[prop] }
      }
    })
    ommitContext.properties = newProp
    ommitContext.required = this.ommit.fields
    this.handleProperties(properties, ommitContext)
    return properties
  }

  setProperties() {
    const properties = []
    this.handleProperties(properties)
    // this.handleOfProperties(properties)
    return properties
  }

  private isSimpleTypeSchemaType(schemaType: string) {
    return ['boolean', 'number', 'string', 'integer'].includes(schemaType)
  }

  private getTypeFromReference(reference: string): string {
    // reference format: #/components/schemas/<type>
    return reference.split('/').pop()
  }

  private getTypeFromSimpleType(schemaType: string, schema?: any, isArray?: boolean) {
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

  private getTypeFromStringType(schema: any, isArray: boolean) {
    schema = schema !== null && schema !== undefined ? schema : this.schema
    if (schema.enum) {
      const type = `'${schema.enum.join("' | '")}'`
      return isArray ? `(${type})` : type
    }
    if (schema.format && schema.format === 'date-time') {
      return 'Date'
    }
    return 'string'
  }

  private getTypeFromArrayType(arraySchemaObject?: any, name?: string) {
    const schema =
      arraySchemaObject !== null && arraySchemaObject !== undefined
        ? arraySchemaObject
        : this.schema
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
    const type = renderTemplateToString('object-type', {
      properties: nestedProperties,
    })
    const newType = type.endsWith('\n') ? type.replace(/\n/g, '') : type
    return `${newType}[]`
  }

  private getExternalReferences(refName: string) {
    const nameFile = this.getTypeFromReference(refName)
    const name = nameFile.split('.')[0]
    if(this.importsV2[name] === undefined) {
      this.importsV2[name] = name
    }
    return name
  }

  private handleProperties(properties: PropertyAdapter[], schemaObject?: any) {
    const schema =
      schemaObject !== null && schemaObject !== undefined ? schemaObject : this.schema
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
        const type = renderTemplateToString('object-type', {
          properties: nestedProperties,
        })
        properties.push(new PropertyAdapter(propertyNameTs, type))
      }
    })
  }

  private buildOmmitProperties(allOfSchema: any) {
    if (allOfSchema.$ref) {
      this.ommit = {
        ...this.ommit,
        type: this.getTypeFromReference(allOfSchema.$ref),
      }
    } else {
      this.ommit = { ...this.ommit, fields: allOfSchema.required }
    }
  }

  private handleOfProperties(schemaObject?: any) {
    const schema =
      schemaObject !== null && schemaObject !== undefined ? schemaObject : this.schema

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

  private handleRef(schema: any) {
    if (schema.$ref.includes('.yaml')) {
      return this.getExternalReferences(schema.$ref)
    } else {
      return this.getTypeFromReference(schema.$ref)
    }
  }
}
