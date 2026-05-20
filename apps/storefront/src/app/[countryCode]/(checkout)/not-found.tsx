import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Algo salio mal",
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Pagina no encontrada</h1>
      <p className="text-small-regular text-ui-fg-base">
        La pagina a la que intentas acceder no existe.
      </p>
      <InteractiveLink href="/">Ir a la pagina principal</InteractiveLink>
    </div>
  )
}
