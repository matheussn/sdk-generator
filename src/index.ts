#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { openApiGen } from './OpenApi'
import { exit } from 'process'
import { prepareOutDir } from './utils/file'

const { argv } = yargs
  .option('basePath', {
    alias: 'bp',
    description: 'Base Path',
    type: 'string',
  })
  .option('ref', {
    alias: 'r',
    description: 'Folder contains the openApi references',
    default: 'references',
    type: 'string',
  })
  .option('schema', {
    alias: 's',
    default: 'schemas',
    description: 'Folder contains the schemas references',
    type: 'string',
  })
  .option('o', {
    alias: 'o',
    description: 'Output Directory',
    type: 'string',
  })
  .demandOption('basePath')
  .demandOption('o')
  .help()
  .alias('help', 'h')

const runAllSchemas = (
  basePath: string,
  calback: (path: string) => void,
) => {
  const files = fs.readdirSync(basePath)

  for (const fileName of files) {
    const filePath = path.join(basePath, fileName)

    const isDir = fs.statSync(filePath).isDirectory()

    if (isDir) {
      runAllSchemas(filePath, calback)
    } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      calback(filePath)
    }
  }
}

const outDir = path.join(process.cwd(), argv.o)

try {
  const referencesDir = path.join(process.cwd(), argv.basePath, argv.ref)
  const schemasDir = path.join(process.cwd(), argv.basePath, argv.schema)

  // verify if the references folder exists
  if (!fs.existsSync(referencesDir)) {
    console.error(`The references folder does not exist: ${referencesDir}`)
    exit(-1)
  }

  // verify if the schemas folder exists
  if (!fs.existsSync(schemasDir)) {
    console.warn(`The schemas folder does not exist: ${schemasDir}`)
  }

  prepareOutDir(outDir)
  runAllSchemas(schemasDir, (path) => {
    openApiGen(path, outDir)
  })
  runAllSchemas(referencesDir, (path) => {
    openApiGen(path, outDir)
  })
} catch (error) {
  console.error(error)
  fs.rmdirSync(outDir)
}
