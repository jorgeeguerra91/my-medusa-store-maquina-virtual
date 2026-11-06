
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  createCartWorkflow,
  addToCartWorkflow,
} from "@medusajs/medusa/core-flows"

type Body = {
  email: string
  trm: number
  impuesto: number
  expires_at: string
  items: {
    variant_id: string
    quantity: number
    unit_price: number
  }[]
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const {
      email,
      trm,
      impuesto,
      expires_at,
      items,
    } = req.body as Body

    if (!email) {
      return res.status(400).json({
        message: "email is required",
      })
    }

    const trmNumerica = Number(trm)
    const impuestoNumerico = Number(impuesto)

    if (
      !Number.isFinite(trmNumerica) ||
      trmNumerica <= 0
    ) {
      return res.status(400).json({
        message: "TRM must be greater than 0",
      })
    }

    if (
      !Number.isFinite(impuestoNumerico) ||
      impuestoNumerico < 0
    ) {
      return res.status(400).json({
        message: "Impuesto cannot be negative",
      })
    }

    if (!expires_at) {
      return res.status(400).json({
        message: "La fecha límite es obligatoria",
      })
    }

    const expirationDate = new Date(expires_at)

    if (Number.isNaN(expirationDate.getTime())) {
      return res.status(400).json({
        message: "La fecha límite no es válida",
      })
    }

    const itemsRecibidos = Array.isArray(items)
      ? items
      : []

    const subtotalUSD = itemsRecibidos.reduce(
      (total, item) =>
        total +
        Number(item.unit_price) *
          Number(item.quantity),
      0
    )

    if (
      impuestoNumerico > 0 &&
      subtotalUSD <= 0
    ) {
      return res.status(400).json({
        message:
          "No se puede distribuir el impuesto porque el subtotal de los productos es cero",
      })
    }

    // Distribuye el impuesto entre los productos
    // proporcionalmente a sus precios base.
    const factorConImpuesto =
      subtotalUSD > 0
        ? (subtotalUSD + impuestoNumerico) /
          subtotalUSD
        : 1

    const query = req.scope.resolve("query")

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: {
        email,
      },
    })

    const customer = customers?.[0]

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      })
    }

    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name"],
    })

    const region = regions?.[0]

    if (!region) {
      return res.status(404).json({
        message: "No region found",
      })
    }

    const { result: cart } =
      await createCartWorkflow(req.scope).run({
        input: {
          customer_id: customer.id,
          region_id: region.id,
          items: [],
          metadata: {
            quote_expires_at:
              expirationDate.toISOString(),
          },
        },
      })

    if (itemsRecibidos.length > 0) {
      await addToCartWorkflow(req.scope).run({
        input: {
          cart_id: cart.id,
          items: itemsRecibidos.map((item) => {
            const precioBaseUSD =
              Number(item.unit_price)

            const cantidad =
              Number(item.quantity)

            // Precio unitario en COP, con el impuesto incluido.
            const precioConImpuestoCOP =
              precioBaseUSD *
              factorConImpuesto *
              trmNumerica

            return {
              variant_id: item.variant_id,
              quantity: cantidad,
              unit_price: Math.round(
                precioConImpuestoCOP
              ),
            }
          }),
        },
      })
    }

    const storefrontBaseUrl = (
      process.env.STOREFRONT_PUBLIC_URL?.trim() ||
      "http://localhost:8000"
    ).replace(/\/+$/, "")

    return res.json({
      customer_email: customer.email,
      cart_id: cart.id,
      region_id: region.id,
      recovery_link:
        `${storefrontBaseUrl}/co/cart/recover/${cart.id}`,
      expires_at: expirationDate.toISOString(),
    })
  } catch (error: any) {
    console.error(error)

    return res.status(500).json({
      message: error.message,
    })
  }
}
