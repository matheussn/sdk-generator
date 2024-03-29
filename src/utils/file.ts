import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { OpenApi, OpenApiSchema } from '../types/OpenApi'

// função que prepara o diretório de saída
// Operações:
//  - Cria o diretório de saída caso ele não exista
//  - Cria um subDiretório para os arquivos de tipos com o nome `types`
//  - TODO: Cria um subDiretório para os arquivos de api com o nome `api`
export const prepareOutDir = (outDir: string) => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  // const typesDir = path.join(outDir, 'types')
  // if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir)
}

export const createDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
}

const parseYAML = (schema: any): any => {
  try {
    return yaml.load(schema)
  } catch (err: any) {
    console.error(`YAML: ${err.toString()}`)
    process.exit(1)
  }
}

export const loadFile = (
  filePath: string,
): OpenApi | Record<string, any> | OpenApiSchema => {
  const ext = path.extname(filePath).toLowerCase()
  const contents = fs.readFileSync(filePath, 'utf8')

  if (ext === '.yaml' || ext === '.yml') return parseYAML(contents)
  // TODO: add support for JSON

  return undefined
}
