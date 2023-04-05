import path from 'path'
import { renderTemplate } from './renders'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { camelize } from './utils/camelize'

export class Schema {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly schemas: Record<string, any>,
  ) {}

  generateTypes() {
    if (this.schemas) {
      const schemas = new SchemaAdapter(this.fileName, this.schemas)
      const name =
        camelize(path.basename(this.fileName, path.extname(this.fileName))) + '.ts'
      const dest = path.join(this.outDir, name)

      if (schemas.hasModel()) {
        renderTemplate('schema', dest, { schemas })
      }
    }
  }
}
