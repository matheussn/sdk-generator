import path from 'path'
import { renderTemplate } from './renders'
import { camelize } from './utils/string'
import { createDir } from './utils/file'
import { OpenApiWrapper } from './wrapper/OpenApiWrapper'

export class OpenApiGen {
  constructor(
    private readonly fileName: string,
    private readonly outDir: string,
    private readonly openApi: OpenApiWrapper,
    private readonly folder: boolean,
  ) {}

  generateTypes(): void {
    if (this.openApi.hasSchemas()) {
      const baseFolder = path.join(
        this.outDir,
        this.folder ? this.fileName.toLocaleLowerCase() : '',
      )
      const name = camelize(this.fileName) + '.ts'
      const dest = path.join(baseFolder, name)

      if (this.folder) createDir(baseFolder)

      renderTemplate('openApiSchema.njk', dest, { openApi: this.openApi })
    }
  }
}
