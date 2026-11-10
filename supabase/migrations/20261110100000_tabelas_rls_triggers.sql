-- BusinessOS: tabelas, RLS e triggers.
-- Idempotente sempre que possível (if not exists / drop policy if exists).

-- ============================================================
-- Funções utilitárias
-- ============================================================

-- Mantém atualizado_em sempre igual ao momento da última alteração.
create or replace function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ============================================================
-- perfis
-- ============================================================
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  papel text not null default 'usuario' check (papel in ('admin', 'usuario')),
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário é criado no Auth.
-- security definer: roda com permissão do dono, por isso o search_path é fixo.
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nome', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'usuario'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- A função só deve ser chamada pelo trigger, nunca pela API.
revoke execute on function public.criar_perfil_novo_usuario() from public, anon, authenticated;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Anti escalada de privilégio: o usuário só pode editar a coluna "nome".
-- (insert/delete em perfis não são liberados: o perfil nasce pelo trigger
-- e some com o usuário via cascade.)
revoke insert, update, delete on public.perfis from anon, authenticated;
grant update (nome) on public.perfis to authenticated;

-- ============================================================
-- documentos
-- ============================================================
create table if not exists public.documentos (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  secao text not null,
  pagina text not null,
  status text not null default 'rascunho'
    check (status in ('vazio', 'rascunho', 'em-validacao', 'validado')),
  atualizado_em timestamptz not null default now(),
  atualizado_por text not null default 'humano',
  tags text[] not null default '{}',
  relacionados text[] not null default '{}',
  campos jsonb not null default '{}',
  itens jsonb not null default '[]',
  corpo text not null default '',
  extras jsonb not null default '{}',
  primary key (user_id, id),
  constraint documentos_id_confere check (id = secao || '/' || pagina)
);

drop trigger if exists documentos_atualizado_em on public.documentos;
create trigger documentos_atualizado_em
  before update on public.documentos
  for each row execute function public.definir_atualizado_em();

-- ============================================================
-- oportunidades
-- ============================================================
create table if not exists public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dados jsonb not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists oportunidades_user_id_idx on public.oportunidades (user_id);

drop trigger if exists oportunidades_atualizado_em on public.oportunidades;
create trigger oportunidades_atualizado_em
  before update on public.oportunidades
  for each row execute function public.definir_atualizado_em();

-- ============================================================
-- tarefas
-- ============================================================
create table if not exists public.tarefas (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  dados jsonb not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

drop trigger if exists tarefas_atualizado_em on public.tarefas;
create trigger tarefas_atualizado_em
  before update on public.tarefas
  for each row execute function public.definir_atualizado_em();

-- ============================================================
-- arquivos (metadados; o binário fica no bucket "arquivos")
-- ============================================================
create table if not exists public.arquivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  caminho text not null unique, -- objeto no bucket: <user_id>/<uuid>-<nome>
  nome_original text not null,
  mime text not null,
  tamanho bigint not null,
  doc_id text,
  criado_em timestamptz not null default now()
);
create index if not exists arquivos_user_doc_idx on public.arquivos (user_id, doc_id);

-- ============================================================
-- RLS: ligado em tudo; políticas separadas por comando, só "authenticated".
-- Nenhuma política para anon.
-- ============================================================
alter table public.perfis enable row level security;
alter table public.documentos enable row level security;
alter table public.oportunidades enable row level security;
alter table public.tarefas enable row level security;
alter table public.arquivos enable row level security;

-- perfis (dono = id). Sem insert/delete para o usuário.
drop policy if exists perfis_select on public.perfis;
drop policy if exists perfis_update on public.perfis;
create policy perfis_select on public.perfis for select to authenticated
  using ((select auth.uid()) = id);
create policy perfis_update on public.perfis for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Demais tabelas (dono = user_id)
do $$
declare
  t text;
begin
  foreach t in array array['documentos', 'oportunidades', 'tarefas', 'arquivos']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete', t);
  end loop;
end;
$$;

-- anon não tem acesso a nada nas tabelas do app.
revoke all on public.perfis, public.documentos, public.oportunidades, public.tarefas, public.arquivos from anon;
