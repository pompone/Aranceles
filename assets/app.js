const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1gQmH3CKwISJKg4YUGKuEMgjG_HZRETM85JzdP7sNjjE/edit?usp=sharing";

const MODO_PRUEBA_AVISO = false;

const state = {
  catalogo: Array.isArray(window.CATALOGO_INICIAL) ? window.CATALOGO_INICIAL : [],
  valores: { ...(window.VALORES_INICIALES || {}) },
  presupuesto: []
};

const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

function normalizarCodigo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function valorUnidad(tipo) {
  return Number(state.valores[tipo] || 0);
}

function subtotalItem(item, cantidad = 1) {
  return Number(item.unidades || 0) * valorUnidad(item.tipoUnidad) * Number(cantidad || 0);
}

function aplicarValores(nuevosValores, fuenteTexto = 'Valores actualizados') {
  const camposNumericos = ['UA', 'UF', 'GAVET', 'NAFTA', 'DOLAR'];

  camposNumericos.forEach(campo => {
    if (nuevosValores[campo] !== undefined && nuevosValores[campo] !== '') {
      state.valores[campo] = Number(String(nuevosValores[campo]).replace(',', '.')) || 0;
    }
  });

  ['mes', 'anio', 'fechaVigencia', 'fuente'].forEach(campo => {
    if (nuevosValores[campo] !== undefined && nuevosValores[campo] !== '') {
      state.valores[campo] = nuevosValores[campo];
    }
  });

  sincronizarInputsValores();

  const periodo = `${state.valores.mes || ''} ${state.valores.anio || ''}`.trim();
  $('periodoValores').textContent = periodo || 'Valores';

  if ($('estadoDrive')) {
    $('estadoDrive').textContent = fuenteTexto;
  }

  filtrarYRenderizar();
  renderPresupuesto();
}

function sincronizarInputsValores() {
  ['UA', 'UF', 'GAVET'].forEach(tipo => {
    const input = $('valor' + tipo);
    if (input) input.value = state.valores[tipo] ?? 0;
  });
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function parseValoresCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error('El CSV está vacío.');
  }

  const rows = lines.map(parseCsvLine);
  const headers = rows[0].map(h => h.toLowerCase());

  const claveIdx = headers.indexOf('clave');
  const valorIdx = headers.indexOf('valor');

  if (claveIdx === -1 || valorIdx === -1) {
    throw new Error('El CSV debe tener las columnas clave y valor.');
  }

  const valores = {};

  rows.slice(1).forEach(row => {
    const clave = String(row[claveIdx] || '').trim();
    const valor = String(row[valorIdx] || '').trim();

    if (!clave) return;

    const claveNormalizada = clave.toUpperCase();

    if (['UA', 'UF', 'GAVET', 'NAFTA', 'DOLAR'].includes(claveNormalizada)) {
      valores[claveNormalizada] = valor;
    } else {
      valores[clave] = valor;
    }
  });

  return valores;
}

