import { toSnakeCase } from "../utils/string"

export class EnumSchema {
  constructor(
    readonly name: string,
    readonly values: string[],
    readonly description: string,
  ) {}

  getType() {
    return 'enum'
  }

  getValues(): Record<string, string> {
    return this.values.reduce((acc, value) => {
      acc[toSnakeCase(value).toUpperCase()] = value
      return acc
    }, {})
  }
}
