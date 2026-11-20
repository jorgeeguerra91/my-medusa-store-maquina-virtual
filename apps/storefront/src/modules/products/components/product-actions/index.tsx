"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (acc: Record<string, string>, varopt) => {
      if (varopt.option_id) acc[varopt.option_id] = varopt.value
      return acc
    },
    {}
  )
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<
    Record<string, string | undefined>
  >({})
  const [isAdding, setIsAdding] = useState(false)

  // Nuevo: controlar el error de inventario y otros errores
  const [stockErrorVariantId, setStockErrorVariantId] = useState<
    string | null
  >(null)
  const [addToCartError, setAddToCartError] = useState("")

  const countryCode = useParams().countryCode as string

  // Si solo hay una variante, seleccionar sus opciones automáticamente
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(
        product.variants[0].options
      )
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Determinar si la variante actual produjo un error de inventario
  const stockError = Boolean(
    selectedVariant?.id &&
      stockErrorVariantId === selectedVariant.id
  )

  // Actualizar opciones cuando se selecciona una variante
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))

    // Al cambiar la selección, limpiar el error anterior
    setStockErrorVariantId(null)
    setAddToCartError("")
  }

  // Comprobar si las opciones seleccionadas corresponden a una variante
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // Comprobar disponibilidad de inventario de la variante
  const inStock = useMemo(() => {
    // Si no se administra el inventario, permitir agregar
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // Si se permiten pedidos pendientes, permitir agregar
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // Si hay inventario disponible, permitir agregar
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    return false
  }, [selectedVariant])

  // Disponibilidad efectiva: también considera errores del servidor
  const canAddToCart = inStock && !stockError

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Agregar la variante seleccionada al carrito
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !canAddToCart || isAdding) {
      return
    }

    setIsAdding(true)
    setAddToCartError("")

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase()

      // Capturar el error específico de inventario de Medusa
      if (
        message.includes("required inventory") ||
        message.includes("insufficient_inventory") ||
        message.includes("insufficient inventory")
      ) {
        setStockErrorVariantId(selectedVariant.id)
        setAddToCartError(
          "No hay stock disponible para agregar más unidades de este producto."
        )
      } else {
        setAddToCartError(
          "No se pudo agregar el producto al carrito. Inténtalo de nuevo."
        )
      }
    } finally {
      // Evitar que el botón se quede cargando si la solicitud falla
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}

              <Divider />
            </div>
          )}
        </div>

        <ProductPrice
          product={product}
          variant={selectedVariant}
        />

        <Button
          onClick={handleAddToCart}
          disabled={
            !canAddToCart ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant || !isValidVariant
            ? "Selecciona una variante"
            : !canAddToCart
            ? "Sin stock"
            : "Añadir al carrito"}
        </Button>

        {/* Mostrar mensajes sin provocar un error de ejecución */}
        {addToCartError && (
          <p
            role="alert"
            aria-live="polite"
            className="mt-2 text-sm text-red-600"
          >
            {addToCartError}
          </p>
        )}

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={canAddToCart}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}