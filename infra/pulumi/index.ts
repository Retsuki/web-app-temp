import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'

const cfg = new pulumi.Config()
const project = cfg.require('project')
const region = cfg.get('region') ?? 'asia-northeast1'
const appName = 'web-app' // 既存のサービス名に合わせる

// 必要API
;[
  'run.googleapis.com',
  'artifactregistry.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'logging.googleapis.com',
  'monitoring.googleapis.com',
  'apigateway.googleapis.com',
].forEach((s, i) => {
  new gcp.projects.Service(`svc-${i}`, { project, service: s, disableOnDestroy: false })
})

// Artifact Registry: apps(Docker)
new gcp.artifactregistry.Repository('apps', {
  project,
  location: region,
  repositoryId: 'apps',
  format: 'DOCKER',
  dockerConfig: { immutableTags: true },
})

// Service Accounts
const webSa = new gcp.serviceaccount.Account('web-sa', { accountId: 'web-sa' })
const apiSa = new gcp.serviceaccount.Account('api-sa', { accountId: 'api-sa' })
const gwSa = new gcp.serviceaccount.Account('web-app-stripe-gw-sa', {
  accountId: 'web-app-stripe-gw-sa',
})

// Cloud Run v2: API（IAM必須・外部公開URLはあるが認証が必要）
const api = new gcp.cloudrunv2.Service(`${appName}-api`, {
  location: region,
  ingress: 'INGRESS_TRAFFIC_ALL',
  template: {
    serviceAccount: apiSa.email,
    containers: [
      {
        image: pulumi.interpolate`${region}-docker.pkg.dev/${project}/apps/api:initial`,
        envs: [
          { name: 'NODE_ENV', value: 'production' },
          { name: 'DATABASE_URL', value: cfg.requireSecret('databaseUrl') },
          { name: 'SUPABASE_SERVICE_ROLE_KEY', value: cfg.requireSecret('supabaseServiceRoleKey') },
          { name: 'SUPABASE_JWT_SECRET', value: cfg.requireSecret('supabaseJwtSecret') },
          { name: 'STRIPE_SECRET_KEY', value: cfg.requireSecret('stripeSecretKey') },
          { name: 'STRIPE_WEBHOOK_SECRET', value: cfg.requireSecret('stripeWebhookSecret') },
          {
            name: 'STRIPE_PRICE_ID_INDIE_MONTHLY',
            value: cfg.requireSecret('stripePriceIdIndieMonthly'),
          },
          {
            name: 'STRIPE_PRICE_ID_INDIE_YEARLY',
            value: cfg.requireSecret('stripePriceIdIndieYearly'),
          },
          {
            name: 'STRIPE_PRICE_ID_PRO_MONTHLY',
            value: cfg.requireSecret('stripePriceIdProMonthly'),
          },
          {
            name: 'STRIPE_PRICE_ID_PRO_YEARLY',
            value: cfg.requireSecret('stripePriceIdProYearly'),
          },
        ],
        resources: { limits: { cpu: '1', memory: '512Mi' } },
      },
    ],
    scaling: { minInstanceCount: 0, maxInstanceCount: 10 },
  },
})

// Cloud Run v2: Web（公開）
const web = new gcp.cloudrunv2.Service(`${appName}-web`, {
  location: region,
  ingress: 'INGRESS_TRAFFIC_ALL',
  template: {
    serviceAccount: webSa.email,
    containers: [
      {
        image: pulumi.interpolate`${region}-docker.pkg.dev/${project}/apps/web:initial`,
        envs: [
          { name: 'NEXT_PUBLIC_ENV', value: 'production' },
          { name: 'NEXT_PUBLIC_SUPABASE_URL', value: cfg.requireSecret('nextPublicSupabaseUrl') },
          { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: cfg.requireSecret('nextPublicSupabaseAnonKey') },
          { name: 'NEXT_PUBLIC_SITE_URL', value: cfg.requireSecret('nextPublicSiteUrl') },
          { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: cfg.requireSecret('nextPublicStripePublishableKey') },
          // サーバー側プロキシで使うAudience（=APIのURL）
          { name: 'API_URL', value: pulumi.interpolate`${api.uri}` },
          { name: 'API_AUDIENCE', value: pulumi.interpolate`${api.uri}` },
        ],
        resources: { limits: { cpu: '1', memory: '512Mi' } },
      },
    ],
    scaling: { minInstanceCount: 0, maxInstanceCount: 10 },
  },
})

// APIのinvokerをWeb/ApiGatewayにだけ付与
new gcp.cloudrunv2.ServiceIamMember('api-invoker-web', {
  project,
  location: region,
  name: api.name,
  role: 'roles/run.invoker',
  member: webSa.email.apply((e: string) => `serviceAccount:${e}`),
})
new gcp.cloudrunv2.ServiceIamMember('api-invoker-gw', {
  project,
  location: region,
  name: api.name,
  role: 'roles/run.invoker',
  member: gwSa.email.apply((e: string) => `serviceAccount:${e}`),
})

export const webUrl = web.uri
export const apiUrl = api.uri
