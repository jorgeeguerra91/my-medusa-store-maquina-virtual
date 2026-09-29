import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"     
     
     {/* CTA FINAL */}
     export default function CTA() {
  return (
      <section className="py-24 bg-coemColors-magentaCoem text-white">
        <div className="max-w-4xl mx-auto text-center px-6">

          <h2 className="text-5xl font-bold mb-6">
            Crecimiento Empresarial
          </h2>

          <p className="text-xl mb-10">
            Tener éxito en la transformación digital de tu empresa es posible. En Controles Empresariales, comprendemos que la clave reside en la estrategia, estructura y cultura. Por eso, contamos con cinco dominios y dos estrategias de servicios que sirven como pilares de acción para ofrecerte lo mejor en tecnología y competitividad empresarial.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
          

            
            <LocalizedClientLink href="/store">
  <Button
    className="bg-white !text-coemColors-magentaCoem hover:!bg-coemColors-magentaCoem hover:border-white hover:!text-white border-2 border-coemColors-magentaCoem"
  >
    Explorar productos
  </Button>
</LocalizedClientLink>
          </div>

        </div>
      </section>
  )
}