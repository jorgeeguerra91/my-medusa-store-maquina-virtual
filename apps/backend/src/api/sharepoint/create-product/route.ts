import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  createProductsWorkflow,
  batchLinkProductsToCategoryWorkflow,
} from "@medusajs/medusa/core-flows"

console.log("ROUTE CREATE-PRODUCT CARGADA")

type CreateProductBody = {
  title: string
  sku: string
  description?: string
  handle: string
  image_url?: string
  price?: number

  // Power Automate envía strings
  requires_shipping?: boolean | string

  referencia?: string
  fabricante?: string
  categoria?: string
  vigencia?: number | string
  informacion_adicional?: string
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  console.log("GET RECIBIDO")

  return res.json({
    success: true,
    message: "Endpoint funcionando",
  })
}

export async function POST(
  req: MedusaRequest<CreateProductBody>,
  res: MedusaResponse
) {
  try {
    console.log("POST RECIBIDO")
    console.log("BODY:", req.body)

    const {
      title,
      sku,
      description,
      handle,
      image_url,
      referencia,
      requires_shipping,
      fabricante,
      categoria,
      vigencia,
      informacion_adicional,
      price,
    } = req.body

    const requiresShippingBool =
      requires_shipping === true ||
      requires_shipping === "True" ||
      requires_shipping === "true"

    const query = req.scope.resolve(
      ContainerRegistrationKeys.QUERY
    )

    const {
      data: [shippingProfile],
    } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    })

    console.log("SHIPPING PROFILE:", shippingProfile)

    console.log(
      "requires_shipping:",
      requires_shipping,
      typeof requires_shipping
    )

    console.log(
      "requiresShippingBool:",
      requiresShippingBool
    )

    const categoryMap: Record<string, string> = {
      Software: "pcat_01KRP9T3DFRR12KXBGSDYWPXRG",
      Hardware: "pcat_01KRP9V9FFHGRG9RPPD7NFQH42",
      "Servicios TI": "pcat_01KRP9WM7ESPX2VSE016KSFQPW",
      "Microsoft Solutions":
        "pcat_01KRP9YD4A06TFZF4C0H5B292Y",
    }

    console.log(
      "CATEGORY ID:",
      categoryMap[categoria ?? ""]
    )

    const { result } =
      await createProductsWorkflow(req.scope).run({
        input: {
          products: [
            {
              title,
              handle,
              description,
              status: "published",

              material: referencia,
              origin_country: fabricante,

              metadata: {
                informacion_adicional,
                vigencia,
                categoria,
              },

              shipping_profile_id:
                requiresShippingBool
                  ? shippingProfile.id
                  : undefined,

              images: image_url
                ? [
                    {
                      url: image_url,
                    },
                  ]
                : [],

              options: [
                {
                  title: "Default",
                  values: ["Default"],
                },
              ],

              variants: [
                {
                  title: "Default",
                  sku,
                  manage_inventory: false,

                  options: {
                    Default: "Default",
                  },

                  prices: [
  {
    amount: Number(price ?? 0),
    currency_code: "cop",
  },
],
                },
              ],
            },
          ],
        },
      })

    console.log("PRODUCTO CREADO:", result)

    const productId = result[0].id

    console.log("PRODUCT ID:", productId)

    console.log("ANTES DEL LINK")

    if (categoria && categoryMap[categoria]) {
      console.log("ENTRANDO AL LINK")

      const { data: categoriesFound } =
        await query.graph({
          entity: "product_category",
          fields: ["id", "name"],
          filters: {
            id: [categoryMap[categoria]],
          },
        })

      console.log(
        "CATEGORIAS ENCONTRADAS:",
        categoriesFound
      )

      await batchLinkProductsToCategoryWorkflow(
        req.scope
      ).run({
        input: {
          id: categoryMap[categoria],
          add: [productId],
        },
      })

      console.log("LINK COMPLETADO")
    }

    return res.json({
      success: true,
      product: result[0],
    })
  } catch (error: any) {
    console.log(
      "========== ERROR COMPLETO =========="
    )

    console.dir(error, {
      depth: null,
    })

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}