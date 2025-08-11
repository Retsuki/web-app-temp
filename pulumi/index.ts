import * as pulumi from '@pulumi/pulumi'

// Import configuration
import { environment, gcpConfig, naming } from './src/config'
import { createApiGateway } from './src/resources/api-gateway'
import { createArtifactRegistry } from './src/resources/artifact-registry'
import { createCloudBuildTriggers } from './src/resources/cloud-build'
import { createCloudRunServices } from './src/resources/cloud-run'
// Import resource modules
import { enableAPIs } from './src/resources/project'
import { createSecrets } from './src/resources/secrets'
import { createServiceAccounts } from './src/resources/service-accounts'

// Main deployment function
async function main() {
  pulumi.log.info(`Deploying infrastructure for environment: ${environment}`)
  pulumi.log.info(`GCP Project: ${gcpConfig.project}`)
  pulumi.log.info(`Region: ${gcpConfig.region}`)

  // Step 1: Enable required GCP APIs
  pulumi.log.info('Enabling GCP APIs...')
  const apis = enableAPIs()

  // Step 2: Create service accounts
  pulumi.log.info('Creating service accounts...')
  const serviceAccounts = createServiceAccounts()

  // Step 3: Create secrets in Secret Manager
  pulumi.log.info('Creating secrets...')
  const secrets = createSecrets(serviceAccounts)

  // Step 4: Create Artifact Registry
  pulumi.log.info('Creating Artifact Registry...')
  const artifactRegistry = createArtifactRegistry()

  // Step 5: Create Cloud Run services
  pulumi.log.info('Creating Cloud Run services...')
  const cloudRunServices = createCloudRunServices(serviceAccounts, secrets)

  // Step 6: Create API Gateway for Stripe webhooks
  pulumi.log.info('Creating API Gateway...')
  const apiGateway = createApiGateway(serviceAccounts, cloudRunServices)

  // Step 7: Create Cloud Build triggers
  pulumi.log.info('Creating Cloud Build triggers...')
  const cloudBuildTriggers = createCloudBuildTriggers()

  // Export important values
  return {
    // Environment
    environment,
    project: gcpConfig.project,
    region: gcpConfig.region,

    // Service URLs
    apiServiceUrl: cloudRunServices.apiServiceUrl,
    webServiceUrl: cloudRunServices.webServiceUrl,
    stripeWebhookUrl: apiGateway.gatewayUrl.apply((url) => `${url}/api/v1/stripe/webhook`),

    // Service names
    apiServiceName: naming.apiServiceName,
    webServiceName: naming.webServiceName,

    // Service account emails
    apiServiceAccount: serviceAccounts.apiServiceAccount.email,
    webServiceAccount: serviceAccounts.webServiceAccount.email,
    stripeGatewayServiceAccount: serviceAccounts.stripeGatewayServiceAccount.email,

    // Secret names
    apiSecretName: naming.apiSecretName,
    webSecretName: naming.webSecretName,

    // Artifact Registry
    artifactRegistryUrl: pulumi.interpolate`${gcpConfig.region}-docker.pkg.dev/${gcpConfig.project}/${naming.artifactRegistryName}`,

    // Instructions
    instructions: pulumi.interpolate`
==========================================================
Deployment Complete!
==========================================================

Environment: ${environment}
Project: ${gcpConfig.project}
Region: ${gcpConfig.region}

🌐 Service URLs:
- Web Application: ${cloudRunServices.webServiceUrl}
- API Service: ${cloudRunServices.apiServiceUrl}
- Stripe Webhook: ${apiGateway.gatewayUrl}/api/v1/stripe/webhook

📦 Docker Registry:
${gcpConfig.region}-docker.pkg.dev/${gcpConfig.project}/${naming.artifactRegistryName}

🔐 Secrets:
- API: ${naming.apiSecretName}
- Web: ${naming.webSecretName}

📝 Next Steps:
1. Configure Stripe webhook URL in Stripe Dashboard
2. Push to ${environment === 'prod' ? 'main' : 'develop'} branch to trigger Cloud Build
3. Monitor deployments in Cloud Console

==========================================================
`,
  }
}

// Execute main function and export results
const deployment = main()

export const environment = deployment.then((d) => d.environment)
export const project = deployment.then((d) => d.project)
export const region = deployment.then((d) => d.region)
export const apiServiceUrl = deployment.then((d) => d.apiServiceUrl)
export const webServiceUrl = deployment.then((d) => d.webServiceUrl)
export const stripeWebhookUrl = deployment.then((d) => d.stripeWebhookUrl)
export const artifactRegistryUrl = deployment.then((d) => d.artifactRegistryUrl)
export const instructions = deployment.then((d) => d.instructions)
