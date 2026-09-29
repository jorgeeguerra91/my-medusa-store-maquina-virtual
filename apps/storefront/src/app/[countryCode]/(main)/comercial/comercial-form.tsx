"use client"

import { useState } from "react"

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

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [analizandoPdf, setAnalizandoPdf] = useState(false)

  const subtotalUSD = items.reduce(
    (total, item) =>
      total + item.unit_price * item.quantity,
    0
  )

  const subtotalCOP =
    subtotalUSD * Number(trm)

const totalUSD = subtotalUSD + Number(impuesto)

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
        "http://localhost:9000/store/quote-from-pdf",
        {
          method: "POST",
          headers: {
            "x-publishable-api-key":
              process.env
                .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(
          data.message ||
            "No fue posible analizar el PDF."
        )
        return
      }

      // =====================================================
      // DATOS GENERALES
      // =====================================================

      if (data.customer_email) {
        setEmail(data.customer_email)
      } else if (data.email) {
        setEmail(data.email)
      }

      if (data.trm) {
        setTrm(String(data.trm))
      }

if (data.impuesto !== undefined) setImpuesto(String(data.impuesto))

      // =====================================================
      // FECHA DE VENCIMIENTO
      // =====================================================

      if (data.expires_at) {
        const fecha = new Date(data.expires_at)

        const year = fecha.getFullYear()
        const month = String(
          fecha.getMonth() + 1
        ).padStart(2, "0")
        const day = String(
          fecha.getDate()
        ).padStart(2, "0")

        setExpiresAt(
          `${year}-${month}-${day}`
        )
      }

      // =====================================================
      // PRODUCTOS DEL PDF
      // =====================================================

      const productosPDF: PdfProduct[] =
        Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.productos)
            ? data.productos
            : []

     const impuestoTotalUSD = productosPDF.reduce(
  (total, producto) => total + Number(producto.tax_usd || 0),
  0
)

