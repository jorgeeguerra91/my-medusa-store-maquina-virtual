import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

export default async function orderToSharePoint({
  event,
  container,
}: SubscriberArgs<any>) {
  try {
    console.log("ORDEN DETECTADA PARA SHAREPOINT")

    const query = container.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "*",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "payment_collections.*",
        "payment_collections.payments.*",
      ],
      filters: {
        id: event.data.id,
      },
    })

    const order = orders[0]

    if (!order) {
      console.log("No se encontró la orden")
      return
    }

    const cleanOrder = {
      id: order.id,
      status: order.status,
      display_id: order.display_id,

      productosInteres: order.items
        ?.map((item: any) => item.product_title || item.title)
        .filter(Boolean)
        .join(", "),

      email: order.email,
      currency_code: order.currency_code,
      total: order.total,
      subtotal: order.subtotal,
      shipping_total: order.shipping_total,
      tax_total: order.tax_total,
      discount_total: order.discount_total,
      created_at: order.created_at,

      customer: {
        id: order.customer_id,
        email: order.email,
      },

      shipping_address: order.shipping_address
        ? {
            first_name: order.shipping_address.first_name,
            last_name: order.shipping_address.last_name,
            company: order.shipping_address.company,
            address_1: order.shipping_address.address_1,
            address_2: order.shipping_address.address_2,
            city: order.shipping_address.city,
            province: order.shipping_address.province,
            postal_code: order.shipping_address.postal_code,
            country_code: order.shipping_address.country_code,
            phone: order.shipping_address.phone,
          }
        : null,

      billing_address: order.billing_address
        ? {
            first_name: order.billing_address.first_name,
            last_name: order.billing_address.last_name,
            company: order.billing_address.company,
            address_1: order.billing_address.address_1,
            address_2: order.billing_address.address_2,
            city: order.billing_address.city,
            province: order.billing_address.province,
            postal_code: order.billing_address.postal_code,
            country_code: order.billing_address.country_code,
            phone: order.billing_address.phone,
          }
        : null,

      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        product_id: item.product_id,
        product_title: item.product_title,
        product_description: item.product_description,
        product_handle: item.product_handle,
        product_type: item.product_type,
        variant_id: item.variant_id,
        variant_title: item.variant_title,
        variant_sku: item.variant_sku,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total: item.total,
        requires_shipping: item.requires_shipping,
        is_discountable: item.is_discountable,
        is_tax_inclusive: item.is_tax_inclusive,
        created_at: item.created_at,
      })) || [],

      payments:
        order.payment_collections?.flatMap((collection: any) =>
          collection.payments?.map((payment: any) => ({
            id: payment.id,
            amount: payment.amount,
            currency_code: payment.currency_code,
            provider_id: payment.provider_id,
            created_at: payment.created_at,
          })) || []
        ) || [],
    }

    console.log(
      "CLEAN ORDER SHAREPOINT:",
      JSON.stringify(cleanOrder, null, 2)
    )

    const response = await fetch("https://ea232a82126ae3bfb7265782aa5bcf.17.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/ee58494952da4744b01172942ef9d762/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=uAR-_P_4uDm0rHODb17-ParDcO3AZlYjMUjlQuqNfhE", {
      method: "POST",             
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanOrder),
    })

    console.log("RESPUESTA POWER AUTOMATE SHAREPOINT:", response.status)
  } catch (error) {
    console.log("ERROR EN SUBSCRIBER SHAREPOINT:", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}