"use client"

import { useState } from "react"

export default function FormularioCotizacion() {
  const [empresa, setEmpresa] =useState("")
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [comentarios, setComentarios] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  
  const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  console.log("ENVIANDO FORMULARIO...")

  try {

    const formData = new FormData()

    formData.append("empresa", empresa)
    formData.append("nombre", nombre)
    formData.append("correo", correo)
    formData.append("telefono", telefono)
    formData.append("comentarios", comentarios)

    if (file) {
      formData.append("archivo", file)
    }

    const response = await fetch(
  `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/quote`,
      {
        method: "POST",
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
        },
        body: formData,
      }
    )

    console.log("STATUS:", response.status)

    const data = await response.json()

    console.log(data)

    if (response.ok) {
      alert("Solicitud enviada")
    } else {
      alert("Error al enviar")
    }

  } catch (error) {

    console.log(error)

    alert("Error de conexión")

  }

}

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border p-8">

      <h2 className="text-2xl font-semibold mb-2">
        Solicitud de cotización
      </h2>

      <p className="text-gray-500 mb-8">
        Cargue un archivo con los productos que desea cotizar.
      </p>

      <form
        className="space-y-6"
        onSubmit={handleSubmit}
      >

        <div>
          <label className="block text-sm font-medium mb-2">
            Empresa
          </label>

          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre del contacto
          </label>

          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Correo electrónico
          </label>

          <input
            type="email"
            className="w-full border rounded-md px-3 py-2"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Teléfono
          </label>

          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Comentarios
          </label>

          <textarea
            rows={4}
            className="w-full border rounded-md px-3 py-2"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
  Archivo
</label>

<p className="text-sm text-gray-500 mb-2">
  Tamaño máximo permitido: 10 MB.
</p>

<input
  type="file"
  onChange={(e) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("El archivo no puede superar los 10 MB.")
      e.target.value = ""
      setFile(null)
      return
    }

    setFile(selectedFile)
  }}
  required
/>

          {file && (
            <p className="text-green-600 mt-2">
              {file.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
        >
          Enviar solicitud
        </button>

      </form>
    </div>
  )
}