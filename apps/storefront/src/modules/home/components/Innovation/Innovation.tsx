 {/* INNOVATION */}
 export default function Innovation() {
  return (
<section className="py-24 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6">

    {/* TITULO */}
    <h2 className="text-3xl md:text-4xl font-bold text-center text-coemColors-azulCoem mb-4">
      Áreas de innovación
    </h2>

    <p className="text-center text-gray-600 max-w-2xl mx-auto mb-14">
      Soluciones tecnológicas diseñadas para potenciar cada parte de tu organización.
    </p>

    {/* GRID */}
    <div className="grid md:grid-cols-3 gap-8">

      <div className="bg-white border-l-4 border-coemColors-azulCoem rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-coemColors-azulCoem">
          Infraestructura
        </h3>
        <p className="text-gray-600">
          Diseño e implementación de centros de datos, redes y arquitectura TI.
        </p>
      </div>

      <div className="bg-white border-l-4 border-coemColors-magentaCoem rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-coemColors-magentaCoem">
          Cloud & Software
        </h3>
        <p className="text-gray-600">
          Migración, desarrollo y gestión de soluciones en la nube.
        </p>
      </div>

      <div className="bg-white border-l-4 border-blue-500 rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-blue-500">
          Ciberseguridad
        </h3>
        <p className="text-gray-600">
          Protección de datos, infraestructura y continuidad del negocio.
        </p>
      </div>

      <div className="bg-white border-l-4 border-green-500 rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-green-600">
          Data & Analytics
        </h3>
        <p className="text-gray-600">
          Transformación de datos en decisiones estratégicas.
        </p>
      </div>

      <div className="bg-white border-l-4 border-yellow-500 rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-yellow-600">
          Workplace Moderno
        </h3>
        <p className="text-gray-600">
          Herramientas para productividad y colaboración empresarial.
        </p>
      </div>

      <div className="bg-white border-l-4 border-purple-500 rounded-xl p-6 hover:shadow-md transition">
        <h3 className="text-xl font-semibold mb-2 text-purple-600">
          Servicios Administrados
        </h3>
        <p className="text-gray-600">
          Gestión integral de TI para empresas en crecimiento.
        </p>
      </div>

    </div>
  </div>
</section>
  ) 
}