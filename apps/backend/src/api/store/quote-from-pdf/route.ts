import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  createCartWorkflow,
  addToCartWorkflow,
} from "@medusajs/medusa/core-flows"

import { PDFParse } from "pdf-parse"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("=== COTIZACIÓN DESDE PDF ===")

    const archivo = (req as any).file

    if (!archivo) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo PDF.",
      })
    }

    // =========================================
    // 1. EXTRAER TEXTO DEL PDF
    // =========================================

    const parser = new PDFParse({
      data: archivo.buffer,
    })

    const resultado = await parser.getText()

    await parser.destroy()

    const texto = resultado.text

    const textoNormalizado = texto
      .replace(/\r/g, "")
      .trim()

console.log("=== TEXTO EXTRAÍDO DEL PDF ===")
console.log(JSON.stringify(texto))
console.log("=== TEXTO NORMALIZADO ===")
console.log(JSON.stringify(textoNormalizado))
console.log("=== FIN DEL TEXTO ===")

    // =========================================
    // 2. CORREO
    // =========================================

    const emailMatch = textoNormalizado.match(
      /E-mail:\s*([^\s]+)/i
    )

    const email = emailMatch?.[1]?.trim()

   /* if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "No se encontró el correo del cliente en el PDF.",
      })
    }*/

    console.log("EMAIL:", email)

    // =========================================
    // 3. VIGENCIA
    // =========================================

    const vigenciaMatch = textoNormalizado.match(
      /Validez de la oferta:\s*(\d+)\s*d[ií]as?/i
    )

    const vigenciaDias = vigenciaMatch
      ? Number(vigenciaMatch[1])
      : 5

    const expirationDate = new Date()

    expirationDate.setDate(
      expirationDate.getDate() + vigenciaDias
    )

    console.log(
      "VIGENCIA:",
      vigenciaDias,
      "días"
    )

// 4. EXTRAER PRODUCTOS
// La fila de precios marca el final de cada producto.
// No dependemos de que exista SKU.

const inicioProductos = textoNormalizado.indexOf(
  "#PARTE DESCRIPCIÓN"
)

if (inicioProductos === -1) {
  return res.status(400).json({
    success: false,
    message:
      "No se encontró la sección de productos en el PDF.",
  })
}

const textoProductos =
  textoNormalizado.slice(inicioProductos)

// Fila final de cada producto:
// CANT. + VALOR UND. + SUBTOTAL + IMPUESTOS + TOTAL
const patronFilaPrecios =
  /(\d+)\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})/g

const productos: any[] = []

let posicionAnterior = 0
let matchPrecio: RegExpExecArray | null

while (
  (matchPrecio =
    patronFilaPrecios.exec(textoProductos)) !== null
) {
  const bloque =
    textoProductos
      .slice(posicionAnterior, matchPrecio.index)
      .trim()

  // Si todavía estamos en el encabezado, lo quitamos
  const bloqueLimpio = bloque
    .replace(
      /^#PARTE DESCRIPCIÓN CANT\. VALOR UND\. SUBTOTAL IMPUESTOS TOTAL\s*/i,
      ""
    )
    .trim()

  // Buscar SKU dentro del bloque.
  // También permite que el PDF lo separe con un salto de línea:
  // D5BK2LT#
  // ABM
const skuMatch = bloqueLimpio.match(
  /\b[A-Z0-9-]+#\s*[A-Z0-9]+\b/i
)

  let sku: string | null = null
  let descripcion = bloqueLimpio

  if (skuMatch) {
    // Quitamos espacios/saltos de línea del SKU
    sku = skuMatch[0]
      .replace(/\s+/g, "")
      .toUpperCase()

    // Eliminamos el SKU de la descripción
    const partesSku = sku.split("#")

const skuRegex = new RegExp(
  `${partesSku[0]}#\\s*${partesSku[1]}`,
  "gi"
)

    descripcion = descripcion.replace(
      skuRegex,
      ""
    )
  }

  // Limpiar espacios y saltos de línea
  descripcion = descripcion
    .replace(/\s+/g, " ")
    .trim()

const convertir = (valor: string) =>
  Number(
    valor
      .replace(/\./g, "")
      .replace(",", ".")
  )

  productos.push({
    sku,
    description: descripcion,
    quantity: Number(matchPrecio[1]),
    unit_price_usd: convertir(matchPrecio[2]),
    subtotal_usd: convertir(matchPrecio[3]),
    tax_usd: convertir(matchPrecio[4]),
    total_usd: convertir(matchPrecio[5]),
  })

  // La próxima búsqueda comienza después
  // de la fila de precios actual
  posicionAnterior =
    patronFilaPrecios.lastIndex
}

