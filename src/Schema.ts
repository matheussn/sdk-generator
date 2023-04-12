import path from 'path'
import { renderTemplate } from './renders'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { camelize } from './utils/string'
import { createDir } from './utils/file'

export class Schema {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly schemas: Record<string, any>,
    private readonly folder: boolean,
  ) {}

  generateTypes(): void {
    if (this.schemas) {
      const schemas = new SchemaAdapter(this.fileName, this.schemas, this.folder)
      const baseFolder = path.join(
        this.outDir,
        this.folder ? this.fileName.toLocaleLowerCase() : '',
      )
      const name = camelize(this.fileName) + '.ts'
      const dest = path.join(baseFolder, name)

      if (this.folder) createDir(baseFolder)

      if (schemas.hasModel()) {
        renderTemplate('schema.njk', dest, { schemas })
      }
    }
  }
}
