// ===== CART DATA =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];
let allProductsLoaded = false;

// ===== DOM ELEMENTS =====
const DOMElements = {
  searchBar: document.getElementById("search-bar"),
  productList: document.getElementById("product-list"),
  cartBtn: document.getElementById("cart-btn"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartOverlay: document.getElementById("cart-overlay"),
  closeCart: document.getElementById("close-cart"),
  cartItemsContainer: document.getElementById("cart-items"),
  cartCount: document.getElementById("cart-count"),
  checkoutBtn: document.getElementById("checkout-btn"),
  orderModal: document.getElementById("order-modal"),
  closeModal: document.getElementById("close-modal"),
  cartTotal: document.getElementById("cart-total"),
  productDetailsModal: document.getElementById("product-details-modal"),
  productDetailsContainer: document.getElementById("product-details-container"),
  toast: document.getElementById("toast"),
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();
  setupEventListeners();
});

// ===== PRODUCT HANDLING =====

/**
 * Loads products from 'products.json' and custom products from local storage.
 * Renders the product list and sets up search functionality.
 */
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    const data = await res.json();
    const customProducts = JSON.parse(localStorage.getItem("customProducts")) || [];
    products = [...data, ...customProducts];
    allProductsLoaded = true;
    renderProducts(products);
  } catch (error) {
    console.error("Failed to load products:", error);
    DOMElements.productList.innerHTML = `<p style="grid-column:1/-1;text-align:center;">Failed to load products.</p>`;
  }
}

/**
 * Renders a list of products to the product display area.
 * @param {Array} items - The array of product objects to render.
 */
function renderProducts(items) {
  DOMElements.productList.innerHTML = "";

  if (items.length === 0) {
    DOMElements.productList.innerHTML = `<p style="grid-column:1/-1;text-align:center;">No products found</p>`;
    return;
  }

  items.forEach((product) => {
    const div = document.createElement("div");
    div.classList.add("product-card");
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-img" data-id="${product.id}">
      <h3>${product.name}</h3>
      <p>Rs ${product.price}</p>
      <button class="add-cart-btn" data-id="${product.id}">Add to Cart</button>
    `;
    DOMElements.productList.appendChild(div);
  });

  attachProductCardListeners();
}

/**
 * Attaches event listeners to product card buttons (Add to Cart) and images (Product Details).
 */
function attachProductCardListeners() {
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = parseInt(event.currentTarget.dataset.id);
      const product = products.find((p) => p.id === id);
      if (product) {
        addToCart(product);
        showToast(`${product.name} added to cart!`);
      }
    });
  });

  document.querySelectorAll(".product-img").forEach((img) => {
    img.addEventListener("click", (event) => {
      const id = parseInt(event.currentTarget.dataset.id);
      const product = products.find((p) => p.id === id);
      if (product) {
        showProductDetails(product);
      }
    });
  });
}

/**
 * Sets up the search bar functionality to filter products.
 */
function setupSearch() {
  DOMElements.searchBar.addEventListener("input", () => {
    if (!allProductsLoaded) return;

    const searchText = DOMElements.searchBar.value.trim().toLowerCase();
    const filtered = searchText === ""
      ? products
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchText) ||
            (p.description && p.description.toLowerCase().includes(searchText))
        );
    renderProducts(filtered);
  });
}

/**
 * Displays detailed information about a selected product in a modal.
 * @param {Object} product - The product object to display details for.
 */
function showProductDetails(product) {
  let variantsHTML = "";
  if (product.variants && product.variants.length > 0) {
    variantsHTML = `
      <div class="variant-container">
        ${product.variants
          .map(
            (v, i) => `
          <button class="variant-btn ${i === 0 ? "active" : ""}" data-variant="${v}">
            ${v}
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  DOMElements.productDetailsContainer.innerHTML = `
    <div class="product-details-content">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h2>${product.name}</h2>
        <p><strong>Price:</strong> Rs ${product.price}</p>
        <p>${product.description || "No description available."}</p>
        ${variantsHTML}
        <input type="number" id="qty" value="1" min="1" style="width:70px;">
        <button class="add-to-cart-btn">Add to Cart</button>
      </div>
    </div>
  `;

  // Handle variant selection
  const variantButtons = DOMElements.productDetailsContainer.querySelectorAll(".variant-btn");
  variantButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      variantButtons.forEach((b) => b.classList.remove("active"));
      event.currentTarget.classList.add("active");
    });
  });

  // Add to cart event from details modal
  DOMElements.productDetailsContainer.querySelector(".add-to-cart-btn").addEventListener("click", () => {
    const qtyInput = document.getElementById("qty");
    const qty = parseInt(qtyInput.value);
    const selectedVariant = DOMElements.productDetailsContainer.querySelector(".variant-btn.active")?.dataset.variant || null;

    addToCart({
      ...product,
      qty,
      variant: selectedVariant,
    });
    closeProductDetailsModal();
    showToast(`${product.name} added to cart!`);
  });

  DOMElements.productDetailsModal.classList.add("show");
}

/**
 * Closes the product details modal.
 */
function closeProductDetailsModal() {
  DOMElements.productDetailsModal.classList.remove("show");
}

// ===== CART FUNCTIONS =====

/**
 * Adds a product to the cart or increments its quantity if already present.
 * @param {Object} product - The product object to add.
 */
function addToCart(product) {
  const existing = cart.find(
    (item) => item.id === product.id && item.variant === product.variant
  );

  if (existing) {
    existing.qty += product.qty || 1; // Use product.qty if available (from details modal), else default to 1
  } else {
    cart.push({ ...product, qty: product.qty || 1 });
  }
  saveCart();
  updateCartUI();
}

/**
 * Removes a product from the cart.
 * @param {number} id - The ID of the product to remove.
 */
function removeFromCart(id) {
  cart = cart.filter((item) => item.id != id); // Using != to compare string data-id with number id
  saveCart();
  updateCartUI();
}

/**
 * Saves the current cart state to local storage.
 */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/**
 * Updates the cart user interface, including item list, total, and item count.
 */
function updateCartUI() {
  DOMElements.cartItemsContainer.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    DOMElements.cartItemsContainer.innerHTML = `<p style="text-align:center;">Your cart is empty</p>`;
  } else {
    cart.forEach((item) => {
      total += item.price * item.qty;

      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h4>${item.name} ${item.variant ? `(${item.variant})` : ""}</h4>
          <p>Qty: ${item.qty}</p>
          <p>Price: Rs ${item.price * item.qty}</p>
        </div>
        <button class="remove-btn" data-id="${item.id}">&times;</button>
      `;
      DOMElements.cartItemsContainer.appendChild(div);
    });

    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        removeFromCart(event.currentTarget.dataset.id);
      });
    });
  }

  DOMElements.cartTotal.textContent = total.toFixed(2); // Format total to 2 decimal places
  DOMElements.cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

