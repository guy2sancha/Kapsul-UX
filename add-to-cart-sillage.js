function initializeLocalCartSystem() {
  console.log("🛒 Initialisation du panier local...");
  const buttons = document.querySelectorAll(".custom-add-to-cart-button");

  if (!buttons.length) {
    console.log("⚠️ Aucun bouton détecté, attente du DOM via observer...");
    return;
  }

  buttons.forEach(button => {
    const productID = button.getAttribute("data-product-id");
    const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

    if (!button.dataset.listenerAdded) {
      console.log("🎯 Attaching click handler to:", productID);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        openLocalCartModal(button, productID, maxQuantity);
      });
      button.dataset.listenerAdded = "true";
    }
  });
}

// 🔁 MutationObserver + Delay = combo antifail pour Softr
function waitAndObserveCartButtons() {
  initializeLocalCartSystem(); // appel initial

  const observer = new MutationObserver(() => {
    initializeLocalCartSystem(); // relance à chaque changement DOM
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Sécurité supplémentaire : relance après délai
  setTimeout(() => {
    console.log("⏳ Relance forcée après timeout...");
    initializeLocalCartSystem();
  }, 1500);
}

document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
