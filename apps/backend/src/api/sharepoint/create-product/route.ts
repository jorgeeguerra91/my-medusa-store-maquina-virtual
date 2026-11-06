
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  createProductsWorkflow,
  batchLinkProductsToCategoryWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

console.log("ROUTE CREATE-PRODUCT CARGADA")

type CreateProductBody = {
  title: string
  sku: string
  description?: string
  handle: string
  image_url?: string
  price?: number | string
  requires_shipping?: boolean | string
  referencia?: string
  fabricante?: string
  categoria?: string
  vigencia?: number | string
  informacion_adicional?: string

  // Columna de inventario proveniente de SharePoint
  inventario?: number | string | null
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
      inventario,
    } = req.body

    // 1. Determinar si requiere envío
    const requiresShippingBool =
      requires_shipping === true ||
      requires_shipping === "True" ||
      requires_shipping === "true"

    // 2. Interpretar el inventario.
    // Si viene vacío, el producto no controlará stock.
    const inventarioVacio =
      inventario === undefined ||
      inventario === null ||
      String(inventario).trim() === ""

    let cantidadInventario: number | null = null

    if (!inventarioVacio) {
      const cantidad = Number(inventario)

      if (
        !Number.isInteger(cantidad) ||
        cantidad < 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "El inventario debe ser un número entero mayor o igual a cero, o quedar vacío.",
        })
      }

      cantidadInventario = cantidad
    }

    const manageInventory =
      cantidadInventario !== null

    console.log("INVENTARIO RECIBIDO:", inventario)
    console.log("MANAGE INVENTORY:", manageInventory)
    console.log("CANTIDAD:", cantidadInventario)

    // 3. Obtener Query
    const query = req.scope.resolve(
      ContainerRegistrationKeys.QUERY
    )

    // 4. Obtener el perfil de envío existente
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

    // 5. Si hay inventario, obtener una ubicación de stock
    let stockLocationId: string | undefined

    if (manageInventory) {
      const { data: stockLocations } =
        await query.graph({
          entity: "stock_location",
          fields: ["id", "name"],
        })

      if (!stockLocations.length) {
        return res.status(400).json({
          success: false,
          error:
            "No hay ninguna ubicación de stock configurada en Medusa.",
        })
      }

      // Se utiliza la primera ubicación disponible.
      stockLocationId = stockLocations[0].id

      console.log(
        "STOCK LOCATION:",
        stockLocations[0]
      )
    }

    // 6. Mapeo de categorías
    const categoryMap: Record<string, string> = {
      Software: "pcat_01KRP9T3DFRR12KXBGSDYWPXRG",
      Hardware: "pcat_01KRP9V9FFHGRG9RPPD7NFQH42",
      "Servicios TI": "pcat_01KRP9WM7ESPX2VSE016KSFQPW",
      "Microsoft Solutions": "pcat_01KRP9YD4A06TFZF4C0H5B292Y",
    }

    console.log(
      "CATEGORY ID:",
      categoryMap[categoria ?? ""]
    )

    // 7. Crear producto y variante
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

                  // Vacío = disponibilidad ilimitada.
                  // Con cantidad = control de inventario.
                  manage_inventory: manageInventory,

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

    // 8. Crear nivel de inventario si se informó una cantidad
    if (
      manageInventory &&
      stockLocationId &&
      cantidadInventario !== null
    ) {
      const variantId = result[0].variants?.[0]?.id

      if (!variantId) {
        throw new Error(
          "El producto se creó, pero no se encontró su variante."
        )
      }

      // La variante ya tiene un inventory item porque
      // manage_inventory está habilitado.
      const { data: variantsFound } =
        await query.graph({
          entity: "variant",
          fields: [
            "id",
            "inventory_items.inventory.id",
          ],
          filters: {
            id: variantId,
          },
        })

      const inventoryItemId =
        variantsFound[0]?.inventory_items?.[0]
          ?.inventory?.id

      if (!inventoryItemId) {
        throw new Error(
          "No se encontró el inventory item de la variante."
        )
      }

      // Registrar la cantidad en la ubicación de stock
      await createInventoryLevelsWorkflow(
        req.scope
      ).run({
        input: {
          inventory_levels: [
            {
              inventory_item_id: inventoryItemId,
              location_id: stockLocationId,
              stocked_quantity: cantidadInventario,
            },
          ],
        },
      })

      console.log("INVENTARIO REGISTRADO:", {
        inventoryItemId,
        stockLocationId,
        cantidadInventario,
      })
    }

    // 9. Asociar categoría
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

    // 10. Respuesta
    return res.json({
      success: true,
      product: result[0],
      inventory: {
        managed: manageInventory,
        quantity: cantidadInventario,
        stock_location_id: stockLocationId ?? null,
      },
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