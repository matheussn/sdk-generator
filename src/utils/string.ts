export const camelize = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .split(/[ -_]/g)
    .map(word => word.replace(word[0], word[0].toString().toUpperCase()))
    .join('')

export const toSnakeCase = (str: string) =>
  str &&
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_')
