import { sendAbandonedCheckoutEmail, sendOwnerAbandonedCheckoutEmail } from "@/lib/email";
import { markAbandonedEmailSent, readAbandonedCheckoutOrders } from "@/lib/supabase/order-store";

export async function runAbandonedCheckoutAutomation(origin: string) {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const orders = await readAbandonedCheckoutOrders(cutoff);
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const results = await Promise.allSettled([
        sendAbandonedCheckoutEmail({
          to: order.customerEmail,
          productName: order.productName,
          shopUrl: new URL("/shop", origin).toString()
        }),
        ownerEmail
          ? sendOwnerAbandonedCheckoutEmail({
              to: ownerEmail,
              orderId: order.id,
              productName: order.productName,
              customerEmail: order.customerEmail,
              amount: order.amount,
              currency: order.currency,
              createdAt: order.createdAt
            })
          : Promise.resolve()
      ]);
      const rejected = results.filter((result) => result.status === "rejected");

      if (rejected.length > 0) {
        failed += 1;
        rejected.forEach((result) => {
          if (result.status === "rejected") {
            console.warn("Abandoned checkout email failed.", result.reason);
          }
        });
        continue;
      }

      await markAbandonedEmailSent(order.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.warn("Could not process abandoned checkout email.", error);
    }
  }

  return { sent, failed };
}
