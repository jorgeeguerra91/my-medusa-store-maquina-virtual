// src/app/[countryCode]/(main)/page.tsx
import { Metadata } from "next"
import HeroCarousel from "@modules/home/components/hero/hero-carousel"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Ciberseguridad, Datos e Inteligencia de Negocios - Controles Empresariales",
  description:
    "Impulsa tu negocio con soluciones de ciberseguridad, análisis de datos e inteligencia de negocios. Conoce cómo Controles Empresariales acompaña tu transformación digital.",
}

const SITE = "https://www.controlesempresariales.com"
const IMG = `${SITE}/wp-content/uploads`

// Estilos compartidos (cámbialos aquí y se actualizan todas las secciones)
const wrap = "mx-auto w-full max-w-7xl px-6"
const section = "bg-white py-16"
const h2 = "mb-12 text-center text-3xl font-bold md:text-4xl"
const card = "rounded-2xl bg-white shadow-[0_12px_32px_rgba(26,0,60,0.22)]"

/* ------------------------------ DATOS ------------------------------ */

const stats = [
  { img: "2024/07/icono-home-cifrasv2.webp", value: "97%", label: "De Clientes Satisfechos" },
  { img: "2024/07/icono-home-cifras2v2.webp", value: "+300", label: "Ingenieros Certificados" },
  { img: "2024/07/icono-home-cifras3v2.webp", value: "+2.000", label: "Clientes" },
  { img: "2024/07/icono-home-cifras4v2.webp", value: "4 países", label: "Cobertura regional" },
]

const testimonials = [
  {
    quote:
      "Los recomendamos no al 100, al 200 (%), es que con Controles Empresariales el tema es totalmente fluido, transparente, honesto, no hay cartas ocultas, siempre entienden el negocio, y provee las soluciones adecuadas, en los momentos adecuados, con los costos adecuados…",
    name: "Hernan Sanabria",
    role: "Director T.I. de Biomax Colombia",
  },
  {
    quote:
      "…más allá de hablar de una transformación digital, es una reinvención, del modelo de negocio que por fortuna en estos momentos pueden lograrse de la mano de aliados como Controles Empresariales.",
    name: "Jaime Malagon,",
    role: "Líder de Programas de Transformación Digital Ecopetrol",
  },
]

// La imagen de cada dominio ya trae el nombre dibujado, por eso no hay título en texto.
const domains = [
  { img: "MODER-WORKPLACE", title: "Modern Workplace", href: "soluciones/modern-workplace",
    desc: "Flexibilidad para el trabajo en entornos híbridos, con herramientas que mejoran la productividad y la eficiencia." },
  { img: "DATA-CLOUD-CENTER-Y-CLOUD", title: "Data Center & Cloud", href: "soluciones/data-center-cloud",
    desc: "Servicios de infraestructura y nube con el alcance para agregar valor a la oferta de tu compañía, en constante mejora." },
  { img: "CYBERSECURITY-Y-NETWORKING", title: "Cybersecurity & Networking", href: "soluciones/cybersecurity-networking",
    desc: "Un servicio habilitador que entrega herramientas de conectividad seguras e idóneas." },
  { img: "DATA-Y-ANALYTICS", title: "Data & Analytics", href: "soluciones/data-analytics",
    desc: "Respuesta eficiente a la necesidad de visualizar, gestionar y aprovechar al máximo los datos de tu empresa." },
  { img: "BUSINESS-APPS", title: "Business Applications", href: "soluciones/business-applications",
    desc: "Connect 365 App for Sales, nuestra aplicación insignia para apoyar a tus equipos de ventas y la comunicación con clientes." },
  { img: "LOGO-XaaS", title: "XaaS", href: "soluciones/estrategias-de-servicios",
    desc: "Optimiza tus recursos con expertos y soluciones en alquiler, renting y DaaS, a la medida de tu operación." },
  { img: "LOGO-INNOVATION-LAB", title: "Innovation Lab", href: "dominios/estrategias-de-servicios/#innovation-lab",
    desc: "Integramos soluciones digitales innovadoras y seguras con tecnologías de vanguardia para transformar tu operación." },
]

