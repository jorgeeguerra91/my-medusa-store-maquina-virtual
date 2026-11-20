"use client"

import { useState } from "react"

const getBackendUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:9000"
  }

  const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

  if (!url) {
    throw new Error("Falta configurar la URL pública del backend")
  }

  return url.replace(/\/+$/, "")
}

type QuoteItem = {
  title: string
  variant_id: string
  quantity: number
  unit_price: number
  sku?: string | null
  fromPdf?: boolean
  needsSelection?: boolean
}

type PdfProduct = {
  sku: string | null
  description: string
  product_title?: string | null
  quantity: number
  unit_price_usd: number
  subtotal_usd: number
  tax_usd: number
  total_usd: number
  variant_id?: string | null
}

export default function ComercialForm() {
  const [email, setEmail] = useState("")
  const [variantId, setVariantId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")
  const [productName, setProductName] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [items, setItems] = useState<QuoteItem[]>([])
  const [trm, setTrm] = useState("4000")
  const [impuesto, setImpuesto] = useState("0")
  const [expiresAt, setExpiresAt] = useState("")
  const [vigenciaDias, setVigenciaDias] = useState("5")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [analizandoPdf, setAnalizandoPdf] = useState(false)

  // Devuelve una fecha en formato AAAA-MM-DD,
  // compatible con el input type="date".
  function fechaDesdeDias(dias: string) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + Number(dias))

    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, "0")
    const day = String(fecha.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const subtotalUSD = items.reduce(
    (total, item) => total + item.unit_price * item.quantity,
    0
  )

  const subtotalCOP = subtotalUSD * Number(trm || 0)
  const totalUSD = subtotalUSD + Number(impuesto || 0)

  // =========================================================
  // ANALIZAR PDF
  // =========================================================

  async function analizarPDF() {
    if (!pdfFile) {
      setError("Seleccione primero un archivo PDF.")
      return
    }

    setAnalizandoPdf(true)
    setError("")
    setLink("")

try {
  const formData = new FormData()
  formData.append("file", pdfFile)

  const res = await fetch(
    `${getBackendUrl()}/store/quote-from-pdf`,
    {
      method: "POST",
      headers: {
        "x-publishable-api-key":
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
      },
      body: formData,
    }
  )

      const data = await res.json()

      if (!res.ok || data.success === false) {
        setError(
          data.message || "No fue posible analizar el PDF."
        )
        return
      }

      // =====================================================
      // CORREO DEL PDF
      // =====================================================

      const correoPdf = data.customer_email ?? data.email ?? null

      if (correoPdf) {
        setEmail(String(correoPdf).trim())
      } else {
        console.warn(
          "El backend no detectó un correo en el PDF."
        )
        setError(
          "PDF analizado, pero no se detectó un correo. Puede escribirlo manualmente."
        )
      }

      // =====================================================
      // TRM Y VIGENCIA
      // =====================================================

      setTrm(String(data.trm ?? 4000))

      const dias = String(data.vigencia_dias ?? 5)

      setVigenciaDias(dias)
      setExpiresAt(fechaDesdeDias(dias))

      // =====================================================
      // PRODUCTOS EXTRAÍDOS
      // =====================================================

      const productosPDF: PdfProduct[] =
        Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.productos)
            ? data.productos
            : []

      const impuestoTotalUSD = productosPDF.reduce(
        (total, producto) =>
          total + Number(producto.tax_usd || 0),
        0
      )

      setImpuesto(
        String(data.impuesto ?? impuestoTotalUSD)
      )

      const productosConvertidos: QuoteItem[] =
        productosPDF.map((producto) => ({
          // Se prioriza el nombre o descripción del PDF.
          title:
            producto.description ||
            producto.product_title ||
            "Producto sin descripción",

          variant_id: producto.variant_id || "",

          quantity: Number(producto.quantity) || 1,

          // Precio por unidad; la cantidad se multiplica
          // posteriormente en el resumen.
          unit_price: Number(producto.unit_price_usd) || 0,

          // Se conserva el SKU encontrado en el documento.
          sku: producto.sku || null,

          fromPdf: true,

          needsSelection: !producto.variant_id,
        }))

      setItems(productosConvertidos)

      if (!productosConvertidos.length) {
        setError(
          "El PDF fue analizado, pero no se encontraron productos."
        )
      }
    } catch (err) {
      console.error(err)
      setError(
        "No fue posible conectar con el servidor para analizar el PDF."
      )
    } finally {
      setAnalizandoPdf(false)
    }
  }

  // =========================================================
  // GENERAR COTIZACIÓN
  // =========================================================

  async function generar() {
    setLoading(true)
    setError("")
    setLink("")

    try {
      if (!email.trim()) {
        setError("Debe ingresar el correo del cliente.")
        return
      }

      if (!items.length) {
        setError("Debe agregar al menos un producto.")
        return
      }

      const productoPendiente = items.find(
        (item) => !item.variant_id
      )

      if (productoPendiente) {
        setError(
          `Debe seleccionar un producto de Medusa para "${productoPendiente.title}".`
        )
        return
      }

      if (!expiresAt) {
        setError("Debe seleccionar una fecha límite.")
        return
      }

      const trmNumerica = Number(trm)
      const impuestoNumerico = Number(impuesto)

      if (!trmNumerica || trmNumerica <= 0) {
        setError("La TRM debe ser mayor que 0.")
        return
      }

      if (
        Number.isNaN(impuestoNumerico) ||
        impuestoNumerico < 0
      ) {
        setError("El impuesto no puede ser negativo.")
        return
      }

      const [year, month, day] = expiresAt.split("-")

      const expirationDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59,
        999
      )

      if (Number.isNaN(expirationDate.getTime())) {
        setError(
          "La fecha límite seleccionada no es válida."
        )
        return
      }

      const res = await fetch(
        `${getBackendUrl()}/store/quote-cart-test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: JSON.stringify({
            email: email.trim(),

            items: items.map((item) => ({
              title: item.title,
              variant_id: item.variant_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),

            trm: trmNumerica,
            impuesto: impuestoNumerico,
            expires_at: expirationDate.toISOString(),
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        const mensajes: Record<string, string> = {
          "Customer not found":
            "No se encontró un cliente con ese correo.",

          "email is required":
            "El correo del cliente es obligatorio.",

          "TRM must be greater than 0":
            "La TRM debe ser mayor que 0.",

          "Impuesto cannot be negative":
            "El impuesto no puede ser negativo.",

          "La fecha límite es obligatoria":
            "Debe seleccionar una fecha límite.",

          "La fecha límite no es válida":
            "La fecha límite seleccionada no es válida.",

          "No region found":
            "No se encontró una región configurada.",
        }

        setError(
          mensajes[data.message] ||
            data.message ||
            "No fue posible generar el enlace. Verifique los datos e inténtelo nuevamente."
        )

        return
      }

      setLink(data.recovery_link)
    } catch (err) {
      console.error(err)
      setError("No fue posible conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // BUSCAR PRODUCTO MANUALMENTE
  // =========================================================

  async function buscarProducto(valor: string) {
    setProductName(valor)

    if (valor.trim().length < 2) {
      setProducts([])
      return
    }

    try {
      const res = await fetch(
        `${getBackendUrl()}/store/product-search?q=${encodeURIComponent(valor)}`,
        {
          headers: {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
        }
      )

      if (!res.ok) {
        setProducts([])
        return
      }

      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    }
  }

  // =========================================================
  // AGREGAR PRODUCTO MANUAL
  // =========================================================

  function agregarProducto() {
    if (!variantId) {
      alert("Seleccione un producto.")
      return
    }

    if (!price || Number(price) <= 0) {
      alert("Ingrese un precio válido.")
      return
    }

    if (!quantity || Number(quantity) < 1) {
      alert("Ingrese una cantidad válida.")
      return
    }

    setItems((prev) => [
      ...prev,
      {
        title: productName,
        variant_id: variantId,
        quantity: Number(quantity),
        unit_price: Number(price),
        fromPdf: false,
        needsSelection: false,
      },
    ])

    setProductName("")
    setVariantId("")
    setQuantity("1")
    setPrice("")
    setProducts([])
  }

  // =========================================================
  // ASOCIAR UN PRODUCTO DEL PDF CON MEDUSA
  // =========================================================

  function seleccionarProductoParaItem(
    index: number,
    product: any
  ) {
    const selectedVariantId =
      product.variants?.[0]?.id || ""

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,

              // Conserva el nombre original del PDF.
              title: item.fromPdf
                ? item.title
                : product.title,

              variant_id: selectedVariantId,
              needsSelection: !selectedVariantId,
            }
          : item
      )
    )
  }

  // =========================================================
  // MODIFICAR CANTIDAD
  // =========================================================

  function actualizarCantidad(index: number, valor: string) {
    const cantidad = Number(valor)

    if (!cantidad || cantidad < 1) {
      return
    }

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: cantidad }
          : item
      )
    )
  }

  // =========================================================
  // MODIFICAR PRECIO
  // =========================================================

  function actualizarPrecio(index: number, valor: string) {
    if (valor.trim() === "") {
      setItems((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, unit_price: 0 }
            : item
        )
      )
      return
    }

    const precio = Number(valor)

    if (Number.isNaN(precio) || precio < 0) {
      return
    }

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, unit_price: precio }
          : item
      )
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="bg-white rounded-xl shadow p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Generar enlace de cotización
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Puede cargar un PDF para completar automáticamente
          la información o llenar la cotización manualmente.
        </p>
      </div>

      {/* PDF */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <h3 className="font-semibold">
          Analizar cotización PDF
        </h3>

        <input
          type="file"
          accept="application/pdf"
          className="border rounded w-full p-2 bg-white"
          onChange={(e) => {
            const archivo = e.target.files?.[0] || null

            setPdfFile(archivo)
            setError("")
            setLink("")
          }}
        />

        <button
          type="button"
          onClick={analizarPDF}
          disabled={analizandoPdf || !pdfFile}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {analizandoPdf ? "Analizando PDF..." : "Analizar PDF"}
        </button>

        <p className="text-xs text-gray-500">
          El análisis solo llena el formulario. Nada se crea
          hasta presionar "Generar enlace".
        </p>
      </div>

      <div className="space-y-4">
        {/* TRM E IMPUESTO */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              TRM
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="border rounded w-full p-2"
              value={trm}
              onChange={(e) => setTrm(e.target.value)}
            />

            <p className="text-xs text-gray-500 mt-1">
              Valor de 1 USD en COP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Impuesto (USD)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="border rounded w-full p-2"
              value={impuesto}
              onChange={(e) => setImpuesto(e.target.value)}
            />
          </div>
        </div>

        {/* VIGENCIA */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Vigencia de la cotización (días)
          </label>

          <input
            type="number"
            min="1"
            max="365"
            className="border rounded w-full p-2"
            value={vigenciaDias}
            onChange={(e) => {
              const dias = e.target.value
              setVigenciaDias(dias)

              if (dias && Number(dias) >= 1) {
                setExpiresAt(fechaDesdeDias(dias))
              }
            }}
          />

          <p className="text-xs text-gray-500 mt-1">
            Se detecta desde el PDF cuando está disponible.
            Por defecto son 5 días.
          </p>
        </div>

        {/* FECHA LÍMITE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Fecha límite del enlace
          </label>

          <input
            type="date"
            className="border rounded w-full p-2"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={fechaDesdeDias("0")}
            required
          />

          <p className="text-xs text-gray-500 mt-1">
            El enlace dejará de estar disponible después de
            esta fecha.
          </p>
        </div>

        {/* CORREO */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Correo del cliente
          </label>

          <input
            type="email"
            className="border rounded w-full p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
          />

          <p className="text-xs text-gray-500 mt-1">
            Al analizar el PDF, el correo detectado se cargará
            aquí. Puede editarlo antes de generar el enlace.
          </p>
        </div>

        {/* PRODUCTO MANUAL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Agregar producto
          </label>

          <input
            type="text"
            className="border rounded w-full p-2"
            placeholder="Buscar producto..."
            value={productName}
            onChange={(e) => buscarProducto(e.target.value)}
          />

          {products.length > 0 && (
            <div className="border rounded mt-1 bg-white shadow">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setVariantId(
                      product.variants?.[0]?.id || ""
                    )
                    setProductName(product.title)
                    setProducts([])
                  }}
                >
                  {product.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CANTIDAD Y PRECIO MANUAL */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cantidad
            </label>

            <input
              type="number"
              min="1"
              className="border rounded w-full p-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Precio negociado (USD)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="border rounded w-full p-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        {/* AGREGAR PRODUCTO MANUAL */}
        <div>
          <button
            type="button"
            onClick={agregarProducto}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Agregar producto
          </button>
        </div>

        {/* PRODUCTOS DE LA COTIZACIÓN */}
        {items.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">
              Productos de la cotización
            </h3>

            {items.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.title}
                    </div>

                    {item.sku && (
                      <div className="text-xs text-gray-500 mt-1">
                        SKU: {item.sku}
                      </div>
                    )}

                    {item.needsSelection && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠ Seleccione el producto de Medusa antes
                        de generar el enlace.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Eliminar
                  </button>
                </div>

                {/* ASOCIAR PRODUCTO DEL PDF */}
                {item.needsSelection && (
                  <div>
                    <input
                      type="text"
                      className="border rounded w-full p-2"
                      placeholder="Buscar producto para asociarlo..."
                      onChange={(e) =>
                        buscarProducto(e.target.value)
                      }
                    />

                    {products.length > 0 && (
                      <div className="border rounded mt-1 bg-white shadow">
                        {products.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                            onClick={() => {
                              seleccionarProductoParaItem(
                                index,
                                product
                              )
                              setProducts([])
                              setProductName("")
                            }}
                          >
                            {product.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* EDITAR CANTIDAD Y PRECIO */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min="1"
                      className="border rounded w-full p-2"
                      value={item.quantity}
                      onChange={(e) =>
                        actualizarCantidad(index, e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Precio negociado (USD)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border rounded w-full p-2"
                      value={item.unit_price}
                      onChange={(e) =>
                        actualizarPrecio(index, e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Total producto: $
                  {(item.unit_price * item.quantity).toFixed(2)} USD
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESUMEN */}
        {items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal USD:</span>
              <span>${subtotalUSD.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between">
              <span>TRM:</span>
              <span>
                ${Number(trm || 0).toLocaleString("es-CO")}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Impuesto:</span>
              <span>
                $
                {Number(impuesto || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal COP:</span>
              <span>
                $
                {subtotalCOP.toLocaleString("es-CO", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>
                $
                {totalUSD.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div>
          </div>
        )}
      </div>

      {/* GENERAR ENLACE */}
      <button
        type="button"
        onClick={generar}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded"
      >
        {loading ? "Generando..." : "Generar enlace"}
      </button>

      {/* ERROR */}
      {error && (
        <div className="rounded bg-red-100 text-red-700 p-3">
          {error}
        </div>
      )}

      {/* ENLACE */}
      {link && (
        <div className="rounded bg-green-100 p-4 space-y-3">
          <p className="font-semibold text-green-700">
            ✔ Enlace generado correctamente
          </p>

          <input
            readOnly
            value={link}
            className="border rounded w-full p-2 bg-white"
          />

          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(link)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  )
}