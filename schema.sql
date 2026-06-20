-- Six-Seven library schema. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run (idempotent guards).

-- ---------- books ----------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null,
  subtitle    text,
  author      text,
  cover_url   text,
  category    text,
  status      text check (status in ('to_read','reading','finished')),
  favorite    boolean not null default false,
  shelf       text,
  body        text,                       -- personal note (markdown)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- highlights ----------
create table if not exists public.highlights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  book_id     uuid not null references public.books on delete cascade,
  quote       text not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists books_user_idx       on public.books (user_id);
create index if not exists highlights_book_idx   on public.highlights (book_id);

-- ---------- keep updated_at fresh ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists books_touch on public.books;
create trigger books_touch before update on public.books
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.books      enable row level security;
alter table public.highlights enable row level security;

-- books: a user can only see/modify their own rows
drop policy if exists books_select on public.books;
create policy books_select on public.books
  for select using (user_id = auth.uid());
drop policy if exists books_insert on public.books;
create policy books_insert on public.books
  for insert with check (user_id = auth.uid());
drop policy if exists books_update on public.books;
create policy books_update on public.books
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists books_delete on public.books;
create policy books_delete on public.books
  for delete using (user_id = auth.uid());

-- highlights: same isolation
drop policy if exists highlights_select on public.highlights;
create policy highlights_select on public.highlights
  for select using (user_id = auth.uid());
drop policy if exists highlights_insert on public.highlights;
create policy highlights_insert on public.highlights
  for insert with check (user_id = auth.uid());
drop policy if exists highlights_update on public.highlights;
create policy highlights_update on public.highlights
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists highlights_delete on public.highlights;
create policy highlights_delete on public.highlights
  for delete using (user_id = auth.uid());
