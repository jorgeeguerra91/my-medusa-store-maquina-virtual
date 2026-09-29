"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavCategoryProps = {
  categories: HttpTypes.StoreProductCategory[]
}

export default function NavCategory({ categories }: NavCategoryProps) {
  const toggleState = useToggleState()

  return (
    <div
      onMouseEnter={toggleState.open}
      onMouseLeave={() => {
        setTimeout(() => toggleState.close(), 120)
      }}
      className="relative"
    >
      <LocalizedClientLink
  href="/store"
  className={`
    hover:opacity-70
    nav-link
    text-coemColors-azulCoem
    cursor-pointer
    relative
    pr-4

    after:content-['▼']
    after:absolute
    after:right-0
    after:top-[2px]
    after:text-[12px]
    after:font-bold

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
</LocalizedClientLink>

      {toggleState.state && (
        <div
          className="
            absolute
            top-full
            left-0
            h-[30px]
            w-[220px]
          "
        />
      )}

      {toggleState.state && (
        <div
          className="
            absolute
            top-[calc(100%+30px)]
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