(() => {
  const tituloPrincipal = document.querySelector(".brand-block h1");

  if (tituloPrincipal) {
    tituloPrincipal.textContent = "Buscador de Análisis";
  }

  const inputOriginal = document.getElementById("codigoBusqueda");
  const selectOriginal = document.getElementById("filtroAnexo");

  if (!inputOriginal || !selectOriginal) {
    return;
  }

  const inputBusqueda = inputOriginal.cloneNode(true);
  const selectAnexo = selectOriginal.cloneNode(true);

  inputOriginal.replaceWith(inputBusqueda);
  selectOriginal.replaceWith(selectAnexo);

  function normalizarTextoBusqueda(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  function buscar() {
    const texto = inputBusqueda.value.trim();
    const qCodigo = normalizarCodigo(texto);
    const qTexto = normalizarTextoBusqueda(texto);
    const anexo = selectAnexo.value;

    if (!qTexto) {
      renderResultados([], {
        estado: "inicial"
      });
      return;
    }

    const resultados = state.catalogo.filter((item) => {
      const codigo = String(item.codigoNormalizado || "");
      const descripcion = normalizarTextoBusqueda(item.descripcion);

      const coincideCodigo = codigo.includes(qCodigo);
      const coincideDescripcion = descripcion.includes(qTexto);
      const coincideAnexo = anexo === "TODOS" || item.anexo === anexo;

      return (
        (coincideCodigo || coincideDescripcion) &&
        coincideAnexo
      );
    });

    resultados.sort((a, b) => {
      const descripcionA = normalizarTextoBusqueda(a.descripcion);
      const descripcionB = normalizarTextoBusqueda(b.descripcion);

      const aEmpieza = descripcionA.startsWith(qTexto) ? 0 : 1;
      const bEmpieza = descripcionB.startsWith(qTexto) ? 0 : 1;

      return (
        aEmpieza - bEmpieza ||
        descripcionA.localeCompare(descripcionB, "es")
      );
    });

    renderResultados(resultados, {
      estado: "busqueda",
      texto
    });

    const ayuda = document.getElementById("ayudaResultados");

    if (ayuda) {
      ayuda.textContent = resultados.length
        ? "Se muestran coincidencias por código o descripción. Usá Agregar en los análisis que necesitás."
        : "No encontré coincidencias. Probá con otro código o con una palabra de la descripción.";
    }
  }

  inputBusqueda.addEventListener("input", buscar);
  selectAnexo.addEventListener("change", buscar);

  document.querySelectorAll(".chip").forEach((boton) => {
    boton.addEventListener("click", () => {
      inputBusqueda.value = boton.dataset.code || "";
      buscar();
      inputBusqueda.focus();
    });
  });

  const botonLimpiar = document.getElementById("limpiarBusqueda");

  if (botonLimpiar) {
    botonLimpiar.addEventListener("click", () => {
      inputBusqueda.value = "";
      selectAnexo.value = "TODOS";
      buscar();
    });
  }

  buscar();
})();
