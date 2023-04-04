import { PropertyAdapter } from './PropertyAdapter'

export interface OmmitAdapter {
  type: string
  fields: string[]
}

export class ObjectSchema {
  constructor(
    readonly name: string,
    readonly properties: PropertyAdapter[],
    readonly description: string,
    readonly ommit: OmmitAdapter = undefined,
  ) {}

  hasOmmit() {
    return this.ommit !== undefined
  }
}
