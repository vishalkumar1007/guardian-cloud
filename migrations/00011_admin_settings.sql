-- +goose Up
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('platform','personal')),
  category TEXT NOT NULL CHECK (category IN ('profile','org','appearance','api','platform_cfg','security','notif')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, category)
);
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_scope ON admin_settings (user_id, scope);

-- Seed default appearance for superadmin (whole-app) if not exists
INSERT INTO admin_settings (user_id, scope, category, data)
SELECT '00000000-0000-4000-8000-0000000000bb', 'platform', 'appearance',
       jsonb_build_object('accent', accent, 'accent2', accent_2, 'radius', radius, 'radiusSm', radius_sm, 'radiusLg', radius_lg, 'fontDisplay', font_display, 'fontBody', font_body, 'colorScheme', color_scheme)
FROM platform_theme WHERE id = '00000000-0000-4000-8000-0000000000aa'
ON CONFLICT (user_id, scope, category) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS admin_settings;
