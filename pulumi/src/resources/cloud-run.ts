import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import { gcpConfig, naming, cloudRunConfig, environment } from '../config'
import type { ServiceAccounts } from './service-accounts'
import type { Secrets } from './secrets'
import { grantCloudRunInvokePermission } from './service-accounts'

export interface CloudRunServices {
  apiService: gcp.cloudrun.Service
  webService: gcp.cloudrun.Service
  apiServiceUrl: pulumi.Output<string>
  webServiceUrl: pulumi.Output<string>
}

/**
 * Create Cloud Run services for API and Web applications
 */
export function createCloudRunServices(
  serviceAccounts: ServiceAccounts,
  secrets: Secrets
): CloudRunServices {
  // API Service (with IAM authentication required)
  const apiService = new gcp.cloudrun.Service('api-service', {
    name: naming.apiServiceName,
    project: gcpConfig.project,
    location: gcpConfig.region,
    
    template: {
      spec: {
        serviceAccountName: serviceAccounts.apiServiceAccount.email,
        timeoutSeconds: cloudRunConfig.timeout,
        containers: [{
          image: pulumi.interpolate`gcr.io/${gcpConfig.project}/${naming.apiServiceName}:latest`,
          ports: [{ containerPort: 8080 }],
          resources: {
            limits: {
              memory: cloudRunConfig.memory,
              cpu: cloudRunConfig.cpu,
            },
          },
          envs: [
            // Mount all environment variables from Secret Manager
            {
              name: 'PORT',
              value: '8080',
            },
          ],
          volumeMounts: [{
            name: 'env-secret',
            mountPath: '/secrets',
          }],
        }],
        volumes: [{
          name: 'env-secret',
          secret: {
            secretName: secrets.apiSecret.secretId,
            items: [{
              key: 'latest',
              path: '.env',
            }],
          },
        }],
      },
      metadata: {
        annotations: {
          'autoscaling.knative.dev/minScale': String(cloudRunConfig.minInstances),
          'autoscaling.knative.dev/maxScale': String(cloudRunConfig.maxInstances),
        },
      },
    },
    
    traffics: [{
      percent: 100,
      latestRevision: true,
    }],
    
    autogenerateRevisionName: true,
  })

  // Web Service (publicly accessible)
  const webService = new gcp.cloudrun.Service('web-service', {
    name: naming.webServiceName,
    project: gcpConfig.project,
    location: gcpConfig.region,
    
    template: {
      spec: {
        serviceAccountName: serviceAccounts.webServiceAccount.email,
        timeoutSeconds: cloudRunConfig.timeout,
        containers: [{
          image: pulumi.interpolate`gcr.io/${gcpConfig.project}/${naming.webServiceName}:latest`,
          ports: [{ containerPort: 3000 }],
          resources: {
            limits: {
              memory: cloudRunConfig.memory,
              cpu: cloudRunConfig.cpu,
            },
          },
          envs: [
            // Environment variables for Next.js (will be set during Cloud Build)
            {
              name: 'PORT',
              value: '3000',
            },
            {
              name: 'NODE_ENV',
              value: 'production',
            },
            // API URL will be set after API service is deployed
            {
              name: 'API_URL',
              value: apiService.statuses[0].url,
            },
          ],
        }],
      },
      metadata: {
        annotations: {
          'autoscaling.knative.dev/minScale': String(cloudRunConfig.minInstances),
          'autoscaling.knative.dev/maxScale': String(cloudRunConfig.maxInstances),
        },
      },
    },
    
    traffics: [{
      percent: 100,
      latestRevision: true,
    }],
    
    autogenerateRevisionName: true,
  })

  // Grant permissions for service-to-service communication
  // Allow Web service to invoke API service
  grantCloudRunInvokePermission(
    'web-to-api',
    serviceAccounts.webServiceAccount,
    apiService
  )

  // Allow Stripe Gateway service account to invoke API service (for webhooks)
  grantCloudRunInvokePermission(
    'stripe-gateway-to-api',
    serviceAccounts.stripeGatewayServiceAccount,
    apiService
  )

  // Allow unauthenticated access to Web service (public website)
  new gcp.cloudrun.ServiceIamMember('web-public-access', {
    project: gcpConfig.project,
    location: gcpConfig.region,
    service: webService.name,
    role: 'roles/run.invoker',
    member: 'allUsers',
  })

  return {
    apiService,
    webService,
    apiServiceUrl: apiService.statuses[0].url,
    webServiceUrl: webService.statuses[0].url,
  }
}