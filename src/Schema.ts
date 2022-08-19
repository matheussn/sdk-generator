import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { SchemaAdapter } from './adapters/SchemaAdapter'
import { renderTemplate } from './renders'

export class Schema {
  private schemaFile: any

  private sourceDir: string

  private fileName: string

  constructor(schemaYaml: string, sourceDir: string, resultFileName: string) {
    const yamlFile = fs.readFileSync(schemaYaml, 'utf-8')
    this.schemaFile = YAML.parse(yamlFile)
    this.sourceDir = sourceDir
    this.fileName = resultFileName
  }

  generateTypes() {
    if (this.schemaFile) {
      const model = new SchemaAdapter(this.schemaFile.title, this.schemaFile)
      const dest = path.join(process.cwd(), this.sourceDir, this.fileName)
      renderTemplate('schema', dest, { models: [model] })
    }
  }
}
