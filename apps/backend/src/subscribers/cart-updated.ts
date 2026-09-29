import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

export default async function cartUpdatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    console.log("CARRITO ACTUALIZADO")

    const query = container.resolve("query")

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "customer.*",
        "items.*",
      ],
      filters: {
        id: event.data.id,
      },
    })

    const cart = carts?.[0]

    if (!cart) return

    const productosInteres = cart.items
      ?.map((item: any) => item.product_title || item.title)
      .filter(Boolean)
      .join(", ")

    console.log("PRODUCTOS INTERÉS:", productosInteres)

    const response = await fetch(
      "https://ea232a82126ae3bfb7265782aa5bcf.17.environment.api.powerplatform.com/powerautomate/automations/direct/cu/07/workflows/f98dd9de73d74b6ab65961d463ed39f6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bXvfNe25tpfmuzqLQSwz8DHfJt4h0YD54YI4rdAkEG0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cart.email || cart.customer?.email || "",
          nombre: cart.customer
            ? `${cart.customer.first_name || ""} ${cart.customer.last_name || ""}`.trim()
            : "",
          productosInteres: productosInteres || "",
          tipoInteraccion: "Producto agregado al carrito",
        }),
      }
    )

    console.log("POWER AUTOMATE:", response.status)
  } catch (error) {
    console.log("ERROR CART SUBSCRIBER:", error)
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
}