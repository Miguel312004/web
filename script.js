const canvas = document.getElementById("simulador");
const ctx = canvas.getContext("2d");

const histCanvas = document.getElementById("histograma");
const histCtx = histCanvas.getContext("2d");

let particulas = [];
let velocidad = 3;
let cantidad = 20;
let animacionId = null;

let nucleo = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radio: 50,
  carga: 1000
};

// Guardaremos aquí los ángulos finales para el histograma
let angulosFinales = [];

let tiempoInicio = 0;
const TIEMPO_MAXIMO_MS = 10000; // 10 segundos máximo para la simulación

document.getElementById("velocidad").addEventListener("input", e => {
  velocidad = parseInt(e.target.value);
});

document.getElementById("tamanoNucleo").addEventListener("input", e => {
  nucleo.radio = parseInt(e.target.value);
});

document.getElementById("cargaNucleo").addEventListener("input", e => {
  nucleo.carga = parseInt(e.target.value);
});

function iniciarSimulacion() {
  cancelarAnimacion();

  particulas = [];
  angulosFinales = [];
  clearHistograma();

  cantidad = parseInt(document.getElementById("cantidad").value);
  tiempoInicio = performance.now();

  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x: 0,
      y: Math.random() * canvas.height,
      vx: velocidad,
      vy: 0,
      anguloDesviacion: 0,
      registrado: false // para evitar registrar varias veces
    });
  }

  animar();
}

function reiniciarSimulacion() {
  cancelarAnimacion();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  clearHistograma();
  particulas = [];
  angulosFinales = [];
}

function cancelarAnimacion() {
  if (animacionId) {
    cancelAnimationFrame(animacionId);
    animacionId = null;
  }
}

function animar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar núcleo
  ctx.beginPath();
  ctx.arc(nucleo.x, nucleo.y, nucleo.radio, 0, Math.PI * 2);
  ctx.fillStyle = "#ff0000";
  ctx.fill();

  particulas.forEach(p => {
    const dx = p.x - nucleo.x;
    const dy = p.y - nucleo.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < nucleo.radio + 30) {
      let fuerza = nucleo.carga / (distancia * distancia);
      p.vx += (dx / distancia) * fuerza;
      p.vy += (dy / distancia) * fuerza;

      const v1x = velocidad;
      const v1y = 0;
      const v2x = p.vx;
      const v2y = p.vy;

      const dot = v1x * v2x + v1y * v2y;
      const magV1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const magV2 = Math.sqrt(v2x * v2x + v2y * v2y);

      let angleRad = Math.acos(dot / (magV1 * magV1) < 1e-8 ? 1 : (dot / (magV1 * magV2))); // evitar NaN
      let angleDeg = angleRad * (180 / Math.PI);

      p.anguloDesviacion = angleDeg;
    }

    p.x += p.vx;
    p.y += p.vy;

    // Dibujar partícula
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#0000ff";
    ctx.fill();

    if (distancia < nucleo.radio + 30) {
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.fillText(p.anguloDesviacion.toFixed(1) + "°", p.x + 5, p.y - 5);
    }
  });

  // Registrar y eliminar partículas fuera del canvas
  particulas = particulas.filter(p => {
    const fuera = p.x > canvas.width || p.x < 0 || p.y < 0 || p.y > canvas.height;
    if (fuera && !p.registrado) {
      angulosFinales.push(p.anguloDesviacion);
      p.registrado = true;
    }
    return !fuera;
  });

  // Condición para finalizar si timeout excedido
  const tiempoActual = performance.now();
  if ((particulas.length === 0 && angulosFinales.length > 0) || (tiempoActual - tiempoInicio > TIEMPO_MAXIMO_MS)) {
    if (particulas.length > 0) {
      // En caso de timeout, registrar ángulos pendientes
      particulas.forEach(p => {
        if (!p.registrado) {
          angulosFinales.push(p.anguloDesviacion);
          p.registrado = true;
        }
      });
      particulas = [];
    }
    graficarHistograma(angulosFinales);
    cancelarAnimacion();
    return;
  }

  animacionId = requestAnimationFrame(animar);
}