setImpuesto(String(impuestoTotalUSD))

      const productosConvertidos: QuoteItem[] =
        productosPDF.map((producto) => ({
          title:
            producto.description ||
            "Producto sin descripción",

          variant_id:
            producto.variant_id || "",

          quantity:
            Number(producto.quantity) || 1,

          unit_price:
            Number(producto.total_usd) || 0,

          sku:
            producto.sku || null,

          fromPdf: true,

          needsSelection:
            !producto.variant_id,
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

    if (!email) {
      setError(
        "Debe ingresar el correo del cliente."
      )
      setLoading(false)
      return
    }

    if (!items.length) {
      setError(
        "Debe agregar al menos un producto."
      )
      setLoading(false)
      return
    }

    // Verificar productos que todavía no tienen variante
    const productoPendiente =
      items.find(
        (item) => !item.variant_id
      )

    if (productoPendiente) {
      setError(
        `Debe seleccionar un producto de Medusa para "${productoPendiente.title}".`
      )
      setLoading(false)
      return
    }

    if (!expiresAt) {
      setError(
        "Debe seleccionar una fecha límite."
      )
      setLoading(false)
      return
    }

    const trmNumerica = Number(trm)
    const impuestoNumerico =
      Number(impuesto)

    if (!trmNumerica || trmNumerica <= 0) {
      setError(
        "La TRM debe ser mayor que 0."
      )
      setLoading(false)
      return
    }

    if (
      Number.isNaN(impuestoNumerico) ||
      impuestoNumerico < 0
    ) {
      setError(
        "El impuesto no puede ser negativo."
      )
      setLoading(false)
      return
    }

    try {
      // Convertimos la fecha seleccionada
      // al final del día.
      const [year, month, day] =
        expiresAt.split("-")

      const expirationDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59,
        999
      )

      if (
        Number.isNaN(
          expirationDate.getTime()
        )
      ) {
        setError(
          "La fecha límite seleccionada no es válida."
        )
        setLoading(false)
        return
      }

      const res = await fetch(
        "http://localhost:9000/store/quote-cart-test",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            "x-publishable-api-key":
              process.env
                .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },

          body: JSON.stringify({
            email,

            items: items.map((item) => ({
              title: item.title,
              variant_id:
                item.variant_id,
              quantity:
                item.quantity,
              unit_price:
                item.unit_price,
            })),

            trm: trmNumerica,

            impuesto:
              impuestoNumerico,

            expires_at:
              expirationDate.toISOString(),
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        const mensajes: Record<
          string,
          string
        > = {
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
      } else {
        setLink(
          data.recovery_link
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        "No fue posible conectar con el servidor."
      )
    }

    setLoading(false)
  }

  // =========================================================
  // BUSCAR PRODUCTO MANUALMENTE
  // =========================================================

  async function buscarProducto(
    valor: string
  ) {
    setProductName(valor)

    if (valor.length < 2) {
      setProducts([])
      return
    }

    try {
      const res = await fetch(
        `http://localhost:9000/store/product-search?q=${encodeURIComponent(
          valor
        )}`,
        {
          headers: {
            "x-publishable-api-key":
              process.env
                .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
        }
      )

      const data = await res.json()

      setProducts(data)
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

    if (
      !quantity ||
      Number(quantity) < 1
    ) {
      alert(
        "Ingrese una cantidad válida."
      )
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
  // SELECCIONAR PRODUCTO PARA PRODUCTO DEL PDF
  // =========================================================

  function seleccionarProductoParaItem(
    index: number,
    product: any
  ) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              title: product.title,
              variant_id:
                product.variants?.[0]?.id ||
                "",
              needsSelection:
                !product.variants?.[0]?.id,
            }
          : item
      )
    )
  }

  // =========================================================
  // MODIFICAR CANTIDAD
  // =========================================================

  function actualizarCantidad(
    index: number,
    valor: string
  ) {
    const cantidad = Number(valor)

    if (!cantidad || cantidad < 1) {
      return
    }

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantity: cantidad,
            }
          : item
      )
    )
  }

  // =========================================================
  // MODIFICAR PRECIO
  // =========================================================

  function actualizarPrecio(
    index: number,
    valor: string
  ) {
    const precio = Number(valor)

    if (Number.isNaN(precio)) {
      return
    }

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              unit_price: precio,
            }
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
          Puede cargar un PDF para
          completar automáticamente la
          información o llenar la
          cotización manualmente.
        </p>
      </div>

      {/* =====================================================
          PDF
      ====================================================== */}

      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <h3 className="font-semibold">
          Analizar cotización PDF
        </h3>

        <input
          type="file"
          accept="application/pdf"
          className="border rounded w-full p-2 bg-white"
          onChange={(e) => {
            const archivo =
              e.target.files?.[0] || null

            setPdfFile(archivo)
            setError("")
            setLink("")
          }}
        />

        <button
          type="button"
          onClick={analizarPDF}
          disabled={
            analizandoPdf ||
            !pdfFile
          }
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {analizandoPdf
            ? "Analizando PDF..."
            : "Analizar PDF"}
        </button>

        <p className="text-xs text-gray-500">
          El análisis solo llena el
          formulario. Nada se crea hasta
          presionar "Generar enlace".
        </p>
      </div>

      <div className="space-y-4">
        {/* ===================================================
            TRM E IMPUESTO
        ==================================================== */}

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
              onChange={(e) =>
                setTrm(e.target.value)
              }
            />

            <p className="text-xs text-gray-500 mt-1">
              Valor de 1 USD en COP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Impuesto
            </label>

            <input
              type="number"
              min="0"
              max="100"
              className="border rounded w-full p-2"
              value={impuesto}
              onChange={(e) =>
                setImpuesto(e.target.value)
              }
            />
          </div>
        </div>

        {/* ===================================================
            FECHA
        ==================================================== */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Fecha límite del enlace
          </label>

          <input
            type="date"
            className="border rounded w-full p-2"
            value={expiresAt}
            onChange={(e) =>
              setExpiresAt(e.target.value)
            }
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
            required
          />

          <p className="text-xs text-gray-500 mt-1">
            El enlace dejará de estar
            disponible después de esta
            fecha.
          </p>
        </div>

        {/* ===================================================
            CORREO
        ==================================================== */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Correo del cliente
          </label>

          <input
            type="email"
            className="border rounded w-full p-2"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="cliente@empresa.com"
          />
        </div>

        {/* ===================================================
            PRODUCTO MANUAL
        ==================================================== */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Agregar producto
          </label>

          <input
            type="text"
            className="border rounded w-full p-2"
            placeholder="Buscar producto..."
            value={productName}
            onChange={(e) =>
              buscarProducto(
                e.target.value
              )
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
                    setVariantId(
                      product.variants?.[0]
                        ?.id || ""
                    )

                    setProductName(
                      product.title
                    )

                    setProducts([])
                  }}
                >
                  {product.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================
            CANTIDAD Y PRECIO MANUAL
        ==================================================== */}

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
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
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
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
            />
          </div>
        </div>

        {/* ===================================================
            AGREGAR MANUALMENTE
        ==================================================== */}

        <div>
          <button
            type="button"
            onClick={agregarProducto}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Agregar producto
          </button>
        </div>

        {/* ===================================================
            PRODUCTOS
        ==================================================== */}

        {items.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">
              Productos de la cotización
            </h3>

            {items.map(
              (item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* PRODUCTO */}

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
                          ⚠ Seleccione el
                          producto de
                          Medusa antes de
                          generar el enlace.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setItems(
                          (prev) =>
                            prev.filter(
                              (
                                _,
                                i
                              ) =>
                                i !== index
                            )
                        )
                      }
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* BUSCAR PRODUCTO PARA UNO
                      QUE VINO DEL PDF */}

                  {item.needsSelection && (
                    <div>
                      <input
                        type="text"
                        className="border rounded w-full p-2"
                        placeholder="Buscar producto para asociarlo..."
                        onChange={(e) =>
                          buscarProducto(
                            e.target.value
                          )
                        }
                      />

                      {products.length >
                        0 && (
                        <div className="border rounded mt-1 bg-white shadow">
                          {products.map(
                            (
                              product
                            ) => (
                              <button
                                key={
                                  product.id
                                }
                                type="button"
                                className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                                onClick={() => {
                                  seleccionarProductoParaItem(
                                    index,
                                    product
                                  )

                                  setProducts(
                                    []
                                  )
                                  setProductName(
                                    ""
                                  )
                                }}
                              >
                                {
                                  product.title
                                }
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CANTIDAD */}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Cantidad
                      </label>

                      <input
                        type="number"
                        min="1"
                        className="border rounded w-full p-2"
                        value={
                          item.quantity
                        }
                        onChange={(
                          e
                        ) =>
                          actualizarCantidad(
                            index,
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    {/* PRECIO */}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Precio negociado (USD)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded w-full p-2"
                        value={
                          item.unit_price
                        }
                        onChange={(
                          e
                        ) =>
                          actualizarPrecio(
                            index,
                            e.target
                              .value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Total producto: $
                    {(
                      item.unit_price *
                      item.quantity
                    ).toFixed(2)}{" "}
                    USD
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ===================================================
            RESUMEN
        ==================================================== */}

        {items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <span>
                Subtotal USD:
              </span>

              <span>
                $
                {subtotalUSD.toFixed(
                  2
                )}{" "}
                USD
              </span>
            </div>

            <div className="flex justify-between">
              <span>TRM:</span>

              <span>
                $
                {Number(
                  trm
                ).toLocaleString(
                  "es-CO"
                )}
              </span>
            </div>

            <div className="flex justify-between">
              
              <span>
                Impuesto:
              </span>
              
            

               <span>
                $
{Number(impuesto).toLocaleString(
  "en-US",
  {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Subtotal COP:
              </span>

  <span>
                $
                {subtotalCOP.toLocaleString(
                  "es-CO"
                )}
              </span>
             
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>

              <span>
                $
{(
  subtotalUSD + Number(impuesto)
).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          GENERAR
      ====================================================== */}

      <button
        type="button"
        onClick={generar}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded"
      >
        {loading
          ? "Generando..."
          : "Generar enlace"}
      </button>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded bg-red-100 text-red-700 p-3">
          {error}
        </div>
      )}

      {/* =====================================================
          ENLACE
      ====================================================== */}

      {link && (
        <div className="rounded bg-green-100 p-4 space-y-3">
          <p className="font-semibold text-green-700">
            ✔ Enlace generado
            correctamente
          </p>

          <input
            readOnly
            value={link}
            className="border rounded w-full p-2 bg-white"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                link
              )
            }
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  )
}