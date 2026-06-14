const tourSteps = [
  {
    selector: "#codigoBusqueda",
    titulo: "Buscar por código",
    texto:
      "Escribí el código completo o una parte. Por ejemplo: FA, FD2, MR o CA3."
  },
  {
    selector: "#filtroAnexo",
    titulo: "Filtrar por anexo",
    texto:
      "Podés mostrar todos los registros o limitar la búsqueda a uno de los anexos."
  },
  {
    selector: ".table-wrap",
    titulo: "Resultados de búsqueda",
    texto:
      "Acá aparecen los análisis que coinciden con el código ingresado."
  },
  {
    selector: ".add-btn",
    titulo: "Agregar un análisis",
    texto:
      "Elegí la cantidad y presioná Agregar para incorporarlo al presupuesto.",
    opcional: true
  },
  {
    selector: ".values-card",
    titulo: "Valores vigentes",
    texto:
      "La aplicación obtiene automáticamente los valores de UA, UF y GAVET desde Google Sheets."
  },
  {
    selector: "#laboratorioSeleccionado",
    titulo: "Destino del presupuesto",
    texto:
      "Seleccioná el laboratorio o la opción Otros antes de imprimir."
  },
  {
    selector: ".budget-card",
    titulo: "Presupuesto",
    texto:
      "En este sector se muestran los análisis agregados, las cantidades y el total estimado."
  },
  {
    selector: ".actions",
    titulo: "Exportar o imprimir",
    texto:
      "Podés descargar el presupuesto en formato CSV o imprimirlo con el encabezado correspondiente."
  }
];

let tourIndex = 0;

let tourOverlay;
let tourHighlight;
let tourBox;
let tourStepNumber;
let tourTitle;
let tourText;
let tourPreviousButton;
let tourNextButton;
let tourCloseButton;

