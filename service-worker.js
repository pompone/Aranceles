const APP_VERSION = "1.0.1";
const CACHE_NAME = `aranceles-${APP_VERSION}`;

const ARCHIVOS_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./assets/styles.css",
  "./assets/tour.css",
  "./assets/header-fix.css?v=1.0.1",

  "./assets/data.js",
  "./assets/app.js",
  "./assets/tour.js",
  "./assets/tema.js",
  "./assets/pwa.js",

  "./assets/logo-rionegro.jpg",
  "./assets/favicon.ico",

  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

/* =========================================================
   INSTALACIÓN
   Descarga los archivos de la versión actual
   ========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

/* =========================================================
   ACTIVACIÓN
   Elimina las cachés de versiones anteriores
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombresCache) =>
        Promise.all(
          nombresCache
            .filter((nombre) => nombre !== CACHE_NAME)
            .map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   PETICIONES
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  /*
   * Las solicitudes externas, como Google Sheets,
   * siguen consultándose directamente por Internet.
   */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * Para la navegación intentamos obtener primero
   * la versión más reciente de Internet.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put("./index.html", copia);
          });

          return respuesta;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  /*
   * Para CSS, JS, imágenes y demás archivos:
   * usamos primero la caché y recurrimos a Internet
   * cuando el archivo no está guardado.
   */
  event.respondWith(
    caches.match(request).then((respuestaCache) => {
      if (respuestaCache) {
        return respuestaCache;
      }

      return fetch(request).then((respuestaRed) => {
        if (
          !respuestaRed ||
          respuestaRed.status !== 200 ||
          respuestaRed.type !== "basic"
        ) {
          return respuestaRed;
        }

        const copia = respuestaRed.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, copia);
        });

        return respuestaRed;
      });
    })
  );
});
