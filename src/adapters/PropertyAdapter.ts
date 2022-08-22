export class PropertyAdapter {
  constructor(public readonly name: string, public readonly type: string | string[]) {}

  isMoreThanOne() {
    return typeof this.type === 'object'
  }
}
