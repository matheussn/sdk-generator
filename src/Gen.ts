import fs from 'fs'
import path from 'path'
import { createDir, loadFile } from './utils/file'
import { OpenApi, OpenApiSchema } from './types/OpenApi'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { createFile, render } from './renders'
import { OpenApiWrapper } from './wrapper/OpenApiWrapper'
import { SchemaType } from './schemas/BaseSchema'


export interface FileAdapter {
  imports: Record<string, string>
  schemas: SchemaAdapter[]
}

export class Generator {
  // Mapa de schemas, sendo a chave o nome do arquivo e o valor o schema em si
  public schemas: Record<string, FileAdapter> = {}

  constructor(
    private readonly basePath: string,
    private readonly referencePath: string,
    private readonly outDir: string,
    private readonly folder: boolean,
    private readonly prettier: boolean,
    private readonly schemaPath?: string,
  ) {
    this.loadSchemas()
  }

  generateTypes(): void {
    const baseFolder = path.join(this.outDir)

    for (const [key, value] of Object.entries(this.schemas)) {
      const fileName = key.replace('.yaml', '.ts')
      const name = fileName.charAt(0).toUpperCase() + fileName.slice(1)
      const dest = path.join(baseFolder, name)

      if (this.folder) createDir(baseFolder)

      const schemas = Object.values(value.schemas)

      if (schemas.length === 1) {
        const model = schemas[0].getModel()
        const dependencies = schemas[0].getDependencies()
        let dependenciesString = ''

        if (dependencies) {
          dependencies.forEach(dependency => {
            dependenciesString += render[dependency.type]({ schema: dependency })
          })
        }

        const type = model.type
        const imports = render[SchemaType.IMPORTS]({ imports: value.imports })
        const schema = render[type]({ schema: model })

        if(schema === '') continue

        createFile(dest, `${imports}\n${dependenciesString}\n${schema}`, this.prettier)
        continue
      } else {
        const dependencies = schemas.map(schema => schema.getDependencies()).flat()
        const models = schemas.map(schema => schema.getModel())
        const dependenciesString = dependencies
          .map(dependency => render[dependency.type]({ schema: dependency }))
          .join('\n')
        const modelsString = models
          .map(model => render[model.type]({ schema: model }))
          .join('\n')
        const importString = render[SchemaType.IMPORTS]({ imports: value.imports })

        if(modelsString === '') continue
        createFile(dest, `${importString}\n${dependenciesString}\n${modelsString}`, this.prettier)
      }
    }
  }

  private loadSchemas() {
    if (this.schemaPath) {
      this.loadSchemaFromFolder(this.schemaPath)
    }

    this.loadSchemaFromFolder(this.referencePath)
  }

  private loadSchemaFromFolder(folderPath: string) {
    const basePath = path.join(process.cwd(), this.basePath, folderPath)
    const files = fs.readdirSync(basePath)

    for (const fileName of files) {
      const filePath = path.join(basePath, fileName)

      const isDir = fs.statSync(filePath).isDirectory()

      if (isDir) {
        this.loadSchemaFromFolder(path.join(folderPath, fileName))
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        this.loadSchema(filePath, fileName)
      }
    }
  }

  private loadSchema(filePath: string, fileName: string) {
    const file = loadFile(filePath)

    if (this.isOpenApiFile(file)) {
      const openApi = new OpenApiWrapper(file as OpenApi, this.folder)
      this.schemas = {
        ...this.schemas,
        [fileName]: {
          schemas: {
            ...openApi.schemas,
          },
          imports: openApi.getImports(),
        },
      }
    } else {
      const openApiSchema = file as OpenApiSchema
      const schema = new SchemaAdapter(openApiSchema, this.folder, fileName.replace('.yaml', ''))
      this.schemas = {
        ...this.schemas,
        [fileName]: {
          schemas: [schema],
          imports: schema.getImports(),
        },
      }
    }
  }

  private isOpenApiFile(schema: OpenApi | Record<string, any>): boolean {
    return schema?.openapi !== undefined
  }
}