console.log(
  "=== PRODUCTOS EXTRAÍDOS ==="
)
console.log(
  JSON.stringify(productos, null, 2)
)

if (!productos.length) {
  return res.status(400).json({
    success: false,
    message:
      "No se pudieron extraer productos del PDF.",
  })
}

// 5. BUSCAR VARIANTES POR SKU
const query = req.scope.resolve("query")

const productosConVariante: any[] = []

for (const producto of productos) {
  // Si no tiene SKU, todavía no intentamos
  // buscarlo por variante.
  if (!producto.sku) {
    productosConVariante.push({
      ...producto,
      variant_id: null,
    })

    continue
  }

  const { data: variants } =
    await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "sku",
        "title",
        "product_id",
      ],
      filters: {
        sku: producto.sku,
      },
    })

  const variante =
    variants?.find(
      (variant: any) =>
        variant.sku
          ?.trim()
          .toUpperCase() ===
        producto.sku
          .trim()
          .toUpperCase()
    )

  if (!variante) {
    throw new Error(
      `No se encontró el SKU ${producto.sku} en Medusa.`
    )
  }

  productosConVariante.push({
    ...producto,
    variant_id: variante.id,
  })
}

console.log(
  "=== PRODUCTOS CON VARIANTE ==="
)
console.log(
  JSON.stringify(
    productosConVariante,
    null,
    2
  )
)
    // =========================================
    // 8. OBTENER TRM ACTUAL
    // =========================================

    const trmResponse = await fetch(
      "https://www.datos.gov.co/resource/ceyp-9c7c.json?$limit=1&$order=vigenciadesde%20DESC"
    )

    if (!trmResponse.ok) {
      throw new Error(
        "No fue posible obtener la TRM actual."
      )
    }

    const trmData =
      await trmResponse.json()

    const trm =
      Number(trmData?.[0]?.valor)

    if (!trm || trm <= 0) {
      throw new Error(
        "La TRM obtenida no es válida."
      )
    }

    console.log("TRM:", trm)

    // =========================================
    // 9. BUSCAR CUSTOMER
    // =========================================

    const { data: customers } =
      await query.graph({
        entity: "customer",
        fields: [
          "id",
          "email",
        ],
        filters: {
          email,
        },
      })

    const customer =
      customers?.[0]

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          `No existe un cliente en Medusa con el correo ${email}.`,
      })
    }

    // =========================================
    // 10. REGIÓN
    // =========================================

    const { data: regions } =
      await query.graph({
        entity: "region",
        fields: [
          "id",
          "name",
        ],
      })

    const region =
      regions?.[0]

    if (!region) {
      return res.status(404).json({
        success: false,
        message:
          "No existe ninguna región configurada.",
      })
    }

    // =========================================
    // 11. PRECIO FINAL EN COP
    // =========================================

const items =
  productosConVariante
    .filter((producto) => producto.variant_id)
    .map((producto) => ({
      variant_id: producto.variant_id,
      quantity: producto.quantity,
      unit_price: Math.round(
        producto.total_usd * trm
      ),
    }))

    // =========================================
    // 12. CREAR CARRITO
    // =========================================

    const { result: cart } =
      await createCartWorkflow(
        req.scope
      ).run({
        input: {
          customer_id:
            customer.id,

          region_id:
            region.id,

          items: [],

          metadata: {
            quote_source:
              "pdf",

            quote_trm:
              trm,

            quote_validity_days:
              vigenciaDias,

            quote_expires_at:
              expirationDate.toISOString(),

            quote_email:
              email,
          },
        },
      })

    // =========================================
    // 13. AGREGAR PRODUCTOS
    // =========================================

    await addToCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id:
          cart.id,

        items,
      },
    })

    // =========================================
    // 14. LINK
    // =========================================

    const recoveryLink =
      `http://localhost:8000/cart/recover/${cart.id}`

    console.log(
      "=== COTIZACIÓN GENERADA ==="
    )

    console.log(
      "CART:",
      cart.id
    )

    console.log(
      "TRM:",
      trm
    )

    console.log(
      "LINK:",
      recoveryLink
    )

    console.log(
      "EXPIRA:",
      expirationDate.toISOString()
    )

    return res.json({
      success: true,

      customer_email:
        customer.email,

      cart_id:
        cart.id,

      recovery_link:
        recoveryLink,

      trm,

      expires_at:
        expirationDate.toISOString(),

      products:
        productosConVariante,
    })
  } catch (error: any) {
    console.error(
      "=== ERROR ==="
    )

    console.error(error)

    return res.status(500).json({
      success: false,
      message:
        error.message,
    })
  }
}