document.addEventListener("DOMContentLoaded", async () => {
  const buttons = document.querySelectorAll(".custom-add-to-cart-button");
  const API_URL = "https://kapsul-cart-backend-production.up.railway.app"; 
  const userToken = localStorage.getItem("userToken"); // Correction ici (minuscule)

  if (!userToken) {
    buttons.forEach(button => {
      button.addEventListener("click", (event) => {
        event.preventDefault(); // Empêche tout comportement par défaut (comme ajouter "#" à l'URL)
        showModal('cartModal'); // Utilise ta modale existante pour le login
      });
    });
    return;
}

  async function checkCart() {
    try {
      const response = await fetch(`${API_URL}/cart?token=${userToken}`);
      const cartData = await response.json();
      return cartData.items.map(item => item["Product ID"]); // Correction du mapping
    } catch (error) {
      console.error("Error checking cart:", error);
      return [];
    }
  }

  const cartProductIDs = await checkCart();

  buttons.forEach(button => {
    const productID = button.getAttribute("data-product-id");

    if (cartProductIDs.includes(productID)) {
      button.textContent = "✔ In Cart";
      button.classList.add("in-cart");
      button.disabled = true;
    }

    button.addEventListener("click", () => openCartModal(button, productID));
  });

  function openCartModal(button, productID) {
    const sizes = button.getAttribute("data-sizes").split(",").map(size => `<option value="${size.trim()}">${size.trim()}</option>`).join('');
    const colors = button.getAttribute("data-colors").split(",").map(color => `<option value="${color.trim()}">${color.trim()}</option>`).join('');

    const modalHTML = `
      <div id="cart-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 400px; width: 90%;">
          <h2 style="text-align: center;">Add to Cart</h2>
          <label for="cart-size">Size:</label>
          <select id="cart-size" style="width: 100%; padding: 10px;">${sizes}</select>
          <label for="cart-color">Color:</label>
          <select id="cart-color" style="width: 100%; padding: 10px;">${colors}</select>
          <label for="cart-quantity">Quantity:</label>
          <input type="number" id="cart-quantity" min="1" value="1" style="width: 100%; padding: 10px;">
          <button id="submit-cart" style="width: 100%; padding: 10px; background-color: #0D26FF; color: white; font-weight: bold; border: none; border-radius: 5px; cursor: pointer;">Add to Cart</button>
          <button id="close-cart" style="width: 100%; padding: 10px; background-color: #ccc; color: black; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("submit-cart").addEventListener("click", () => addToCart(button, productID));
    document.getElementById("close-cart").addEventListener("click", () => document.getElementById("cart-modal").remove());
  }

  async function addToCart(button, productID) {
    const selectedSize = document.getElementById("cart-size").value;
    const selectedColor = document.getElementById("cart-color").value;
    const quantity = parseInt(document.getElementById("cart-quantity").value, 10);

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Adding...`;

    try {
      const response = await fetch(`${API_URL}/cart/add`, { // Correction ici
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}` // Ajout d'une autorisation si besoin
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
        button.textContent = "✔ In Cart";
        button.classList.add("in-cart");
        button.disabled = true;
        document.getElementById("cart-modal").remove();
        alert("Product added to cart successfully!");
      } else {
        throw new Error(result.message || "Failed to add to cart.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
      button.innerHTML = "Add to Cart";
      button.disabled = false;
    }
  }
});
