/* ============================================================
   Numerar las SIM dentro de cada lote: VFWP - 1, VFWP - 2, ...
   Pegar este archivo en el proyecto "Escaner SIM" (add > Apps Script,
   nombre: LoteNumerado).
   ============================================================ */

/* ---- 1) ARREGLO DE UNA VEZ ----
   Ejecuta numerarLotes() una sola vez y renumera TODO lo que ya hay
   guardado en la pestaña Altas. Respeta el orden en que estan las filas
   (que es el orden en que se escanearon) y es idempotente: la puedes
   volver a ejecutar las veces que quieras sin que salga "VFWP - 3 - 3". */
function numerarLotes() {
  var h = hojaAltas_();
  var ultima = h.getLastRow();
  if (ultima < 2) return 'No hay filas que numerar.';

  var col = colLote_(h);
  var rango = h.getRange(2, col, ultima - 1, 1);
  var valores = rango.getValues();
  var cuenta = {};

  for (var f = 0; f < valores.length; f++) {
    var base = baseLote_(valores[f][0]);
    if (!base) continue;                 // fila sin lote: no se toca
    cuenta[base] = (cuenta[base] || 0) + 1;
    valores[f][0] = base + ' - ' + cuenta[base];
  }

  rango.setValues(valores);
  SpreadsheetApp.flush();
  return 'Numeradas ' + valores.length + ' filas.';
}

/* ---- 2) PARA LOS ESCANEOS NUEVOS ----
   En la funcion del backend que guarda un alta, justo antes de escribir
   la fila, sustituye el valor del lote por esto:

       lote = loteNumerado_(lote);

   Devuelve "VFWP - 7" si en la hoja ya hay seis VFWP. Le da igual que le
   pases "VFWP" o un "VFWP - 3" ya numerado: se queda con el codigo.
   Llamalo DENTRO del LockService que ya usas al guardar, para que dos
   moviles escaneando a la vez no se lleven el mismo numero. */
function loteNumerado_(lote) {
  var base = baseLote_(lote);
  if (!base) return '';

  var h = hojaAltas_();
  var ultima = h.getLastRow();
  if (ultima < 2) return base + ' - 1';

  var valores = h.getRange(2, colLote_(h), ultima - 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < valores.length; i++) {
    if (baseLote_(valores[i][0]) === base) n++;
  }
  return base + ' - ' + (n + 1);
}

/* ---- ayudantes ---- */

/* "VFWP", "VFWP - 3", "vfwp-3 " -> "VFWP" */
function baseLote_(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  return s.replace(/\s*-\s*\d+\s*$/, '').trim();
}

function hojaAltas_() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('SS_ID') || p.getProperty('ID_HOJA') || p.getProperty('HOJA_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
  if (!ss) throw new Error('No encuentro la hoja de calculo (revisa la propiedad SS_ID).');
  var h = ss.getSheetByName('Altas');
  if (!h) throw new Error('No hay ninguna pestaña llamada "Altas" en ' + ss.getName());
  return h;
}

function colLote_(h) {
  var cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  for (var i = 0; i < cab.length; i++) {
    if (String(cab[i]).trim().toLowerCase() === 'lote') return i + 1;
  }
  throw new Error('No encuentro la columna "Lote" en la fila 1 de Altas.');
}
