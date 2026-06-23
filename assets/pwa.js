if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registro = await navigator.serviceWorker.register(
        "./service-worker.js"
      );

      console.log(
        "Service Worker registrado correctamente:",
        registro.scope
      );
    } catch (error) {
      console.error(
        "No se pudo registrar el Service Worker:",
        error
      );
    }
  });
}

const scriptBusqueda = document.createElement("script");
scriptBusqueda.src = "assets/busqueda-analisis.js";
scriptBusqueda.defer = true;
document.body.appendChild(scriptBusqueda);

const tituloPrincipal = document.querySelector(".brand-block h1");
const subtituloPrincipal = document.querySelector(".brand-block p");
const tituloFiltro = document.querySelector(".search-section .section-title h2");
const etiquetaBusqueda = document.querySelector("label[for='codigoBusqueda'] span, .main-field span");
const campoBusqueda = document.getElementById("codigoBusqueda");
const ayudaBusqueda = document.getElementById("ayudaResultados");

if (tituloPrincipal) {
  tituloPrincipal.textContent = "Buscador de análisis por código o nombre";
}

if (subtituloPrincipal) {
  subtituloPrincipal.textContent =
    "Filtrá los análisis por código o por descripción. Después decidí cuáles agregar al presupuesto.";
}

if (tituloFiltro) {
  tituloFiltro.textContent = "Filtrar por código o análisis";
}

if (etiquetaBusqueda) {
  etiquetaBusqueda.textContent = "Código o nombre del análisis";
}

if (campoBusqueda) {
  campoBusqueda.placeholder = "Ej: FA1, Dureza, Fósforo...";
}

if (ayudaBusqueda) {
  ayudaBusqueda.textContent =
    "Escribí un código o parte del nombre del análisis.";
}
