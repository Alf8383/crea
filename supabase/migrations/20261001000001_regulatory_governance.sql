alter table public.sources add column if not exists published_at date, add column if not exists next_review_at date, add column if not exists review_frequency_days integer, add column if not exists verified_by uuid references public.profiles(id), add column if not exists evidence_url text;
alter table public.rule_versions add column if not exists last_verified_at date, add column if not exists next_review_at date, add column if not exists verified_by uuid references public.profiles(id), add column if not exists evidence_url text;
create table if not exists public.ubigeo_departments (id text primary key, name text not null unique);
create table if not exists public.ubigeo_provinces (id text primary key, department_id text not null references public.ubigeo_departments(id), name text not null);
create table if not exists public.ubigeo_districts (id text primary key, province_id text not null references public.ubigeo_provinces(id), name text not null, municipality_name text, municipality_url text);
create table if not exists public.regulatory_review_queue (id uuid primary key default gen_random_uuid(), source_id uuid not null references public.sources(id), status text not null default 'PENDIENTE', detected_at timestamptz not null default now(), resolved_at timestamptz, notes text);
create index if not exists rule_versions_review_index on public.rule_versions(next_review_at);
create index if not exists sources_review_index on public.sources(next_review_at);
