#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { exit } from 'process'
import { Schema } from './Schema'
import { SchemaFromOpenApi } from './SchemaFromOpenApi'

const { argv } = yargs
  .option('references', {
    alias: 'r',
    description: 'Folder contains the openApi references',
    type: 'string',
  })
  .option('schemas', {
    alias: 's',
    description: 'Folder contains the schemas references',
    type: 'string',
  })
  .option('outDir', {
    alias: 'od',
    description: 'Output Directory',
    type: 'string',
  })
  .demandOption('references')
  .demandOption('schemas')
  .demandOption('outDir')
  .help()
  .alias('help', 'h')

const runAllSchemas = (basePath: string, schemaMap: Map<string, string>, calback: (path: string, name: string, schemaMap: Map<string, string>) => void) => {
  console.log(`> ${basePath}`)
  const files = fs.readdirSync(basePath)

  for (const fileName of files) {
    const filePath = path.join(basePath, fileName)

    const isDir = fs.statSync(filePath).isDirectory()
  
    if (isDir) {
      runAllSchemas(filePath, schemaMap, calback)
    } else {
      calback(filePath, fileName, schemaMap)
    }
  }
}

const outDir = path.join(process.cwd(), argv.outDir)

try {
  const referencesDir = path.join(process.cwd(), argv.references)
  const schemasDir = path.join(process.cwd(), argv.schemas)

  if (!fs.existsSync(referencesDir)) {
    console.error(`O doretório '${referencesDir}' não existe!`)
    exit(0)
  }

  if (!fs.existsSync(schemasDir)) {
    console.error(`O doretório '${schemasDir}' não existe!`)
    exit(0)
  }

  const schemaMap: Map<string, string> = new Map()

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }

  runAllSchemas(schemasDir, schemaMap, (path, name, _) => {
    console.log(`${path}:`)
    const outFile = name
    schemaMap.set(name, outFile)
    const api = new Schema(path, argv.outDir, outFile)
    api.generateTypes()
  })

  runAllSchemas(referencesDir, schemaMap, (filePath, name, schemas) => {
    console.log(`${filePath}:`)
    const api = new SchemaFromOpenApi(
      filePath,
      argv.outDir,
      name,
      schemas,
    )
    api.generateTypes()
  })
} catch (error) {
  console.error(error)
  fs.rmdirSync(outDir)
}