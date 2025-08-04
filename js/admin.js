const PASSWORD = "admin123";
let currentAction = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("add-product").addEventListener("click", () => {
    currentAction = "add";
    document.getElementById("password-modal").style.display = "flex";
  });
});

function showModal(message) {
  document.getElementById("modal-message").innerText = message;
  document.getElementById("modal").style.display = "flex";
}
function closeModal() {
  document.getElementById("modal").style.display = "none";
}
function closePasswordModal() {
  document.getElementById("password-modal").style.display = "none";
  document.getElementById("password-input").value = '';
}

function checkPassword() {
  const passInput = document.getElementById("password-input").value;
  if (passInput !== PASSWORD) {
    showModal("Incorrect password!");
    closePasswordModal();
    return;
  }
  closePasswordModal();

  if (currentAction === "add") {
    handleImageUploadConfirmed();
  } else if (currentAction?.startsWith("delete-")) {
    const productIdToDelete = parseInt(currentAction.split("-")[1]);
    deleteProductConfirmed(productIdToDelete);
  }
}

function handleImageUploadConfirmed() {
  const fileInput = document.getElementById("image");
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      addProduct(event.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    showModal("Please select an image");
  }
}

async function loadProducts() {
  const res = await fetch("products.json");
  const defaultProducts = await res.json();
  const customProducts = JSON.parse(localStorage.getItem("customProducts")) || [];

  displayProducts(defaultProducts, customProducts);
}

function displayProducts(defaultProducts, customProducts) {
  const adminDiv = document.getElementById("admin-products");
  adminDiv.innerHTML = "";

  // Default products (no delete)
  defaultProducts.forEach((p) => {
    adminDiv.innerHTML += `
      <div class="product-item">
        <img src="${p.image}">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>Rs ${p.price}</p>
        </div>
        <div class="edit-delete-buttons">
          <button disabled style="background:#999;">Default</button>
        </div>
      </div>
    `;
  });

  // Custom products (deletable)
  customProducts.forEach((p) => {
    adminDiv.innerHTML += `
      <div class="product-item">
        <img src="${p.image}">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>Rs ${p.price}</p>
        </div>
        <div class="edit-delete-buttons">
          <button onclick="requestDelete(${p.id})">Delete</button>
        </div>
      </div>
    `;
  });
}

function addProduct(imageBase64) {
  const name = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const description = document.getElementById("description").value.trim();
  const variants = document.getElementById("variants").value.split(",").map(v => v.trim());

  if (!name || isNaN(price) || !description) {
    showModal("Please fill all fields correctly!");
    return;
  }

  let customProducts = JSON.parse(localStorage.getItem("customProducts")) || [];
  customProducts.push({
    id: Date.now(),
    name,
    price,
    image: imageBase64, // ✅ Fixed typo
    description,
    variants
  });

  localStorage.setItem("customProducts", JSON.stringify(customProducts));

  // Clear form
  document.getElementById("name").value = '';
  document.getElementById("price").value = '';
  document.getElementById("description").value = '';
  document.getElementById("variants").value = '';
  document.getElementById("image").value = '';

  showModal("Product Added Successfully!");
  loadProducts();
}

function requestDelete(productId) {
  currentAction = `delete-${productId}`;
  document.getElementById("password-modal").style.display = "flex";
}

function deleteProductConfirmed(productIdToDelete) {
  let customProducts = JSON.parse(localStorage.getItem("customProducts")) || [];
  customProducts = customProducts.filter(p => p.id !== productIdToDelete);

  localStorage.setItem("customProducts", JSON.stringify(customProducts));

  showModal("Product Deleted Successfully!");
  loadProducts();
}
