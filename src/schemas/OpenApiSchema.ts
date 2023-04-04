import fs from 'fs'
import YAML from 'yaml'
import { Schema } from '../Schema'
import { camelize } from '../utils/camelize'

export class OpenApiSchema {
  private readonly schemaFile: any
  private readonly finalFileName: string
  public components: Map<string, Schema> = new Map()

  constructor(path: string, private filename: string) {
    const yamlFile = fs.readFileSync(path, 'utf-8')
    this.schemaFile = YAML.parse(yamlFile)

    this.finalFileName = camelize(filename.replace('.yaml', ''))
    this.makeComponents()
  }

  private makeComponents() {
    if (this.schemaFile.components && this.schemaFile.components.schemas) {
      Object.keys(this.schemaFile.components.schemas).map(schemaName => {
        this.components.set(schemaName, this.schemaFile.components.schemas[schemaName])
      })
    }
  }
}
