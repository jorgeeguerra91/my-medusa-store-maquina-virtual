import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const q = (req.query.q as string)?.trim()

  if (!q) {
    return res.json([])
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "variants.id",
      "variants.title",
    ],
    filters: {
      title: {
        $ilike: `%${q}%`,
      },
    },
  })

  return res.json(data)
}