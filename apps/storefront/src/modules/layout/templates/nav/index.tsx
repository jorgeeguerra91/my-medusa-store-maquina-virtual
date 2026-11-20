import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import NavCategory from "./nav-category"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import NavMore from "./nav-more"
import MobileMenu from "./mobile-menu"

const linkClass =
  "nav-link !text-sm text-coemColors-azulCoem hover:opacity-70 transition-colors"

export default async function Nav() {
  const [regions, categories] = await Promise.all([
    listRegions(),
    listCategories(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto py-2 px-2 md:py-3 md:px-8 lg:px-20 border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container relative flex items-center justify-between w-full h-full gap-4">

          {/* Izquierda: menú (móvil) y logo */}
          <div className="flex items-center gap-4 lg:gap-8">
            <MobileMenu categories={categories} regions={regions} />

            {/* Logo: centrado en móvil, a la izquierda en escritorio */}
            <LocalizedClientLink
              href="/"
              className="flex items-center shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
              data-testid="nav-store-link"
            >
              <img
                src="/logoCoem.png"
                alt="COEM"
                className="w-[100px] h-auto md:w-[124px] md:h-[40px]"
              />
            </LocalizedClientLink>
          </div>

          {/* Centro (solo escritorio) */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
            <LocalizedClientLink href="/" className={linkClass}>
              Inicio
            </LocalizedClientLink>
            <NavCategory categories={categories} />
            <LocalizedClientLink href="/account" className={linkClass}>
              Cuenta
            </LocalizedClientLink>
            <NavMore regions={regions} />
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