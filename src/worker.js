// ==========================================
// IZURAN — CLOUDFLARE WORKER
// ==========================================


// ------------------------------------------
// Réponse JSON
// ------------------------------------------

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store"
      }
    }
  );

}


// ------------------------------------------
// Numéro de commande
// ------------------------------------------

function createOrderNumber() {

  const time =
    Date.now()
      .toString()
      .slice(-8);

  const random =
    Math.floor(
      Math.random() * 900 + 100
    );

  return `IZ-${time}-${random}`;

}


// ------------------------------------------
// API
// ------------------------------------------

async function handleApi(
  request,
  env
) {

  const url =
    new URL(request.url);


  // ========================================
  // PRODUITS
  // ========================================

  if (
    url.pathname === "/api/products" &&
    request.method === "GET"
  ) {

    const result =
      await env.DB
        .prepare(`
          SELECT
            id,
            name,
            slug,
            description,
            category,
            price_cents,
            image,
            stock
          FROM products
          WHERE active = 1
          ORDER BY id DESC
        `)
        .all();


    return json(
      result.results
    );

  }


  // ========================================
  // CRÉER UNE COMMANDE
  // ========================================

  if (
    url.pathname === "/api/orders" &&
    request.method === "POST"
  ) {

    let body;


    try {

      body =
        await request.json();

    } catch {

      return json(
        {
          error:
            "Les données envoyées sont invalides."
        },
        400
      );

    }


    // --------------------------------------
    // Vérification
    // --------------------------------------

    if (
      !body.name ||
      !body.email ||
      !body.phone ||
      !body.fulfillment ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {

      return json(
        {
          error:
            "Veuillez compléter toutes les informations."
        },
        400
      );

    }


    const productIds =
      body.items
        .map(
          item =>
            Number(item.product_id)
        )
        .filter(Boolean);


    if (!productIds.length) {

      return json(
        {
          error:
            "Le panier est invalide."
        },
        400
      );

    }


    // --------------------------------------
    // Récupérer les produits
    // --------------------------------------

    const placeholders =
      productIds
        .map(() => "?")
        .join(",");


    const productsResult =
      await env.DB
        .prepare(`
          SELECT
            id,
            name,
            price_cents,
            stock
          FROM products
          WHERE active = 1
          AND id IN (${placeholders})
        `)
        .bind(...productIds)
        .all();


    const products =
      productsResult.results;


    const productMap =
      new Map(
        products.map(
          product => [
            product.id,
            product
          ]
        )
      );


    let total = 0;

    const orderItems = [];


    // --------------------------------------
    // Vérifier chaque article
    // --------------------------------------

    for (
      const item of body.items
    ) {

      const product =
        productMap.get(
          Number(item.product_id)
        );


      const quantity =
        Math.floor(
          Number(item.quantity)
        );


      if (
        !product ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {

        return json(
          {
            error:
              "Produit ou quantité invalide."
          },
          400
        );

      }


      if (
        quantity > product.stock
      ) {

        return json(
          {
            error:
              `Stock insuffisant pour ${product.name}.`
          },
          400
        );

      }


      total +=
        product.price_cents *
        quantity;


      orderItems.push({
        product,
        quantity
      });

    }


    // --------------------------------------
    // Numéro de commande
    // --------------------------------------

    const orderNumber =
      createOrderNumber();


    // --------------------------------------
    // Enregistrer commande
    // --------------------------------------

    const order =
      await env.DB
        .prepare(`
          INSERT INTO orders (
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            fulfillment,
            pickup_date,
            pickup_time,
            total_cents
          )

          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(

          orderNumber,

          body.name,

          body.email,

          body.phone,

          body.fulfillment,

          body.pickup_date ||
            null,

          body.pickup_time ||
            null,

          total

        )
        .run();


    const orderId =
      order.meta.last_row_id;


    // --------------------------------------
    // Articles de commande
    // --------------------------------------

    for (
      const item of orderItems
    ) {

      await env.DB
        .prepare(`
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            unit_price_cents,
            quantity
          )

          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(

          orderId,

          item.product.id,

          item.product.name,

          item.product.price_cents,

          item.quantity

        )
        .run();


      // ------------------------------------
      // Mise à jour du stock
      // ------------------------------------

      await env.DB
        .prepare(`
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
        `)
        .bind(

          item.quantity,

          item.product.id

        )
        .run();

    }


    // --------------------------------------
    // IMPORTANT
    // --------------------------------------
    //
    // Le paiement réel sera connecté
    // dans une prochaine étape.
    //
    // On ne simule PAS un paiement.
    // --------------------------------------

    return json(
      {

        ok: true,

        order_number:
          orderNumber,

        payment_status:
          "pending",

        message:
          "Commande enregistrée. Le paiement sera activé après configuration du prestataire."

      },

      201

    );

  }


  // ========================================
  // SUIVI D'UNE COMMANDE
  // ========================================

  if (
    url.pathname.startsWith(
      "/api/orders/"
    ) &&
    request.method === "GET"
  ) {

    const orderNumber =
      decodeURIComponent(
        url.pathname
          .split("/")
          .pop()
      );


    const order =
      await env.DB
        .prepare(`
          SELECT
            order_number,
            fulfillment,
            pickup_date,
            pickup_time,
            total_cents,
            payment_status,
            status,
            created_at

          FROM orders

          WHERE order_number = ?
        `)
        .bind(orderNumber)
        .first();


    if (!order) {

      return json(
        {
          error:
            "Commande introuvable."
        },
        404
      );

    }


    return json(order);

  }


  return null;

}


// ==========================================
// CLOUDFLARE WORKER
// ==========================================

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);


    // --------------------------------------
    // API
    // --------------------------------------

    if (
      url.pathname.startsWith(
        "/api/"
      )
    ) {

      try {

        const response =
          await handleApi(
            request,
            env
          );


        return (
          response ||
          json(
            {
              error:
                "Route introuvable."
            },
            404
          )
        );

      } catch (error) {

        console.error(error);


        return json(
          {
            error:
              "Erreur serveur."
          },
          500
        );

      }

    }


    // --------------------------------------
    // SITE
    // --------------------------------------

    return env.ASSETS.fetch(
      request
    );

  }

};