import { exit } from "process"
import { OpenApiRecord } from "../types/OpenApi"
import { SchemaAdapter } from "./SchemaAdapter"
import { ObjectSchema } from "../schemas/ObjectSchema"
import { SimpleSchema } from "../schemas/SimpleSchema"

export class OpenApiAdapter {
  private imports: Record<string, string>
  private models: Record<string, ObjectSchema | SimpleSchema>
  constructor(private readonly rawSchemas: OpenApiRecord<any>) {
    this.imports = {}
    this.models = {}
  }

  getModels() {
    return Object.values(this.models)
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
      const buildedSchema =  new SchemaAdapter(key, value)
      if (buildedSchema.hasModel()) {
        this.models[key] = buildedSchema.getModel()
        if (buildedSchema.getImports()) {
          this.imports = { ...this.imports, ...buildedSchema.getImports() }
        }
      }
    })
  }
  
}
