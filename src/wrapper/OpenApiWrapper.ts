import { SchemaAdapter } from '../adapters/SchemaAdapter'
import { ObjectSchema } from '../schemas/ObjectSchema'
import { SimpleSchema } from '../schemas/SimpleSchema'
import { OpenApi } from '../types/OpenApi'

export class OpenApiWrapper {
  private modelsImports: Record<string, string> = {}
  private models: Record<string, ObjectSchema | SimpleSchema> = {}

  constructor(private openApi: OpenApi) {
    this.buildModels()
  }

  hasSchemas(): boolean {
    return this.openApi?.components?.schemas !== undefined
  }

  hasPaths(): boolean {
    return this.openApi?.paths !== undefined
  }

  getSchemas() {
    return Object.values(this.models)
  }

  getImports() {
    return this.modelsImports
  }

  private buildModels() {
    Object.entries(this.openApi?.components?.schemas || {}).map(([key, value]) => {
      if (this.models[key]) {
        console.warn(`Schema ${key} already exists!`)
        return
      }
      const buildedSchema = new SchemaAdapter(key, value)
      if (buildedSchema.hasModel()) {
        this.models[key] = buildedSchema.getModel()
        if (buildedSchema.getImports()) {
          this.modelsImports = { ...this.modelsImports, ...buildedSchema.getImports() }
        }
      }
    })
  }
}
