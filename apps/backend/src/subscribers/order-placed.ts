import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<any>) {

  try {

    console.log("ORDEN DETECTADA")

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
        total: order.payment_collections?.[0]?.payments?.[0]?.amount || 0,

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
  "ORDER COMPLETO:",
  JSON.stringify(order, null, 2)
)

    console.log(
  "CLEAN ORDER:",
  JSON.stringify(cleanOrder, null, 2)
)

    const response = await fetch("https://ea232a82126ae3bfb7265782aa5bcf.17.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/467c4d7b1a6848e19e25d6f775d8e835/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=a9U8tMpD5c442jur-C9eDvIUKlnilU4zt7q8rj9Bqhs", {
      method: "POST",             
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanOrder),
    })

    console.log("RESPUESTA POWER AUTOMATE:", response.status)

  } catch (error) {

    console.log("ERROR EN SUSCRIBER:", error)

  }

}

export const config: SubscriberConfig = {
  event: "order.placed",
}