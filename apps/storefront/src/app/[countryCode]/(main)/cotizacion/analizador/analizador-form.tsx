"use client"

import { useState } from "react"

type PdfProduct = {
  sku?: string | null
  description?: string | null
  quantity?: number
  variant_id?: string | null
}

type SearchProduct = {
  id: string
  title: string
  variants?: {
    id: string
    sku?: string | null
  }[]
}

type AnalyzerItem = {
  title: string
  sku: string | null
  quantity: number
  variant_id: string
  unit_price: number | null
  fromPdf: boolean
}

type Props = {
  customerEmail?: string
}

export default function AnalizadorForm({
  customerEmail,
}: Props) {
  const [pdfFile, setPdfFile] =
    useState<File | null>(null)

  const [items, setItems] =
    useState<AnalyzerItem[]>([])

  const [loading, setLoading] =
    useState(false)

  const [generating, setGenerating] =
    useState(false)

  const [error, setError] =
    useState("")

  const [link, setLink] =
    useState("")

  // =========================================================
  // BUSCADORES DE PRODUCTOS DEL PDF
  // =========================================================

  const [searchText, setSearchText] =
    useState<Record<number, string>>({})

  const [searchResults, setSearchResults] =
    useState<Record<number, SearchProduct[]>>({})

  const [searching, setSearching] =
    useState<Record<number, boolean>>({})

  const [priceLoading, setPriceLoading] =
    useState<Record<number, boolean>>({})

  // =========================================================
  // AGREGAR PRODUCTO MANUALMENTE
  // =========================================================

  const [manualProductName, setManualProductName] =
    useState("")

  const [manualVariantId, setManualVariantId] =
    useState("")

  const [manualPrice, setManualPrice] =
    useState<number | null>(null)

  const [manualQuantity, setManualQuantity] =
    useState("1")

  const [manualProducts, setManualProducts] =
    useState<SearchProduct[]>([])

  const [searchingManual, setSearchingManual] =
    useState(false)

  const [loadingManualPrice, setLoadingManualPrice] =
    useState(false)

  // =========================================================
  // OBTENER REGIÓN COP
  // =========================================================

  async function obtenerRegionCOP() {
    const res = await fetch(
      "http://localhost:9000/store/regions",
      {
        headers: {
          "x-publishable-api-key":
            process.env
              .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
        },
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(
        data.message ||
          "No fue posible obtener las regiones."
      )
    }

    const region =
      data.regions?.find(
        (item: {
          id: string
          currency_code: string
        }) =>
          item.currency_code?.toLowerCase() ===
          "cop"
      )

    if (!region) {
      throw new Error(
        "No se encontró una región configurada en COP."
      )
    }

    return region
  }

  // =========================================================
  // OBTENER PRECIO DE MEDUSA
  // =========================================================

  async function obtenerPrecioMedusa(
    variantId: string
  ) {
    const region =
      await obtenerRegionCOP()

    const res = await fetch(
      `http://localhost:9000/store/product-variants/${variantId}?region_id=${encodeURIComponent(
        region.id
      )}&fields=*calculated_price`,
      {
        headers: {
          "x-publishable-api-key":
            process.env
              .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
        },
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(
        data.message ||
          "No fue posible obtener el precio del producto."
      )
    }

    const amount =
      Number(
        data.variant?.calculated_price
          ?.calculated_amount
      )

    if (Number.isNaN(amount)) {
      throw new Error(
        "El producto no tiene un precio disponible en COP."
      )
    }

    return amount
  }

  // =========================================================
  // ANALIZAR PDF
  // =========================================================

  async function analizarPDF() {
    if (!pdfFile) {
      setError(
        "Seleccione primero un archivo PDF."
      )
      return
    }

    setLoading(true)
    setError("")
    setLink("")
    setItems([])
    setSearchText({})
    setSearchResults({})

    try {
      const formData = new FormData()

      formData.append(
        "file",
        pdfFile
      )

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

      const productosPDF: PdfProduct[] =
        Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.productos)
            ? data.productos
            : []

      // =====================================================
      // EL PDF SOLO APORTA:
      // - descripción
      // - SKU
      // - cantidad
      // - posible variant_id
      //
      // NO usamos precios del PDF.
      // =====================================================

      const productosIniciales:
        AnalyzerItem[] =
        productosPDF.map(
          (producto) => ({
            title:
              producto.description?.trim() ||
              "Producto sin descripción",

            sku:
              producto.sku ||
              null,

            quantity:
              Number(
                producto.quantity
              ) || 1,

            variant_id:
              producto.variant_id ||
              "",

            unit_price:
              null,

            fromPdf:
              true,
          })
        )

      setItems(
        productosIniciales
      )

      // =====================================================
      // PRODUCTOS QUE YA TRAEN VARIANT ID
      // OBTIENEN EL PRECIO DESDE MEDUSA
      // =====================================================

      const productosConPrecio =
        await Promise.all(
          productosIniciales.map(
            async (item) => {
              if (!item.variant_id) {
                return item
              }

              try {
                const precio =
                  await obtenerPrecioMedusa(
                    item.variant_id
                  )

                return {
                  ...item,
                  unit_price:
                    precio,
                }
              } catch {
                return {
                  ...item,
                  variant_id:
                    "",
                  unit_price:
                    null,
                }
              }
            }
          )
        )

      setItems(
        productosConPrecio
      )

      if (
        !productosConPrecio.length
      ) {
        setError(
          "El PDF fue analizado, pero no se encontraron productos."
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible analizar el PDF."
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // BUSCAR PRODUCTO
  // =========================================================

  async function buscarProducto(
    index: number,
    valor: string
  ) {
    setSearchText(
      (prev) => ({
        ...prev,
        [index]:
          valor,
      })
    )

    if (
      valor.trim().length < 2
    ) {
      setSearchResults(
        (prev) => ({
          ...prev,
          [index]: [],
        })
      )

      return
    }

    setSearching(
      (prev) => ({
        ...prev,
        [index]: true,
      })
    )

    try {
      const res =
        await fetch(
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

      const data =
        await res.json()

      if (!res.ok) {
        console.error(
          "product-search error:",
          data
        )

        setSearchResults(
          (prev) => ({
            ...prev,
            [index]: [],
          })
        )

        return
      }

      const resultados =
        Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : Array.isArray(data.data)
              ? data.data
              : []

      setSearchResults(
        (prev) => ({
          ...prev,
          [index]:
            resultados,
        })
      )
    } catch (err) {
      console.error(
        "Error buscando producto:",
        err
      )

      setSearchResults(
        (prev) => ({
          ...prev,
          [index]: [],
        })
      )
    } finally {
      setSearching(
        (prev) => ({
          ...prev,
          [index]: false,
        })
      )
    }
  }

  // =========================================================
  // SELECCIONAR PRODUCTO DEL PDF
  // =========================================================

  async function seleccionarProducto(
    index: number,
    product: SearchProduct
  ) {
    const variantId =
      product.variants?.[0]?.id ||
      ""

    if (!variantId) {
      setError(
        "El producto seleccionado no tiene una variante disponible."
      )

      return
    }

    setError("")

    setSearchResults(
      (prev) => ({
        ...prev,
        [index]: [],
      })
    )

    setSearchText(
      (prev) => ({
        ...prev,
        [index]:
          product.title,
      })
    )

    setItems(
      (prev) =>
        prev.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? {
                  ...item,
                  title:
                    product.title,
                  variant_id:
                    variantId,
                  unit_price:
                    null,
                }
              : item
        )
    )

    setPriceLoading(
      (prev) => ({
        ...prev,
        [index]: true,
      })
    )

    try {
      const precio =
        await obtenerPrecioMedusa(
          variantId
        )

      setItems(
        (prev) =>
          prev.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...item,
                    title:
                      product.title,
                    variant_id:
                      variantId,
                    unit_price:
                      precio,
                  }
                : item
          )
      )
    } catch (err) {
      setItems(
        (prev) =>
          prev.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...item,
                    variant_id:
                      "",
                    unit_price:
                      null,
                  }
                : item
          )
      )

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible obtener el precio."
      )
    } finally {
      setPriceLoading(
        (prev) => ({
          ...prev,
          [index]: false,
        })
      )
    }
  }

  // =========================================================
  // BUSCAR PRODUCTO MANUAL
  // =========================================================

  async function buscarProductoManual(
    valor: string
  ) {
    setManualProductName(
      valor
    )

    setManualVariantId("")
    setManualPrice(null)

    if (
      valor.trim().length < 2
    ) {
      setManualProducts([])
      return
    }

    setSearchingManual(
      true
    )

    try {
      const res =
        await fetch(
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

      const data =
        await res.json()

      if (!res.ok) {
        console.error(
          "product-search error:",
          data
        )

        setManualProducts([])
        return
      }

      const resultados =
        Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : Array.isArray(data.data)
              ? data.data
              : []

      setManualProducts(
        resultados
      )
    } catch (err) {
      console.error(
        "Error buscando producto manual:",
        err
      )

      setManualProducts([])
    } finally {
      setSearchingManual(
        false
      )
    }
  }

  // =========================================================
  // SELECCIONAR PRODUCTO MANUAL
  // =========================================================

  async function seleccionarProductoManual(
    product: SearchProduct
  ) {
    const variantId =
      product.variants?.[0]?.id ||
      ""

    if (!variantId) {
      setError(
        "El producto seleccionado no tiene una variante disponible."
      )

      return
    }

    setManualProductName(
      product.title
    )

    setManualVariantId(
      variantId
    )

    setManualProducts([])
    setManualPrice(null)
    setError("")
    setLoadingManualPrice(
      true
    )

    try {
      const precio =
        await obtenerPrecioMedusa(
          variantId
        )

      setManualPrice(
        precio
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible obtener el precio."
      )
    } finally {
      setLoadingManualPrice(
        false
      )
    }
  }

  // =========================================================
  // AGREGAR PRODUCTO MANUAL
  // =========================================================

  function agregarProducto() {
    const quantity =
      Number(
        manualQuantity
      )

    if (!manualVariantId) {
      setError(
        "Seleccione un producto de Medusa."
      )

      return
    }

    if (
      manualPrice ===
      null
    ) {
      setError(
        "El producto todavía no tiene un precio disponible."
      )

      return
    }

    if (
      !quantity ||
      quantity < 1
    ) {
      setError(
        "Ingrese una cantidad válida."
      )

      return
    }

    setItems(
      (prev) => [
        ...prev,
        {
          title:
            manualProductName,

          sku:
            null,

          quantity,

          variant_id:
            manualVariantId,

          unit_price:
            manualPrice,

          fromPdf:
            false,
        },
      ]
    )

    setManualProductName("")
    setManualVariantId("")
    setManualPrice(null)
    setManualQuantity("1")
    setManualProducts([])
    setError("")
  }

  // =========================================================
  // CAMBIAR CANTIDAD
  // =========================================================

  function actualizarCantidad(
    index: number,
    valor: string
  ) {
    const cantidad =
      Number(valor)

    if (
      !cantidad ||
      cantidad < 1
    ) {
      return
    }

    setItems(
      (prev) =>
        prev.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? {
                  ...item,
                  quantity:
                    cantidad,
                }
              : item
        )
    )
  }

  // =========================================================
  // TOTAL
  // =========================================================

  const totalCOP =
    items.reduce(
      (
        total,
        item
      ) => {
        if (
          !item.variant_id ||
          item.unit_price ===
            null
        ) {
          return total
        }

        return (
          total +
          item.unit_price *
            item.quantity
        )
      },
      0
    )

  // =========================================================
  // GENERAR CARRITO
  // =========================================================

  async function generarEnlace() {
    setGenerating(true)
    setError("")
    setLink("")

    if (!customerEmail) {
      setError(
        "No se encontró el correo de la sesión de Medusa."
      )

      setGenerating(false)
      return
    }

    if (!items.length) {
      setError(
        "Debe analizar un PDF o agregar un producto."
      )

      setGenerating(false)
      return
    }

    // =====================================================
    // TODOS LOS PRODUCTOS DEBEN ESTAR IDENTIFICADOS
    // =====================================================

    const productoPendiente =
      items.find(
        (item) =>
          !item.variant_id
      )

    if (productoPendiente) {
      setError(
        `Debe identificar el producto "${productoPendiente.title}" antes de generar el carrito.`
      )

      setGenerating(false)
      return
    }

    // =====================================================
    // TODOS DEBEN TENER PRECIO
    // =====================================================

    const precioPendiente =
      items.find(
        (item) =>
          item.unit_price ===
          null
      )

    if (precioPendiente) {
      setError(
        `No se pudo obtener el precio de "${precioPendiente.title}" desde Medusa.`
      )

      setGenerating(false)
      return
    }

    try {
      // Mantener compatibilidad
      // con quote-cart-test.
      const trm = 1
      const impuesto = 0

      const expirationDate =
        new Date()

      expirationDate.setFullYear(
        expirationDate.getFullYear() +
          1
      )

      const res =
        await fetch(
          "http://localhost:9000/store/quote-cart-test",
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              "x-publishable-api-key":
                process.env
                  .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },

            body:
              JSON.stringify({
                // Este correo es el de
                // la sesión actual.
                email:
                  customerEmail,

                items:
                  items.map(
                    (item) => ({
                      title:
                        item.title,

                      variant_id:
                        item.variant_id,

                      quantity:
                        item.quantity,

                      unit_price:
                        item.unit_price,
                    })
                  ),

                trm,

                impuesto,

                expires_at:
                  expirationDate.toISOString(),
              }),
          }
        )

      const data =
        await res.json()

      if (!res.ok) {
        setError(
          data.message ||
            "No fue posible generar el carrito."
        )

        return
      }

      setLink(
        data.recovery_link
      )
    } catch (err) {
      console.error(err)

      setError(
        "No fue posible conectar con el servidor."
      )
    } finally {
      setGenerating(false)
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          CORREO DE SESIÓN
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border p-6">

        <label className="block text-sm font-medium mb-1">
          Correo
        </label>

        <input
          type="email"
          value={
            customerEmail || ""
          }
          readOnly
          className="border rounded-lg w-full p-3 bg-gray-50 text-gray-600"
        />

        <p className="text-xs text-gray-500 mt-1">
          Se utiliza el correo de la sesión
          actual de Medusa.
        </p>

      </div>

      {/* =====================================================
          ANALIZAR PDF
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">

        <div>
          <h2 className="text-xl font-semibold">
            Analizar cotización
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Cargue una cotización en PDF
            para identificar los productos.
          </p>
        </div>

        <input
          type="file"
          accept="application/pdf"
          className="border rounded-lg w-full p-3 bg-white"
          onChange={(e) => {
            setPdfFile(
              e.target.files?.[0] ||
                null
            )

            setItems([])
            setSearchText({})
            setSearchResults({})
            setLink("")
            setError("")
          }}
        />

        <button
          type="button"
          onClick={
            analizarPDF
          }
          disabled={
            loading ||
            !pdfFile
          }
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          {loading
            ? "Analizando..."
            : "Analizar PDF"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">
          {error}
        </div>
      )}

      {/* =====================================================
          PRODUCTOS
      ====================================================== */}

      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          <div>
            <h2 className="text-xl font-semibold">
              Productos
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Los precios corresponden a
              los precios actuales de Medusa.
            </p>
          </div>

          {items.map(
            (item, index) => (
              <div
                key={index}
                className="border rounded-xl p-5 space-y-4"
              >

                {/* INFORMACIÓN */}

                <div className="flex justify-between gap-4">

                  <div>

                    <div className="font-semibold">
                      {item.title}
                    </div>

                    {item.sku && (
                      <div className="text-xs text-gray-500 mt-1">
                        SKU: {item.sku}
                      </div>
                    )}

                    {item.variant_id ? (
                      <div className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Identificado en Medusa
                      </div>
                    ) : (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠ Pendiente de identificar
                      </div>
                    )}

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setItems(
                        (prev) =>
                          prev.filter(
                            (_, i) =>
                              i !== index
                          )
                      )
                    }
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Eliminar
                  </button>

                </div>

                {/* BUSCADOR */}

                {!item.variant_id && (
                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Buscar producto en Medusa
                    </label>

                    <input
                      type="text"
                      value={
                        searchText[
                          index
                        ] || ""
                      }
                      onChange={(e) =>
                        buscarProducto(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Buscar producto..."
                      className="border rounded-lg w-full p-3"
                    />

                    {searching[
                      index
                    ] && (
                      <p className="text-xs text-gray-500 mt-1">
                        Buscando...
                      </p>
                    )}

                    {(
                      searchResults[
                        index
                      ] || []
                    ).length > 0 && (
                      <div className="border rounded-lg mt-1 bg-white shadow overflow-hidden">

                        {searchResults[
                          index
                        ].map(
                          (product) => (
                            <button
                              key={
                                product.id
                              }
                              type="button"
                              onClick={() =>
                                seleccionarProducto(
                                  index,
                                  product
                                )
                              }
                              className="block w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
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

                {/* CANTIDAD Y PRECIO */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        actualizarCantidad(
                          index,
                          e.target.value
                        )
                      }
                      className="border rounded-lg w-full p-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Precio
                    </label>

                    <div className="border rounded-lg w-full p-3 bg-gray-50">

                      {priceLoading[
                        index
                      ] ? (
                        <span className="text-gray-400">
                          Consultando precio...
                        </span>
                      ) : item.unit_price !==
                        null ? (
                        <span className="font-medium">
                          $
                          {item.unit_price.toLocaleString(
                            "es-CO"
                          )}{" "}
                          COP
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          Sin precio
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* TOTAL */}

                {item.variant_id &&
                  item.unit_price !==
                    null && (
                    <div className="border-t pt-3 text-sm text-gray-500">
                      Total producto: $
                      {(
                        item.unit_price *
                        item.quantity
                      ).toLocaleString(
                        "es-CO"
                      )}{" "}
                      COP
                    </div>
                  )}

                {!item.variant_id && (
                  <div className="border-t pt-3 text-sm text-orange-600">
                    Este producto no se incluye
                    en el total hasta que sea
                    identificado en Medusa.
                  </div>
                )}

              </div>
            )
          )}

        </div>
      )}

      {/* =====================================================
          AGREGAR PRODUCTO
      ====================================================== */}

      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          <div>
            <h2 className="text-xl font-semibold">
              Agregar producto
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Agregue otro producto directamente
              desde Medusa.
            </p>
          </div>

          <div>

            <label className="block text-sm font-medium mb-1">
              Buscar producto
            </label>

            <input
              type="text"
              value={
                manualProductName
              }
              onChange={(e) =>
                buscarProductoManual(
                  e.target.value
                )
              }
              placeholder="Buscar producto..."
              className="border rounded-lg w-full p-3"
            />

            {searchingManual && (
              <p className="text-xs text-gray-500 mt-1">
                Buscando...
              </p>
            )}

            {manualProducts.length >
              0 && (
              <div className="border rounded-lg mt-1 bg-white shadow overflow-hidden">

                {manualProducts.map(
                  (product) => (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      onClick={() =>
                        seleccionarProductoManual(
                          product
                        )
                      }
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
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

          {manualVariantId && (
            <div className="rounded-lg bg-gray-50 border p-4">

              <div className="font-medium">
                {
                  manualProductName
                }
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Precio de Medusa:
              </div>

              <div className="font-semibold mt-1">

                {loadingManualPrice ? (
                  <span className="text-gray-400">
                    Consultando precio...
                  </span>
                ) : manualPrice !==
                  null ? (
                  <>
                    $
                    {manualPrice.toLocaleString(
                      "es-CO"
                    )}{" "}
                    COP
                  </>
                ) : (
                  <span className="text-red-600">
                    Precio no disponible
                  </span>
                )}

              </div>

            </div>
          )}

          <div>

            <label className="block text-sm font-medium mb-1">
              Cantidad
            </label>

            <input
              type="number"
              min="1"
              value={
                manualQuantity
              }
              onChange={(e) =>
                setManualQuantity(
                  e.target.value
                )
              }
              className="border rounded-lg w-full p-3"
            />

          </div>

          <button
            type="button"
            onClick={
              agregarProducto
            }
            disabled={
              loadingManualPrice ||
              !manualVariantId ||
              manualPrice ===
                null
            }
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium"
          >
            Agregar al carrito
          </button>

        </div>
      )}

      {/* =====================================================
          TOTAL / GENERAR
      ====================================================== */}

      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          <div className="flex justify-between text-lg">

            <span className="font-semibold">
              Total
            </span>

            <span className="font-bold">
              $
              {totalCOP.toLocaleString(
                "es-CO"
              )}{" "}
              COP
            </span>

          </div>

          <button
            type="button"
            onClick={
              generarEnlace
            }
            disabled={
              generating
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {generating
              ? "Generando carrito..."
              : "Generar carrito"}
          </button>

        </div>
      )}

      {/* =====================================================
          ENLACE
      ====================================================== */}

      {link && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-3">

          <p className="font-semibold text-green-700">
            ✓ Carrito generado correctamente
          </p>

          <input
            readOnly
            value={link}
            className="border rounded-lg w-full p-3 bg-white"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                link
              )
            }
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg"
          >
            Copiar enlace
          </button>

        </div>
      )}

    </div>
  )
}