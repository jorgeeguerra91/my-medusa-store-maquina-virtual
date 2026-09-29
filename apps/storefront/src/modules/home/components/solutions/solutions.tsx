export default function Solutions() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center text-coemColors-azulCoem mb-4">
          Soluciones Tecnológicas
        </h2>

        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16">
          Impulsamos la transformación digital de las organizaciones mediante
          infraestructura, software, ciberseguridad y servicios especializados.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            "Business Applications",
            "Cybersecurity & Networking",
            "Data Center & Cloud",
            "Modern Workplace",
            "Data & Analytics",
            "Servicios Administrados",
          ].map((item) => (
            <div
              key={item}
              className="p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-xl mb-4 text-coemColors-azulCoem">
                {item}
              </h3>

              <p className="text-gray-600">
                Soluciones empresariales diseñadas para mejorar la productividad,
                seguridad y eficiencia operativa.
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}