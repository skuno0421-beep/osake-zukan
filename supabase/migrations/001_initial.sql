-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles: 全員閲覧可" on public.profiles for select using (true);
create policy "profiles: 本人のみ更新可" on public.profiles for update using (auth.uid() = id);

-- sake_records
create table public.sake_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  brewery text not null,
  drunk_at date not null,
  rating int not null check (rating between 1 and 5),
  type text,
  seimaibuai int,
  rice text,
  alcohol numeric,
  acidity numeric,
  sake_meter numeric,
  region text,
  location text,
  price int,
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sake_records enable row level security;
create policy "sake_records: 全員閲覧可" on public.sake_records for select using (true);
create policy "sake_records: 認証済みユーザーが作成可" on public.sake_records for insert with check (auth.uid() = user_id);
create policy "sake_records: 本人のみ更新可" on public.sake_records for update using (auth.uid() = user_id);
create policy "sake_records: 本人のみ削除可" on public.sake_records for delete using (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sake_records_updated_at
  before update on public.sake_records
  for each row execute function update_updated_at();

-- invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  used_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;
create policy "invitations: 認証済みユーザーが作成可" on public.invitations for insert with check (auth.uid() = invited_by);
create policy "invitations: 本人または未使用トークンを閲覧可" on public.invitations for select using (auth.uid() = invited_by or used_by is null);
create policy "invitations: 未使用トークンを更新可（使用済みにする）" on public.invitations for update using (used_by is null);

-- プロフィールを自動作成するトリガー
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
