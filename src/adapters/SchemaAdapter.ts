import { renderTemplateToString } from "../renders"
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
  properties: any[]

  constructor(readonly name: string, readonly schema: any, readonly context?: any, readonly schemaMap?: Map<string, string>) {
    this.imports = []
    this.extends = []
    this.description = schema.description
    this.isSimpleType = this.isSimpleTypeSchemaType(schema.type)
    const schemaType = schema.type
    this.isArrayType = 'array' === schemaType
    if (schema.allOf) {
      let extendedModelSchema = schema;
      const hasTypeChange = schema.allOf.some(elem => elem.required !== undefined)
      schema.allOf.forEach((allOfSchema) => {
        if (hasTypeChange) {
          this.buildOmmitProperties(allOfSchema)
        } else {
          if (allOfSchema.$ref) {
            this.extends.push(this.getTypeFromReference(allOfSchema.$ref))
          } else {
            extendedModelSchema = allOfSchema
          }
        }
      })
      this.schema = extendedModelSchema
    }
    else if (this.isSimpleType) {
      this.schema = schema
      this.type = this.getTypeFromSimpleType(schemaType)
    }
    else {
      this.schema = schema
      this.type = this.isArrayType ? this.getTypeFromArrayType() : undefined
    }

    this.properties = this.setProperties()
  }

  hasDescription() {
    return this.description !== undefined
  }

  hasOmmit() {
    return this.ommit !== undefined
  }

  getImports() {
    return this.imports
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
    return properties
  }

  private isSimpleTypeSchemaType(schemaType: string) {
    return ['boolean', 'number', 'string', 'integer'].includes(schemaType)
  }

  private getTypeFromReference(reference) {
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
    schema = schema !== null && schema !== void 0 ? schema : this.schema
    if (schema.enum) {
      const type = `'${schema.enum.join("' | '")}'`
      return isArray ? `(${type})` : type
    }
    if (schema.format && schema.format === 'date-time') {
      return 'Date'
    }
    return 'string'
  }

  private getTypeFromArrayType(arraySchemaObject?: any) {
    const schema = arraySchemaObject !== null && arraySchemaObject !== void 0 ? arraySchemaObject : this.schema
    const items = schema.items

    if (items.$ref) {
      const type = this.getTypeFromReference(items.$ref)
      return `${type}[]`
    }

    const isSimpleType = this.isSimpleTypeSchemaType(items.type)
    if (isSimpleType) {
      const itemsType = items.type
      const type = this.getTypeFromSimpleType(itemsType, items, true)
      return `${type}[]`
    }
    const isArrayType = 'array' === items.type
    if (isArrayType) {
      const type = this.getTypeFromArrayType(items)
      return `${type}[]`
    }
    const nestedProperties = []
    this.handleProperties(nestedProperties, items)
    const type = renderTemplateToString('object-type', {
      properties: nestedProperties,
    })
    return `${type}[]`
  }

  private getExternalReferences(refName: string) {
    const nameFile = this.getTypeFromReference(refName)
    const name = nameFile.split('.')[0]
    this.imports = [...this.imports, {to: name, from: this.schemaMap.get(nameFile).split('.')[0] }]
    return name
  }

  private handleProperties(properties: PropertyAdapter[], schemaObject?: any) {
    const schema = (schemaObject !== null && schemaObject !== undefined) ? schemaObject : this.schema
    const objectProperties = schema.properties !== undefined && schema.properties !== undefined ? schema.properties : {}
    const hasRequired = schema.required !== null && schema.required !== undefined

    Object.keys(objectProperties).forEach((propertyName) => {
      const property = objectProperties[propertyName];

      const isRequired = hasRequired ? schema.required.includes(propertyName): false
      const propertyNameTs = `${propertyName}${isRequired ? '' : '?'}`

      if (property.$ref) {
        properties.push(new PropertyAdapter(propertyNameTs, this.getExternalReferences(property.$ref)))
      }

      const isSimpleType = this.isSimpleTypeSchemaType(property.type);
      if (isSimpleType) {
        const type = this.getTypeFromSimpleType(property.type, property);
        properties.push(new PropertyAdapter(propertyNameTs, type));
      }
      const isArrayType = 'array' === property.type;
      if (isArrayType) {
        const type = this.getTypeFromArrayType(property);
        properties.push(new PropertyAdapter(propertyNameTs, type));
      }
      const isObjectType = 'object' == property.type
      
      if (isObjectType && !property.properties) {
        properties.push(new PropertyAdapter(propertyNameTs, 'Object'));
      }

      if (isObjectType && property.properties) {
        const nestedProperties = []
        this.handleProperties(nestedProperties, property)
        const type = renderTemplateToString('object-type', {
          properties: nestedProperties,
        })
        properties.push(new PropertyAdapter(propertyNameTs, type));
      }
    })
  }

  private buildOmmitProperties(allOfSchema: any) {
    if (allOfSchema.$ref) {
      this.ommit = { ...this.ommit, type: this.getTypeFromReference(allOfSchema.$ref) }
    } else {
      this.ommit = { ...this.ommit, fields: allOfSchema.required }
    }
  }
}
