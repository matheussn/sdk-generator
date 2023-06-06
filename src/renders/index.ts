import path from 'path'
import nunjucks from 'nunjucks'
import prettier from 'prettier'
import fs from 'fs'
import { OpenApiWrapper } from '../wrapper/OpenApiWrapper'
import { BaseSchema, SchemaType } from '../schemas/BaseSchema'

export interface Params {
  openApi?: OpenApiWrapper
  schemas?: BaseSchema[]
  schema?: BaseSchema
  dependencies?: string
  imports?: Record<string, string>
  properties?: any[]
}

export const renderTemplateToString = (templateName: string, params: Params) => {
  const templateDir = path.join(__dirname, '../templates')
  nunjucks.configure(templateDir, { autoescape: false, trimBlocks: true })
  const template = path.join(templateDir, templateName)
  return nunjucks.render(template, params)
}

export const renderTemplate = (name: string, destinationFile: string, params: Params) => {
  const renderResult = renderTemplateToString(name, params)
  const finalContent = prettier.format(renderResult, {
    parser: 'typescript',
    useTabs: false,
    tabWidth: 2,
    endOfLine: 'lf',
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'avoid',
    printWidth: 90,
    semi: false,
  })
  fs.writeFileSync(destinationFile, finalContent)
}

const applyPrettier = (content: string) =>
  prettier.format(content, {
    parser: 'typescript',
    useTabs: false,
    tabWidth: 2,
    endOfLine: 'lf',
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'avoid',
    printWidth: 90,
    semi: false,
  })

export const createFile = (dest: string, content: string, runPrettier: boolean) => {
  fs.writeFileSync(dest, runPrettier ? applyPrettier(content) : content)
}

export const render = {
  [SchemaType.ENUM]: (params: Params) =>
    renderTemplateToString('schemas/enum.njk', params),
  [SchemaType.SIMPLE]: (params: Params) =>
    renderTemplateToString('schemas/simple.njk', params),
  [SchemaType.OBJECT]: (params: Params) =>
    renderTemplateToString('schemas/object.njk', params),
  [SchemaType.IMPORTS]: (params: Params) =>
    renderTemplateToString('base/imports.njk', params),
}

export const renderAndSave = {
  [SchemaType.ENUM]: (dest: string, params: Params) =>
    renderTemplate('schemas/enum.njk', dest, params),
  [SchemaType.SIMPLE]: (dest: string, params: Params) =>
    renderTemplate('schemas/simple.njk', dest, params),
  [SchemaType.OBJECT]: (dest: string, params: Params) =>
    renderTemplate('schemas/object.njk', dest, params),
}
