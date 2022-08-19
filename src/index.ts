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

  const schemasFiles = fs.readdirSync(schemasDir)
  const schemaMap: Map<string, string> = new Map()

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }

  for (const file of schemasFiles) {
    const fileName = path.join(schemasDir, file)
    const outFile = file.replace('.yaml', '.ts')
    schemaMap.set(file, outFile)
    const api = new Schema(fileName, argv.outDir, outFile)
    api.generateTypes()
  }

  const referencesFiles = fs.readdirSync(referencesDir)

  for (const file of referencesFiles) {
    const fileName = path.join(referencesDir, file)
    const api = new SchemaFromOpenApi(
      fileName,
      argv.outDir,
      file.replace('.yaml', '.ts'),
      schemaMap,
    )
    api.generateTypes()
  }
} catch (error) {
  fs.rmdirSync(outDir)
}
