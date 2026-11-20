"use client"

import { useRef } from "react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavCategoryProps = {
  categories: HttpTypes.StoreProductCategory[]
}

export default function NavCategory({ categories }: NavCategoryProps) {
  const toggleState = useToggleState()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      <LocalizedClientLink
        href="/store"
        className={`
          hover:opacity-70
          nav-link
          !text-sm
          text-coemColors-azulCoem
          cursor-pointer
          relative
          inline-flex
          items-center
          gap-1.5

          before:absolute
          before:left-0
          before:-top-2
          before:w-full
          before:h-[2px]
          before:bg-coemColors-magentaCoem

          ${toggleState.state ? "before:block" : "before:hidden"}
        `}
      >
        Tienda
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
      </LocalizedClientLink>

      {toggleState.state && (
        <div
          className="
            absolute
            top-full
            left-0
            h-[20px]
            w-[220px]
          "
        />
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
          {categories
            .filter((category) => !category.parent_category)
            .map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="block py-2 cursor-pointer hover:opacity-70"
              >
                {category.name}
              </LocalizedClientLink>
            ))}
        </div>
      )}
    </div>
  )
}