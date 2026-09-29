      {/* SERVICIOS */}
      export default function Services() {
  return (
     <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center text-coemColors-azulCoem mb-16">
            Servicios Especializados
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white p-8 rounded-xl border">
              <h3 className="font-bold text-xl mb-3">
                Consultoría TI
              </h3>
              <p>
                Diagnóstico, planeación e implementación de proyectos tecnológicos.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border">
              <h3 className="font-bold text-xl mb-3">
                Licenciamiento
              </h3>
              <p>
                Gestión y optimización de licencias empresariales.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border">
              <h3 className="font-bold text-xl mb-3">
                Soporte Especializado
              </h3>
              <p>
                Atención técnica para infraestructura, software y seguridad.
              </p>
            </div>

          </div>
        </div>
      </section>
  )  
 }