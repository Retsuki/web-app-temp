import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import * as fs from 'fs'
import * as path from 'path'
import { gcpConfig, naming } from '../config'
import type { ServiceAccounts } from './service-accounts'
import type { CloudRunServices } from './cloud-run'

export interface ApiGateway {
  api: gcp.apigateway.Api
  apiConfig: gcp.apigateway.ApiConfig
  gateway: gcp.apigateway.Gateway
  gatewayUrl: pulumi.Output<string>
}

/**
 * Create API Gateway for Stripe Webhook
 */
export function createApiGateway(
  serviceAccounts: ServiceAccounts,
  cloudRunServices: CloudRunServices
): ApiGateway {
  // Create the API
  const api = new gcp.apigateway.Api('stripe-webhook-api', {
    apiId: naming.apiGatewayName,
    project: gcpConfig.project,
  })

  // Read and update OpenAPI spec with the actual Cloud Run URL
  const openApiSpecPath = path.join(
    __dirname,
    '../../../api-gateway-stripe-webhook/openapi2-run.yaml'
  )
  
  let openApiSpec = ''
  if (fs.existsSync(openApiSpecPath)) {
    openApiSpec = fs.readFileSync(openApiSpecPath, 'utf-8')
  } else {
    // Fallback OpenAPI spec if file doesn't exist
    openApiSpec = `
swagger: "2.0"
info:
  title: stripe-webhook-gateway
  description: API Gateway for Stripe Webhook
  version: 1.0.0

schemes: 
  - "https"
  
produces: 
  - "application/json"

# Backend configuration will be set dynamically
x-google-backend:
  address: BACKEND_URL
  jwt_audience: BACKEND_URL

paths:
  /api/v1/stripe/webhook:
    post:
      summary: Stripe Webhook Endpoint
      operationId: stripeWebhook
      consumes:
        - "text/plain"
      responses:
        "200":
          description: Webhook processed successfully
        "400":
          description: Invalid webhook signature
        "500":
          description: Server error
`
  }

  // Replace the backend URL in the OpenAPI spec
  const apiConfigSpec = pulumi.interpolate`${cloudRunServices.apiServiceUrl}`.apply(
    (apiUrl) => {
      return openApiSpec.replace(/BACKEND_URL|https:\/\/[^\/\s]+\.run\.app/g, apiUrl)
    }
  )

  // Create API Config
  const apiConfig = new gcp.apigateway.ApiConfig('stripe-webhook-config', {
    api: api.apiId,
    apiConfigId: `${naming.apiGatewayConfigName}-${Date.now()}`,
    project: gcpConfig.project,
    
    openapiDocuments: [{
      document: {
        path: 'openapi.yaml',
        contents: apiConfigSpec.apply((spec) => Buffer.from(spec).toString('base64')),
      },
    }],
    
    gatewayConfig: {
      backendConfig: {
        googleServiceAccount: serviceAccounts.stripeGatewayServiceAccount.email,
      },
    },
  })

  // Create Gateway
  const gateway = new gcp.apigateway.Gateway('stripe-webhook-gateway', {
    apiConfig: pulumi.interpolate`${api.name}/configs/${apiConfig.apiConfigId}`,
    gatewayId: `${naming.apiGatewayName}-gateway`,
    project: gcpConfig.project,
    region: gcpConfig.region,
  })

  return {
    api,
    apiConfig,
    gateway,
    gatewayUrl: gateway.defaultHostname.apply((hostname) => `https://${hostname}`),
  }
}