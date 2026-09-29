"use client"

import { useEffect, useState } from "react"

const images = [
  { src: "/image.png", href: "https://landing.controlesempresariales.com/caso-de-exito-huevos-kikes" },
  { src: "/image2.png", href: "https://landing.controlesempresariales.com/ebook-estrategias-de-seguridad" },
]

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(0)
  const [fade, setFade] = useState(true)

  const changeSlide = (newIndex: number) => {
    setPrevIndex(index)
    setFade(false)

    setTimeout(() => {
      setIndex(newIndex)
      setFade(true)
    }, 300)
  }

  const next = () =>
    changeSlide((index + 1) % images.length)

  const prev = () =>
    changeSlide((index - 1 + images.length) % images.length)

  useEffect(() => {
    const interval = setInterval(() => {
      next()
    }, 4000)

    return () => clearInterval(interval)
  }, [index])

  return (
    <section className="w-full">

      <div className="relative w-full overflow-hidden">

        {/* IMAGEN ANTERIOR (fade out) */}
        <img
          src={images[prevIndex].src}
          className={`
            w-full
            max-h-[600px]
            object-cover
            block
            absolute
            inset-0
            transition-opacity
            duration-700
            pointer-events-none
            ${fade ? "opacity-0" : "opacity-100"}
          `}
          alt="prev"
        />

        {/* IMAGEN ACTUAL (fade in) */}
        <a href={images[index].href}>
          <img
            src={images[index].src}
            className={`
              w-full
              max-h-[600px]
              object-cover
              block
              transition-opacity
              duration-700
              ${fade ? "opacity-100" : "opacity-0"}
            `}
            alt="hero"
          />
        </a>

        {/* BOTÓN IZQUIERDO */}
        <button
          onClick={prev}
          className="
            absolute left-3 top-1/2 -translate-y-1/2

            bg-black/50 text-white
            px-3 py-1

            text-xl
            rounded
            z-10
          "
        >
          ‹
        </button>

        {/* BOTÓN DERECHO */}
        <button
          onClick={next}
          className="
            absolute right-3 top-1/2 -translate-y-1/2

            bg-black/50 text-white
            px-3 py-1

            text-xl
            rounded
            z-10
          "
        >
          ›
        </button>

      </div>
    </section>
  )
}