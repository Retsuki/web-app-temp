import * as pulumi from '@pulumi/pulumi'

// Import configuration
import { environment as env, gcpConfig, naming } from './src/config'
import { createApiGateway } from './src/resources/api-gateway'
import { createArtifactRegistry } from './src/resources/artifact-registry'
import { createCloudBuildTriggers } from './src/resources/cloud-build'
import { createCloudRunServices } from './src/resources/cloud-run'
// Import resource modules
import { enableAPIs } from './src/resources/project'
import { createSecrets } from './src/resources/secrets'
import { createServiceAccounts } from './src/resources/service-accounts'

interface DeploymentResult {
  environment: string
  project: string
  region: string
  apiServiceUrl: pulumi.Output<string>
  webServiceUrl: pulumi.Output<string>
  stripeWebhookUrl: pulumi.Output<string>
  apiServiceName: string
  webServiceName: string
  apiServiceAccount: pulumi.Output<string>
  webServiceAccount: pulumi.Output<string>
  stripeGatewayServiceAccount: pulumi.Output<string>
  apiSecretName: string
  webSecretName: string
  artifactRegistryUrl: pulumi.Output<string>
  instructions: pulumi.Output<string>
}

// Main deployment function
async function main(): Promise<DeploymentResult> {
  pulumi.log.info(`Deploying infrastructure for environment: ${env}`)
  pulumi.log.info(`GCP Project: ${gcpConfig.project}`)
  pulumi.log.info(`Region: ${gcpConfig.region}`)

  // Step 1: Enable required GCP APIs
  pulumi.log.info('Enabling GCP APIs...')
  enableAPIs()

  // Step 2: Create service accounts
  pulumi.log.info('Creating service accounts...')
  const serviceAccounts = createServiceAccounts()

  // Step 3: Create secrets in Secret Manager
  pulumi.log.info('Creating secrets...')
  const secrets = createSecrets(serviceAccounts)

  // Step 4: Create Artifact Registry
  pulumi.log.info('Creating Artifact Registry...')
  createArtifactRegistry()

  // Step 5: Create Cloud Run services
  pulumi.log.info('Creating Cloud Run services...')
  const cloudRunServices = createCloudRunServices(serviceAccounts, secrets)

  // Step 6: Create API Gateway for Stripe webhooks
  pulumi.log.info('Creating API Gateway...')
  const apiGateway = createApiGateway(serviceAccounts, cloudRunServices)

  // Step 7: Create Cloud Build triggers
  pulumi.log.info('Creating Cloud Build triggers...')
  createCloudBuildTriggers()

  // Export important values
  return {
    // Environment
    environment: env,
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

Environment: ${env}
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
2. Push to ${env === 'prod' ? 'main' : 'develop'} branch to trigger Cloud Build
3. Monitor deployments in Cloud Console

==========================================================
`,
  }
}

// Execute main function and export results
const deployment = main()

export const environment = deployment.then((d: DeploymentResult) => d.environment)
export const project = deployment.then((d: DeploymentResult) => d.project)
export const region = deployment.then((d: DeploymentResult) => d.region)
export const apiServiceUrl = deployment.then((d: DeploymentResult) => d.apiServiceUrl)
export const webServiceUrl = deployment.then((d: DeploymentResult) => d.webServiceUrl)
export const stripeWebhookUrl = deployment.then((d: DeploymentResult) => d.stripeWebhookUrl)
export const artifactRegistryUrl = deployment.then((d: DeploymentResult) => d.artifactRegistryUrl)
export const instructions = deployment.then((d: DeploymentResult) => d.instructions)
