import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { PDFParse } from "pdf-parse"

type PdfProduct = {
  sku: string | null
  description: string
  product_title: string | null
  quantity: number
  unit_price_usd: number
  subtotal_usd: number
  tax_usd: number
  total_usd: number
  variant_id: string | null
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("=== ANALIZAR COTIZACIÓN PDF ===")

    const archivo = (req as any).file

    if (!archivo) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo PDF.",
      })
    }

    // =====================================================
    // 1. EXTRAER TEXTO DEL PDF
    // =====================================================

    const parser = new PDFParse({
      data: archivo.buffer,
    })

    const resultado = await parser.getText()
    await parser.destroy()

    const texto = resultado.text

    const textoNormalizado = texto
      .replace(/\r/g, "")
      .trim()

    // =====================================================
    // 2. EXTRAER CORREO DEL PDF
    // =====================================================

    const emailMatch = textoNormalizado.match(
      /(?:E[\s-]?mail|correo(?:\s+electr[oó]nico)?)\s*:?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
    )

    const correoPdf = emailMatch?.[1]?.trim() ?? null

    console.log(
      "¿Se encontró correo en el PDF?:",
      Boolean(correoPdf)
    )

    // No buscamos el cliente en Medusa aquí.
    // Solo devolvemos el correo encontrado para llenar
    // el input del formulario en el frontend.

    // =====================================================
    // 3. DETECTAR VIGENCIA
    // =====================================================

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

    expirationDate.setHours(23, 59, 59, 999)

    // =====================================================
    // 4. LOCALIZAR SECCIÓN DE PRODUCTOS
    // =====================================================

    const inicioSeccion = textoNormalizado.match(
      /#PARTE\s+DESCRIPCIÓN/i
    )

    if (!inicioSeccion || inicioSeccion.index === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "No se encontró la sección de productos en el PDF.",
      })
    }

    const textoProductos = textoNormalizado.slice(
      inicioSeccion.index
    )

    // Formato de fila:
    // CANTIDAD + VALOR UNITARIO + SUBTOTAL + IMPUESTO + TOTAL
    const patronFilaPrecios =
      /(\d+)\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})\s+\$([\d.]+,\d{2})/g

    const productosExtraidos: Omit<
      PdfProduct,
      "product_title" | "variant_id"
    >[] = []

    let posicionAnterior = 0
    let matchPrecio: RegExpExecArray | null

    const convertirImporte = (valor: string) =>
      Number(
        valor
          .replace(/\./g, "")
          .replace(",", ".")
      )

    while (
      (matchPrecio =
        patronFilaPrecios.exec(textoProductos)) !== null
    ) {
      const bloque = textoProductos
        .slice(posicionAnterior, matchPrecio.index)
        .trim()

      const bloqueLimpio = bloque
        .replace(
          /^#PARTE\s+DESCRIPCIÓN[\s\S]*?\bTOTAL\b/i,
          ""
        )
        .trim()

      // Detectar SKU incluso cuando hay espacios o saltos
      // de línea alrededor del signo #.
      const skuMatch = bloqueLimpio.match(
        /\b[A-Z0-9-]+#\s*[A-Z0-9]+\b/i
      )

      let sku: string | null = null
      let descripcion = bloqueLimpio

      if (skuMatch) {
        sku = skuMatch[0]
          .replace(/\s+/g, "")
          .toUpperCase()

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

      descripcion = descripcion
        .replace(/\s+/g, " ")
        .trim()

      productosExtraidos.push({
        sku,
        description:
          descripcion || "Producto sin descripción",
        quantity: Number(matchPrecio[1]),
        unit_price_usd: convertirImporte(matchPrecio[2]),
        subtotal_usd: convertirImporte(matchPrecio[3]),
        tax_usd: convertirImporte(matchPrecio[4]),
        total_usd: convertirImporte(matchPrecio[5]),
      })

      posicionAnterior = patronFilaPrecios.lastIndex
    }

    console.log(
      "Cantidad de productos extraídos:",
      productosExtraidos.length
    )

    if (!productosExtraidos.length) {
      return res.status(400).json({
        success: false,
        message:
          "No se pudieron extraer productos del PDF. Verifique el formato de la tabla.",
      })
    }

    // =====================================================
    // 5. BUSCAR VARIANTES POR SKU
    // =====================================================

    const query = req.scope.resolve("query") as any

    const productosConVariante: PdfProduct[] = []

    for (const producto of productosExtraidos) {
      // Si no existe SKU, el usuario podrá asociar
      // manualmente el producto desde el formulario.
      if (!producto.sku) {
        productosConVariante.push({
          ...producto,
          product_title: null,
          variant_id: null,
        })

        continue
      }

      const { data: variantes } = await query.graph({
        entity: "product_variant",
        fields: [
          "id",
          "sku",
          "product_id",
        ],
        filters: {
          sku: producto.sku,
        },
      })

      const variante = variantes?.find(
        (item: any) =>
          item.sku?.trim().toUpperCase() ===
          producto.sku?.trim().toUpperCase()
      )

      // Que el SKU no coincida ya no detiene el análisis.
      // El producto permanece en el formulario para
      // que pueda asociarse manualmente.
      if (!variante) {
        productosConVariante.push({
          ...producto,
          product_title: null,
          variant_id: null,
        })

        continue
      }

      // Obtener el nombre del producto de Medusa.
      const { data: productosMedusa } = await query.graph({
        entity: "product",
        fields: ["id", "title"],
        filters: {
          id: variante.product_id,
        },
      })

      const productoMedusa = productosMedusa?.[0]

      productosConVariante.push({
        ...producto,
        product_title: productoMedusa?.title ?? null,
        variant_id: variante.id,
      })
    }

    // =====================================================
    // 6. SUMAR IMPUESTOS EXTRAÍDOS
    // =====================================================

    const impuestoTotalUSD = productosConVariante.reduce(
      (total, producto) =>
        total + Number(producto.tax_usd || 0),
      0
    )

    // =====================================================
    // 7. OBTENER TRM ACTUAL
    // =====================================================

    // Si el servicio de TRM falla, el análisis continúa
    // utilizando el valor predeterminado.
    let trm = 4000

    try {
      const trmResponse = await fetch(
        "https://www.datos.gov.co/resource/ceyp-9c7c.json?$limit=1&$order=vigenciadesde%20DESC"
      )

      if (trmResponse.ok) {
        const trmData = await trmResponse.json()
        const trmObtenida = Number(trmData?.[0]?.valor)

        if (trmObtenida > 0) {
          trm = trmObtenida
        }
      }
    } catch (error) {
      console.warn(
        "No se pudo consultar la TRM; se utilizará 4000."
      )
    }

    // =====================================================
    // 8. RESPONDER AL FRONTEND
    // =====================================================

    // IMPORTANTE:
    // Esta ruta únicamente analiza y devuelve los datos.
    // No busca al cliente, no crea carritos y no genera enlaces.

    return res.status(200).json({
      success: true,
      customer_email: correoPdf,
      products: productosConVariante,
      impuesto: impuestoTotalUSD,
      trm,
      vigencia_dias: vigenciaDias,
      expires_at: expirationDate.toISOString(),
    })
  } catch (error: any) {
    console.error(
      "Error analizando cotización PDF:",
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Ocurrió un error al analizar el PDF.",
    })
  }
}