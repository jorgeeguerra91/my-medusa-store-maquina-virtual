import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("======== NUEVA COTIZACION ========")

    console.log(req.body)

    return res.json({
      success: true,
      message: "Cotización recibida"
    })
  } catch (error: any) {
    console.error(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}