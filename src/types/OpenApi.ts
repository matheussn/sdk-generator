export interface XAttr {
  [key: `x-${string}`]: any
}

export interface OpenApi extends XAttr {
  openapi: string
  info: OpenApiInfo
  jsonSchemaDialect?: string
  servers?: OpenApiServer[]
  paths?: OpenApiPath
  components?: OpenApiComponents
  security?: OpenApiSecutiry[]
  tags?: OpenApiTag[]
  externalDocs?: OpenApiExternalDocs
}

export interface OpenApiInfo extends XAttr {
  title: string
  summary?: string
  description?: string
  termsOfService?: string
  contact?: ContactInfo
  license?: LicenseInfo
  version: string
}

export interface ContactInfo extends XAttr {
  name?: string
  url?: string
  email?: string
}

export interface LicenseInfo extends XAttr {
  name: string
  identifier: string
  url: string
}

export interface OpenApiServer extends XAttr {
  url: string
  description: string
  variables: { [name: string]: ServerVariables }
}

export interface ServerVariables extends XAttr {
  enum?: string[]
  default: string
  description?: string
}

export interface OpenApiComponents extends XAttr {
  schemas?: Record<string, OpenApiSchema>
  responses?: Record<string, Response | Reference>
  parameters?: Record<string, Parameter | Reference>
  examples?: Record<string, ExampleObject | Reference>
  requestBodies?: Record<string, RequestBody | Reference>
  headers?: Record<string, OpenApiHeader | Reference>
  securitySchemes?: Record<string, SecuritySchemeObject | Reference>
  links?: Record<string, LinkObject | Reference>
  callbacks?: Record<string, CallbackObject | Reference>
  pathItems?: Record<string, PathItemObject | Reference>
}

export interface OpenApiPath {
  [pathname: string]: PathItemObject
}

export interface PathItemObject extends XAttr {
  get?: OperationObject | Reference
  put?: OperationObject | Reference
  post?: OperationObject | Reference
  delete?: OperationObject | Reference
  options?: OperationObject | Reference
  head?: OperationObject | Reference
  patch?: OperationObject | Reference
  trace?: OperationObject | Reference
  servers?: OpenApiServer[]
  parameters?: (Parameter | Reference)[]
}

export interface OperationObject extends XAttr {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: OpenApiExternalDocs
  operationId?: string
  parameters?: (Parameter | Reference)[]
  requestBody?: RequestBody | Reference
  responses?: ResponsesObject
  callbacks?: Record<string, CallbackObject | Reference>
  deprecated?: boolean
  security?: OpenApiSecutiry[]
  servers?: OpenApiServer[]
}

export interface OpenApiExternalDocs extends XAttr {
  description?: string
  url: string
}

export interface Parameter extends XAttr {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: OpenApiSchema
  example?: any
  examples?: { [name: string]: ExampleObject | Reference }
  content?: { [contentType: string]: MediaTypeObject | Reference }
}

export interface RequestBody extends XAttr {
  description?: string
  content: { [contentType: string]: MediaTypeObject | Reference }
  required?: boolean
}

export interface MediaTypeObject extends XAttr {
  schema?: OpenApiSchema
  example?: any
  examples?: { [name: string]: ExampleObject | Reference }
  encoding?: { [contentType: string]: EncodingObject }
}

export interface EncodingObject extends XAttr {
  contentType?: string
  headers?: { [name: string]: OpenApiHeader | Reference }
  style?: string
  explode?: string
  allowReserved?: string
}

export type ResponsesObject = {
  [responseCode: string]: Response | Reference
} & {
  default?: Response | Reference
}

export interface Response extends XAttr {
  description: string
  headers?: { [name: string]: OpenApiHeader | Reference }
  content?: { [contentType: string]: MediaTypeObject }
  links?: { [name: string]: LinkObject | Reference }
}

export type CallbackObject = Record<string, PathItemObject>

