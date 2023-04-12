import { OpenApi } from '../types/OpenApi'

export interface OpenApiPath {
  method: string
  path: string
  lambdaName?: string
}

export class OpenApiAdapter {
  private paths: OpenApiPath[] = undefined

  constructor(private name: string, private readonly file: OpenApi) {}

  getPathsName(): string[] {
    return Object.keys(this.file.paths)
  }

  getName(): string {
    return this.name
  }

  getPaths(): OpenApiPath[] {
    if (this.paths) {
      return this.paths
    }
    Object.entries(this.file.paths).map(([path, value]) => {
      Object.entries(value).map(([method, value]) => {
        if (
          ['get', 'post', 'put', 'delete', 'options', 'head', 'patch'].includes(method)
        ) {
          const regex = new RegExp(/^arn:(?:.*):function:(?<lambda>.*)\/invocations$/)

          const integration = value['x-amazon-apigateway-integration']

          if (!integration || regex.test(integration.uri) === false) {
            this.paths.push({ method, path })
          } else {
            const { lambda: lambdaName } = regex.exec(integration.uri)?.groups
            this.paths.push({ method, path, lambdaName })
          }
        }
      })
    })
    return this.paths
  }
}
