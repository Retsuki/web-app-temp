-- plan_limitsテーブルの初期データ挿入
INSERT INTO plan_limits (
  plan,
  monthly_credits,
  projects_limit,
  policies_per_project_limit,
  sns_accounts_limit,
  monthly_price,
  yearly_price,
  display_order,
  features
) VALUES 
(
  'free',
  100,
  3,
  3,
  1,
  0.00,
  0.00,
  1,
  '{"api_access": false, "export": false, "priority_support": false, "custom_branding": false}'::jsonb
),
(
  'standard',
  1000,
  10,
  10,
  5,
  2980.00,
  29800.00,
  2,
  '{"api_access": true, "export": true, "priority_support": false, "custom_branding": false}'::jsonb
),
(
  'pro',
  5000,
  100,
  100,
  50,
  9980.00,
  99800.00,
  3,
  '{"api_access": true, "export": true, "priority_support": true, "custom_branding": true}'::jsonb
)
ON CONFLICT (plan) DO UPDATE SET
  monthly_credits = EXCLUDED.monthly_credits,
  projects_limit = EXCLUDED.projects_limit,
  policies_per_project_limit = EXCLUDED.policies_per_project_limit,
  sns_accounts_limit = EXCLUDED.sns_accounts_limit,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features,
  updated_at = NOW();