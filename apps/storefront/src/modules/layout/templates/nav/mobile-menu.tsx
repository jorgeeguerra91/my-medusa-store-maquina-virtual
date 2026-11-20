"use client"

import { useEffect, useState } from "react"
import { useParams, usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { updateRegion } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type MobileMenuProps = {
  categories: HttpTypes.StoreProductCategory[]
  regions: HttpTypes.StoreRegion[]
}

const linkClass = "nav-link text-coemColors-azulCoem hover:opacity-70"

export default function MobileMenu({ categories, regions }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { countryCode } = useParams()
  const currentPath = pathname.split(`/${countryCode}`)[1] ?? ""

  // Cierra el menú al cambiar de página
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Cierra con la tecla Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-8 items-center justify-center justify-start text-coemColors-azulCoem"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full flex max-h-[80vh] flex-col gap-5 overflow-y-auto border-b border-ui-border-base bg-white px-2 py-4 shadow-md"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false)
          }}
        >
          <LocalizedClientLink href="/" className={linkClass}>
            Inicio
          </LocalizedClientLink>

          <LocalizedClientLink href="/cotizacion" className={linkClass}>
            Cotización
          </LocalizedClientLink>

          <div className="flex flex-col gap-3">
            <LocalizedClientLink href="/store" className={linkClass}>
              Tienda
            </LocalizedClientLink>
            <div className="flex flex-col gap-3 border-l-2 border-coemColors-magentaCoem pl-4">
              {categories
                .filter((category) => !category.parent_category)
                .map((category) => (
                  <LocalizedClientLink
                    key={category.id}
                    href={`/categories/${category.handle}`}
                    className="text-coemColors-azulCoem hover:opacity-70"
                  >
                    {category.name}
                  </LocalizedClientLink>
                ))}
            </div>
          </div>

          <LocalizedClientLink href="/account" className={linkClass}>
            Cuenta
          </LocalizedClientLink>

          <div className="flex flex-col gap-3">
            <span className="nav-link text-coemColors-azulCoem">Región</span>
            <div className="flex flex-col gap-3 border-l-2 border-coemColors-magentaCoem pl-4">
              {regions.map((region) =>
                region.countries?.map((country) => {
                  const active = country.iso_2 === countryCode
                  return (
                    <button
                      key={country.iso_2}
                      type="button"
                      disabled={active}
                      onClick={() => {
                        updateRegion(country.iso_2 ?? "", currentPath)
                        setOpen(false)
                      }}
                      className={`flex items-center justify-between text-left ${
                        active
                          ? "font-bold text-coemColors-magentaCoem"
                          : "text-coemColors-azulCoem hover:opacity-70"
                      }`}
                    >
                      <span>{country.display_name}</span>
                      {active && <span>✓</span>}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
