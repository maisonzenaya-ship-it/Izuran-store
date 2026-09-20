const state = {
  products: [],
  cart: JSON.parse(
    localStorage.getItem("izuran_cart") || "[]"
  )
};


// ===============================
// PRIX
// ===============================

function euro(cents) {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR"
  });
}


// ===============================
// CHARGER LES PRODUITS
// ===============================

async function loadProducts() {

  try {

    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Erreur API");
    }

    state.products = await response.json();

    renderProducts("all");

    renderCart();

  } catch (error) {

    console.error(error);

    document.querySelector("#products").innerHTML = `
      <p>
        La boutique est momentanément indisponible.
      </p>
    `;

  }

}


// ===============================
// AFFICHER LES PRODUITS
// ===============================

function renderProducts(category) {

  const container =
    document.querySelector("#products");

  let products = state.products;


  if (category !== "all") {

    products = products.filter(
      product => product.category === category
    );

  }


  if (!products.length) {

    container.innerHTML = `
      <p>
        Aucun parfum disponible dans cette catégorie.
      </p>
    `;

    return;

  }


  container.innerHTML = products.map(product => {

    return `

      <article class="product-card">

        <div class="product-image">

          <img
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
          >

        </div>


        <div class="product-info">

          <div class="category">

            ${escapeHtml(product.category)}

          </div>


          <h3>

            ${escapeHtml(product.name)}

          </h3>


          <p class="description">

            ${escapeHtml(product.description)}

          </p>


          <div class="product-bottom">

            <span class="price">

              ${euro(product.price_cents)}

            </span>


            <button
              class="add"
              onclick="addToCart(${product.id})"
            >

              Ajouter

            </button>

          </div>

        </div>

      </article>

    `;

  }).join("");

}


// ===============================
// AJOUTER AU PANIER
// ===============================

function addToCart(id) {

  const product =
    state.products.find(
      product => product.id === id
    );


  if (!product) {
    return;
  }


  const existing =
    state.cart.find(
      item => item.id === id
    );


  if (existing) {

    if (existing.quantity < product.stock) {

      existing.quantity++;

    } else {

      alert(
        "La quantité disponible en stock est atteinte."
      );

      return;

    }

  } else {

    state.cart.push({

      id: product.id,

      name: product.name,

      price_cents: product.price_cents,

      quantity: 1

    });

  }


  saveCart();

  renderCart();


  document
    .querySelector("#panier")
    .scrollIntoView({
      behavior: "smooth"
    });

}


// ===============================
// MODIFIER QUANTITÉ
// ===============================

function changeQty(id, delta) {

  const item =
    state.cart.find(
      item => item.id === id
    );


  if (!item) {
    return;
  }


  const product =
    state.products.find(
      product => product.id === id
    );


  if (!product) {
    return;
  }


  const newQuantity =
    item.quantity + delta;


  if (newQuantity <= 0) {

    state.cart =
      state.cart.filter(
        item => item.id !== id
      );

  } else if (
    newQuantity <= product.stock
  ) {

    item.quantity = newQuantity;

  } else {

    alert(
      "La quantité disponible en stock est atteinte."
    );

    return;

  }


  saveCart();

  renderCart();

}


// ===============================
// SUPPRIMER
// ===============================

function removeItem(id) {

  state.cart =
    state.cart.filter(
      item => item.id !== id
    );


  saveCart();

  renderCart();

}


// ===============================
// SAUVEGARDER LE PANIER
// ===============================

function saveCart() {

  localStorage.setItem(
    "izuran_cart",
    JSON.stringify(state.cart)
  );

}


// ===============================
// AFFICHER LE PANIER
// ===============================

function renderCart() {

  const container =
    document.querySelector("#cartItems");

  const count =
    state.cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  document.querySelector(
    "#cartCount"
  ).textContent = count;


  if (!state.cart.length) {

    container.innerHTML = `
      <p>
        Votre panier est vide.
      </p>
    `;

    document.querySelector(
      "#cartTotal"
    ).textContent = "0,00 €";

    return;

  }


  container.innerHTML =
    state.cart.map(item => {

      return `

        <div class="cart-item">

          <strong>
            ${escapeHtml(item.name)}
          </strong>


          <div class="qty">

            <button
              onclick="changeQty(${item.id}, -1)"
            >
              −
            </button>


            <span>
              ${item.quantity}
            </span>


            <button
              onclick="changeQty(${item.id}, 1)"
            >
              +
            </button>

          </div>


          <strong>

            ${euro(
              item.price_cents *
              item.quantity
            )}

          </strong>


          <button
            class="remove"
            onclick="removeItem(${item.id})"
          >

            Supprimer

          </button>

        </div>

      `;

    }).join("");


  const total =
    state.cart.reduce(
      (sum, item) =>
        sum +
        item.price_cents *
        item.quantity,
      0
    );


  document.querySelector(
    "#cartTotal"
  ).textContent = euro(total);

}


// ===============================
// FILTRES
// ===============================

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".filter")
          .forEach(
            button =>
              button.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        renderProducts(
          button.dataset.category
        );

      }
    );

  });


// ===============================
// CLICK & COLLECT
// ===============================

const fulfillment =
  document.querySelector(
    'select[name="fulfillment"]'
  );


fulfillment.addEventListener(
  "change",
  event => {

    const pickupFields =
      document.querySelector(
        "#pickupFields"
      );


    pickupFields.classList.toggle(
      "hidden",
      event.target.value !== "pickup"
    );

  }
);


// ===============================
// COMMANDE
// ===============================

document
  .querySelector("#checkoutForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!state.cart.length) {

        alert(
          "Votre panier est vide."
        );

        return;

      }


      const form =
        new FormData(
          event.target
        );


      const data =
        Object.fromEntries(
          form.entries()
        );


      data.items =
        state.cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }));


      try {

        const response =
          await fetch(
            "/api/orders",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(data)
            }
          );


        const result =
          await response.json();


        if (!response.ok) {

          alert(
            result.error ||
            "Une erreur est survenue."
          );

          return;

        }


        if (result.checkout_url) {

          window.location.href =
            result.checkout_url;

          return;

        }


        alert(
          "Commande " +
          result.order_number +
          " créée."
        );


        state.cart = [];

        saveCart();

        renderCart();

        event.target.reset();


        document
          .querySelector(
            "#pickupFields"
          )
          .classList.add(
            "hidden"
          );


      } catch (error) {

        console.error(error);

        alert(
          "Impossible de contacter le serveur."
        );

      }

    }
  );


// ===============================
// SÉCURITÉ AFFICHAGE
// ===============================

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      character => {

        const characters = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };

        return characters[character];

      }
    );

}


// ===============================
// DÉMARRAGE
// ===============================

loadProducts();