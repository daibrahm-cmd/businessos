// Cartão tracejado de um campo ainda vazio no relatório (deixa a lacuna visível sem competir com o conteúdo).
export function CampoNaoPreenchido({ rotulo }: { rotulo: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed p-4">
      <p className="text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{rotulo}</p>
      <p className="text-[11px] text-muted-foreground italic">Não preenchido</p>
    </div>
  )
}
