// Referencias a los elementos HTML que JavaScript actualiza durante el juego.
const areaJuego = document.getElementById('area-juego');
const elementoJugador = document.getElementById('jugador');
const elementoSonic = document.getElementById('sonic');
const elementoTemporizador = document.getElementById('temporizador');
const mensajeJuego = document.getElementById('mensaje-juego');
const capaMensaje = document.getElementById('capa-mensaje');
const mensajeCapa = document.getElementById('mensaje-capa');
const botonIniciar = document.getElementById('boton-iniciar');
const entradaVelocidadJugador = document.getElementById('velocidad-jugador');
const entradaVelocidadSonic = document.getElementById('velocidad-sonic');
const valorVelocidadJugador = document.getElementById('valor-velocidad-jugador');
const valorVelocidadSonic = document.getElementById('valor-velocidad-sonic');
const selectorEscenario = document.getElementById('selector-escenario');
const alternarMusica = document.getElementById('alternar-musica');
const musicaFondo = document.getElementById('musica-fondo');

// Arreglo de escenarios disponibles: cada objeto relaciona un nombre con su imagen.
const escenarios = [
    { nombre: 'Escenario 1', imagen: 'ecenario%201.jpeg' },
    { nombre: 'Escenario 2', imagen: 'ecenario2.jpg' },
    { nombre: 'Escenario 3', imagen: 'ecenario3.webp' }
];

// Objeto con el estado general de la partida y los datos del temporizador.
const partida = {
    estado: 'lista',
    duracion: 30,
    tiempoRestante: 30,
    fotogramaAnterior: 0,
    ultimoSegundo: 30
};

// Objetos que guardan la posición, tamaño, velocidad y elemento HTML de cada personaje.
const jugador = {
    x: 55,
    y: 80,
    tamano: 64,
    velocidad: Number(entradaVelocidadJugador.value),
    elemento: elementoJugador
};

const sonic = {
    x: 0,
    y: 0,
    tamano: 64,
    velocidad: Number(entradaVelocidadSonic.value),
    elemento: elementoSonic
};

// Un conjunto permite registrar varias teclas presionadas a la vez.
const teclasPresionadas = new Set();

// Crea las opciones del selector a partir del arreglo de escenarios.
for (const escenario of escenarios) {
    const opcion = document.createElement('option');
    opcion.value = escenario.imagen;
    opcion.textContent = escenario.nombre;
    selectorEscenario.append(opcion);
}

// Aplica al área de juego la imagen seleccionada en el panel.
function actualizarEscenario() {
    areaJuego.style.backgroundImage = `url("${selectorEscenario.value}")`;
}

selectorEscenario.value = escenarios[0].imagen;
actualizarEscenario();

// Mueve los elementos visuales a las coordenadas guardadas en los objetos.
function actualizarPosiciones() {
    jugador.elemento.style.transform = `translate(${jugador.x}px, ${jugador.y}px)`;
    sonic.elemento.style.transform = `translate(${sonic.x}px, ${sonic.y}px)`;
}

// Coloca a Tails y Sonic en lados opuestos, centrados verticalmente en el escenario.
function colocarPersonajes() {
    jugador.x = 55;
    jugador.y = Math.max(20, (areaJuego.clientHeight - jugador.tamano) / 2);
    sonic.x = Math.max(0, areaJuego.clientWidth - sonic.tamano - 55);
    sonic.y = Math.max(20, (areaJuego.clientHeight - sonic.tamano) / 2);
    actualizarPosiciones();
}

// Presenta el tiempo restante siempre con dos dígitos.
function actualizarTemporizador() {
    elementoTemporizador.textContent = String(Math.ceil(partida.tiempoRestante)).padStart(2, '0');
}

// Termina la partida, muestra el resultado y detiene la música.
function terminarPartida(ganoJugador) {
    partida.estado = ganoJugador ? 'ganada' : 'perdida';
    teclasPresionadas.clear();
    detenerMusica();
    botonIniciar.textContent = 'Jugar otra vez';
    mensajeJuego.textContent = ganoJugador
        ? '¡Lo lograste! Sonic no pudo atraparte.'
        : '¡Sonic te atrapó! Prueba de nuevo.';
    mensajeCapa.textContent = ganoJugador
        ? '¡Ganaste! ¡Qué gran escapada!'
        : '¡Sonic te atrapó! Inténtalo otra vez.';
    capaMensaje.classList.remove('oculta');
}

// Inicializa o reinicia una partida desde el botón de inicio.
function iniciarPartida() {
    partida.estado = 'jugando';
    partida.tiempoRestante = partida.duracion;
    partida.fotogramaAnterior = 0;
    partida.ultimoSegundo = partida.duracion;
    mensajeJuego.textContent = '¡Corre! No dejes que Sonic te alcance.';
    botonIniciar.textContent = 'Reiniciar';
    capaMensaje.classList.add('oculta');
    actualizarTemporizador();
    colocarPersonajes();

    if (alternarMusica.checked) {
        iniciarMusica();
    }
}

// Indica si alguna de las teclas solicitadas está presionada.
function estaPresionada(...teclas) {
    return teclas.some((tecla) => teclasPresionadas.has(tecla));
}

