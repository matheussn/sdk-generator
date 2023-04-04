export class SimpleSchema {
  constructor(
    readonly name: string,
    readonly type: string,
    readonly description: string,
    readonly isSimple: boolean = true,
  ) {}
}
