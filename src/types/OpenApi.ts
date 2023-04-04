export interface AWSInfo {
  title: string
  description?: string
  version: string
  contact?: {
    name?: string
    url?: string
    email?: string
  }
  license?: {
    name: string
    url?: string
  }
  'x-api-mapping': string
}

export interface OpenApiServers {
  url: string
  description?: string
  variables?: {
    [key: string]: {
      default: string
      enum?: string[]
      description?: string
    }
  }
}

export interface OpenApiRecord<T> {
  [key: string]: T
}

export interface OpenApiComponents<T> {
  schemas?: Record<string, T>
  responses?: {
    [key: string]: {
      description: string
      headers?: {
        [key: string]: {
          description: string
          schema: T
        }
      }
      content?: {
        [key: string]: {
          schema: T
        }
      }
    }
  }
  parameters?: {
    [key: string]: T
  }
  examples?: {
    [key: string]: T
  }
  requestBodies?: {
    [key: string]: T
  }
  headers?: {
    [key: string]: T
  }
  securitySchemes?: {
    [key: string]: T
  }
  links?: {
    [key: string]: T
  }
  callbacks?: {
    [key: string]: T
  }
}

export interface AWSOpenAPI<T> {
  openapi: string
  info: AWSInfo
  servers?: OpenApiServers[]
  paths: {
    [key: string]: {
      [key: string]: {
        tags?: string[]
        summary?: string
        description?: string
        requestBody?: T
        responses?: {
          [key: string]: {
            description: string
            headers?: {
              [key: string]: {
                description: string
                schema: T
              }
            }
            content?: {
              [key: string]: {
                schema: T
              }
            }
          }
        }
        security?: {
          [key: string]: string[]
        }[]
      }
    }
  }
  components?: OpenApiComponents<T>
  security?: {
    [key: string]: string[]
  }[]
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }>
  externalDocs?: {
    description?: string
    url: string
  }
}
