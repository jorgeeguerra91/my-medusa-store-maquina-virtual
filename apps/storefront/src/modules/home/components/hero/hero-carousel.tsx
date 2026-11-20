"use client"
// src/modules/home/components/hero/hero-carousel.tsx

import { useEffect, useState } from "react"

const images: {
  src: string
  href: string
  alt: string
  title?: string
  subtitle?: string
  cta?: string
}[] = [
  {
    src: "https://www.controlesempresariales.com/wp-content/uploads/2026/10/banner-web-fondo-pc-panama.webp",
    href: "https://landing.controlesempresariales.com/landing-panama-coem",
    alt: "Controles Empresariales en Panamá",
    title: "Panamá llegamos,\npara transformar tu\nNegocio.",
    subtitle: "Tecnología, seguridad e innovación sin fronteras.",
    cta: "¡Conoce más!",
  },
  { src: "https://www.controlesempresariales.com/wp-content/uploads/2026/08/BANNER-WEB-scaled-1.webp", href: "", alt: "Banner 2" },
  { src: "https://www.controlesempresariales.com/wp-content/uploads/2026/02/Banner-web-WMvare.webp", href: "#", alt: "Banner VMware" },
  { src: "https://www.controlesempresariales.com/wp-content/uploads/2026/02/Banner-wob-37-anos.webp", href: "#", alt: "37 años" },
  { src: "https://www.controlesempresariales.com/wp-content/uploads/2026/08/banner-aws-pc.webp", href: "#", alt: "AWS" },
]

const INTERVAL_MS = 4000

// Proporción del hero (ancho/alto). Más grande el segundo número = hero más bajo.
// Celular → tablet → escritorio. Usa la proporción de tu imagen MÁS BAJITA.
const ASPECT = "aspect-[16/9] sm:aspect-[16/6] lg:aspect-[16/5] lg:max-h-[520px]"

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const total = images.length

  const next = () => setIndex((i) => (i + 1) % total)
  const prev = () => setIndex((i) => (i - 1 + total) % total)

  // Un solo timer; se reinicia con cada cambio (automático o manual)
  useEffect(() => {
    const id = setTimeout(next, INTERVAL_MS)
    return () => clearTimeout(id)
  }, [index])

  return (
    <section className="w-full">
      {/* Imágenes apiladas con la misma caja: crossfade puro, sin parpadeo ni espacios vacíos */}
      <div className={`relative w-full overflow-hidden bg-coemColors-azulCoem ${ASPECT}`}>
        {images.map((img, i) => {
          const active = i === index
          const hasLink = img.href && img.href !== "#"

          const picture = (
            <img
              src={img.src}
              alt={img.alt}
              className="block h-full w-full object-cover object-center"
            />
          )

          return (
            <div
              key={img.src}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {hasLink ? (
                <a href={img.href} tabIndex={active ? 0 : -1} className="block h-full w-full">
                  {picture}
                </a>
              ) : (
                picture
              )}

              {/* Texto opcional sobre la imagen */}
              {img.title && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-6 sm:px-12">
                    <div className="max-w-4xl text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
                      <h2 className="whitespace-pre-line text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                        {img.title}
                      </h2>
                      {img.subtitle && (
                        <p className="mt-3 text-lg sm:mt-4 sm:text-xl lg:text-3xl">{img.subtitle}</p>
                      )}
                      {img.cta && (
                        <a
                          href={img.href}
                          tabIndex={active ? 0 : -1}
                          className="pointer-events-auto mt-4 inline-block rounded-md bg-coemColors-magentaCoem px-6 py-2 text-sm font-bold sm:mt-6 sm:px-8 sm:py-3 sm:text-base [text-shadow:none] transition hover:brightness-110"
                        >
                          {img.cta}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* BOTÓN IZQUIERDO */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded bg-black/50 px-3 py-1 text-xl text-white"
        >
          ‹
        </button>

        {/* BOTÓN DERECHO */}
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded bg-black/50 px-3 py-1 text-xl text-white"
        >
          ›
        </button>
      </div>
    </section>
  )
}