import { Suspense } from "react"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { listCategories } from "@lib/data/categories"
import NavCategory from "./nav-category"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import NavRegion from "./nav-region"


export default async function Nav() {
  const [regions, categories] = await Promise.all([
  listRegions(),
  listCategories(),
  listLocales(),
  getLocale(),
])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto py-5 px-20 border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container flex items-center justify-between w-full h-full">

          {/* Logo izquierda */}
          <div className="flex items-center">
            <LocalizedClientLink
              href="/"
              className="flex items-center"
              data-testid="nav-store-link"
            >
              <img
  src="/logoCoem.png"
  alt="COEM"
  className="w-[134px] h-[43px]"
/>
            </LocalizedClientLink>
          </div>

          {/* Menú centro */}
          <div className="hidden md:flex items-center gap-8">
<LocalizedClientLink
  href="/"
  className="nav-link text-coemColors-azulCoem hover:opacity-70 transition-colors"
>
  Inicio
</LocalizedClientLink>

            <NavCategory categories={categories} />

            <LocalizedClientLink
              href="/cotizacion"
  className="nav-link text-coemColors-azulCoem hover:opacity-70 transition-colors"
            >
              Cotización
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/account"
  className="nav-link text-coemColors-azulCoem hover:opacity-70 transition-colors"
            >
              Cuenta
            </LocalizedClientLink>          

<NavRegion regions={regions} />
          </div>

          {/* Derecha */}
          <div className="flex items-center">
            <Suspense
              fallback={
                <LocalizedClientLink
                  href="/cart"
                  className="text-coemColors-magentaCoem"
                >
                  Carrito (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}