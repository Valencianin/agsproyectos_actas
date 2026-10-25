/* Genera el PDF del acta sin pasar por la impresión del navegador.
   window.print() no funciona en una app añadida a la pantalla de inicio
   en iPadOS, y en Safari añade la dirección y la fecha al pie. */

function generarPdfActa(datos, logoB64){
  var doc = new jspdf.jsPDF({unit: 'mm', format: 'a4'});

  var IZQ = 12, DER = 198, ANCHO = DER - IZQ;
  var TOPE = 10;                 // arriba del membrete
  var MEMBRETE = 26;
  var PIE_Y = 262;               // arriba del recuadro del pie
  var LIMITE = PIE_Y - 6;        // hasta dónde puede llegar el contenido
  var y = 0;

  var GRIS_BANDA = 217, GRIS_CABECERA = 230, GRIS_PIE = 230;

  function fechaEs(iso){
    if(!iso) return '';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function membrete(){
    var anchoLogo = 56, anchoDatos = 44;
    var xTitulo = IZQ + anchoLogo, anchoTitulo = ANCHO - anchoLogo - anchoDatos;
    var xDatos = xTitulo + anchoTitulo;

    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(IZQ, TOPE, anchoLogo, MEMBRETE);
    doc.rect(xTitulo, TOPE, anchoTitulo, MEMBRETE);
    doc.rect(xDatos, TOPE, anchoDatos, MEMBRETE / 2);
    doc.rect(xDatos, TOPE + MEMBRETE / 2, anchoDatos, MEMBRETE / 2);

    if(logoB64){
      var anchoImagen = 34, altoImagen = 13;
      doc.addImage('data:image/jpeg;base64,' + logoB64, 'JPEG',
        IZQ + (anchoLogo - anchoImagen) / 2, TOPE + (MEMBRETE - altoImagen) / 2,
        anchoImagen, altoImagen);
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('ACTA DE REUNIÓN', xTitulo + anchoTitulo / 2, TOPE + MEMBRETE / 2,
      {align: 'center', baseline: 'middle'});

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Fecha: ' + fechaEs(datos.fecha), xDatos + 3, TOPE + MEMBRETE / 4,
      {baseline: 'middle'});
    /* el número de hoja se escribe al final, cuando se sabe el total */
  }

  function pie(){
    var alto = 13;
    doc.setFillColor(GRIS_PIE); doc.setDrawColor(0);
    doc.rect(IZQ, PIE_Y, ANCHO, alto, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(90);
    doc.text('FECHA DE ENVÍO: ' + fechaEs(datos.fechaEnvio || datos.fecha), IZQ + 3, PIE_Y + 4);
    doc.setTextColor(0);
    var clausula = 'Tras el envío de esta acta, si en el plazo de una semana no se recibe ' +
      'notificación alguna por parte de las partes que han intervenido en la reunión, ' +
      'se da por aprobado su contenido aunque no se firme.';
    doc.text(doc.splitTextToSize(clausula, ANCHO - 6), IZQ + 3, PIE_Y + 7.6);
    doc.setTextColor(0);
  }

  function nuevaPagina(){
    doc.addPage();
    membrete(); pie();
    y = TOPE + MEMBRETE + 6;
  }

  function sitio(alto){
    if(y + alto > LIMITE) nuevaPagina();
  }

  membrete(); pie();
  y = TOPE + MEMBRETE + 6;

  /* ---- tabla de datos ---- */
  doc.setFontSize(8.5);
  var ANCHO_ETIQUETA = 40;

  [['Obra:', datos.obra], ['Promotor de la reunión:', datos.promotor],
   ['Motivo de la reunión:', datos.motivo], ['Lugar de la reunión:', datos.lugar]
  ].forEach(function(f){
    var alto = 6.5;
    sitio(alto);
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(IZQ, y, ANCHO_ETIQUETA, alto);
    doc.rect(IZQ + ANCHO_ETIQUETA, y, ANCHO - ANCHO_ETIQUETA, alto);
    doc.setFont('helvetica', 'normal');
    doc.text(f[0], IZQ + 1.5, y + alto / 2, {baseline: 'middle'});
    doc.text(String(f[1] || ''), IZQ + ANCHO_ETIQUETA + 1.5, y + alto / 2, {baseline: 'middle'});
    y += alto;
  });

  var altoBanda = 7;
  sitio(altoBanda);
  doc.setFillColor(GRIS_BANDA);
  doc.rect(IZQ, y, ANCHO, altoBanda, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('Relación de personas que intervienen en la reunión', IZQ + 1.5, y + altoBanda / 2,
    {baseline: 'middle'});
  y += altoBanda;

  var COL_NOMBRE = 86, COL_EMPRESA = 46, COL_FIRMA = ANCHO - COL_NOMBRE - COL_EMPRESA;
  var altoCabecera = 6;
  sitio(altoCabecera);
  doc.setFillColor(GRIS_CABECERA);
  doc.rect(IZQ, y, COL_NOMBRE, altoCabecera, 'FD');
  doc.rect(IZQ + COL_NOMBRE, y, COL_EMPRESA, altoCabecera, 'FD');
  doc.rect(IZQ + COL_NOMBRE + COL_EMPRESA, y, COL_FIRMA, altoCabecera, 'FD');
  doc.text('NOMBRE', IZQ + 1.5, y + altoCabecera / 2, {baseline: 'middle'});
  doc.text('EMPRESA', IZQ + COL_NOMBRE + 1.5, y + altoCabecera / 2, {baseline: 'middle'});
  doc.text('FIRMA', IZQ + COL_NOMBRE + COL_EMPRESA + 1.5, y + altoCabecera / 2, {baseline: 'middle'});
  y += altoCabecera;

  doc.setFont('helvetica', 'normal');
  (datos.asistentes || []).forEach(function(a){
    var alto = 13;
    sitio(alto);
    doc.rect(IZQ, y, COL_NOMBRE, alto);
    doc.rect(IZQ + COL_NOMBRE, y, COL_EMPRESA, alto);
    doc.rect(IZQ + COL_NOMBRE + COL_EMPRESA, y, COL_FIRMA, alto);
    doc.text(String(a.nombre || ''), IZQ + 1.5, y + alto / 2, {baseline: 'middle'});
    doc.text(String(a.empresa || ''), IZQ + COL_NOMBRE + 1.5, y + alto / 2, {baseline: 'middle'});
    if(a.firma && a.firma.url){
      var escala = Math.min((COL_FIRMA - 6) / a.firma.ancho, (alto - 3) / a.firma.alto);
      var w = a.firma.ancho * escala, h = a.firma.alto * escala;
      doc.addImage(a.firma.url, 'PNG',
        IZQ + COL_NOMBRE + COL_EMPRESA + (COL_FIRMA - w) / 2, y + (alto - h) / 2, w, h);
    }
    y += alto;
  });

  /* ---- asuntos tratados ---- */
  y += 4;
  sitio(6);
  doc.setFontSize(9);
  doc.text('Asuntos tratados en la reunión,', IZQ, y);
  y += 6;

  function epigrafe(titulo, lineas){
    sitio(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(titulo, IZQ, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    var puntos = (lineas && lineas.length) ? lineas : ['No hay comentarios al respecto.'];
    puntos.forEach(function(p){
      var trozos = doc.splitTextToSize(p, ANCHO - 8);
      sitio(trozos.length * 4.4 + 1);
      doc.text('-', IZQ + 2, y);
      doc.text(trozos, IZQ + 6, y);
      y += trozos.length * 4.4 + 1;
    });
    y += 4;
  }

  epigrafe('VISITA DE OBRA', datos.secciones.visita);
  epigrafe('SEGURIDAD Y SALUD', datos.secciones.seguridad);
  epigrafe('GESTIÓN DE RESIDUOS', datos.secciones.residuos);

  sitio(10);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('FOTOS DE LA VISITA', IZQ, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  var fotos = datos.fotos || [];
  if(!fotos.length){
    doc.text('-', IZQ + 2, y);
    doc.text('No hay comentarios al respecto.', IZQ + 6, y);
    y += 5;
  } else {
    fotos.forEach(function(f){
      var escala = Math.min(150 / f.ancho, 95 / f.alto);
      var w = f.ancho * escala, h = f.alto * escala;
      var pieTexto = f.pie ? doc.splitTextToSize(f.pie, ANCHO - 4) : null;
      var altoPie = pieTexto ? pieTexto.length * 4.2 + 2 : 0;
      sitio(h + altoPie + 4);
      doc.addImage(f.url, 'PNG', IZQ, y, w, h);
      y += h + 3;
      if(pieTexto){
        doc.text(pieTexto, IZQ, y);
        y += altoPie;
      }
      y += 3;
    });
  }

  /* ---- número de hoja, ya con el total ---- */
  var total = doc.getNumberOfPages();
  var xDatos = DER - 44;
  for(var i = 1; i <= total; i++){
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Hoja nº ' + i + ' de ' + total, xDatos + 3, TOPE + MEMBRETE * 0.75,
      {baseline: 'middle'});
  }

  return doc;
}

if(typeof module !== 'undefined') module.exports = {generarPdfActa: generarPdfActa};
