// Cargar clientes desde Google Sheets
async function cargarClientes() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOsNxY280axln8vgnj9_LshmD6BlSpswpWPV4pgRIY-gOZAvoUBVcQfHwcHnrRL0_qRPlYHWP3nXw4/pub?output=csv";

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const csv = await res.text();

    const filas = csv.split("\n").slice(1); // salta encabezado

    const select = document.getElementById("cliente");

    filas.forEach(f => {
      const [nombre, email] = f.split(",");

      if (nombre && email) {
        const opt = document.createElement("option");
        opt.value = email.trim();
        opt.textContent = nombre.trim();
        select.appendChild(opt);
      }
    });
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
}

if (document.getElementById("cliente")) {
  cargarClientes();
}

// Toggle para tipo de cliente
if (document.getElementById('clienteExistente')) {
  document.getElementById('clienteExistente').addEventListener('change', toggleCliente);
  document.getElementById('clienteNuevo').addEventListener('change', toggleCliente);
}

function toggleCliente() {
  const tipo = document.querySelector('input[name="tipoCliente"]:checked').value;
  if (tipo === 'existente') {
    document.getElementById('selectCliente').style.display = 'block';
    document.getElementById('nuevoCliente').style.display = 'none';
  } else {
    document.getElementById('selectCliente').style.display = 'none';
    document.getElementById('nuevoCliente').style.display = 'block';
  }
}

// Guardar configuración
function guardarConfig() {
  const nombre = document.getElementById("nombreEmisor").value;
  const email = document.getElementById("emailEmisor").value;
  const canvas = document.getElementById("firmaCanvas");
  const firmaData = canvas.toDataURL();

  localStorage.setItem("nombreEmisor", nombre);
  localStorage.setItem("emailEmisor", email);
  localStorage.setItem("firmaDigital", firmaData);

  alert("Configuración guardada");
}

// Generar recibo
async function generarRecibo() {
  const monto = document.getElementById("monto").value;
  const tipo = document.querySelector('input[name="tipoCliente"]:checked').value;
  let clienteNombre, clienteEmail;

  if (tipo === 'existente') {
    clienteEmail = document.getElementById("cliente").value;
    clienteNombre = document.getElementById("cliente").selectedOptions[0].text;
  } else {
    clienteNombre = document.getElementById("nuevoNombre").value;
    clienteEmail = document.getElementById("nuevoEmail").value;
  }

  const payload = {
    monto,
    clienteNombre,
    clienteEmail,
    nombreEmisor: localStorage.getItem("nombreEmisor"),
    emailEmisor: localStorage.getItem("emailEmisor"),
    firmaDigital: localStorage.getItem("firmaDigital")
  };

  console.log("Enviando payload:", payload);

  // Mostrar loading y deshabilitar
  document.getElementById("loading").style.display = "block";
  disableForm(true);

  const formData = new FormData();
  Object.keys(payload).forEach(key => {
    formData.append(key, payload[key]);
  });

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbxq10Sg2vODNuIh7sb7yLiURSyFTb5XnlY_lnBbDO7KDRubT7MX6hID3cwBNRmHVW8/exec", {
      method: "POST",
      mode: "no-cors",
      body: formData
    });

    // Con no-cors, no podemos leer la respuesta, asumimos éxito
    console.log("Solicitud enviada (no-cors)");
    alert("Recibo enviado");

    // Limpiar form
    limpiarForm();
  } catch (error) {
    console.error("Error generando recibo:", error);
    alert("Error al enviar recibo: " + error.message);
  } finally {
    // Ocultar loading y habilitar
    document.getElementById("loading").style.display = "none";
    disableForm(false);
  }
}

// Lógica para el canvas de firma
const canvas = document.getElementById("firmaCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  let drawing = false;

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  function startDrawing(e) {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  }

  function draw(e) {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  function stopDrawing() {
    drawing = false;
  }

  // Cargar firma existente
  const firmaData = localStorage.getItem("firmaDigital");
  if (firmaData) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = firmaData;
  }
}

function limpiarFirma() {
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function disableForm(disable) {
  const elements = document.querySelectorAll('input, select, button');
  elements.forEach(el => {
    el.disabled = disable;
  });
}

function limpiarForm() {
  document.getElementById("monto").value = "";
  document.getElementById("cliente").selectedIndex = 0;
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoEmail").value = "";
  // Reset radio to existente
  document.getElementById("clienteExistente").checked = true;
  toggleCliente();
}