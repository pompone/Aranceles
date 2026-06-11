# Piloto de aranceles de laboratorio

## Qué prueba esta versión

- Catálogo completo de análisis/servicios tomado de los Excel.
- Búsqueda por código del Excel.
- Resultados filtrados con botón **Agregar**.
- Presupuesto separado.
- Cálculo automático con valores UA, UF, NAFTA y DOLAR.
- Simulación de valores mensuales desde Google Drive / Google Sheets.
- Impresión limpia: imprime solo los ítems agregados y el total del presupuesto.

## Simulación de Drive

La carpeta `data` incluye este archivo:

```text
data/valores-drive.csv
```

Tiene formato compatible con un Google Sheet publicado como CSV:

```csv
clave,valor
mes,Julio
anio,2026
fechaVigencia,2026-07-01
UA,1500
UF,2200
GAVET,860.50
NAFTA,1280
DOLAR,950
fuente,CSV simulado como si viniera de Google Drive / Google Sheets
```

En la pantalla, el campo de URL ya apunta a:

```text
data/valores-drive.csv
```

Para que el navegador pueda leer ese CSV local, lo más seguro es abrir la web con servidor local:

```bash
python -m http.server 8000
```

Luego entrar a:

```text
http://localhost:8000
```

Si abrís `index.html` con doble clic, algunos navegadores bloquean `fetch()` a archivos locales. Para ese caso, usá el botón **Subir CSV local** y elegí `data/valores-drive.csv`.

## Cómo sería con Google Sheets real

1. Crear una hoja con columnas `clave` y `valor`.
2. Poner los valores del mes: UA, UF, NAFTA, DOLAR, etc.
3. Publicar la hoja como CSV.
4. Pegar la URL publicada en el campo **URL CSV / Google Sheet publicado**.
5. Presionar **Cargar desde Drive/CSV**.

La app actualiza los valores y recalcula los análisis que ya fueron agregados al presupuesto.

## Lectura desde Google Sheets

La pantalla ahora acepta el enlace normal del Google Sheet, por ejemplo:

https://docs.google.com/spreadsheets/d/1gQmH3CKwISJKg4YUGKuEMgjG_HZRETM85JzdP7sNjjE/edit?usp=sharing

Formato recomendado de la hoja:

clave,valor
UA,1445
UF,2074
NAFTA,1200
DOLAR,900
mes,Junio
anio,2026
fuente,Google Sheet de prueba

El archivo debe estar compartido como “Cualquier persona con el enlace puede ver”.
