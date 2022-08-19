import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { renderTemplate } from './renders'

export class SchemaFromOpenApi {
  private schemaFile: any

  constructor(openApiYaml: string, private sourceDir: string, private fileName: string, private schemaMap: Map<string, string>) {
    const yamlFile = fs.readFileSync(openApiYaml, 'utf-8')
    this.schemaFile = YAML.parse(yamlFile)
  }

  generateTypes() {
    if (this.schemaFile.components && this.schemaFile.components.schemas) {
      const models = Object.keys(this.schemaFile.components.schemas).map((schemaName) => {
        return new SchemaAdapter(schemaName, this.schemaFile.components.schemas[schemaName], this.schemaFile.components.schemas, this.schemaMap)
      })
      const imports = models.flatMap(elem => elem.getImports())
      const dest = path.join(process.cwd(), this.sourceDir, this.fileName)

      renderTemplate('schema', dest, { models, imports })
    }
  }
}
