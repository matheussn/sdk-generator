#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { exit } from 'process'
import { prepareOutDir } from './utils/file'
import { Generator } from './Gen'

const argv = yargs(process.argv.slice(2))
  .options({
    basePath: {
      alias: 'bp',
      description: 'Base Path',
      type: 'string',
      require: true,
    },
    f: {
      description: 'Folder contains the openApi references',
      default: false,
      type: 'boolean',
    },
    ref: {
      alias: 'r',
      description: 'Folder contains the openApi references',
      default: 'references',
      type: 'string',
    },
    schema: {
      alias: 's',
      default: 'schemas',
      description: 'Folder contains the schemas references',
      type: 'string',
    },
    o: { description: 'Output Directory', type: 'string', require: true },
  })
  .help()
  .alias('help', 'h')
  .parseSync()

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

  // Passar pelos arquivos de schema preparando as informações para gerar os arquivos
  // Salvar essas informações em um mapa (nome do arquivo => informações)

  // Passar pelos arquivos de referência preparando as informações para gerar os arquivos
  // Salvar essas informações em um mapa (nome do arquivo => informações)

  const gen = new Generator(argv.basePath, argv.ref, outDir, argv.f, argv.schema)
  gen.generateTypes()
} catch (error) {
  console.error(error)
  fs.rmSync(outDir, { recursive: true })
}
