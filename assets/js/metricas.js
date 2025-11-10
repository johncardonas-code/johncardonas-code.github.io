(() => {
  // --- Elementos base ---
  const fileInput = document.getElementById("metrics-file");
  const loadTestsBtn = document.getElementById("metrics-load-tests");
  const recalcBtn = document.getElementById("metrics-recalc");

  const weightInputs = {
    performance: document.getElementById("weight-performance"),
    accessibility: document.getElementById("weight-accessibility"),
    "best-practices": document.getElementById("weight-best-practices"),
    seo: document.getElementById("weight-seo"),
  };

  // Tarjetas de resultados (performance, accessibility, best-practices, seo)
  const cards = {};
  document.querySelectorAll(".metrics-card").forEach((card) => {
    const key = card.dataset.metric;
    cards[key] = {
      bar: card.querySelector(".metrics-bar-fill"),
      text: card.querySelector(".metrics-score-text"),
    };
  });

  const totalScoreSpan = document.getElementById("metrics-total-score");
  const weightsInfo = document.getElementById("metrics-weights-info");

  // Valores actuales (0–100)
  const scores = {
    performance: 0,
    accessibility: 0,
    "best-practices": 0,
    seo: 0,
  };

  // Obtener peso numérico seguro
  function getWeight(key) {
    const val = Number(weightInputs[key]?.value);
    return Number.isFinite(val) && val >= 0 ? val : 0;
  }

  // Actualiza barras, textos e índice global
  function updateUI() {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const key of Object.keys(scores)) {
      const score = scores[key] || 0;
      const w = getWeight(key);

      totalWeight += w;
      weightedSum += score * w;

      const card = cards[key];
      if (card) {
        const clamped = Math.max(0, Math.min(score, 100));
        card.bar.style.width = clamped + "%";
        card.text.textContent = Math.round(clamped) + " / 100";
      }
    }

    if (totalWeight <= 0) totalWeight = 1;
    const index = weightedSum / totalWeight;
    totalScoreSpan.textContent = index.toFixed(1);

    if (weightsInfo) {
      weightsInfo.textContent =
        `Pesos → Performance: ${getWeight("performance")}%` +
        `, Accesibilidad: ${getWeight("accessibility")}%` +
        `, Best Practices: ${getWeight("best-practices")}%` +
        `, SEO: ${getWeight("seo")}%`;
    }
  }

  // Leer JSON de Lighthouse y extraer categorías
  function parseLighthouseJson(json) {
    try {
      const cat = json.categories || {};

      scores.performance = (cat.performance?.score ?? 0) * 100;
      scores.accessibility = (cat.accessibility?.score ?? 0) * 100;
      scores["best-practices"] = (cat["best-practices"]?.score ?? 0) * 100;
      scores.seo = (cat.seo?.score ?? 0) * 100;

      updateUI();
    } catch (err) {
      console.error("Error al interpretar JSON de Lighthouse", err);
      alert(
        "No se pudo interpretar el archivo JSON. Verifica que sea un reporte de Lighthouse."
      );
    }
  }

  // Cargar archivo local
  fileInput?.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        parseLighthouseJson(json);
      } catch (err) {
        console.error(err);
        alert("El archivo no es un JSON válido.");
      }
    };
    reader.readAsText(file, "utf-8");
  });

  // Cargar archivo de prueba desde /tests
  loadTestsBtn?.addEventListener("click", async () => {
    try {
      const res = await fetch("/tests/lighthouse-report.json");
      if (!res.ok) throw new Error("No se pudo cargar el archivo de prueba.");
      const json = await res.json();
      parseLighthouseJson(json);
    } catch (err) {
      console.error(err);
      alert(
        "No se pudo cargar /tests/lighthouse-report.json. Verifica la ruta o coloca el archivo en esa carpeta."
      );
    }
  });

  // Recalcular índice usando los pesos actuales
  recalcBtn?.addEventListener("click", () => {
    updateUI();
  });

  // Estado inicial
  updateUI();
})();
