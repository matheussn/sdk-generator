#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { openApiGen, prepareOutDir } from './OpenApi'

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

const runAllSchemas = (
  basePath: string,
  schemaMap: Map<string, string>,
  calback: (path: string, name: string, schemaMap: Map<string, string>) => void,
) => {
  console.log(`> ${basePath}`)
  const files = fs.readdirSync(basePath)

  for (const fileName of files) {
    const filePath = path.join(basePath, fileName)

    const isDir = fs.statSync(filePath).isDirectory()

    if (isDir) {
      runAllSchemas(filePath, schemaMap, calback)
    } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      calback(filePath, fileName, schemaMap)
    }
  }
}

const outDir = path.join(process.cwd(), argv.outDir)

try {
  const referencesDir = path.join(process.cwd(), argv.references)
  const schemasDir = path.join(process.cwd(), argv.schemas)

  prepareOutDir(outDir)
  const schemaMap: Map<string, string> = new Map()
  runAllSchemas(referencesDir, schemaMap, (path, name, _) => {
    console.log(`> ${path}`)
    openApiGen(path, outDir)
  })
} catch (error) {
  console.error(error)
  fs.rmdirSync(outDir)
}
