# Prospecção B2B e LGPD — rascunho para revisão jurídica

> **Status: rascunho. Não é parecer jurídico.** Um advogado deve revisar antes do primeiro contato.
> Os trechos entre colchetes `[...]` são lacunas a preencher por você: nenhum dado foi inventado.

## 1. Teste de legítimo interesse (LGPD, art. 7º, IX)

**Finalidade (para que usamos os dados):** oferecer, a decisores de empresas com perfil de cliente ideal, os serviços de branding do BrandOS (Sprint de Clareza, BrandOS, Brand's Core e Governança).

**Dados tratados (minimização):** nome, cargo, e-mail corporativo, empresa, fonte pública e data do achado. **Não tratamos:** CPF de terceiros, telefone ou e-mail pessoal, dados sensíveis, dados de familiares.

**Necessidade:** o contato direto com quem decide é o meio mais simples de apresentar a oferta; não usamos compra de listas nem disparo em massa.

**Expectativa do titular:** o decisor de uma empresa com sinal público de movimento de marca (rebranding, lançamento, captação) pode razoavelmente esperar uma proposta comercial profissional sobre o assunto.

**Impacto sobre o titular e salvaguardas:**
- um contato por vez, escrito pela fundadora, sem automação de envio;
- identificação clara de quem escreve e de onde veio o contato (link da fonte);
- opt-out em uma resposta, atendido de imediato (ver item 3);
- dado apagado ou bloqueado quando a pessoa pedir ou quando o lead for descartado por mais de [12] meses.

**Conclusão:** [a fundadora assina após a revisão do advogado — data e responsável].

## 2. Regras de uso de dados (já incorporadas às regras dos agentes em Leads)

1. Só enriquecer (Apollo, Clay) leads que já estão na lista, um a um. Sem busca em massa.
2. Guardar sempre a fonte (link) de cada contato e de onde veio o e-mail (site da empresa, Apollo ou Clay).
3. Não gravar CPF de terceiros, nem telefone ou e-mail pessoal.
4. Não usar o envio automático de e-mails, campanhas ou sequências do Apollo. Quem escreve e envia é a fundadora.
5. Não comprar listas.
6. Pedido de opt-out ou de apagamento: marcar o lead como Perdido, registrar a data na nota e não contatar mais; apagar o dado se a pessoa pedir.

## 3. Texto de opt-out (final do primeiro e-mail)

> Encontrei seu contato em [fonte pública: link]. Escrevo porque [motivo: sinal público da empresa]. Se preferir não receber mensagens minhas, responda "não, obrigada(o)" e eu removo seus dados da minha lista imediatamente. Para saber como trato seus dados ou exercer seus direitos como titular, escreva para [e-mail de privacidade].
>
> [Seu nome] · [Nome da empresa] · [CNPJ] · [Endereço]

## 4. Onde os dados ficam (Supabase)

- Os dados pessoais dos leads (nome, cargo, e-mail corporativo, fonte) agora ficam no **Supabase**, no banco Postgres do projeto "BusinessOS", e não mais em arquivos locais.
- **Isolamento:** todas as tabelas têm RLS com a política "dono vê e edita só o que é seu" (`user_id = auth.uid()`). Anexos ficam em bucket privado, em pasta do dono. A chave de serviço (que ignora RLS) fica só no servidor.
- **Ponto de atenção LGPD (art. 33):** a região do projeto é **us-east-1 (EUA)**. Guardar dados de titulares no Supabase é, portanto, transferência internacional de dados, além da já citada com Apollo e Clay. Avaliar com o advogado a base e as cláusulas (ou mudar o projeto para uma região adequada, se necessário) e listar o Supabase como operador na política de privacidade.
- **Apagamento e opt-out:** o dado precisa poder ser removido de fato do banco (e dos backups, no prazo de retenção do Supabase) quando o titular pedir.
- **Multiusuário:** cada usuário é controlador dos leads que cadastra; a regra de acesso é o RLS. O admin técnico (quem tem a chave de serviço) consegue ler tudo, então o acesso a essa chave deve ser restrito.

## 5. Pontos para o advogado confirmar

- O legítimo interesse sustenta a prospecção a decisores nesse formato?
- Transferência internacional (art. 33): Apollo e Clay são empresas dos EUA. Qual a cláusula ou base adequada?
- A origem dos dados nas bases do Apollo e do Clay é lícita, e a responsabilidade como controladora fica onde?
- Prazo de retenção de leads descartados.
- Necessidade de política de privacidade pública e canal do titular no site.
- Transferência internacional para o Supabase (us-east-1): qual a base e as cláusulas adequadas? Vale mudar a região do projeto?
