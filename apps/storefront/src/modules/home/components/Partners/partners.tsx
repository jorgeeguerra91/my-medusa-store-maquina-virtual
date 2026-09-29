{/* PARTNERS */}
export default function Solutions() {
  return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center text-coemColors-azulCoem mb-14">
            Partners Estratégicos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-center">
            {[
              "Microsoft",
              "Cisco",
              "Adobe",
              "Lenovo",
              "Fortinet",
              "IBM",
              "Apple",
              "HPE",
              "Autodesk",
              "Red Hat",
              "VMware",
              "Veeam",
            ].map((partner) => (
              <div
                key={partner}
                className="bg-white rounded-lg border p-6 font-semibold hover:shadow-md transition"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>
  )
}
