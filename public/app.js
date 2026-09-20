const state = {

  products: [

    {
      id: 1,
      name: "Éclat Noir",
      category: "Mixte",
      description:
        "Une fragrance élégante aux notes profondes.",
      price_cents: 5900,
      image:
        "/assets/product-placeholder.svg",
      stock: 12
    },

    {
      id: 2,
      name: "Velours Blanc",
      category: "Femme",
      description:
        "Une composition douce et lumineuse.",
      price_cents: 6500,
      image:
        "/assets/product-placeholder.svg",
      stock: 8
    },

    {
      id: 3,
      name: "Noir Intense",
      category: "Homme",
      description:
        "Une fragrance intense au caractère affirmé.",
      price_cents: 6900,
      image:
        "/assets/product-placeholder.svg",
      stock: 10
    }

  ],

  cart:
    JSON.parse(
      localStorage.getItem("izuran_cart") || "[]"
    )

};


// ===============================
// PRIX
// ===============================

function euro(cents) {

  return (cents / 100).toLocaleString(
    "fr-FR",
    {
      style: "currency",
      currency: "EUR"
    }
  );

}


// ===============================
// PRODUITS
// ===============================

function renderProducts(category) {

  const container =
    document.querySelector("#products");


  let products = state.products;


  if (category !== "all") {

    products =
      products.filter(
        product =>
          product.category === category
      );

  }


  container.innerHTML =
    products.map(product => `

      <article class="product-card">

        <div class="product-image">

          <img
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
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

    `).join("");

}


// ===============================
// PANIER
// ===============================

function addToCart(id) {

  const product =
    state.products.find(
      product => product.id === id
    );


  if (!product) return;


  const existing =
    state.cart.find(
      item => item.id === id
    );


  if (existing) {

    if (
      existing.quantity <
      product.stock
    ) {

      existing.quantity++;

    } else {

      alert(
        "Stock maximum atteint."
      );

      return;

    }

  } else {

    state.cart.push({

      id: product.id,

      name: product.name,

      price_cents:
        product.price_cents,

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
// QUANTITÉ
// ===============================

function changeQty(id, change) {

  const item =
    state.cart.find(
      item => item.id === id
    );


  if (!item) return;


  const product =
    state.products.find(
      product => product.id === id
    );


  const quantity =
    item.quantity + change;


  if (quantity <= 0) {

    removeItem(id);

    return;

  }


  if (
    quantity >
    product.stock
  ) {

    alert(
      "Stock maximum atteint."
    );

    return;

  }


  item.quantity = quantity;


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
// SAUVEGARDE
// ===============================

function saveCart() {

  localStorage.setItem(
    "izuran_cart",
    JSON.stringify(state.cart)
  );

}


// ===============================
// AFFICHER PANIER
// ===============================

function renderCart() {

  const container =
    document.querySelector(
      "#cartItems"
    );


  const count =
    state.cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  document.querySelector(
    "#cartCount"
  ).textContent = count;


  if (
    state.cart.length === 0
  ) {

    container.innerHTML = `
      <p>
        Votre panier est vide.
      </p>
    `;


    document.querySelector(
      "#cartTotal"
    ).textContent =
      "0,00 €";


    return;

  }


  container.innerHTML =
    state.cart.map(item => `

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

    `).join("");


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
  ).textContent =
    euro(total);

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

document
  .querySelector(
    'select[name="fulfillment"]'
  )
  .addEventListener(
    "change",
    event => {

      document
        .querySelector(
          "#pickupFields"
        )
        .classList.toggle(
          "hidden",
          event.target.value !==
            "pickup"
        );

    }
  );


// ===============================
// COMMANDE
// ===============================

document
  .querySelector(
    "#checkoutForm"
  )
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      if (
        state.cart.length === 0
      ) {

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
        state.cart.map(
          item => ({

            id: item.id,

            name: item.name,

            quantity:
              item.quantity,

            price:
              item.price_cents

          })
        );


      const total =
        state.cart.reduce(
          (sum, item) =>
            sum +
            item.price_cents *
            item.quantity,
          0
        );


      data.total = total;


      /*
       * Pour cette première version,
       * on prépare les informations
       * de commande.
       *
       * Le paiement en ligne sera
       * branché ensuite côté serveur.
       */


      console.log(
        "Commande IZURAN :",
        data
      );


      alert(
        "Votre demande de commande a bien été préparée."
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

    }
  );


// ===============================
// PROTECTION HTML
// ===============================

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      })[character]
    );

}


// ===============================
// DÉMARRAGE
// ===============================

renderProducts("all");

renderCart();