export const camelize = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .split(/[ -_]/g)
    .map(word => word.replace(word[0], word[0].toString().toUpperCase()))
    .join('')
}
