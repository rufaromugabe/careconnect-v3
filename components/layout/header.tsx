import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  actions?: ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center space-x-2">{actions}</div>
      </div>
    </header>
  )
}
