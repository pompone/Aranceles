const CLAVE_TEMA = "tema-aranceles";

function aplicarTema(tema) {
  const esClaro = tema === "claro";

  document.body.classList.toggle("tema-claro", esClaro);

  const icono = document.getElementById("iconoTema");
  const texto = document.getElementById("textoTema");

  if (icono) {
    icono.textContent = esClaro ? "🌙" : "☀";
  }

  if (texto) {
    texto.textContent = esClaro
      ? "Modo oscuro"
      : "Modo claro";
  }

  localStorage.setItem(CLAVE_TEMA, tema);
}

function alternarTema() {
  const temaActual =
    document.body.classList.contains("tema-claro")
      ? "claro"
      : "oscuro";

  const nuevoTema =
    temaActual === "claro"
      ? "oscuro"
      : "claro";

  aplicarTema(nuevoTema);
}

function estabilizarBotonTema(botonTema) {
  if (!botonTema) {
    return;
  }

  botonTema.style.width = "142px";
  botonTema.style.minWidth = "142px";
  botonTema.style.paddingInline = "8px";
  botonTema.style.flexShrink = "0";
}

document.addEventListener("DOMContentLoaded", () => {
  const botonTema = document.getElementById("btnTema");

  estabilizarBotonTema(botonTema);

  const temaGuardado =
    localStorage.getItem(CLAVE_TEMA) || "oscuro";

  aplicarTema(temaGuardado);

  if (botonTema) {
    botonTema.addEventListener("click", alternarTema);
  }
});