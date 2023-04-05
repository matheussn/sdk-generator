import path from 'path'
import { renderTemplate } from './renders'
import { OpenApiAdapter } from './adapters/OpenApiAdapter'
import { camelize } from './utils/camelize'

export class SchemaFromOpenApi {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly schemas: Record<string, any>,
  ) {}

  generateTypes(): void {
    if (this.schemas) {
      const schemas = new OpenApiAdapter(
        this.schemas,
      )
      schemas.exec()
      const name =
        camelize(path.basename(this.fileName, path.extname(this.fileName))) + '.ts'
      const dest = path.join(this.outDir, name)

      renderTemplate('schema', dest, { schemas })
    }
  }
}