// Lee las teclas de dirección y desplaza a Tails sin permitirle salir del escenario.
function moverJugador(segundosTranscurridos) {
    let direccionX = Number(estaPresionada('arrowright', 'd'))
        - Number(estaPresionada('arrowleft', 'a'));
    let direccionY = Number(estaPresionada('arrowdown', 's'))
        - Number(estaPresionada('arrowup', 'w'));
    const longitudDireccion = Math.hypot(direccionX, direccionY);

    if (longitudDireccion === 0) return;

    // Normaliza la dirección para evitar que el movimiento diagonal sea más rápido.
    direccionX /= longitudDireccion;
    direccionY /= longitudDireccion;
    jugador.x += direccionX * jugador.velocidad * segundosTranscurridos;
    jugador.y += direccionY * jugador.velocidad * segundosTranscurridos;
    jugador.x = Math.max(0, Math.min(jugador.x, areaJuego.clientWidth - jugador.tamano));
    jugador.y = Math.max(0, Math.min(jugador.y, areaJuego.clientHeight - jugador.tamano));
}

// Avanza a Sonic hacia Tails según la velocidad configurada.
function moverSonic(segundosTranscurridos) {
    const diferenciaX = jugador.x - sonic.x;
    const diferenciaY = jugador.y - sonic.y;
    const distancia = Math.hypot(diferenciaX, diferenciaY);

    if (distancia === 0) return;

    const avance = Math.min(sonic.velocidad * segundosTranscurridos, distancia);
    sonic.x += (diferenciaX / distancia) * avance;
    sonic.y += (diferenciaY / distancia) * avance;
}

// Comprueba si los círculos que representan a los personajes se están tocando.
function hayColision() {
    const diferenciaCentrosX = jugador.x + jugador.tamano / 2 - (sonic.x + sonic.tamano / 2);
    const diferenciaCentrosY = jugador.y + jugador.tamano / 2 - (sonic.y + sonic.tamano / 2);
    return Math.hypot(diferenciaCentrosX, diferenciaCentrosY) < (jugador.tamano + sonic.tamano) / 2;
}

// Bucle de animación: actualiza movimiento, tiempo y condiciones de victoria.
function bucleDelJuego(marcaTiempo) {
    if (partida.estado === 'jugando') {
        const segundosTranscurridos = partida.fotogramaAnterior
            ? Math.min((marcaTiempo - partida.fotogramaAnterior) / 1000, 0.05)
            : 0;
        partida.fotogramaAnterior = marcaTiempo;
        partida.tiempoRestante = Math.max(0, partida.tiempoRestante - segundosTranscurridos);

        moverJugador(segundosTranscurridos);
        moverSonic(segundosTranscurridos);
        actualizarPosiciones();

        const segundoActual = Math.ceil(partida.tiempoRestante);
        if (segundoActual !== partida.ultimoSegundo) {
            partida.ultimoSegundo = segundoActual;
            actualizarTemporizador();
        }

        if (hayColision()) {
            terminarPartida(false);
        } else if (partida.tiempoRestante === 0) {
            terminarPartida(true);
        }
    }

    requestAnimationFrame(bucleDelJuego);
}

// Reproduce el archivo de música incluido con el proyecto.
function iniciarMusica() {
    musicaFondo.play().catch(() => {
        alternarMusica.checked = false;
        mensajeJuego.textContent = 'No se pudo reproducir la música.';
    });
}

// Pausa la música cuando el jugador la desactiva o termina la partida.
function detenerMusica() {
    musicaFondo.pause();
}

// El botón comienza una nueva partida.
botonIniciar.addEventListener('click', iniciarPartida);

// El evento de teclado guarda las teclas activas mientras se juega.
window.addEventListener('keydown', (evento) => {
    const tecla = evento.key.toLowerCase();
    const teclasDeDireccion = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    const teclasDeMovimiento = [...teclasDeDireccion, 'w', 'a', 's', 'd'];

    if (teclasDeDireccion.includes(tecla)) {
        evento.preventDefault();
    }
    if (partida.estado === 'jugando' && teclasDeMovimiento.includes(tecla)) {
        teclasPresionadas.add(tecla);
    }
});

// Al soltar una tecla, la elimina del conjunto para detener el movimiento asociado.
window.addEventListener('keyup', (evento) => {
    teclasPresionadas.delete(evento.key.toLowerCase());
});

// Evita que una tecla quede marcada como presionada al cambiar de ventana.
window.addEventListener('blur', () => teclasPresionadas.clear());

// Los controles deslizantes actualizan la velocidad y su valor visible.
entradaVelocidadJugador.addEventListener('input', () => {
    jugador.velocidad = Number(entradaVelocidadJugador.value);
    valorVelocidadJugador.textContent = entradaVelocidadJugador.value;
});

entradaVelocidadSonic.addEventListener('input', () => {
    sonic.velocidad = Number(entradaVelocidadSonic.value);
    valorVelocidadSonic.textContent = entradaVelocidadSonic.value;
});

// Cambia el fondo al escenario elegido.
selectorEscenario.addEventListener('change', actualizarEscenario);

// Activa o pausa la música mediante la casilla de configuración.
alternarMusica.addEventListener('change', () => {
    if (alternarMusica.checked) {
        iniciarMusica();
    } else {
        detenerMusica();
    }
});

// Mantiene a ambos personajes dentro del área si cambia el tamaño de la ventana.
window.addEventListener('resize', () => {
    jugador.x = Math.min(jugador.x, Math.max(0, areaJuego.clientWidth - jugador.tamano));
    jugador.y = Math.min(jugador.y, Math.max(0, areaJuego.clientHeight - jugador.tamano));
    sonic.x = Math.min(sonic.x, Math.max(0, areaJuego.clientWidth - sonic.tamano));
    sonic.y = Math.min(sonic.y, Math.max(0, areaJuego.clientHeight - sonic.tamano));
    actualizarPosiciones();
});

// Prepara la pantalla y solicita el primer fotograma de animación.
colocarPersonajes();
actualizarTemporizador();
requestAnimationFrame(bucleDelJuego);
