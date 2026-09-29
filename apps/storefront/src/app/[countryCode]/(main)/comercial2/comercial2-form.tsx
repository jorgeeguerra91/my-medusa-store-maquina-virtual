"use client"

import { useState } from "react"

export default function Comercial2Form() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")

  const MAX_FILE_SIZE = 10 * 1024 * 1024

  async function generarCotizacion() {
    setError("")
    setLink("")

    if (!file) {
      setError("Debe seleccionar un archivo PDF.")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/quote-from-pdf`,
        {
          method: "POST",
          headers: {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: formData,
        }
      )

      const data = await response.json()

      console.log("RESPUESTA PDF:", data)

      if (!response.ok) {
        setError(
          data.message ||
            "No fue posible generar la cotización."
        )
        return
      }

      setLink(data.recovery_link)
    } catch (error) {
      console.error(error)
      setError("No fue posible conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Cotización desde PDF
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Cargue una propuesta económica para generar
          automáticamente el enlace de cotización.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Archivo PDF
        </label>

        <p className="text-sm text-gray-500 mb-2">
          Tamaño máximo: 10 MB.
        </p>

        <input
          type="file"
          accept=".pdf,application/pdf"
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
            setError("")
            setLink("")
          }}
        />

        {file && (
          <p className="text-green-600 mt-2">
            Archivo seleccionado: {file.name}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={generarCotizacion}
        disabled={loading || !file}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded"
      >
        {loading ? "Generando..." : "Generar cotización"}
      </button>

      {error && (
        <div className="rounded bg-red-100 text-red-700 p-3">
          {error}
        </div>
      )}

      {link && (
        <div className="rounded bg-green-100 p-4 space-y-3">
          <p className="font-semibold text-green-700">
            ✔ Enlace generado correctamente
          </p>

          <input
            readOnly
            value={link}
            className="border rounded w-full p-2 bg-white"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(link)
            }
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  )
}