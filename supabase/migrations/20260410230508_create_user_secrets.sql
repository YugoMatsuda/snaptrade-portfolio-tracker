-- user_secrets: SnapTradeのuserSecretをユーザーごとに保存するテーブル
-- user_id は Supabase Auth の auth.users.id と対応

create table public.user_secrets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snaptrade_user_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS有効化（他のユーザーのデータは見えない）
alter table public.user_secrets enable row level security;

-- 自分のデータのみ読み取り可能
create policy "Users can read own secret"
  on public.user_secrets
  for select
  using (auth.uid() = user_id);

-- 自分のデータのみ挿入可能
create policy "Users can insert own secret"
  on public.user_secrets
  for insert
  with check (auth.uid() = user_id);

-- 自分のデータのみ更新可能
create policy "Users can update own secret"
  on public.user_secrets
  for update
  using (auth.uid() = user_id);
