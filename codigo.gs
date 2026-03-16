const ID_DE_TU_SHEET= "1cM4OPEMwTKJVMzl0S4ftcp0ZGfdCtD61KBJQsvv9edw"
const ID_DE_TU_CARPETA_PDF="17kgETQIEUlkmihkPBlQKHY07Yv0NPBsJ"
const NOMBRE_HOJA_CLIENTES = "Clientes"


function doPost(e) {
  const data = e.parameter;
 /* const data = {

    monto:5000,
    clienteNombre:"leominis",
    clienteEmail:"leojg1090@gmail.com",
    nombreEmisor:"fernando",
    emailEmisor:"leorodr4446@gmail.com"


  }*/


  const monto = data.monto;
  const clienteNombre = data.clienteNombre;
  const clienteEmail = data.clienteEmail;
  const nombreEmisor = data.nombreEmisor;
  const emailEmisor = data.emailEmisor;
  const firmaDigital = data.firmaDigital; // Base64

  // Verificar si el cliente existe, si no, agregarlo
  if (!clienteExiste(clienteEmail)) {
    agregarCliente(clienteNombre, clienteEmail);
  }

  const numeroRecibo = generarNumeroRecibo();
  const fecha = new Date();

  // Generar PDF
  const pdfFile = generarPDF({
    monto,
    clienteNombre,
    clienteEmail,
    nombreEmisor,
    emailEmisor,
    firmaDigital,
    numeroRecibo,
    fecha
  });

  // Guardar registro en Sheets
  registrarEnSheet({
    fecha,
    clienteNombre,
    clienteEmail,
    monto,
    numeroRecibo,
    pdfUrl: pdfFile.getUrl()
  });

  // Enviar emails
  enviarEmails({
    pdfFile,
    clienteEmail,
    emailEmisor,
    clienteNombre,
    numeroRecibo
  });

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok", recibo: numeroRecibo })
  ).setMimeType(ContentService.MimeType.JSON);
}


function generarNumeroRecibo() {
  const ss = SpreadsheetApp.openById(ID_DE_TU_SHEET);
  const sheet = ss.getSheetByName("Recibos");

  const last = sheet.getLastRow();
  if (last < 2) return 1;

  const prev = sheet.getRange(last, 5).getValue(); // Columna E = número
  return prev + 1;
}

function generarPDF(data) {
  const template = HtmlService.createTemplateFromFile("pdf_template");
  template.data = data;

  const html = template.evaluate().getContent();

  const blob = Utilities.newBlob(html, "text/html", "recibo.html");
  const pdf = blob.getAs("application/pdf").setName("Recibo_" + data.numeroRecibo + ".pdf");

  const folder = DriveApp.getFolderById(ID_DE_TU_CARPETA_PDF);
  const file = folder.createFile(pdf);

  return file;
}


function registrarEnSheet(info) {
  
  const ss = SpreadsheetApp.openById(ID_DE_TU_SHEET);
  const sheet = ss.getSheetByName("Recibos");

  sheet.appendRow([
    info.fecha,
    info.clienteNombre,
    info.clienteEmail,
    info.monto,
    info.numeroRecibo,
    info.pdfUrl
  ]);
}


function enviarEmails({ pdfFile, clienteEmail, emailEmisor, clienteNombre, numeroRecibo }) {
  const asunto = "Recibo de pago #" + numeroRecibo;
  const cuerpo = "Hola " + clienteNombre + ",\n\nAdjunto tu recibo.\n\nSaludos.";

  GmailApp.sendEmail(clienteEmail, asunto, cuerpo, {
    attachments: [pdfFile.getAs(MimeType.PDF)]
  });

  GmailApp.sendEmail(emailEmisor, asunto, "Copia del recibo generado.", {
    attachments: [pdfFile.getAs(MimeType.PDF)]
  });
}

function clienteExiste(email) {
  const ss = SpreadsheetApp.openById(ID_DE_TU_SHEET);
  const sheet = ss.getSheetByName(NOMBRE_HOJA_CLIENTES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { // Empezar desde la fila 2 (índice 1)
    if (data[i][1] === email) {
      return true;
    }
  }
  return false;
}

function agregarCliente(nombre, email) {
  const ss = SpreadsheetApp.openById(ID_DE_TU_SHEET);
  const sheet = ss.getSheetByName(NOMBRE_HOJA_CLIENTES);
  sheet.appendRow([nombre, email]);
}

