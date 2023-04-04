#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { openApiGen, prepareOutDir } from './OpenApi'
import { exit } from 'process'

const { argv } = yargs
  .option('basePath', {
    alias: 'bp',
    description: 'Base Path',
    type: 'string',
  })
  .option('references', {
    alias: 'r',
    description: 'Folder contains the openApi references',
    default: 'references',
    type: 'string',
  })
  .option('schemas', {
    alias: 's',
    default: 'schemas',
    description: 'Folder contains the schemas references',
    type: 'string',
  })
  .option('outDir', {
    alias: 'od',
    description: 'Output Directory',
    type: 'string',
  })
  .demandOption('basePath')
  .demandOption('outDir')
  .help()
  .alias('help', 'h')

const runAllSchemas = (
  basePath: string,
  calback: (path: string, name: string) => void,
) => {
  console.log(`> ${basePath}`)
  const files = fs.readdirSync(basePath)

  for (const fileName of files) {
    const filePath = path.join(basePath, fileName)

    const isDir = fs.statSync(filePath).isDirectory()

    if (isDir) {
      runAllSchemas(filePath, calback)
    } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      calback(filePath, fileName)
    }
  }
}

const outDir = path.join(process.cwd(), argv.outDir)

try {
  const referencesDir = path.join(process.cwd(), argv.basePath, argv.references)
  const schemasDir = path.join(process.cwd(), argv.basePath, argv.schemas)

  // verify if the references folder exists
  if (!fs.existsSync(referencesDir)) {
    console.error(`The references folder does not exist: ${referencesDir}`)
    exit(-1)
  }

  if (!fs.existsSync(schemasDir)) {
    console.warn(`The schemas folder does not exist: ${schemasDir}`)
  }

  prepareOutDir(outDir)
  const schemaMap: Map<string, string> = new Map()
  runAllSchemas(referencesDir, (path, name) => {
    console.log(`> ${path}`)
    openApiGen(path, outDir)
  })
} catch (error) {
  console.error(error)
  fs.rmdirSync(outDir)
}
