import { SchemaAdapter } from '../adapters/SchemaAdapter'
import { OpenApi } from '../types/OpenApi'

export class OpenApiWrapper {
  private imports: Record<string, string> = {}
  public schemas: SchemaAdapter[] = []

  constructor(private readonly openApi: OpenApi, private readonly folder: boolean) {
    this.buildModels()
  }

  hasSchemas(): boolean {
    return this.openApi?.components?.schemas !== undefined
  }

  hasPaths(): boolean {
    return this.openApi?.paths !== undefined
  }

  getSchemas() {
    return Object.values(this.schemas)
  }

  getImports() {
    return this.imports
  }

  private buildModels() {
    Object.entries(this.openApi?.components?.schemas || {}).map(([key, value]) => {
      const buildedSchema = new SchemaAdapter(value, this.folder, key)
      if (buildedSchema.hasModel()) {
        this.schemas.push(buildedSchema)
      }
      if (buildedSchema.getImports()) {
        this.imports = { ...this.imports, ...buildedSchema.getImports() }
      }
    })
  }
}
