function normalizarTextoBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function filtrarYRenderizarMejorado() {
  const texto = $("codigoBusqueda").value.trim();
  const qCodigo = normalizarCodigo(texto);
  const qTexto = normalizarTextoBusqueda(texto);
  const anexo = $("filtroAnexo").value;

  if (!qTexto) {
    renderResultados([], { estado: "inicial" });
    return;
  }

  const resultados = state.catalogo.filter((item) => {
    const codigo = String(item.codigoNormalizado || "");
    const descripcion = normalizarTextoBusqueda(item.descripcion);

    const matchCodigo = codigo.includes(qCodigo);
    const matchDescripcion = descripcion.includes(qTexto);
    const matchAnexo = anexo === "TODOS" || item.anexo === anexo;

    return (matchCodigo || matchDescripcion) && matchAnexo;
  });

  resultados.sort((a, b) => {
    const codigoA = String(a.codigoNormalizado || "");
    const codigoB = String(b.codigoNormalizado || "");
    const descripcionA = normalizarTextoBusqueda(a.descripcion);
    const descripcionB = normalizarTextoBusqueda(b.descripcion);

    const prioridad = (codigo, descripcion) => {
      if (codigo === qCodigo) return 0;
      if (descripcion === qTexto) return 1;
      if (codigo.startsWith(qCodigo)) return 2;
      if (descripcion.startsWith(qTexto)) return 3;
      return 4;
    };

    return (
      prioridad(codigoA, descripcionA) - prioridad(codigoB, descripcionB) ||
      descripcionA.localeCompare(descripcionB, "es") ||
      codigoA.localeCompare(codigoB)
    );
  });

  renderResultados(resultados, {
    estado: "busqueda",
    texto
  });

  const ayuda = $("ayudaResultados");
  if (ayuda) {
    ayuda.textContent = resultados.length
      ? "Se muestran coincidencias por código o descripción. Usá Agregar en los análisis que necesitás."
      : "No encontré coincidencias. Probá con otro código o con una palabra de la descripción.";
  }
}

const inputBusquedaAnalisis = $("codigoBusqueda");
const selectAnexoBusqueda = $("filtroAnexo");

inputBusquedaAnalisis.addEventListener("input", filtrarYRenderizarMejorado);
selectAnexoBusqueda.addEventListener("change", filtrarYRenderizarMejorado);

document.querySelectorAll(".chip").forEach((boton) => {
  boton.addEventListener("click", () => {
    window.setTimeout(filtrarYRenderizarMejorado, 0);
  });
});

$("limpiarBusqueda").addEventListener("click", () => {
  window.setTimeout(filtrarYRenderizarMejorado, 0);
});

filtrarYRenderizarMejorado();