const resources = [
  { img: "2026/10/Miniatura-768-X-534-400x250.webp", date: "Oct 15, 2026",
    title: "Guía práctica: Cómo implementar IA en tu negocio y no morir en el intento",
    desc: "Descubre cuál es la IA adecuada para tu empresa y cómo maximizar el ROI de forma segura.",
    page: `${SITE}/project/guia-practica-como-implementar-ia-en-tu-negocio-y-no-morir-en-el-intento`,
    href: "https://landing.controlesempresariales.com/guia-comparativa-copilot" },
  { img: "2026/05/MINIATURA-768X534PXL-400x250.jpg", date: "May 20, 2026",
    title: "Caso de éxito: Mesa de Servicio Optimizada",
    desc: "¿Tu Mesa de Servicio está preparada para sostener una operación cloud crítica?",
    page: `${SITE}/project/caso-de-exito-mesa-de-servicio-optimizada`,
    href: "https://landing.controlesempresariales.com/caso-de-%C3%A9xito-outsourcing-mesa-de-servicio" },
  { img: "2026/06/miniatura-sin-mosca-Ebook-Adobe-MS-400x250.webp", date: "May 5, 2026",
    title: "Ebook: Más allá de Microsoft 365 con Acrobat Studio",
    desc: "Gestiona tu documentación con las herramientas más potentes y seguras",
    page: `${SITE}/project/ebook-mas-alla-de-microsoft-365-con-acrobat-studio`,
    href: "https://landing.controlesempresariales.com/ebook-adobe-express-studio-mas-alla-de-microsoft" },
]

// "excerpt" está resumido con mis palabras; pega el extracto original si lo prefieres.
const BLOG = "https://blog.controlesempresariales.com"
const posts = [
  { img: "2026/10/Imagen-portada-blog-La-verdadera-innovacion-no-comienza-con-una-herramienta-3.jpg",
    date: "Octubre 2, 2026", title: "Tu próximo riesgo digital podría no ser humano",
    excerpt: "Bots, APIs y agentes de IA actúan ya como nuevas identidades. El reto es saber quién los gobierna.",
    href: `${BLOG}/tu-pr%C3%B3ximo-riesgo-digital-podr%C3%ADa-no-ser-humano` },
  { img: "2026/10/Imagen-blog-1-scaled-1.jpg",
    date: "Septiembre 15, 2026", title: "¿Cómo convertir los pilotos de inteligencia artificial en resultados?",
    excerpt: "Pocas organizaciones tienen un modelo para decidir qué pilotos de IA escalar, rediseñar o detener.",
    href: `${BLOG}/c%C3%B3mo-convertir-los-pilotos-de-inteligencia-artificial-en-resultados` },
  { img: "2026/10/Imagen-Blog-webinar-10-sept-2-scaled-1.jpg",
    date: "Septiembre 9, 2026", title: "¿Estamos invirtiendo en inteligencia artificial o simplemente aumentando nuestros costos operativos?",
    excerpt: "Una pregunta clave para los líderes: ¿la IA genera resultados o solo suma costos?",
    href: `${BLOG}/estamos-invirtiendo-en-inteligencia-artificial-o-simplemente-aumentando-nuestros-costos-operativos` },
  { img: "2026/10/blog-ia-security.png",
    date: "Agosto 27, 2026", title: "El nuevo perímetro de seguridad ya no es la red. Es la identidad",
    excerpt: "Con apoyo de IA, el phishing ya no depende de errores obvios y es más convincente.",
    href: `${BLOG}/el-nuevo-perimetro-de-seguridad-ya-no-es-la-red-es-la-identidad` },
  { img: "2026/06/miniatura-blog-1-sentinel.webp",
    date: "Agosto 18, 2026", title: "La nube como prioridad estratégica para las empresas",
    excerpt: "Competir depende también de qué tan rápido puede adaptarse y escalar una organización.",
    href: `${BLOG}/la-nube-como-prioridad-estrategica-para-las-empresas` },
  { img: "2026/10/Imagen-blog-Tienes-Copilot-pero-sigues-trabajando-como-antes.jpg",
    date: "Mayo 8, 2026", title: "Copilot Cowork: cuando la inteligencia artificial deja de asistir y empieza a ejecutar",
    excerpt: "La siguiente evolución de la IA no es dar mejores respuestas, sino ayudar a ejecutar trabajo real.",
    href: `${BLOG}/copilot-cowork-cuando-la-inteligencia-artificial-deja-de-asistir-y-empieza-a-ejecutar` },
]

/* ------------------------------ PÁGINA ------------------------------ */

