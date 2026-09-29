/**import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import createNegotiatedCartWorkflow from "../../../../workflows/create-negotiated-cart"
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { email, items } = req.body as {
    email: string
    items: {
      variant_id: string
      quantity: number
      unit_price: number
    }[]
  }

  const { result } = await createNegotiatedCartWorkflow(req.scope).run({
    input: {
      email,
      items,
    },
  })

  return res.json(result)
}*/