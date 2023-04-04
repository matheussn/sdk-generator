import fs from 'fs'
import YAML from 'yaml'

export class ObjectSchema {
  private readonly schemaFile: any

  constructor(fileName: string) {
    const yamlFile = fs.readFileSync(fileName, 'utf-8')
    this.schemaFile = YAML.parse(yamlFile)
  }
}
