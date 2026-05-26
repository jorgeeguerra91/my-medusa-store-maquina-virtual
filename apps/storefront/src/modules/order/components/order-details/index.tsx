import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const statusMap: Record<string, string> = {
      // Fulfillment cambio de idioma de estado de la orden
      not_fulfilled: "No enviado",
      partially_fulfilled: "Parcialmente enviado",
      fulfilled: "Enviado",
      shipped: "Despachado",
      delivered: "Entregado",
      canceled: "Cancelado",
      requires_action: "Requiere acción",

      // Payment
      pending: "Pendiente",
      authorized: "Autorizado",
      captured: "Pagado",
      partially_refunded: "Reembolso parcial",
      refunded: "Reembolsado",
    }

    return (
      statusMap[str] ||
      str
        .split("_")
        .join(" ")
        .replace(/^./, (c) => c.toUpperCase())
    )
  }

  return (
    <div>
      <Text>
        Hemos enviado los detalles de confirmación del pedido a{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>

      <Text className="mt-2">
        Fecha de orden:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>

      <Text className="mt-2 text-ui-fg-interactive">
        Nro de orden:{" "}
        <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Estado de la orden:{" "}
              <span
                className="text-ui-fg-subtle"
                data-testid="order-status"
              >
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>

            <Text>
              Estado del pago:{" "}
              <span
                className="text-ui-fg-subtle"
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails