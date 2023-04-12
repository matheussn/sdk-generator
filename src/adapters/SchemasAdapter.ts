import { exit } from 'process'
import { OpenApiSchema } from '../types/OpenApi'
import { SchemaAdapter } from './SchemaAdapter'
import { ObjectSchema } from '../schemas/ObjectSchema'
import { SimpleSchema } from '../schemas/SimpleSchema'
import { EnumSchema } from '../schemas/EnumSchema'

export class SchemasAdapter {
  private imports: Record<string, string>
  private models: Record<string, ObjectSchema | SimpleSchema | EnumSchema>
  constructor(
    private readonly rawSchemas: Record<string, OpenApiSchema>,
    private readonly folder: boolean,
  ) {
    this.imports = {}
    this.models = {}
    this.exec()
  }

  getModels() {
    return Object.values(this.models)
  }

  getImports() {
    return this.imports
  }

  private exec() {
    Object.entries(this.rawSchemas).map(([key, value]) => {
      if (this.models[key]) {
        console.warn(`Schema ${key} already exists!`)
        exit(-1)
      }
      const buildedSchema = new SchemaAdapter(key, value, this.folder)
      if (buildedSchema.hasModel()) {
        this.models[key] = buildedSchema.getModel()
        if (buildedSchema.getImports()) {
          this.imports = { ...this.imports, ...buildedSchema.getImports() }
        }
      }
    })
  }
}
