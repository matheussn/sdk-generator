import path from 'path'
import nunjucks from 'nunjucks'
import prettier from 'prettier'
import fs from 'fs'
import { Import, SchemaAdapter } from '../adapters/SchemaAdapter'

export interface Params {
  models?: SchemaAdapter[]
  imports?: Import[]
  properties?: any[]
}

export const renderTemplateToString = (templateName: string, params: Params) => {
  const templatesDir = path.join(__dirname, '../../src/templates')
  const template = path.join(templatesDir, templateName)
  return nunjucks.render(template, params)
}

export const renderTemplate = (name: string, destinationFile: string, params: Params) => {
  const templateDir = path.join(__dirname, '../../src/templates/')
  nunjucks.configure(templateDir, { autoescape: false })
  const renderResult = renderTemplateToString(name, params)
  const finalContent = prettier.format(renderResult, {
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'avoid',
    printWidth: 90,
    tabWidth: 2,
    semi: false,
  })
  fs.writeFileSync(destinationFile, finalContent)
}
