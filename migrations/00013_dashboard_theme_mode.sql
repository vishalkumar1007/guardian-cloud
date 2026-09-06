-- +goose Up
-- Normalize personal appearance rows to explicit mode contract.
-- follow_brand: delete cleared/empty rows
-- personal: ensure mode=personal on rows that have theme tokens

-- Delete legacy cleared / empty personal appearance rows
DELETE FROM admin_settings
WHERE scope = 'personal'
  AND category = 'appearance'
  AND (
    (data ? '_cleared' AND (data->>'_cleared')::boolean IS TRUE)
    OR (data ? 'mode' AND data->>'mode' = 'follow_brand')
    OR (
      COALESCE(data->>'accent', '') = ''
      OR COALESCE(data->>'colorScheme', data->>'color_scheme', '') NOT IN ('light', 'dark')
    )
  );

-- Mark remaining personal appearance rows (with valid tokens) as mode=personal
UPDATE admin_settings
SET data = jsonb_set(data - '_cleared', '{mode}', '"personal"', true),
    updated_at = now()
WHERE scope = 'personal'
  AND category = 'appearance'
  AND COALESCE(data->>'accent', '') <> ''
  AND COALESCE(data->>'colorScheme', data->>'color_scheme', '') IN ('light', 'dark');

-- +goose Down
-- Best-effort reverse: strip mode key only
UPDATE admin_settings
SET data = data - 'mode',
    updated_at = now()
WHERE scope = 'personal'
  AND category = 'appearance'
  AND data ? 'mode';