export default function Home() {
  return (
    <div className="bg-white">
      <HeroCarousel />

      {/* CIFRAS + TESTIMONIOS + VIDEO */}
      <section className={section}>
        <div className={wrap}>
          <h2 className={`${h2} text-coemColors-azulCoem`}>Lo que las cifras dicen</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${card} flex flex-col items-center p-6 text-center transition-transform duration-300 hover:-translate-y-1`}
              >
                <img src={`${IMG}/${s.img}`} alt="COEM" className="h-16 w-16 object-contain" />
                <p className="mt-3 text-4xl font-bold text-coemColors-magentaCoem">{s.value}</p>
                <h3 className="mt-1 text-sm font-semibold text-coemColors-azulCoem md:text-base">{s.label}</h3>
              </div>
            ))}
          </div>

          <h2 className={`${h2} mt-20 text-coemColors-azulCoem`}>Lo que nuestros clientes dicen</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure key={t.name} className={`${card} p-8`}>
                <img src={`${IMG}/2024/05/icono-usuario.png`} alt="icono usuario" className="mb-4 h-12 w-12" />
                <blockquote className="text-gray-700">“{t.quote}”</blockquote>
                <figcaption className="mt-5">
                  <strong className="block text-coemColors-azulCoem">{t.name}</strong>
                  <strong className="block text-coemColors-magentaCoem">{t.role}</strong>
                </figcaption>
              </figure>
            ))}
          </div>

          <a
            href="https://www.youtube.com/watch?v=9D1TZiAfLko"
            className="mt-12 block w-full overflow-hidden rounded-md shadow-[0_12px_32px_rgba(26,0,60,0.22)]"
          >
            <img
              src={`${IMG}/2024/07/imagen-video-youtube-icono-icono-vf.webp`}
              alt="Ver video COEM"
              className="block w-full"
            />
          </a>
        </div>
      </section>

      {/* DOMINIOS */}
      <section className={section}>
        <div className={wrap}>
          <h2 className={`${h2} text-coemColors-magentaCoem`}>Dominios</h2>
          <p className="mx-auto mb-12 max-w-4xl text-center text-gray-700">
            Tener éxito en la transformación digital es posible, y la clave está en la estrategia, la
            estructura y la cultura. Por eso contamos con cinco dominios y dos estrategias de servicios
            que son los pilares para ofrecerte lo mejor en tecnología y competitividad empresarial.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => (
              <article key={d.title} className={`${card} flex flex-col p-6`}>
                <img src={`${IMG}/2024/08/${d.img}.webp`} alt={d.title} className="mb-4 h-auto w-full object-contain" />
                <h3 className="sr-only">{d.title}</h3>
                <p className="mb-4 flex-1 text-gray-700">{d.desc}</p>
                <a href={`${SITE}/${d.href}`} className="font-bold text-coemColors-magentaCoem hover:underline">
                  Leer más
                </a>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-4xl text-center text-gray-700">
            Los dominios son equipos de ingeniería especializados en las tecnologías que son tendencia.
            Las estrategias de servicios llevan la solución ideal a las capacidades de cada dominio para
            lograr su óptima adopción, funcionamiento y despliegue.
          </p>
        </div>
      </section>

      {/* CONTENIDOS Y RECURSOS */}
      <section className={section}>
        <div className={wrap}>
          <h2 className={`${h2} text-coemColors-azulCoem`}>Contenidos y Recursos</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {resources.map((r) => (
              <article key={r.title} className={`${card} flex flex-col overflow-hidden`}>
                <a href={r.page}>
                  <img src={`${IMG}/${r.img}`} alt={r.title} className="h-auto w-full" />
                </a>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-coemColors-azulCoem">
                    <a href={r.page}>{r.title}</a>
                  </h3>
                  <time className="mt-1 text-sm font-semibold text-coemColors-magentaCoem">{r.date}</time>
                  <p className="my-3 flex-1 text-gray-700">{r.desc}</p>
                  <a
                    href={r.href}
                    className="self-start rounded-md bg-coemColors-magentaCoem px-6 py-2 font-bold text-white transition hover:brightness-110"
                  >
                    Descargar
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className={section}>
        <div className={wrap}>
          <h2 className={`${h2} text-coemColors-azulCoem`}>Visita Nuestro Blog</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.title} className={`${card} flex flex-col overflow-hidden`}>
                <img src={`${IMG}/${p.img}`} alt="Blog" className="h-48 w-full object-cover" />
                <div className="flex flex-1 flex-col p-6">
                  <h4 className="font-bold text-coemColors-azulCoem">{p.title}</h4>
                  <time className="mt-1 text-sm font-semibold text-coemColors-magentaCoem">{p.date}</time>
                  <p className="my-3 flex-1 text-sm text-gray-700">{p.excerpt}</p>
                  <a href={p.href} className="font-bold text-coemColors-magentaCoem hover:underline">
                    Leer más
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* INVITACIÓN A LA TIENDA: a todo el ancho, pegada al footer */}
      <section className="bg-gradient-to-r from-coemColors-azulCoem to-coemColors-azul2Coem px-6 py-20 text-center text-white md:py-28">
        <h2 className="text-3xl font-bold md:text-5xl">Conoce nuestra tienda</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg md:text-xl">
          Explora el catálogo y encuentra los productos de tecnología que tu empresa necesita.
        </p>
        <LocalizedClientLink
          href="/store"
          className="mt-8 inline-block rounded-md bg-coemColors-magentaCoem px-10 py-4 text-lg font-bold text-white transition hover:brightness-110"
        >
          Ir a la tienda
        </LocalizedClientLink>
      </section>
    </div>
  )
}