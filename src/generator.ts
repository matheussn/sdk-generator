import path from 'path'
import { OpenApi } from './types/OpenApi'
import { OpenApiGen } from './OpenApi'
import { Schema } from './Schema'
import { loadFile } from './utils/file'
import { OpenApiWrapper } from './wrapper/OpenApiWrapper'

export const openApiGen = (filePath: string, outDir: string, folder: boolean) => {
  const typesDir = path.join(outDir, 'types')
  const name = path.basename(filePath, path.extname(filePath))

  const file = loadFile(filePath)

  if(isOpenApiFile(file)) {
    const openApi = new OpenApiWrapper(file as OpenApi, folder)
    const schemaGen = new OpenApiGen(name, typesDir, openApi, folder)
    schemaGen.generateTypes()
    // TODO: generate api sdk
  } else {
    const schemaGen = new Schema(name, typesDir, file, folder)
    schemaGen.generateTypes()
  }
}

export const isOpenApiFile = (schema: OpenApi | Record<string, any>): boolean => {
  return schema?.openapi !== undefined
}
