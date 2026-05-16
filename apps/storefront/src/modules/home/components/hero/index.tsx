import { Github } from "@medusajs/icons";
import { Button, Heading } from "@modules/common/components/ui";
import LocalizedClientLink from "@modules/common/components/localized-client-link";

const Hero = () => {
  return (
    <div className="h-[80vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle overflow-hidden">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-coemColors-magentaCoem/10" />

      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-6 gap-6">

        <span className="space-y-3">
          <Heading
            level="h1"
            className="text-5xl leading-tight font-bold text-coemColors-azulCoem uppercase"
          >
            Cloud • Infraestructura • Software
          </Heading>

          <Heading
            level="h2"
            className="text-2xl small:text-3xl font-medium text-colorsCoem-azulCoem
            }"
          >
            Soluciones empresariales escalables para compañías modernas
          </Heading>
        </span>

        {/* Botones */}
        <div className="flex gap-4 flex-col small:flex-row">
          <LocalizedClientLink href="/store">
            <Button variant="primary" className="bg-white !text-coemColors-magentaCoem hover:!bg-coemColors-magentaCoem hover:!text-white border-2 border-coemColors-magentaCoem">
              Ver productos
            </Button>
          </LocalizedClientLink>

          <a
            href="https://github.com/jorgeeguerra91/my-medusa-store-maquina-virtual"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">
              Repositorio <Github />
            </Button>
          </a>
        </div>

        {/* Mini badges */}
        <div className="flex gap-3 flex-wrap justify-center mt-4">
          <span className="px-3 py-1 rounded-full bg-white shadow-sm text-sm">
            Hardware
          </span>

          <span className="px-3 py-1 rounded-full bg-white shadow-sm text-sm">
            Software
          </span>

          <span className="px-3 py-1 rounded-full bg-white shadow-sm text-sm">
            Microsoft Solutions
          </span>

          <span className="px-3 py-1 rounded-full bg-white shadow-sm text-sm">
            Servicios TI
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero;