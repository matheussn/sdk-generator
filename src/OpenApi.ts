import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { AWSOpenAPI } from './types/OpenApi'
import { SchemaFromOpenApi } from './SchemaFromOpenApi'

const parseYAML = (schema: any): any => {
  try {
    return yaml.load(schema)
  } catch (err: any) {
    console.error(`YAML: ${err.toString()}`)
    process.exit(1)
  }
}

// função que prepara o diretório de saída
// Operações:
//  - Cria o diretório de saída caso ele não exista
//  - Cria um subDiretório para os arquivos de tipos com o nome `types`
//  - Cria um subDiretório para os arquivos de api com o nome `api`
export const prepareOutDir = (outDir: string) => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  const typesDir = path.join(outDir, 'types')
  if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir)
  const apiDir = path.join(outDir, 'api')
  if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir)
}

export const openApiGen = (filePath: string, outDir: string) => {
  const typesDir = path.join(outDir, 'types')
  const name = path.basename(filePath, path.extname(filePath))

  const schema = loadFile(filePath)

  const schemaGen = new SchemaFromOpenApi(name, typesDir, schema?.components?.schemas)
  schemaGen.generateTypes()
}

const loadFile = (filePath: string): AWSOpenAPI<any> => {
  let schema = undefined
  const ext = path.extname(filePath).toLowerCase()
  const contents = fs.readFileSync(filePath, 'utf8')

  if (ext === '.yaml' || ext === '.yml') return parseYAML(contents)
  // TODO: add support for JSON Schema Draft 7

  return schema
}
