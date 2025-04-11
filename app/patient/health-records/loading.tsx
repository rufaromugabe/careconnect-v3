import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Loading Health Records</h2>
        <p className="text-muted-foreground">Please wait while we fetch your health records...</p>
      </div>
    </div>
  )
}
