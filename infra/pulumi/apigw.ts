import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const cfg = new pulumi.Config();
const project = cfg.require("project");
const region  = cfg.get("region") ?? "asia-northeast1";

const api = new gcp.apigateway.Api("stripe-webhook-api", { apiId: "stripe-webhook-api" });

const providerSa = pulumi.interpolate`web-app-stripe-gw-sa@${project}.iam.gserviceaccount.com`;
const config = new gcp.apigateway.ApiConfig("stripe-webhook-config", {
  api: api.name,
  apiConfigId: "v1",
  openapiDocuments: [{
    document: { path: "../../api-gateway-stripe-webhook/openapi2-run.yaml" }
  }],
  project,
  gatewayConfig: { backendConfig: { googleServiceAccount: providerSa } }
});

const gw = new gcp.apigateway.Gateway("stripe-webhook", {
  apiConfig: config.id,
  gatewayId: "stripe-webhook",
  region
});

export const stripeWebhookUrl = gw.defaultHostname.apply(h => `https://${h}`);