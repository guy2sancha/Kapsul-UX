function initializeCartSystem() {
    console.log("🛒 Initialisation du système de panier...");

    const buttons = document.querySelectorAll(".custom-add-to-cart-button");
    const API_URL = "https://kapsul-cart-backend-production.up.railway.app"; 
    const userToken = localStorage.getItem("userToken"); 

    console.log("🔍 Vérification du token utilisateur:", userToken ? "✅ Présent" : "❌ Absent");

    if (!userToken) {
        console.log("❌ Aucun utilisateur connecté, affichage de la modale...");
        buttons.forEach(button => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                showModal('cartModal'); 
            });
        });
        return;
    }

    async function checkCart() {
        try {
            console.log("📦 Vérification du contenu du panier...");
            const response = await fetch(`${API_URL}/cart?token=${userToken}`);
            const cartData = await response.json();
            
            if (!cartData.items) {
                console.warn("⚠ Aucune donnée reçue pour le panier.");
                return [];
            }

            console.log("🛒 Produits actuellement dans le panier:", cartData.items);
            return cartData.items.map(item => item["Product ID"]); 
        } catch (error) {
            console.error("❌ Erreur lors de la vérification du panier:", error);
            return [];
        }
    }

    checkCart().then(cartProductIDs => {
        buttons.forEach(button => {
            const productID = button.getAttribute("data-product-id");

            if (cartProductIDs.includes(productID)) {
                button.textContent = "✔ In Cart";
                button.classList.add("in-cart");
                button.disabled = true;
            }

            button.addEventListener("click", () => openCartModal(button, productID));
        });
    });

    function openCartModal(button, productID) {
        console.log("🛍 Ouverture de la modale pour:", productID);

        const sizes = button.getAttribute("data-sizes") ? 
            button.getAttribute("data-sizes").split(",").map(size => `<option value="${size.trim()}">${size.trim()}</option>`).join('') : 
            `<option value="">One Size</option>`;

        const colors = button.getAttribute("data-colors") ? 
            button.getAttribute("data-colors").split(",").map(color => `<option value="${color.trim()}">${color.trim()}</option>`).join('') : 
            `<option value="">Default</option>`;

        // Supprimer tout modal existant avant d'ajouter un nouveau
        const existingModal = document.getElementById("cart-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
          <div id="cart-modal" class="cart-modal-overlay">
            <div class="cart-modal-content">
              <h2>Add to Cart</h2>
              <label for="cart-size">Size:</label>
              <select id="cart-size">${sizes}</select>
              <label for="cart-color">Color:</label>
              <select id="cart-color">${colors}</select>
              <label for="cart-quantity">Quantity:</label>
              <input type="number" id="cart-quantity" min="1" value="1">
              <button id="submit-cart" class="confirm">Add to Cart</button>
              <button id="close-cart" class="cancel">Cancel</button>
            </div>
          </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHTML);

        // 🔥 Attacher les événements APRÈS l'ajout au DOM
        document.getElementById("submit-cart").addEventListener("click", () => addToCart(button, productID));
        document.getElementById("close-cart").addEventListener("click", () => {
            console.log("❌ Fermeture du modal...");
            document.getElementById("cart-modal").remove();
        });
    }

    async function addToCart(button, productID) {
        const selectedSize = document.getElementById("cart-size").value;
        const selectedColor = document.getElementById("cart-color").value;
        const quantity = parseInt(document.getElementById("cart-quantity").value, 10);

        console.log("➕ Ajout au panier:", { productID, selectedSize, selectedColor, quantity });

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
                    size: selectedSize,
                    color: selectedColor,
                    quantity: quantity
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log("✅ Produit ajouté au panier avec succès !");
                button.textContent = "In Cart";
                button.classList.add("in-cart");
                button.disabled = true;
                document.getElementById("cart-modal").remove();
                alert("Product added to cart successfully!");
            } else {
                throw new Error(result.message || "Failed to add to cart.");
            }
        } catch (error) {
            console.error("❌ Erreur:", error);
            alert(error.message);
            button.innerHTML = "Add to Cart";
            button.disabled = false;
        }
    }
}

/** 🔥 Exécuter une seule fois au chargement initial */
document.addEventListener("DOMContentLoaded", initializeCartSystem);

/** 🕵️‍♂️ MutationObserver : Surveille les changements dans le DOM */
const observer = new MutationObserver(() => {
    console.log("🔄 Changement détecté dans le DOM, réinitialisation du panier...");
    initializeCartSystem();
});
observer.observe(document.body, { childList: true, subtree: true });

/** 📌 popstate : Surveille les retours arrière et avant */
window.addEventListener("popstate", () => {
    console.log("🔄 Navigation détectée (popstate), réinitialisation...");
    initializeCartSystem();
});
