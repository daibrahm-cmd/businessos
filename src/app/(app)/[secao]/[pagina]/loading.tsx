// Esqueleto da página editável enquanto o documento é lido: cabeçalho, 6 cards de campo e notas.
import { Skeleton } from "@/components/ui/skeleton"

export default function CarregandoPagina() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando página"
      className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-9 w-56" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    </div>
  )
}
