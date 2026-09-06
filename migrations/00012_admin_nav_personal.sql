-- +goose Up
-- Allow personal scope nav/admin studio categories for Admin Studio (side+top nav, personal radius, message theme)
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_category_check;
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_scope_check;
ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_scope_check CHECK (scope IN ('platform','personal'));
ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_category_check CHECK (category IN ('profile','org','appearance','api','platform_cfg','security','notif','platform','navigation','admin_studio'));

-- Seed default personal navigation for superadmin if not exists
INSERT INTO admin_settings (user_id, scope, category, data)
VALUES ('00000000-0000-4000-8000-0000000000bb', 'personal', 'navigation',
        '{"width":"270","collapsedWidth":"68","density":"cozy","showSubtitles":true,"showSectionIcons":true,"showSectionDots":true,"showFooterUser":true,"favorites":[],"hiddenSections":[],"topHeight":"64","topOpacity":"75","topBlur":"xl","showBreadcrumbs":true,"showSearch":true,"showDemoBadge":true,"showNotifications":true,"showThemeToggle":true,"syncWithSidebar":true}'::jsonb)
ON CONFLICT (user_id, scope, category) DO NOTHING;

INSERT INTO admin_settings (user_id, scope, category, data)
VALUES ('00000000-0000-4000-8000-0000000000bb', 'personal', 'admin_studio',
        '{"adminRadius":"14px","adminRadiusSm":"10px","adminRadiusLg":"22px","messageDensity":"cozy","messageStyle":"bubble"}'::jsonb)
ON CONFLICT (user_id, scope, category) DO NOTHING;

-- +goose Down
DELETE FROM admin_settings WHERE scope='personal' AND category IN ('navigation','admin_studio') AND user_id='00000000-0000-4000-8000-0000000000bb';
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_category_check;
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_scope_check;
ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_scope_check CHECK (scope IN ('platform','personal'));
ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_category_check CHECK (category IN ('profile','org','appearance','api','platform_cfg','security','notif','platform'));
