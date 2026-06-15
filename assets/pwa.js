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