-- BusinessOS: conversas com a IA e base de conhecimento (pgvector).
-- Idempotente: pode rodar mais de uma vez (if not exists / drop policy if exists / create or replace).

-- ============================================================
-- Extensão de vetores (fica no schema "extensions", como no Supabase)
-- ============================================================
create extension if not exists vector with schema extensions;

-- ============================================================
-- conversas
-- ============================================================
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null default 'Nova conversa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists conversas_usuario_atualizado_idx on public.conversas (usuario_id, atualizado_em desc);

drop trigger if exists conversas_atualizado_em on public.conversas;
create trigger conversas_atualizado_em
  before update on public.conversas
  for each row execute function public.definir_atualizado_em();

-- ============================================================
-- mensagens
-- ============================================================
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  papel text not null check (papel in ('usuario', 'assistente')),
  conteudo text not null,
  fontes jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_conversa_idx on public.mensagens (conversa_id, criado_em);
create index if not exists mensagens_usuario_idx on public.mensagens (usuario_id);

-- ============================================================
-- conhecimento (trechos + embeddings de 768 dimensões)
-- ============================================================
create table if not exists public.conhecimento (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  origem_tipo text not null check (origem_tipo in ('documento', 'mensagem')),
  -- id do documento (secao/pagina) ou da mensagem; texto porque os dois formatos convivem
  origem_id text not null,
  trecho_indice integer not null default 0,
  conteudo text not null,
  -- sha-256 do conteúdo: só reindexa o trecho quando muda
  hash text not null,
  embedding extensions.vector(768) not null,
  criado_em timestamptz not null default now(),
  unique (usuario_id, origem_tipo, origem_id, trecho_indice)
);
create index if not exists conhecimento_usuario_idx on public.conhecimento (usuario_id);
create index if not exists conhecimento_origem_idx on public.conhecimento (usuario_id, origem_tipo, origem_id);
create index if not exists conhecimento_embedding_idx
  on public.conhecimento using hnsw (embedding extensions.vector_cosine_ops);

-- ============================================================
-- RLS: cada pessoa só enxerga e altera o que é dela
-- ============================================================
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.conhecimento enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['conversas', 'conhecimento']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = usuario_id)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = usuario_id)', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id)', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = usuario_id)', t || '_delete', t);
  end loop;
end;
$$;

-- mensagens: além de ser a dona, a conversa também precisa ser dela.
drop policy if exists mensagens_select on public.mensagens;
drop policy if exists mensagens_insert on public.mensagens;
drop policy if exists mensagens_update on public.mensagens;
drop policy if exists mensagens_delete on public.mensagens;

create policy mensagens_select on public.mensagens for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy mensagens_insert on public.mensagens for insert to authenticated
  with check (
    (select auth.uid()) = usuario_id
    and exists (
      select 1 from public.conversas c
      where c.id = conversa_id and c.usuario_id = (select auth.uid())
    )
  );
create policy mensagens_update on public.mensagens for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy mensagens_delete on public.mensagens for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- anon não tem acesso a nada.
revoke all on public.conversas, public.mensagens, public.conhecimento from anon;

-- ============================================================
-- Busca semântica
-- ============================================================
-- SECURITY INVOKER: roda com as permissões de quem chama, então o RLS filtra por usuário.
-- search_path vazio: tudo qualificado (o operador <=> vive no schema extensions).
create or replace function public.buscar_conhecimento(
  consulta extensions.vector(768),
  limite integer default 8
)
returns table (
  conteudo text,
  origem_tipo text,
  origem_id text,
  similaridade double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.conteudo,
    c.origem_tipo,
    c.origem_id,
    (1 - (c.embedding operator(extensions.<=>) consulta))::double precision as similaridade
  from public.conhecimento c
  where c.usuario_id = (select auth.uid())
  order by c.embedding operator(extensions.<=>) consulta
  limit least(greatest(coalesce(limite, 8), 1), 50);
$$;

revoke execute on function public.buscar_conhecimento(extensions.vector, integer) from public, anon;
grant execute on function public.buscar_conhecimento(extensions.vector, integer) to authenticated;
