{/* ESTADÍSTICAS */}
export default function Statistics() {
  return (
      <section className="py-24 bg-coemColors-azulCoem text-white">
        <div className="max-w-6xl mx-auto px-6">

          <div className="grid md:grid-cols-4 gap-10 text-center">

            <div>
              <div className="text-5xl font-bold">97%</div>
              <div className="mt-2">De clientes satisfechos</div>
            </div>

            <div>
              <div className="text-5xl font-bold">+300</div>
              <div className="mt-2">Ingenieros certificados</div>
            </div>

            <div>
              <div className="text-5xl font-bold">+2000</div>
              <div className="mt-2">Clientes</div>
            </div>

            <div>
              <div className="text-5xl font-bold">4 paises</div>
              <div className="mt-2">Cobertura regional</div>
            </div>

          </div>
        </div>
      </section>
  )
}