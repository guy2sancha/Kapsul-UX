document.addEventListener("DOMContentLoaded", async () => {
    const recordId = new URLSearchParams(window.location.search).get("recordId");

    if (!recordId) {
        console.error("⚠️ Aucun recordId trouvé.");
        return;
    }

    const airtableBaseID = "appgcWn4A6roDqCvZ";
    const airtableAPIKey = "patO9rpamPXlUl187.04762c9db441a31ff90683adf7c1e946442befe597322eacdec6965f9f14c910";
    const tableName = "tbl7hQpZhlPFJQLeT";

    const cacheKey = `founderData_${recordId}`;
    const cacheTimeKey = `founderDataTime_${recordId}`;
    const cacheDuration = 10 * 60 * 1000; // ⏳ Cache pendant 10 minutes
    const now = Date.now();

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime && now - cachedTime < cacheDuration) {
        console.log("📌 Chargement depuis le cache...");
        displayData(JSON.parse(cachedData));
        return;
    }

    try {
        console.log("🔄 Chargement depuis l'API Airtable...");
        const response = await fetch(`https://api.airtable.com/v0/${airtableBaseID}/${tableName}/${recordId}`, {
            headers: { Authorization: `Bearer ${airtableAPIKey}` }
        });

        if (!response.ok) throw new Error("Réponse API invalide");

        const data = await response.json();
        const fields = data.fields;

        localStorage.setItem(cacheKey, JSON.stringify(fields));
        localStorage.setItem(cacheTimeKey, now);

        displayData(fields);
    } catch (error) {
        console.error("❌ Erreur API :", error);

        if (cachedData) {
            console.log("📌 Utilisation du cache en secours...");
            displayData(JSON.parse(cachedData));
        } else {
            console.error("⚠️ Aucune donnée disponible.");
        }
    }
});

function displayData(fields) {
    document.getElementById("founder-name").textContent = fields["Founder Name"] || "Nom inconnu";
    document.getElementById("founder-intro").textContent = fields["Founder Introduction"] || "";
    document.getElementById("founder-photo").src = fields["Founder Photo"] ? fields["Founder Photo"][0].url : "https://via.placeholder.com/150";
    document.getElementById("founder-location").textContent = fields["Founder Location"] || "Lieu inconnu";
    document.getElementById("founder-experience").textContent = fields["Founder Experience"] || "Expérience non précisée";

    // ✨ Appliquer l'effet Blur + Fade-in
    document.getElementById("founder-block").style.opacity = "1";
    document.getElementById("founder-block").style.filter = "blur(0)";
}
