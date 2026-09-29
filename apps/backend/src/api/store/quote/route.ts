import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("COTIZACION RECIBIDA")
    console.log("AUTH CONTEXT:", req.auth_context)
console.log("ACTOR ID:", req.auth_context?.actor_id)

const query = req.scope.resolve("query")

const customerId = req.auth_context?.actor_id

let correoMedusa = ""

if (customerId) {
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: {
      id: customerId,
    },
  })

  correoMedusa = customers?.[0]?.email || ""
}

console.log("CORREO MEDUSA:", correoMedusa)

    const {
      empresa,
      nombre,
      correo,
      telefono,
      comentarios,
    } = (req as any).body

    const archivo = (req as any).file

    if (archivo) {
      console.log("Nombre:", archivo.name)
      console.log("Tipo:", archivo.type)
      console.log("Tamaño:", archivo.size)
    } else {
      console.log("NO LLEGÓ ARCHIVO")
    }

    let archivoNombre = ""
    let archivoContenido = ""

    if (archivo) {
      archivoNombre = archivo.originalname
      archivoContenido = archivo.buffer.toString("base64")

      console.log("ARCHIVO:", archivoNombre)
    }

const body = {
  empresa,
  nombre,
  correo,
  correoMedusa,
  telefono,
  comentarios,
  archivoNombre,
  archivoContenido,
}

    console.log(body)

    const response = await fetch(
      "https://ea232a82126ae3bfb7265782aa5bcf.17.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/4c0a907b35ff4e359b3038b0a40e613d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8AlDxj_aRkwkbVd4a7Y8Mq6CD2EKWuYt_aJ7N0088f4",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    console.log(
      "POWER AUTOMATE:",
      response.status
    )

    return res.json({
      success: true,
    })
  } catch (e: any) {
    console.log(e)

    return res.status(500).json({
      success: false,
      message: e.message,
    })
  }
}