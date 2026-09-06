-- +goose Up
ALTER TABLE platform_theme
  ADD COLUMN IF NOT EXISTS accent TEXT NOT NULL DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS accent_2 TEXT NOT NULL DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS accent_rgb TEXT NOT NULL DEFAULT '99,102,241',
  ADD COLUMN IF NOT EXISTS radius TEXT NOT NULL DEFAULT '14px',
  ADD COLUMN IF NOT EXISTS radius_sm TEXT NOT NULL DEFAULT '10px',
  ADD COLUMN IF NOT EXISTS radius_lg TEXT NOT NULL DEFAULT '22px',
  ADD COLUMN IF NOT EXISTS font_display TEXT NOT NULL DEFAULT 'Sora',
  ADD COLUMN IF NOT EXISTS font_body TEXT NOT NULL DEFAULT 'Inter';

UPDATE platform_theme
SET accent = signal,
    accent_2 = signal,
    accent_rgb = '99,102,241',
    radius = '14px',
    radius_sm = '10px',
    radius_lg = '22px',
    font_display = 'Sora',
    font_body = 'Inter'
WHERE id = '00000000-0000-4000-8000-0000000000aa' AND accent = '#6366f1';

-- +goose Down
ALTER TABLE platform_theme DROP COLUMN IF EXISTS font_body;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS font_display;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS radius_lg;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS radius_sm;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS radius;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS accent_rgb;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS accent_2;
ALTER TABLE platform_theme DROP COLUMN IF EXISTS accent;
