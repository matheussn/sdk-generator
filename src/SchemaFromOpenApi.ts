import path from 'path'
import { renderTemplate } from './renders'
import { SchemasAdapter } from './adapters/SchemasAdapter'

export class SchemaFromOpenApi {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly schemas: Record<string, any>,
  ) {}

  generateTypes(): void {
    if (this.schemas) {
      const schemas = new SchemasAdapter(
        this.schemas,
      )
      schemas.exec()
      const name =
        this.camelize(path.basename(this.fileName, path.extname(this.fileName))) + '.ts'
      const dest = path.join(this.outDir, name)

      renderTemplate('schema', dest, { schemas })
    }
  }

  private camelize(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .split(/[ -_]/g)
      .map(word => word.replace(word[0], word[0].toString().toUpperCase()))
      .join('')
  }
}