export interface ExampleObject extends XAttr {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

export interface LinkObject extends XAttr {
  operationRef?: string
  operationId?: string
  parameters?: { [name: string]: `$${string}` }
  requestBody?: `$${string}`
  description?: string
  server?: OpenApiServer
}

export type OpenApiHeader = Omit<Parameter, 'name' | 'in'>

export interface OpenApiTag extends XAttr {
  name: string
  description?: string
  externalDocs?: OpenApiExternalDocs
}

export interface Reference extends XAttr {
  $ref: string
  summary?: string
  description?: string
}

type Test2 = { description: boolean }

type Test = {
  name: string
} & Test2

const test = (test: Test) => {
  test.description
}

export type OpenApiSchema = {
  type: string
  title?: string
  description?: string
  anyOf?: (OpenApiSchema | Reference)[]
  oneOf?: (OpenApiSchema | Reference)[]
  enum?: string[]
  items?: OpenApiSchema
  $ref?: string
  properties?: { [name: string]: OpenApiSchema }
  required?: string[]
}

// {
//   discriminator?: DiscriminatorObject
//   xml?: XMLObject
//   externalDocs?: OpenApiExternalDocs
//   example?: any
//   title?: string
//   // type: string
//   // $ref?: string
//   description?: string
//   $comment?: string
//   deprecated?: boolean
//   readOnly?: boolean
//   writeOnly?: boolean
//   // enum?: string[]
//   const?: unknown
//   default?: unknown
//   format?: string
//   nullable?: boolean
//   [key: `x-${string}`]: any
// } & (
//   | { oneOf: (OpenApiSchema | Reference)[] }
//   | {
//       type: ('string' | 'number' | 'integer' | 'array' | 'boolean' | 'null' | 'object')[]
//     }
//   | { type: 'string' }
//   | { type: 'number'; minimum?: number; maximum?: number }
//   | { type: 'integer'; minimum?: number; maximum?: number }
//   | {
//       type: 'array'
//       prefixItems?: OpenApiSchema | Reference
//       items?: OpenApiSchema | Reference
//       minItems?: number
//       maxItems?: number
//     }
//   | { type: 'boolean' }
//   | { type: 'null' }
//   | {
//       type: 'object'
//       properties?: { [name: string]: OpenApiSchema | Reference }
//       additionalProperties?: boolean | Record<string, never> | OpenApiSchema | Reference
//       required?: string[]
//       allOf?: (OpenApiSchema | Reference)[]
//       anyOf?: (OpenApiSchema | Reference)[]
//     }
//   | {
//       allOf: (OpenApiSchema | Reference)[]
//       anyOf?: (OpenApiSchema | Reference)[]
//       required?: string[]
//     }
//   | {
//       allOf?: (OpenApiSchema | Reference)[]
//       anyOf: (OpenApiSchema | Reference)[]
//       required?: string[]
//     }
//   | {}
// )

export interface DiscriminatorObject {
  propertyName: string
  mapping?: Record<string, string>
}

export interface XMLObject extends XAttr {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

export type SecuritySchemeObject = {
  description?: string
  [key: `x-${string}`]: any
} & (
  | {
      type: 'apiKey'
      name: string
      in: 'query' | 'header' | 'cookie'
    }
  | {
      type: 'http'
      scheme: string
      bearer?: string
    }
  | {
      type: 'mutualTLS'
    }
  | {
      type: 'oauth2'
      flows: OAuthFlowsObject
    }
  | {
      type: 'openIdConnect'
      openIdConnectUrl: string
    }
)

export interface OAuthFlowsObject extends XAttr {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
}

export interface OAuthFlowObject extends XAttr {
  authorizationUrl: string
  tokenUrl: string
  refreshUrl: string
  scopes: { [name: string]: string }
}

export type OpenApiSecutiry = Record<keyof OpenApiComponents['securitySchemes'], string[]>
