CREATE TABLE user_authorizations (
  authorization_id text PRIMARY KEY,
  user_id          text NOT NULL,
  is_disabled      boolean NOT NULL DEFAULT false,
  disabled_date    timestamptz
);

ALTER TABLE user_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own authorizations"
  ON user_authorizations FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own authorizations"
  ON user_authorizations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own authorizations"
  ON user_authorizations FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own authorizations"
  ON user_authorizations FOR DELETE
  USING (auth.uid()::text = user_id);
