"use client"

// Página do documento: relatório de leitura + botões "Aprovar" e "Editar".
// "Editar" abre o editor completo (formulários) em um modal; fechar com alterações pede confirmação.
import * as React from "react"
import { Check, Pencil } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageEditor, type PageEditorProps } from "@/components/editor/page-editor"

import { RelatorioPagina } from "./relatorio-pagina"

export type PaginaRelatorioProps = Pick<
  PageEditorProps,
  "documento" | "definicao" | "resumos" | "onSalvar" | "onPedirIA" | "onGerarRelatorio"
>

export function PaginaRelatorio({
  documento,
  definicao,
  resumos,
  onSalvar,
  onPedirIA,
  onGerarRelatorio,
}: PaginaRelatorioProps) {
  const [editando, setEditando] = React.useState(false)
  const [pendente, setPendente] = React.useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = React.useState(false)
  const [aprovando, iniciarAprovacao] = React.useTransition()

  const fechar = () => {
    setEditando(false)
    setPendente(false)
    setConfirmandoSaida(false)
  }

  // Fechar o modal (X, Esc ou clique fora) com alterações pendentes pede confirmação
  const aoMudarAberto = (aberto: boolean) => {
    if (aberto) return setEditando(true)
    if (pendente) setConfirmandoSaida(true)
    else fechar()
  }

  const aprovar = () => {
    iniciarAprovacao(async () => {
      const r = await onSalvar({ status: "validado" }, documento.atualizado_em)
      if (r.ok) toast.success("Página aprovada.")
      else if (r.erro.codigo === "CONFLITO") toast.error("A página mudou enquanto você revisava. Releia e aprove de novo.")
      else toast.error(r.erro.mensagem)
    })
  }

  const podeAprovar = documento.status !== "validado" && documento.status !== "vazio"

  const acoes = (
    <>
      {podeAprovar && (
        <Button onClick={aprovar} disabled={aprovando} aria-busy={aprovando} className="h-11 md:h-9">
          <Check aria-hidden />
          Aprovar
        </Button>
      )}
      <Button variant="outline" onClick={() => setEditando(true)} className="h-11 md:h-9">
        <Pencil aria-hidden />
        Editar
      </Button>
    </>
  )

  return (
    <>
      <RelatorioPagina documento={documento} definicao={definicao} resumos={resumos} acoes={acoes} onSalvar={onSalvar} />

      <Dialog open={editando} onOpenChange={aoMudarAberto}>
        <DialogContent className="flex h-[94dvh] max-h-[94dvh] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="border-b px-4 py-4 pr-12 md:px-6">
            <DialogTitle className="text-lg font-semibold">Editar · {documento.titulo}</DialogTitle>
            <DialogDescription>Salvar fecha esta janela e atualiza o relatório.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <PageEditor
              documento={documento}
              definicao={definicao}
              resumos={resumos}
              onSalvar={onSalvar}
              emModal
              onPendenteChange={setPendente}
              onSalvo={fechar}
              onPedirIA={onPedirIA}
              onGerarRelatorio={onGerarRelatorio}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmandoSaida} onOpenChange={setConfirmandoSaida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>As alterações não salvas serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={fechar}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
