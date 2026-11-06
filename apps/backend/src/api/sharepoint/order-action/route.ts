import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("=== SHAREPOINT ORDER ACTION ===")

    const body = (req.body || {}) as {
      action?: string
      order_id?: string
    }

    const { action, order_id } = body

    // =========================================
    // 1. VALIDAR DATOS
    // =========================================

    if (action !== "get_order") {
      return res.status(400).json({
        success: false,
        message:
          'La acción de prueba debe ser "get_order".',
      })
    }

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message:
          "order_id es obligatorio.",
      })
    }

    // =========================================
    // 2. CONSULTAR ORDEN EN MEDUSA
    // =========================================

    const query =
      req.scope.resolve("query")

    const { data: orders } =
      await query.graph({
        entity: "order",

        fields: [
          "id",
          "display_id",
          "status",
          "email",
          "currency_code",
          "total",
          "subtotal",
          "tax_total",
          "discount_total",
          "shipping_total",
          "items.*",
          "customer.*",
          "shipping_address.*",
          "billing_address.*",
          "metadata",
        ],

        filters: {
          id: order_id,
        },
      })

    const order = orders?.[0]

    // =========================================
    // 3. VALIDAR ORDEN
    // =========================================

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          `No se encontró la orden ${order_id}.`,
      })
    }

    console.log(
      "ORDEN ENCONTRADA:",
      order.id
    )

    console.log(
      "DISPLAY ID:",
      order.display_id
    )

    console.log(
      "ESTADO:",
      order.status
    )

    // =========================================
    // 4. RESPUESTA
    // =========================================

    return res.json({
      success: true,

      action: "get_order",

      order: {
        id: order.id,
        display_id: order.display_id,
        status: order.status,
        email: order.email,
        currency_code:
          order.currency_code,

        total: order.total,
        subtotal:
          order.subtotal,
        tax_total:
          order.tax_total,
        discount_total:
          order.discount_total,
        shipping_total:
          order.shipping_total,

        customer:
          order.customer,

        shipping_address:
          order.shipping_address,

        billing_address:
          order.billing_address,

        items:
          order.items,

        metadata:
          order.metadata,
      },
    })
  } catch (error: any) {
    console.error(
      "=== ERROR SHAREPOINT ORDER ACTION ==="
    )

    console.error(error)

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "No fue posible consultar la orden.",
    })
  }
}