// src/lib/arquivos/servico.ts
// Envio, listagem, URL assinada e remoção. Usa o cliente do usuário logado: o RLS isola os dados.
import { criarClienteServidor } from "@/lib/supabase/server";
import { usuarioAtualId } from "@/lib/supabase/usuario";
import {
  BUCKET_ARQUIVOS,
  idArquivoSchema,
  linhaArquivoSchema,
  opcoesDocSchema,
  type Arquivo,
  type OpcoesDoc,
} from "@/lib/arquivos/tipos";
import { ErroArquivo, gerarCaminho, validarArquivo } from "@/lib/arquivos/validar";

const COLUNAS = "id,user_id,caminho,nome_original,mime,tamanho,doc_id,criado_em";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/** Cliente injetável: nos testes, substitui o cliente real do Supabase. */
let fabricaCliente: () => Promise<Cliente> = criarClienteServidor;
export function _definirFabricaClienteParaTeste(f: (() => Promise<Cliente>) | null): void {
  fabricaCliente = f ?? criarClienteServidor;
}

function paraArquivo(linha: unknown): Arquivo {
  const l = linhaArquivoSchema.parse(linha);
  return {
    id: l.id,
    userId: l.user_id,
    caminho: l.caminho,
    nomeOriginal: l.nome_original,
    mime: l.mime,
    tamanho: l.tamanho,
    docId: l.doc_id,
    criadoEm: l.criado_em,
  };
}

/** Envia o arquivo; se o registro falhar, apaga o objeto (sem órfãos). */
export async function enviarArquivo(file: File, opcoes: OpcoesDoc = {}): Promise<Arquivo> {
  const { docId } = opcoesDocSchema.parse(opcoes);
  const validado = validarArquivo({ name: file.name, type: file.type, size: file.size });
  const userId = await usuarioAtualId();
  const supabase = await fabricaCliente();
  const caminho = gerarCaminho(userId, validado.nomeSanitizado);

  const up = await supabase.storage
    .from(BUCKET_ARQUIVOS)
    .upload(caminho, file, { contentType: validado.mime, upsert: false });
  if (up.error) throw new ErroArquivo("FALHA_ENVIO", "Não foi possível enviar o arquivo. Tente novamente.");

  const ins = await supabase
    .from("arquivos")
    .insert({
      user_id: userId,
      caminho,
      nome_original: file.name.split(/[\\/]/).pop() || validado.nomeSanitizado,
      mime: validado.mime,
      tamanho: validado.tamanho,
      doc_id: docId ?? null,
    })
    .select(COLUNAS)
    .single();

  if (ins.error || !ins.data) {
    // Rollback: remove o objeto recém-enviado. Falha aqui não muda o erro devolvido.
    await supabase.storage.from(BUCKET_ARQUIVOS).remove([caminho]).catch(() => undefined);
    throw new ErroArquivo("FALHA_ENVIO", "Não foi possível registrar o arquivo. Tente novamente.");
  }
  return paraArquivo(ins.data);
}

/** Lista os arquivos do usuário (mais recentes primeiro), opcionalmente de um documento. */
export async function listarArquivos(opcoes: OpcoesDoc = {}): Promise<Arquivo[]> {
  const { docId } = opcoesDocSchema.parse(opcoes);
  await usuarioAtualId();
  const supabase = await fabricaCliente();
  let consulta = supabase.from("arquivos").select(COLUNAS).order("criado_em", { ascending: false });
  if (docId) consulta = consulta.eq("doc_id", docId);
  const { data, error } = await consulta;
  if (error || !data) throw new ErroArquivo("FALHA_LEITURA", "Não foi possível listar os arquivos.");
  return data.map(paraArquivo);
}

/** Busca uma linha por id; o RLS devolve nada para arquivos de outra pessoa. */
async function buscarPorId(supabase: Cliente, id: string): Promise<Arquivo> {
  const { data, error } = await supabase.from("arquivos").select(COLUNAS).eq("id", id).maybeSingle();
  if (error) throw new ErroArquivo("FALHA_LEITURA", "Não foi possível acessar o arquivo.");
  if (!data) throw new ErroArquivo("NAO_ENCONTRADO", "Arquivo não encontrado.");
  return paraArquivo(data);
}

/** URL assinada temporária (padrão 300 s) para baixar/visualizar o arquivo. */
export async function urlAssinada(id: string, segundos = 300): Promise<string> {
  const idOk = idArquivoSchema.safeParse(id);
  if (!idOk.success) throw new ErroArquivo("NAO_ENCONTRADO", "Arquivo não encontrado.");
  if (!Number.isInteger(segundos) || segundos < 1 || segundos > 3600) segundos = 300;
  await usuarioAtualId();
  const supabase = await fabricaCliente();
  const arquivo = await buscarPorId(supabase, idOk.data);
  const { data, error } = await supabase.storage
    .from(BUCKET_ARQUIVOS)
    .createSignedUrl(arquivo.caminho, segundos);
  if (error || !data?.signedUrl) throw new ErroArquivo("FALHA_URL", "Não foi possível gerar o link do arquivo.");
  return data.signedUrl;
}

/** Remove o objeto e a linha. Objeto primeiro: se falhar, a linha permanece e dá para tentar de novo. */
export async function removerArquivo(id: string): Promise<void> {
  const idOk = idArquivoSchema.safeParse(id);
  if (!idOk.success) throw new ErroArquivo("NAO_ENCONTRADO", "Arquivo não encontrado.");
  await usuarioAtualId();
  const supabase = await fabricaCliente();
  const arquivo = await buscarPorId(supabase, idOk.data);
  const rm = await supabase.storage.from(BUCKET_ARQUIVOS).remove([arquivo.caminho]);
  if (rm.error) throw new ErroArquivo("FALHA_REMOCAO", "Não foi possível remover o arquivo.");
  const del = await supabase.from("arquivos").delete().eq("id", arquivo.id);
  if (del.error) throw new ErroArquivo("FALHA_REMOCAO", "Não foi possível remover o registro do arquivo.");
}
