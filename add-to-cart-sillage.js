function initializeLocalCartSystem() {
    console.log("🛒 Initialisation du panier local...");

    const buttons = document.querySelectorAll(".custom-add-to-cart-button");

    buttons.forEach(button => {
        const productID = button.getAttribute("data-product-id");
        const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

        button.addEventListener("click", (event) => {
            event.preventDefault();
            openLocalCartModal(button, productID, maxQuantity);
        });
    });
}

function openLocalCartModal(button, productID, maxQuantity) {
    const existingModal = document.getElementById("cart-modal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
      <div id="cart-modal" class="cart-modal-overlay">
        <div class="cart-modal-content">
          <h2>Ajouter au panier</h2>
          <p>📦 Quantité dispo : ${maxQuantity}<br>🆔 Produit : ${productID}</p>
          <label for="cart-quantity">Quantité (max ${maxQuantity}) :</label>
          <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="1">
          <button id="submit-cart" class="confirm">Confirmer</button>
          <button id="close-cart" class="cancel">Annuler</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("submit-cart").addEventListener("click", () => {
        const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
        if (quantity < 1 || quantity > maxQuantity) {
            alert(`Quantité invalide.`);
            return;
        }
        addToLocalCart(button, productID, quantity);
        button.textContent = "Ajouté";
        button.disabled = true;
        button.classList.add("in-cart");
        document.getElementById("cart-modal").remove();
    });

    document.getElementById("close-cart").addEventListener("click", () => {
        document.getElementById("cart-modal").remove();
    });
}

function addToLocalCart(button, productID, quantity) {
    let cart = JSON.parse(localStorage.getItem("localCart")) || {};

    // Récupération des infos depuis les attributs data-*
    const name = button.getAttribute("data-name") || "";
    const price = button.getAttribute("data-price") || "";
    const image = button.getAttribute("data-image") || "";
    const size = button.getAttribute("data-size") || "";
    const condition = button.getAttribute("data-condition") || "";
    const seller = button.getAttribute("data-sold-by") || "";
    const freeShipping = button.getAttribute("data-free-shipping") === "true";

    if (cart[productID]) {
        cart[productID].quantity += quantity;
    } else {
        cart[productID] = {
            id: productID,
            name: name,
            price: price,
            image: image,
            size: size,
            condition: condition,
            seller: seller,
            freeShipping: freeShipping,
            quantity: quantity
        };
    }

    localStorage.setItem("localCart", JSON.stringify(cart));
    console.log("🛒 Panier mis à jour :", cart);
}

// Initialisation
document.addEventListener("DOMContentLoaded", initializeLocalCartSystem);
