import path from 'path'
import { renderTemplate } from './renders'
import { OpenApiAdapter } from './adapters/OpenApiAdapter'
import { camelize } from './utils/camelize'
import { createDir } from './utils/file'

export class OpenApi {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly schemas: Record<string, any>,
    private readonly folder: boolean,
  ) {}

  generateTypes(): void {
    if (this.schemas) {
      const schemas = new OpenApiAdapter(this.schemas)
      schemas.exec()
      const baseFolder = path.join(this.outDir, this.fileName.toLocaleLowerCase())
      const name = camelize(this.fileName) + '.ts'
      const dest = path.join(baseFolder, name)

      if (this.folder) createDir(baseFolder)

      renderTemplate('schema', dest, { schemas })
    }
  }
}
