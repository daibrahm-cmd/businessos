import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"

// Base da gaveta lateral usada pelos itens de coleção (GavetaItem).
const meta = {
  title: "UI/Sheet",
  component: Sheet,
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir gaveta</Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 pr-12 md:px-6">
          <SheetTitle className="text-lg font-semibold">O Dono-Fundador</SheetTitle>
          <SheetDescription>dono de indústria que decide sozinho</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-5 text-sm md:px-6">Conteúdo da gaveta.</div>
      </SheetContent>
    </Sheet>
  ),
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Direita: Story = { name: "Lateral direita" }
