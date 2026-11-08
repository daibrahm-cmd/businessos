// Painel exibido quando um arquivo de content/ está inválido. Não há editor junto,
// para que a interface nunca sobrescreva um arquivo que precisa de correção manual.
import { TriangleAlert } from "lucide-react"

import type { DetalheErro } from "@/lib/content/errors"

export interface PainelErroConteudoProps {
  titulo: string
  mensagem: string
  detalhes?: DetalheErro[]
  /** Caminho relativo do arquivo com problema (ex.: content/direcao/oferta.md). */
  arquivo?: string
}

export function PainelErroConteudo({ titulo, mensagem, detalhes, arquivo }: PainelErroConteudoProps) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-destructive/50 p-4 text-sm">
      <div className="flex items-start gap-2">
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{titulo}</p>
          <p className="break-words text-muted-foreground">{mensagem}</p>
        </div>
      </div>

      {arquivo && (
        <p className="break-words">
          Arquivo: <code className="rounded bg-muted px-1 py-0.5 text-xs">{arquivo}</code>
        </p>
      )}

      {detalhes && detalhes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {detalhes.map((d, i) => (
            <li key={`${d.caminho}-${i}`} className="break-words">
              {d.caminho && <code className="rounded bg-muted px-1 py-0.5 text-xs">{d.caminho}</code>}{" "}
              {d.mensagem}
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground">
        Corrija o arquivo e rode <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run content:validate</code>.
      </p>
    </div>
  )
}
