"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"


type NavRegionProps = {
  regions: HttpTypes.StoreRegion[]
}

export default function NavRegion({ regions }: NavRegionProps) {
  const toggleState = useToggleState()
const { countryCode } = useParams()
const currentPath = usePathname().split(`/${countryCode}`)[1]
  return (
    <div
      onMouseEnter={toggleState.open}
      onMouseLeave={() => {
  setTimeout(() => toggleState.close(), 120)
}}
      className="relative"
    >
<span
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
  Región
</span>
{toggleState.state && (
  <div
    className="
      absolute
      top-full
      left-0
      h-[30px]
      w-[160px]
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
      min-w-[160px]
      p-4
      z-50
    "
  >
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

  {country.iso_2 === countryCode && (
    <span>✓</span>
  )}
</div>
      ))
    )}
  </div>
)}
    </div>
  )
}