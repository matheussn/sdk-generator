import path from 'path'
import nunjucks from 'nunjucks'
import prettier from 'prettier'
import fs from 'fs'
import { SchemaAdapter } from '../adapters/SchemaAdapter'
import { SchemasAdapter } from '../adapters/SchemasAdapter'
import { OpenApiWrapper } from '../wrapper/OpenApiWrapper'

export interface Params {
  openApi?: OpenApiWrapper
  schemas?: SchemasAdapter | SchemaAdapter
  properties?: any[]
}

export const renderTemplateToString = (templateName: string, params: Params) => {
  const templateDir = path.join(__dirname, '../templates')
  nunjucks.configure(templateDir, { autoescape: false })
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
