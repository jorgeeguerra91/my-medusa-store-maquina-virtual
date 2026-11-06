
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"
import { timingSafeEqual } from "node:crypto"

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  return left.length === right.length && timingSafeEqual(left, right)
}

function authenticate(req: MedusaRequest): boolean {
  const expectedUser = process.env.SHAREPOINT_CATEGORIES_USER
  const expectedPassword = process.env.SHAREPOINT_CATEGORIES_PASSWORD
  const header = req.headers.authorization

  if (!expectedUser || !expectedPassword || !header?.startsWith("Basic ")) {
    return false
  }

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
    const separator = decoded.indexOf(":")

    if (separator < 0) return false

    return (
      safeEqual(decoded.slice(0, separator), expectedUser) &&
      safeEqual(decoded.slice(separator + 1), expectedPassword)
    )
  } catch {
    return false
  }
}

function makeHandle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseActive(value: unknown): boolean | null {
  if (typeof value === "boolean") return value

  if (typeof value === "number") {
    if (value === 1) return true
    if (value === 0) return false
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()

    if (["sí", "si", "yes", "true", "1", "activo", "activa"].includes(normalized)) {
      return true
    }

    if (["no", "false", "0", "inactivo", "inactiva"].includes(normalized)) {
      return false
    }
  }

  return null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (
    !process.env.SHAREPOINT_CATEGORIES_USER ||
    !process.env.SHAREPOINT_CATEGORIES_PASSWORD
  ) {
    return res.status(500).json({
      message: "Falta configurar la autenticación de sincronización.",
    })
  }

  if (!authenticate(req)) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="SharePoint Categories Sync"'
    )

    return res.status(401).json({ message: "No autorizado." })
  }

  const body = req.body as {
    nombre?: string
    descripcion?: string
    activo?: unknown
    id_medusa?: string
    sharepoint_item_id?: string | number
  }

  const name = body.nombre?.trim()
  const description = body.descripcion?.trim() ?? ""
  const active = parseActive(body.activo)
  const medusaId = body.id_medusa?.trim()
  const sharePointId =
    body.sharepoint_item_id != null
      ? String(body.sharepoint_item_id).trim()
      : ""

  if (!name || !makeHandle(name)) {
    return res.status(400).json({
      message: "El nombre de la categoría es obligatorio y debe ser válido.",
    })
  }

  if (active === null) {
    return res.status(400).json({
      message: "El campo activo debe ser Sí/No o true/false.",
    })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    let categoryId = medusaId || ""

    if (!categoryId && sharePointId) {
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id", "external_id"],
        filters: { external_id: sharePointId } as any,
      })

      categoryId = data[0]?.id ?? ""
    }

    if (!categoryId && !sharePointId) {
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id", "handle"],
        filters: { handle: makeHandle(name) },
      })

      categoryId = data[0]?.id ?? ""
    }

    const categoryData = {
      name,
      description,
      handle: makeHandle(name),
      is_active: active,
      is_internal: false,
      ...(sharePointId ? { external_id: sharePointId } : {}),
    }

    if (categoryId) {
      await updateProductCategoriesWorkflow(req.scope).run({
        input: {
          selector: { id: categoryId },
          update: categoryData,
        },
      })
    } else {
      const { result } = await createProductCategoriesWorkflow(
        req.scope
      ).run({
        input: {
          product_categories: [categoryData],
        },
      })

      categoryId = result[0].id
    }

    return res.status(200).json({
      success: true,
      id_medusa: categoryId,
      nombre: name,
      activo: active,
      estado_sincronizacion: "Sincronizada",
    })
  } catch (error) {
    console.error(
      "[sharepoint/sync-categories]",
      error instanceof Error ? error.message : "Error desconocido"
    )

    return res.status(500).json({
      success: false,
      estado_sincronizacion: "Error",
      message:
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar la categoría.",
    })
  }
}
