import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { renderTemplate } from './renders'

export class SchemaFromOpenApi {
  private schemaFile: any

  constructor(
    openApiYaml: string,
    private sourceDir: string,
    private fileName: string,
    private schemaMap: Map<string, string>,
  ) {
    const yamlFile = fs.readFileSync(openApiYaml, 'utf-8')
    this.schemaFile = YAML.parse(yamlFile)
  }

  generateTypes() {
    if (this.schemaFile.components && this.schemaFile.components.schemas) {
      const models = Object.keys(this.schemaFile.components.schemas).map(schemaName => {
        return new SchemaAdapter(
          schemaName,
          this.schemaFile.components.schemas[schemaName],
          this.schemaFile.components.schemas,
          this.schemaMap,
        )
      })
      const name = this.camelize(this.fileName.replace('.yaml', '')) + '.ts'
      const dest = path.join(process.cwd(), this.sourceDir, name)

      renderTemplate('schema', dest, { models })
    }
  }

  private camelize(str: string) {
    let STR = str.toLowerCase()
      .trim()
      .split(/[ -_]/g)
      .map(word => word.replace(word[0], word[0].toString().toUpperCase()))
      .join('');
    // console.log(STR)
    // const value = STR.replace(STR[0], STR[0].toLowerCase())
    return STR;
  }
}
