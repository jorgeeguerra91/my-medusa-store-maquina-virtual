import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeroCarousel from "@modules/home/components/hero/hero-carousel"
import Solutions from "@modules/home/components/solutions/solutions"
import Partners from "@modules/home/components/Partners/partners"
import Statistics from "@modules/home/components/Statistics/statistics"
import Innovation from "@modules/home/components/Innovation/Innovation"
import ChooseUs from "@modules/home/components/Chooseus/chooseUs"
import Services from "@modules/home/components/Services/services"
import CTA from "@modules/home/components/CTA/cta"

export const metadata: Metadata = {
  title: "Controles Empresariales",
  description:
    "Soluciones empresariales de tecnología, infraestructura y software.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <HeroCarousel />

      <Solutions />

      <Statistics />
      
      {/* RECURSOS 
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center text-coemColors-azulCoem mb-16">
            Recursos y Contenido
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="border rounded-xl p-8">
              <h3 className="font-bold mb-3">
                Ciberseguridad Empresarial
              </h3>
              <p>
                Buenas prácticas para proteger la información de tu organización.
              </p>
            </div>

            <div className="border rounded-xl p-8">
              <h3 className="font-bold mb-3">
                Modern Workplace
              </h3>
              <p>
                Herramientas para colaboración y productividad.
              </p>
            </div>

            <div className="border rounded-xl p-8">
              <h3 className="font-bold mb-3">
                Cloud Computing
              </h3>
              <p>
                Estrategias para migrar y optimizar infraestructura en la nube.
              </p>
            </div>

          </div>
        </div>
      </section>
      */}

     <Partners />

     <Innovation />

     <ChooseUs />

     {/* <Services />  */}
        
    <CTA />
    </>
  )
}