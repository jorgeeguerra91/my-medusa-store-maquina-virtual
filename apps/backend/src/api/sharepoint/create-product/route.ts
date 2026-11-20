import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { timingSafeEqual } from "crypto"

import {
  createProductsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  batchLinkProductsToCategoryWorkflow,
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

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
  inventario?: number | string | null

  // NUEVOS: para editar un producto ya creado
  id_medusa?: string
  sharepoint_item_id?: string | number
}

// Comparación segura de textos (evita ataques por tiempo de respuesta)
function iguales(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

// Valida la autenticación básica (usuario y contraseña) del flujo de Power Automate
function autorizado(req: MedusaRequest) {
  const usuario = process.env.SHAREPOINT_PRODUCTS_USER
  const clave = process.env.SHAREPOINT_PRODUCTS_PASSWORD

  // Si no están configuradas las variables, se rechaza todo por seguridad
  if (!usuario || !clave) return false

  const header = req.headers["authorization"] ?? ""
  if (!header.startsWith("Basic ")) return false

  const decodificado = Buffer.from(header.slice(6), "base64").toString("utf-8")
  const separador = decodificado.indexOf(":")
  if (separador < 0) return false

  return (
    iguales(decodificado.slice(0, separador), usuario) &&
    iguales(decodificado.slice(separador + 1), clave)
  )
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ success: true, message: "Endpoint funcionando" })
}

