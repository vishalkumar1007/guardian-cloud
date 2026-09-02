-- +goose Up
-- Dark/light color scheme for platform theme (super-admin controlled).

ALTER TABLE platform_theme
    ADD COLUMN color_scheme TEXT NOT NULL DEFAULT 'dark'
        CHECK (color_scheme IN ('light', 'dark'));

-- Seed dark Watchline defaults (void + teal signal + amber protect).
UPDATE platform_theme
SET
    ink = '#f1f5f9',
    ink_soft = '#94a3b8',
    mist = '#07090f',
    mist_deep = '#0f1419',
    signal = '#2dd4bf',
    signal_soft = '#115e59',
    alert = '#f59e0b',
    atmosphere_mode = 'void',
    color_scheme = 'dark',
    version = version + 1,
    updated_at = now()
WHERE id = '00000000-0000-4000-8000-0000000000aa';

-- +goose Down
ALTER TABLE platform_theme DROP COLUMN IF EXISTS color_scheme;
