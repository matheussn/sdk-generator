import path from 'path'
import { AWSOpenAPI } from './types/OpenApi'
import { OpenApi } from './OpenApi'
import { Schema } from './Schema'
import { loadFile } from './utils/file'

export const openApiGen = (filePath: string, outDir: string, folder: boolean) => {
  const typesDir = path.join(outDir, 'types')
  const name = path.basename(filePath, path.extname(filePath))

  const schema = loadFile(filePath)

  if(isOpenApiFile(schema)) {
    const schemaGen = new OpenApi(name, typesDir, schema?.components?.schemas, folder)
    schemaGen.generateTypes()
    // TODO: generate api sdk
  } else {
    const schemaGen = new Schema(name, typesDir, schema, folder)
    schemaGen.generateTypes()
  }
}

export const isOpenApiFile = (schema: AWSOpenAPI<any> | Record<string, any>): boolean => {
  return schema?.openapi !== undefined
}
