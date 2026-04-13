-- accounts: SnapTradeの口座情報キャッシュ
create table public.accounts (
  id text primary key,  -- SnapTrade account ID
  user_id uuid not null references auth.users(id) on delete cascade,
  brokerage_authorization text,
  name text,
  number text,
  institution_name text,
  synced_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "Users can read own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

-- positions: 口座ごとの保有銘柄キャッシュ
-- SnapTradeはpositionにIDを持たないため (account_id, ticker) をuniqueキーとする
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  name text,
  units float,
  price float,
  open_pnl float,
  average_purchase_price float,
  currency text,
  synced_at timestamptz not null default now(),
  unique (account_id, ticker)
);

alter table public.positions enable row level security;

create policy "Users can read own positions"
  on public.positions for select
  using (auth.uid() = user_id);

create policy "Users can insert own positions"
  on public.positions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own positions"
  on public.positions for update
  using (auth.uid() = user_id);

-- balances: 口座ごとの現金残高キャッシュ
-- (account_id, currency) をuniqueキーとする
create table public.balances (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null,
  cash float,
  buying_power float,
  synced_at timestamptz not null default now(),
  unique (account_id, currency)
);

alter table public.balances enable row level security;

create policy "Users can read own balances"
  on public.balances for select
  using (auth.uid() = user_id);

create policy "Users can insert own balances"
  on public.balances for insert
  with check (auth.uid() = user_id);

create policy "Users can update own balances"
  on public.balances for update
  using (auth.uid() = user_id);

-- transactions: 口座ごとのトランザクションキャッシュ
-- SnapTradeのtransaction IDをprimary keyとして使用（冪等upsert可能）
create table public.transactions (
  id text primary key,  -- SnapTrade transaction ID
  account_id text not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text,
  description text,
  amount float,
  currency text,
  trade_date text,
  ticker text,
  units float,
  price float,
  fee float,
  synced_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);
