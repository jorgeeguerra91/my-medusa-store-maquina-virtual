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
    const { email, trm, impuesto, expires_at, items } =
      req.body as Body

    if (!email) {
      return res.status(400).json({
        message: "email is required",
      })
    }

    if (!trm || trm <= 0) {
      return res.status(400).json({
        message: "TRM must be greater than 0",
      })
    }

    if (impuesto < 0) {
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

    const { result: cart } = await createCartWorkflow(req.scope).run({
      input: {
        customer_id: customer.id,
        region_id: region.id,
        items: [],
        metadata: {
          quote_expires_at: expirationDate.toISOString(),
        },
      },
    })

    if (items?.length) {
      await addToCartWorkflow(req.scope).run({
        input: {
          cart_id: cart.id,
          items: items.map((item) => {
const precioCOP = item.unit_price * trm

return {
  variant_id: item.variant_id,
  quantity: item.quantity,
  unit_price: Math.round(precioCOP),
}
          }),
        },
      })
    }

    return res.json({
      customer_email: customer.email,
      cart_id: cart.id,
      region_id: region.id,
      recovery_link: `http://localhost:8000/cart/recover/${cart.id}`,
      expires_at: expirationDate.toISOString(),
    })
  } catch (error: any) {
    console.error(error)

    return res.status(500).json({
      message: error.message,
    })
  }
}