function crearTour() {
  tourOverlay = document.createElement("div");
  tourOverlay.className = "tour-overlay";

  tourHighlight = document.createElement("div");
  tourHighlight.className = "tour-highlight";

  tourBox = document.createElement("div");
  tourBox.className = "tour-box";
  tourBox.setAttribute("role", "dialog");
  tourBox.setAttribute("aria-modal", "true");
  tourBox.setAttribute("aria-label", "Ayuda guiada");

  tourBox.innerHTML = `
    <span class="tour-step-number"></span>

    <h3 class="tour-title"></h3>

    <p class="tour-text"></p>

    <div class="tour-actions">
      <button
        type="button"
        class="tour-button tour-button-close"
        id="tourCerrar"
      >
        Cerrar
      </button>

      <div class="tour-actions-group">
        <button
          type="button"
          class="tour-button tour-button-secondary"
          id="tourAnterior"
        >
          Anterior
        </button>

        <button
          type="button"
          class="tour-button tour-button-primary"
          id="tourSiguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(tourOverlay);
  document.body.appendChild(tourHighlight);
  document.body.appendChild(tourBox);

  tourStepNumber =
    tourBox.querySelector(".tour-step-number");

  tourTitle =
    tourBox.querySelector(".tour-title");

  tourText =
    tourBox.querySelector(".tour-text");

  tourPreviousButton =
    tourBox.querySelector("#tourAnterior");

  tourNextButton =
    tourBox.querySelector("#tourSiguiente");

  tourCloseButton =
    tourBox.querySelector("#tourCerrar");

  tourPreviousButton.addEventListener(
    "click",
    mostrarPasoAnterior
  );

  tourNextButton.addEventListener(
    "click",
    mostrarPasoSiguiente
  );

  tourCloseButton.addEventListener(
    "click",
    cerrarTour
  );

  tourOverlay.addEventListener(
    "click",
    cerrarTour
  );

  window.addEventListener(
    "resize",
    actualizarPosicionTour
  );

  window.addEventListener(
    "scroll",
    actualizarPosicionTour,
    true
  );

  document.addEventListener(
    "keydown",
    manejarTecladoTour
  );
}

function iniciarTour() {
  if (!tourOverlay) {
    crearTour();
  }

  tourIndex = 0;

  document.body.classList.add("tour-open");

  tourOverlay.classList.add("active");
  tourHighlight.classList.add("active");
  tourBox.classList.add("active");

  mostrarPasoActual();
}

function cerrarTour() {
  document.body.classList.remove("tour-open");

  tourOverlay?.classList.remove("active");
  tourHighlight?.classList.remove("active");
  tourBox?.classList.remove("active");
}

function buscarElementoPaso(paso) {
  const elemento =
    document.querySelector(paso.selector);

  if (!elemento && paso.opcional) {
    return null;
  }

  return elemento;
}

function mostrarPasoActual() {
  const paso = tourSteps[tourIndex];
  const elemento = buscarElementoPaso(paso);

  if (!elemento && paso.opcional) {
    mostrarPasoSiguiente();
    return;
  }

  if (!elemento) {
    console.warn(
      `No se encontró el elemento del tour: ${paso.selector}`
    );
    return;
  }

  elemento.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });

  window.setTimeout(() => {
    tourStepNumber.textContent =
      `Paso ${tourIndex + 1} de ${tourSteps.length}`;

    tourTitle.textContent =
      paso.titulo;

    tourText.textContent =
      paso.texto;

    tourPreviousButton.disabled =
      tourIndex === 0;

    tourNextButton.textContent =
      tourIndex === tourSteps.length - 1
        ? "Finalizar"
        : "Siguiente";

    posicionarHighlight(elemento);
    posicionarCaja(elemento);
  }, 350);
}

function mostrarPasoSiguiente() {
  if (tourIndex >= tourSteps.length - 1) {
    cerrarTour();
    return;
  }

  tourIndex++;
  mostrarPasoActual();
}

function mostrarPasoAnterior() {
  if (tourIndex <= 0) {
    return;
  }

  tourIndex--;
  mostrarPasoActual();
}

function posicionarHighlight(elemento) {
  const rect =
    elemento.getBoundingClientRect();

  const margen = 8;

  tourHighlight.style.top =
    `${Math.max(4, rect.top - margen)}px`;

  tourHighlight.style.left =
    `${Math.max(4, rect.left - margen)}px`;

  tourHighlight.style.width =
    `${Math.min(
      window.innerWidth - 8,
      rect.width + margen * 2
    )}px`;

  tourHighlight.style.height =
    `${rect.height + margen * 2}px`;
}

function posicionarCaja(elemento) {
  if (window.innerWidth <= 600) {
    tourBox.style.top = "auto";
    tourBox.style.right = "16px";
    tourBox.style.bottom = "16px";
    tourBox.style.left = "16px";
    return;
  }

  const rect =
    elemento.getBoundingClientRect();

  const anchoCaja =
    tourBox.offsetWidth || 390;

  const altoCaja =
    tourBox.offsetHeight || 220;

  const margen = 18;

  let top =
    rect.bottom + margen;

  let left =
    rect.left;

  if (
    top + altoCaja >
    window.innerHeight - margen
  ) {
    top =
      rect.top - altoCaja - margen;
  }

  if (top < margen) {
    top = margen;
  }

  if (
    left + anchoCaja >
    window.innerWidth - margen
  ) {
    left =
      window.innerWidth -
      anchoCaja -
      margen;
  }

  if (left < margen) {
    left = margen;
  }

  tourBox.style.top =
    `${top}px`;

  tourBox.style.left =
    `${left}px`;

  tourBox.style.right =
    "auto";

  tourBox.style.bottom =
    "auto";
}

function actualizarPosicionTour() {
  if (!tourBox?.classList.contains("active")) {
    return;
  }

  const paso =
    tourSteps[tourIndex];

  const elemento =
    buscarElementoPaso(paso);

  if (!elemento) {
    return;
  }

  posicionarHighlight(elemento);
  posicionarCaja(elemento);
}

function manejarTecladoTour(evento) {
  if (!tourBox?.classList.contains("active")) {
    return;
  }

  if (evento.key === "Escape") {
    cerrarTour();
  }

  if (evento.key === "ArrowRight") {
    mostrarPasoSiguiente();
  }

  if (evento.key === "ArrowLeft") {
    mostrarPasoAnterior();
  }
}

window.iniciarTour = iniciarTour;

document.addEventListener("DOMContentLoaded", () => {
  const btnAyuda = document.getElementById("btnAyuda");

  if (btnAyuda) {
    btnAyuda.addEventListener("click", iniciarTour);
  }
});