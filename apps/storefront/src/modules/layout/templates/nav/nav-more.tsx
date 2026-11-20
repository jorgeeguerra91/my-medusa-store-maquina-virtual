"use client"

import { useRef } from "react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Cambia aquí el nombre del menú (ej. "Más", "Servicios", "Herramientas")
const MENU_LABEL = "Más"

type NavMoreProps = {
  regions: HttpTypes.StoreRegion[]
}

export default function NavMore({ regions }: NavMoreProps) {
  const toggleState = useToggleState()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { countryCode } = useParams()
  const currentPath = usePathname().split(`/${countryCode}`)[1] ?? ""

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    toggleState.open()
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => toggleState.close(), 120)
  }

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative"
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={toggleState.state}
        className={`
          nav-link
          !text-sm
          inline-flex items-center gap-1.5
          text-coemColors-azulCoem
          hover:opacity-70
          cursor-pointer
          relative

          before:absolute
          before:left-0
          before:-top-2
          before:w-full
          before:h-[2px]
          before:bg-coemColors-magentaCoem

          ${toggleState.state ? "before:block" : "before:hidden"}
        `}
      >
        {MENU_LABEL}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${
            toggleState.state ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {toggleState.state && (
        <div className="absolute top-full left-0 h-[20px] w-[220px]" />
      )}

      {toggleState.state && (
        <div
          className="
            absolute
            top-[calc(100%+20px)]
            left-0
            bg-coemColors-azulCoem
            text-white
            border
            border-gray-200
            shadow-lg
            rounded-b-lg
            min-w-[220px]
            p-4
            z-50
          "
        >
          <LocalizedClientLink
            href="/cotizacion"
            className="block py-2 cursor-pointer hover:opacity-70"
            onClick={toggleState.close}
          >
            Cotización
          </LocalizedClientLink>

          <div className="mt-2 border-t border-white/30 pt-3">
            <span className="block pb-1 text-sm opacity-70">Región</span>
            {regions.map((region) =>
              region.countries?.map((country) => (
                <div
                  key={country.iso_2}
                  className={`
                    flex justify-between items-center
                    py-2
                    ${
                      country.iso_2 === countryCode
                        ? "font-bold text-coemColors-magentaCoem cursor-default"
                        : "cursor-pointer hover:opacity-70"
                    }
                  `}
                  onClick={() => {
                    if (country.iso_2 !== countryCode) {
                      updateRegion(country.iso_2 ?? "", currentPath)
                      toggleState.close()
                    }
                  }}
                >
                  <span>{country.display_name}</span>
                  {country.iso_2 === countryCode && <span>✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}