import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });

  const productCategories = await listCategories();

  return (
    <footer className="border-t border-ui-border-base w-full bg-coemColors-azulCoem  text-sm">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 lg:flex-row items-start py-6">

          {/* LOGO */}
          <div className="ml-16 w-[299px] shrink-0 ">
  <LocalizedClientLink
    href="/store"
    className="inline-block"
  >
    <img
      src="/footer-certificaciones-imagenes.webp"
      alt="Controles Empresariales"
      className="w-[299px] h-[229px]"
    />
  </LocalizedClientLink>
</div>

          {/* COLUMNAS */}
          <div className="ml-8 lg:ml-16 text-sm grid grid-cols-2 lg:grid-cols-4 gap-x-0 gap-y-4">

 {/* Nosotros */}
            <div className="flex flex-col gap-y-2 !leading-[1.3]">
              <span className="txt-small-plus text-coemColors-magentaCoem text-base font-extrabold">
                Nosotros
              </span>

              <ul className="text-white space-y-1">
  <li><a href="https://www.controlesempresariales.com/filosofia/">Filosofia</a></li>
  <li><a href="https://www.controlesempresariales.com/historia/">Historia</a></li>
  <li><a href="https://www.controlesempresariales.com/trayectoria/">Nuestra trayectoria</a></li>
  <li><a href="https://www.controlesempresariales.com/clientes/">Nuestros clientes</a></li>
  <li><a href="https://controlesempresarialesltda.sharepoint.com/sites/Intranet/">Acceso a colaboradores</a></li>
  <li><a href="https://www.controlesempresariales.com/contactanos/#ubicaciones">Oficinas</a></li>
  <li><a href="https://trabajo.controlesempresariales.com/">Trabaja con nosotros</a></li>
  <li><a href="https://trabajo.controlesempresariales.com/">Certificaciones y acreditaciones</a></li>
</ul>
            </div>

            {/* Politicas */}
            <div className="flex flex-col gap-y-2 !leading-[1.3]">
              <span className="txt-small-plus text-coemColors-magentaCoem text-base font-extrabold">
                Políticas
              </span>

              <ul className="text-white space-y-1">
  <li><a href="https://www.controlesempresariales.com/politica-y-objetivos-del-sistema-integrado-de-gestion">Sistema integrado de gestion</a></li>
  <li><a href="https://www.controlesempresariales.com/politica-de-tratamiento-de-datos-personales">Habeas data</a></li>
  <li><a href="https://www.controlesempresariales.com/sagrlaft/">SAGRLAFT</a></li>
  <li><a href="https://www.controlesempresariales.com/terminos-y-condiciones/">Términos y condiciones</a></li>
  <li><a href="https://www.controlesempresariales.com/linea-etica/">Línea ética</a></li>
  <li><a href="https://www.controlesempresariales.com/gestion-ambiental/">Gestión ambiental</a></li>
</ul>
            </div>

            {/* Proveedores */}
            <div className="flex flex-col gap-y-2 !leading-[1.3]">
              <span className="txt-small-plus text-coemColors-magentaCoem text-base font-extrabold">
                Proveedores
              </span>

              <ul className="text-white space-y-2">
  <li><a href="https://www.controlesempresariales.com/cumplimiento/">Cumplimiento</a></li>
  <li><a href="https://www.controlesempresariales.com/politica-de-seguridad-y-privacidad-de-la-informacion-para-proveedores">Politicas de seguridad de la informacion</a></li>
  <li><a href="https://www.controlesempresariales.com/tc-proveedores/">Terminos y condiciones</a></li>
</ul>
            </div>

{/* Soporte */}
            <div className="flex flex-col gap-y-2 !leading-[1.3]">
              <span className="txt-small-plus text-coemColors-magentaCoem text-base font-extrabold">
                Soporte
              </span>

              <ul className="text-white space-y-1">
  <li><a href="https://www.controlesempresariales.com/guias-de-soporte/">Guías de soporte</a></li>
  <li><a href="https://soporte.coem.co/mesadeservicio/#/login/">Portal de soporte</a></li>
</ul>
            </div>

          </div>
        </div>

<div className="flex justify-end translate-x-[-50px] translate-y-[-110px]">
    <div className="flex gap-1">
    <a href="https://facebook.com" target="_blank" rel="noreferrer">
      <img src="/logo-linkedin.webp" alt="Facebook" className="w-[31px] h-[31px]" />
    </a>

    <a href="https://instagram.com" target="_blank" rel="noreferrer">
      <img src="/logo-facebook.webp" alt="Instagram" className="w-[31px] h-[31px]" />
    </a>

    <a href="https://linkedin.com" target="_blank" rel="noreferrer">
      <img src="/logo-linkedin.webp" alt="LinkedIn" className="w-[31px] h-[31px]" />
    </a>

    <a href="https://youtube.com" target="_blank" rel="noreferrer">
      <img src="/logo-youtube.webp" alt="YouTube" className="w-[31px] h-[31px]" />
    </a>

    <a href="https://x.com" target="_blank" rel="noreferrer">
      <img src="/logo-x.webp" alt="X" className="w-[31px] h-[31px]" />
    </a>
  </div>
</div>


      </div>
    </footer>
  );
}