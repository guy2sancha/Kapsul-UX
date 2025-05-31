function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("show");
    } else {
        console.error(`❌ Modale ${modalId} introuvable.`);
    }
}

function initializeCartSystem() {
    console.log("🛒 Initialisation du système de panier...");

    const buttons = document.querySelectorAll(".custom-add-to-cart-button");
    const API_URL = "https://kapsul-cart-backend-production.up.railway.app"; 
    const userToken = localStorage.getItem("userToken");

    console.log("🔍 Vérification du token utilisateur:", userToken ? "✅ Présent" : "❌ Absent");

    buttons.forEach(button => {
        const productID = button.getAttribute("data-product-id");
        const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

        button.addEventListener("click", (event) => {
            event.preventDefault();

            if (!userToken) {
                console.log("❌ Aucun utilisateur connecté, affichage de la modale de login...");
                showModal('cartModal');
                return;
            }

            openCartModal(button, productID, maxQuantity);
        });
    });
}

function openCartModal(button, productID, maxQuantity) {
    console.log(`🛍 Ouverture du modal pour : ${productID}, quantité max : ${maxQuantity}`);

    const existingModal = document.getElementById("cart-modal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
      <div id="cart-modal" class="cart-modal-overlay">
        <div class="cart-modal-content">
          <h2>Réserver votre produit</h2>
          <p>📦 Quantité disponible : ${maxQuantity}<br>🔑 Product ID : ${productID}</p>
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
        if (quantity > maxQuantity || quantity < 1) {
            alert(`Veuillez sélectionner une quantité entre 1 et ${maxQuantity}`);
            return;
        }
        addToCart(button, productID, quantity);
    });

    document.getElementById("close-cart").addEventListener("click", () => {
        document.getElementById("cart-modal").remove();
    });
}

async function addToCart(button, productID, quantity) {
    const API_URL = "https://kapsul-cart-backend-production.up.railway.app";
    const userToken = localStorage.getItem("userToken");

    console.log(`➕ Ajout au panier : ${productID}, quantité : ${quantity}`);
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Adding...`;

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({
                userToken: userToken,
                productID: productID,
                quantity: quantity
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Produit ajouté au panier !");
            button.textContent = "In Cart";
            button.classList.add("in-cart");
            button.disabled = true;
            document.getElementById("cart-modal").remove();
            alert("Produit ajouté avec succès !");
        } else {
            throw new Error(result.message || "Erreur lors de l'ajout.");
        }
    } catch (error) {
        console.error("❌ Erreur:", error);
        alert(error.message);
        button.innerHTML = "Add to Cart";
        button.disabled = false;
    }
}

// Initialisation après chargement
document.addEventListener("DOMContentLoaded", initializeCartSystem);

// Observateur DOM pour surveiller les ajouts dynamiques
const observer = new MutationObserver(() => {
    console.log("🔄 DOM modifié, réinitialisation du système panier...");
    initializeCartSystem();
});
observer.observe(document.body, { childList: true, subtree: true });

// Gestion de la navigation (back/forward)
window.addEventListener("popstate", () => {
    console.log("🔄 Navigation détectée, réinitialisation...");
    initializeCartSystem();
});
