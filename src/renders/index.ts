import path from 'path'
import nunjucks from 'nunjucks'
import prettier from 'prettier'
import fs from 'fs'
import { SchemaAdapter } from '../adapters/SchemaAdapter'
import { OpenApiAdapter } from '../adapters/OpenApiAdapter'

export interface Params {
  schemas?: OpenApiAdapter | SchemaAdapter
  properties?: any[]
}

export const renderTemplateToString = (templateName: string, params: Params) => {
  const templatesDir = path.join(__dirname, '../templates')
  const template = path.join(templatesDir, templateName)
  return nunjucks.render(template, params)
}

export const renderTemplate = (name: string, destinationFile: string, params: Params) => {
  const templateDir = path.join(__dirname, '../templates')
  nunjucks.configure(templateDir, { autoescape: false })
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