export async function POST(
  req: MedusaRequest<CreateProductBody>,
  res: MedusaResponse
) {
  if (!autorizado(req)) {
    return res.status(401).json({
      success: false,
      estado_sincronizacion: "Error",
      error: "No autorizado.",
    })
  }

  try {
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
      id_medusa,
    } = req.body

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // 1. Requiere envío
    const requiresShippingBool =
      requires_shipping === true ||
      requires_shipping === "True" ||
      requires_shipping === "true"

    // 2. Inventario (vacío = sin control de stock)
    const inventarioVacio =
      inventario === undefined ||
      inventario === null ||
      String(inventario).trim() === ""

    let cantidadInventario: number | null = null

    if (!inventarioVacio) {
      const cantidad = Number(inventario)

      if (!Number.isInteger(cantidad) || cantidad < 0) {
        return res.status(400).json({
          success: false,
          estado_sincronizacion: "Error",
          error:
            "El inventario debe ser un número entero mayor o igual a cero, o quedar vacío.",
        })
      }

      cantidadInventario = cantidad
    }

    const manageInventory = cantidadInventario !== null

    // 3. Perfil de envío
    const {
      data: [shippingProfile],
    } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    })

    // 4. Ubicación de stock (solo si hay inventario)
    let stockLocationId: string | undefined

    if (manageInventory) {
      const { data: stockLocations } = await query.graph({
        entity: "stock_location",
        fields: ["id", "name"],
      })

      if (!stockLocations.length) {
        return res.status(400).json({
          success: false,
          estado_sincronizacion: "Error",
          error: "No hay ninguna ubicación de stock configurada en Medusa.",
        })
      }

      stockLocationId = stockLocations[0].id
    }

    // 5. Categoría: se busca por nombre en Medusa (ya no hay mapa fijo)
    let categoryId: string | undefined
    let advertencia: string | undefined

    if (categoria && categoria.trim()) {
      const { data: categoriesFound } = await query.graph({
        entity: "product_category",
        fields: ["id", "name"],
        filters: { name: categoria.trim() },
      })

      categoryId = categoriesFound[0]?.id

      if (!categoryId) {
        advertencia = `No existe en Medusa una categoría llamada "${categoria}".`
      }
    }

    // 6. ¿El producto ya existe? Primero por id_medusa, luego por SKU
    let productId = id_medusa?.trim() || ""
    let variantId = ""

    if (productId) {
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "variants.id"],
        filters: { id: productId },
      })

      if (data.length) {
        variantId = (data[0] as any).variants?.[0]?.id ?? ""
      } else {
        productId = ""
      }
    }

    if (!productId && sku) {
      const { data } = await query.graph({
        entity: "variant",
        fields: ["id", "product_id", "sku"],
        filters: { sku },
      })

      if (data.length) {
        productId = (data[0] as any).product_id
        variantId = data[0].id
      }
    }

    const metadata = { informacion_adicional, vigencia, categoria }
    const isUpdate = !!productId

    // ============ EDITAR ============
    if (isUpdate) {
      await updateProductsWorkflow(req.scope).run({
        input: {
          products: [
            {
              id: productId,
              title,
              // El handle solo se define al crear: no se modifica al editar
              description,
              status: "published",
              material: referencia,
              origin_country: fabricante,
              metadata,
              ...(image_url ? { images: [{ url: image_url }] } : {}),
              ...(requiresShippingBool
                ? { shipping_profile_id: shippingProfile.id }
                : {}),
            },
          ],
        } as any,
      })

      if (variantId) {
        await updateProductVariantsWorkflow(req.scope).run({
          input: {
            product_variants: [
              {
                id: variantId,
                sku,
                // El inventario no se toca al editar
                prices: [
                  { amount: Number(price ?? 0), currency_code: "cop" },
                ],
              },
            ],
          } as any,
        })
      }
    }

    // ============ CREAR ============
    if (!isUpdate) {
      const { result } = await createProductsWorkflow(req.scope).run({
        input: {
          products: [
            {
              title,
              handle,
              description,
              status: "published",
              material: referencia,
              origin_country: fabricante,
              metadata,
              shipping_profile_id: requiresShippingBool
                ? shippingProfile.id
                : undefined,
              images: image_url ? [{ url: image_url }] : [],
              options: [{ title: "Default", values: ["Default"] }],
              variants: [
                {
                  title: "Default",
                  sku,
                  manage_inventory: manageInventory,
                  options: { Default: "Default" },
                  prices: [
                    { amount: Number(price ?? 0), currency_code: "cop" },
                  ],
                },
              ],
            },
          ],
        },
      })

      productId = result[0].id
      variantId = result[0].variants?.[0]?.id ?? ""
    }

    // 7. Inventario: solo al crear el producto. Al editar no se modifica,
    // porque Medusa lleva el stock real (las ventas lo descuentan).
    if (
      !isUpdate &&
      manageInventory &&
      stockLocationId &&
      cantidadInventario !== null
    ) {
      if (!variantId) {
        throw new Error("No se encontró la variante del producto.")
      }

      const { data: variantsFound } = await query.graph({
        entity: "variant",
        fields: ["id", "inventory_items.inventory.id"],
        filters: { id: variantId },
      })

      const inventoryItemId = (variantsFound[0] as any)?.inventory_items?.[0]
        ?.inventory?.id

      if (!inventoryItemId) {
        throw new Error("No se encontró el inventory item de la variante.")
      }

      const { data: levels } = await query.graph({
        entity: "inventory_level",
        fields: ["id"],
        filters: {
          inventory_item_id: inventoryItemId,
          location_id: stockLocationId,
        },
      })

      if (levels.length) {
        await updateInventoryLevelsWorkflow(req.scope).run({
          input: {
            updates: [
              {
                inventory_item_id: inventoryItemId,
                location_id: stockLocationId,
                stocked_quantity: cantidadInventario,
              },
            ],
          } as any,
        })
      } else {
        await createInventoryLevelsWorkflow(req.scope).run({
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
      }
    }

    // 8. Categoría: quitar las anteriores y asociar la nueva
    if (categoryId) {
      const { data: current } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id: productId },
      })

      const currentIds: string[] = (
        (current[0] as any)?.categories ?? []
      ).map((c: any) => c.id)

      for (const oldId of currentIds) {
        if (oldId !== categoryId) {
          await batchLinkProductsToCategoryWorkflow(req.scope).run({
            input: { id: oldId, remove: [productId] },
          })
        }
      }

      if (!currentIds.includes(categoryId)) {
        await batchLinkProductsToCategoryWorkflow(req.scope).run({
          input: { id: categoryId, add: [productId] },
        })
      }
    }

    // 9. Respuesta
    return res.json({
      success: true,
      accion: isUpdate ? "actualizado" : "creado",
      id_medusa: productId,
      estado_sincronizacion: "Sincronizada",
      ...(advertencia ? { advertencia } : {}),
      inventory: isUpdate
        ? { sin_cambios: true }
        : {
            managed: manageInventory,
            quantity: cantidadInventario,
            stock_location_id: stockLocationId ?? null,
          },
    })
  } catch (error: any) {
    console.error("[sharepoint/create-product]", error?.message ?? error)

    return res.status(500).json({
      success: false,
      estado_sincronizacion: "Error",
      error: error?.message ?? "No se pudo sincronizar el producto.",
    })
  }
}