// ===== UI INTERACTIONS =====

/**
 * Sets up all global event listeners for UI interactions.
 */
function setupEventListeners() {
  DOMElements.cartBtn.addEventListener("click", openCartDrawer);
  DOMElements.closeCart.addEventListener("click", closeCartDrawer);
  DOMElements.cartOverlay.addEventListener("click", closeCartDrawer);
  DOMElements.checkoutBtn.addEventListener("click", handleCheckout);
  DOMElements.closeModal.addEventListener("click", handleCloseOrderModal);
  setupSearch();
}

/**
 * Opens the cart drawer and prevents body scrolling.
 */
function openCartDrawer() {
  DOMElements.cartDrawer.classList.add("open");
  DOMElements.cartOverlay.classList.add("show");
  document.body.style.overflow = "hidden"; // Disable page scroll
}

/**
 * Closes the cart drawer and re-enables body scrolling.
 */
function closeCartDrawer() {
  DOMElements.cartDrawer.classList.remove("open");
  DOMElements.cartOverlay.classList.remove("show");
  document.body.style.overflow = ""; // Re-enable page scroll
}

/**
 * Handles the checkout button click, showing the order modal if cart is not empty.
 */
function handleCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  DOMElements.orderModal.classList.add("show");
}

/**
 * Handles the closing of the order modal, clearing the cart and updating UI.
 */
function handleCloseOrderModal() {
  cart = [];
  saveCart();
  updateCartUI();
  DOMElements.orderModal.classList.remove("show");
  closeCartDrawer();
}

/**
 * Displays a toast message for a short duration.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message = "Product added to cart!") {
  DOMElements.toast.textContent = message;
  DOMElements.toast.classList.add("show");

  setTimeout(() => {
    DOMElements.toast.classList.remove("show");
  }, 2000); // hides after 2 seconds
}
// ===== PRODUCT DETAILS MODAL CLOSE EVENT =====
document.getElementById("close-product-modal").addEventListener("click", () => {
  document.getElementById("product-details-modal").classList.remove("show");
});
