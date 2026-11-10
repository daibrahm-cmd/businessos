-- BusinessOS: dados do onboarding no perfil (nome, e-mail de contato, WhatsApp, empresa, porte).
-- Idempotente: pode rodar mais de uma vez.

alter table public.perfis
  add column if not exists email_contato text check (email_contato is null or char_length(email_contato) <= 254),
  add column if not exists whatsapp text check (whatsapp is null or whatsapp ~ '^\+55[0-9]{10,11}$'),
  add column if not exists empresa text check (empresa is null or char_length(empresa) between 1 and 100),
  add column if not exists funcionarios text check (funcionarios is null or funcionarios in ('so-eu', '2-10', '11-50', '51-200', '200+')),
  -- null = onboarding pendente: o app leva a pessoa para /onboarding no próximo acesso.
  add column if not exists onboarding_concluido_em timestamptz;

-- Hoje só `nome` é editável pelo usuário (papel continua protegido). Libera apenas as colunas novas.
grant update (nome, email_contato, whatsapp, empresa, funcionarios, onboarding_concluido_em)
  on public.perfis to authenticated;