function obtenerIdGoogleSheet(url) {
  const match = String(url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function obtenerGidGoogleSheet(url) {
  const texto = String(url || '');
  const match = texto.match(/[?#&]gid=(\d+)/) || texto.match(/#gid=(\d+)/);
  return match ? match[1] : '0';
}

function convertirUrlACsv(url) {
  const id = obtenerIdGoogleSheet(url);

  if (!id) {
    return url;
  }

  const gid = obtenerGidGoogleSheet(url);
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function convertirTablaGoogleAValores(table) {
  if (!table || !Array.isArray(table.rows) || !table.rows.length) {
    throw new Error('El Google Sheet no devolvió filas. Revisá que esté compartido como lectura pública.');
  }

  const matriz = table.rows.map(row => {
    return (row.c || []).map(cell => {
      if (!cell) return '';
      return cell.f ?? cell.v ?? '';
    });
  });

  const encabezados = matriz[0].map(x => String(x).trim().toLowerCase());

  let claveIdx = encabezados.indexOf('clave');
  let valorIdx = encabezados.indexOf('valor');

  let inicio = 1;

  if (claveIdx === -1 || valorIdx === -1) {
    claveIdx = 0;
    valorIdx = 1;
    inicio = 0;
  }

  const valores = {};

  matriz.slice(inicio).forEach(row => {
    const clave = String(row[claveIdx] || '').trim();
    const valor = String(row[valorIdx] || '').trim();

    if (!clave) return;

    const claveNormalizada = clave.toUpperCase();

    if (['UA', 'UF', 'GAVET', 'NAFTA', 'DOLAR'].includes(claveNormalizada)) {
      valores[claveNormalizada] = valor;
    } else {
      valores[clave] = valor;
    }
  });

  return valores;
}

function cargarGoogleSheetPorJsonp(url) {
  return new Promise((resolve, reject) => {
    const id = obtenerIdGoogleSheet(url);

    if (!id) {
      reject(new Error('No parece ser una URL de Google Sheets.'));
      return;
    }

    const gid = obtenerGidGoogleSheet(url);
    const callbackName = '__sheetCallback_' + Date.now();
    const script = document.createElement('script');

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheets no respondió. Verificá permisos del archivo.'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      try {
        const valores = convertirTablaGoogleAValores(data.table);
        cleanup();
        resolve(valores);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('No se pudo conectar con Google Sheets.'));
    };

    script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?gid=${gid}&tqx=responseHandler:${callbackName}`;
    document.body.appendChild(script);
  });
}

async function cargarValoresDesdeDrive() {
  const urlOriginal = GOOGLE_SHEET_URL;

  try {
    if ($('estadoDrive')) {
      $('estadoDrive').textContent = 'Leyendo valores vigentes...';
    }

    let valores;

    try {
      const csvUrl = convertirUrlACsv(urlOriginal);
      const response = await fetch(csvUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`No se pudo leer CSV (${response.status}).`);
      }

      const csv = await response.text();
      valores = parseValoresCsv(csv);
    } catch (_) {
      valores = await cargarGoogleSheetPorJsonp(urlOriginal);
    }

    aplicarValores(
      valores,
      `Valores vigentes cargados correctamente${valores.fuente ? ' - ' + valores.fuente : ''}.`
    );

    verificarActualizacionAranceles();
  } catch (error) {
    console.error(error);

    if ($('estadoDrive')) {
      $('estadoDrive').textContent = 'No se pudo leer Google Sheet. Se usan los valores cargados por defecto.';
    }

    sincronizarInputsValores();
    renderPresupuesto();
  }
}

function normalizarMes(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function nombreMesActual() {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];

  const hoy = new Date();
  return meses[hoy.getMonth()];
}

function verificarActualizacionAranceles() {
  const hoy = new Date();
  const diaActual = hoy.getDate();

  const mesActual = normalizarMes(nombreMesActual());
  const mesLeido = normalizarMes(state.valores.mes);

  const estaEnPrimerosDias = MODO_PRUEBA_AVISO || diaActual < 5;
  const mesNoActualizado = mesLeido && mesLeido !== mesActual;

  if (estaEnPrimerosDias && mesNoActualizado) {
    mostrarAvisoAranceles();
  }
}

function mostrarAvisoAranceles() {
  const aviso = $('avisoAranceles');
  if (!aviso) return;

  aviso.classList.remove('hidden');
}

function cerrarAvisoAranceles() {
  const aviso = $('avisoAranceles');
  if (!aviso) return;

  aviso.classList.add('hidden');
}

function init() {
  const cerrarAvisoBtn = $('cerrarAvisoAranceles');

  if (cerrarAvisoBtn) {
    cerrarAvisoBtn.addEventListener('click', cerrarAvisoAranceles);
  }

  $('totalCatalogo').textContent = state.catalogo.length;

  $('periodoValores').textContent = `${state.valores.mes || ''} ${state.valores.anio || ''}`.trim() || 'Valores';

  sincronizarInputsValores();

  ['UA', 'UF', 'GAVET'].forEach(tipo => {
    const input = $('valor' + tipo);

    if (!input) return;

    input.addEventListener('input', () => {
      state.valores[tipo] = Number(input.value || 0);
      filtrarYRenderizar();
      renderPresupuesto();
    });
  });

  $('codigoBusqueda').addEventListener('input', filtrarYRenderizar);

  $('filtroAnexo').addEventListener('change', filtrarYRenderizar);

  $('limpiarBusqueda').addEventListener('click', () => {
    $('codigoBusqueda').value = '';
    $('filtroAnexo').value = 'TODOS';
    filtrarYRenderizar();
  });

  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      $('codigoBusqueda').value = btn.dataset.code;
      filtrarYRenderizar();
      $('codigoBusqueda').focus();
    });
  });

  $('restaurarValores').addEventListener('click', () => {
    aplicarValores(
      { ...(window.VALORES_INICIALES || {}) },
      'Fuente actual: valores originales cargados en la app.'
    );
  });

  $('vaciarPresupuesto').addEventListener('click', () => {
    state.presupuesto = [];
    renderPresupuesto();
  });

  $('exportarCsv').addEventListener('click', exportarCSV);

  $('imprimir').addEventListener('click', () => {
    if (!state.presupuesto.length) {
      alert('Primero agregá al menos un análisis al presupuesto.');
      return;
    }

    window.print();
  });

  filtrarYRenderizar();
  renderPresupuesto();
  cargarValoresDesdeDrive();
}

function filtrarYRenderizar() {
  const texto = $('codigoBusqueda').value.trim();
  const q = normalizarCodigo(texto);
  const anexo = $('filtroAnexo').value;

  if (!q) {
    renderResultados([], { estado: 'inicial' });
    return;
  }

  let resultados = state.catalogo.filter(item => {
    const matchCodigo = item.codigoNormalizado.includes(q);
    const matchAnexo = anexo === 'TODOS' || item.anexo === anexo;
    return matchCodigo && matchAnexo;
  });

  resultados.sort((a, b) => {
    const aExacto = a.codigoNormalizado === q ? 0 : 1;
    const bExacto = b.codigoNormalizado === q ? 0 : 1;
    const aInicio = a.codigoNormalizado.startsWith(q) ? 0 : 1;
    const bInicio = b.codigoNormalizado.startsWith(q) ? 0 : 1;

    return aExacto - bExacto ||
      aInicio - bInicio ||
      a.codigoNormalizado.localeCompare(b.codigoNormalizado);
  });

  renderResultados(resultados, { estado: 'busqueda', texto });
}

function renderResultados(resultados, meta) {
  const tbody = $('tablaResultados');
  const contador = $('contadorResultados');

  if (meta.estado === 'inicial') {
    $('textoResultados').textContent = 'Sin búsqueda activa';
    $('ayudaResultados').textContent = 'Escribí parte del código para filtrar los análisis del Excel.';
    contador.textContent = '0 resultados';

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty">
          No se ha encontrado nada todavía.
        </td>
      </tr>
    `;

    return;
  }

  $('textoResultados').textContent = `Filtro aplicado: ${meta.texto}`;
  $('ayudaResultados').textContent = 'Se muestran los códigos coincidentes. Usá el botón Agregar solo en los análisis que necesitás.';
  contador.textContent = `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}`;

  if (!resultados.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty">
          No encontré códigos coincidentes. Probá sin espacios: por ejemplo FA1, MR10, CA3.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = resultados.map(item => {
    const precio = subtotalItem(item, 1);
    const id = item.codigoNormalizado;

    return `
      <tr>
        <td>
          <span class="code">${escapeHtml(item.codigo)}</span>
          <br>
          <span class="muted small">Fila ${item.filaExcel || '-'}</span>
        </td>
        <td class="description">
          ${escapeHtml(item.descripcion)}
          <br>
          <span class="muted small">${escapeHtml(item.categoria || '')}</span>
        </td>
        <td>${escapeHtml(item.anexo || '')}</td>
        <td>${escapeHtml(item.tipoUnidad || '')}</td>
        <td>${Number(item.unidades || 0).toLocaleString('es-AR')}</td>
        <td class="price">${money.format(precio)}</td>
        <td>
          <input class="qty" id="qty-${id}" type="number" min="1" step="1" value="1">
        </td>
        <td>
          <button class="add-btn" type="button" onclick="agregarItem('${id}')">Agregar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function agregarItem(codigoNormalizado) {
  const item = state.catalogo.find(x => x.codigoNormalizado === codigoNormalizado);

  if (!item) return;

  const input = $('qty-' + codigoNormalizado);
  const cantidad = Math.max(1, Number(input?.value || 1));

  const existente = state.presupuesto.find(x => x.codigoNormalizado === codigoNormalizado);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    state.presupuesto.push({ ...item, cantidad });
  }

  renderPresupuesto();
}

window.agregarItem = agregarItem;

function renderPresupuesto() {
  const cont = $('listaPresupuesto');

  if (!state.presupuesto.length) {
    cont.innerHTML = '<div class="empty-box">Todavía no agregaste análisis.</div>';
    $('totalPresupuesto').textContent = money.format(0);
    return;
  }

  cont.innerHTML = state.presupuesto.map((item, idx) => {
    const subtotal = subtotalItem(item, item.cantidad);

    return `
      <article class="budget-item">
        <div class="budget-top">
          <strong>${escapeHtml(item.codigo)}</strong>
          <strong>${money.format(subtotal)}</strong>
        </div>

        <div class="budget-meta">
          ${escapeHtml(item.descripcion)}
          <br>
          ${item.unidades} ${item.tipoUnidad} × ${money.format(valorUnidad(item.tipoUnidad))}
        </div>

        <div class="budget-controls">
          <label class="field">
            <span>Cantidad</span>
            <input type="number" min="1" step="1" value="${item.cantidad}" onchange="cambiarCantidad(${idx}, this.value)">
          </label>

          <button class="remove" type="button" onclick="quitarItem(${idx})">Quitar</button>
        </div>
      </article>
    `;
  }).join('');

  const total = state.presupuesto.reduce((acc, item) => {
    return acc + subtotalItem(item, item.cantidad);
  }, 0);

  $('totalPresupuesto').textContent = money.format(total);
}

function cambiarCantidad(idx, value) {
  state.presupuesto[idx].cantidad = Math.max(1, Number(value || 1));
  renderPresupuesto();
}

window.cambiarCantidad = cambiarCantidad;

function quitarItem(idx) {
  state.presupuesto.splice(idx, 1);
  renderPresupuesto();
}

window.quitarItem = quitarItem;

function exportarCSV() {
  if (!state.presupuesto.length) {
    alert('Primero agregá al menos un análisis al presupuesto.');
    return;
  }

  const rows = [
    ['Codigo', 'Descripcion', 'Anexo', 'TipoUnidad', 'Unidades', 'Cantidad', 'ValorUnidad', 'Subtotal']
  ];

  state.presupuesto.forEach(item => {
    rows.push([
      item.codigo,
      item.descripcion,
      item.anexo,
      item.tipoUnidad,
      item.unidades,
      item.cantidad,
      valorUnidad(item.tipoUnidad),
      subtotalItem(item, item.cantidad)
    ]);
  });

  const total = state.presupuesto.reduce((acc, item) => {
    return acc + subtotalItem(item, item.cantidad);
  }, 0);

  rows.push(['TOTAL', '', '', '', '', '', '', total]);

  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'presupuesto-aranceles.csv';
  link.click();

  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

init();