function clearHistograma() {
  histCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);
  histCtx.fillStyle = "#000";
  histCtx.font = "16px Arial";
  histCtx.fillText("Aquí aparecerá el histograma tras la simulación.", 210, 30);
}

function graficarHistograma(angulos) {
  clearHistograma();

  const maxAngle = 180;
  const bins = 18; // 10 grados por bin
  const binWidth = maxAngle / bins;
  const counts = new Array(bins).fill(0);

  angulos.forEach(a => {
    let index = Math.floor(a / binWidth);
    if (index >= bins) index = bins - 1;
    counts[index]++;
  });

  const maxCount = Math.max(...counts);

  const width = histCanvas.width;
  const height = histCanvas.height;
  const margin = 50;
  const barWidth = (width - 2 * margin) / bins * 0.8; // 80% ancho para barras
  const gap = ((width - 2 * margin) / bins) * 0.2; // 20% gap entre barras

  // Fondo blanco y borde
  histCtx.fillStyle = "#ffffff";
  histCtx.fillRect(0, 0, width, height);
  histCtx.strokeStyle = "#666";
  histCtx.lineWidth = 2;
  histCtx.strokeRect(margin, margin, width - 2 * margin, height - 2 * margin);

  // Ejes
  histCtx.strokeStyle = "#000";
  histCtx.lineWidth = 1.5;
  histCtx.beginPath();
  // Eje Y
  histCtx.moveTo(margin, margin);
  histCtx.lineTo(margin, height - margin);
  // Eje X
  histCtx.lineTo(width - margin, height - margin);
  histCtx.stroke();

  // Marcas en eje Y y etiquetas
  histCtx.fillStyle = "#000";
  histCtx.font = "12px Arial";
  histCtx.textAlign = "right";
  histCtx.textBaseline = "middle";

  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    let y = margin + (height - 2 * margin) * (i / numTicks);
    let value = Math.round(maxCount * (1 - i / numTicks));
    histCtx.fillText(value, margin - 5, y);
    histCtx.beginPath();
    histCtx.moveTo(margin - 3, y);
    histCtx.lineTo(margin, y);
    histCtx.stroke();
  }

  // Barras
  histCtx.textAlign = "center";
  histCtx.textBaseline = "top";
  for (let i = 0; i < bins; i++) {
    const barHeight = counts[i] / maxCount * (height - 2 * margin);
    const x = margin + i * (barWidth + gap) + gap / 2;
    const y = height - margin - barHeight;

    histCtx.fillStyle = "#007acc";
    histCtx.fillRect(x, y, barWidth, barHeight);

    // Etiquetas angulares (rango)
    const startAngle = i * binWidth;
    const endAngle = startAngle + binWidth;
    histCtx.fillStyle = "#000";
    histCtx.fillText(`${startAngle}-${endAngle}°`, x + barWidth / 2, height - margin + 5);
  }

  // Título eje Y
  histCtx.save();
  histCtx.translate(margin - 40, height / 2);
  histCtx.rotate(-Math.PI / 2);
  histCtx.textAlign = "center";
  histCtx.font = "16px Arial";
  histCtx.fillText("Frecuencia", 0, 0);
  histCtx.restore();

  // Título eje X
  histCtx.font = "16px Arial";
  histCtx.fillText("Ángulo de desviación (grados)", width / 2, height - 25);
}

// Inicializar mensaje en histograma al cargar página
clearHistograma();

// Modal explicación
const btnExplicacion = document.getElementById("btnExplicacion");
const modal = document.getElementById("modalExplicacion");
const cerrar = document.getElementById("cerrarModal");

btnExplicacion.addEventListener("click", () => {
  modal.style.display = "block";
});

cerrar.addEventListener("click", () => {
  modal.style.display = "none";
});

// Cerrar modal si se da click fuera del contenido
window.addEventListener("click", (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
});
