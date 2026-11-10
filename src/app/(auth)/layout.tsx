// Layout das telas de autenticação: centralizado, sem o menu lateral do app.
import { MarcaDB } from "@/components/layout/marca-db"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
        <MarcaDB className="h-6 w-auto text-sidebar-primary" />
        BusinessOS
      </div>
      {children}
    </main>
  )
}
