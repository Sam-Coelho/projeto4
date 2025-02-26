const { Board, Sensor } = require("johnny-five");

const board = new Board();

// Variáveis para cálculo de BPM
let lastPeakTime1 = 0, lastPeakTime2 = 0;
let beatCount1 = 0, beatCount2 = 0;

board.on("ready", () => {
    console.log("Placa pronta. Lendo sensores...");

    // Configuração dos sensores
    const pulseSensor1 = new Sensor({ pin: "A0", freq: 10 }); // Sensor 1
    const pulseSensor2 = new Sensor({ pin: "A1", freq: 10 }); // Sensor 2

    pulseSensor1.on("data", () => processHeartRate(pulseSensor1.value, 1));
    pulseSensor2.on("data", () => processHeartRate(pulseSensor2.value, 2));
});

// Função para processar o batimento
function processHeartRate(value, sensorNumber) {
    let threshold = 550; // Ajuste conforme necessário

    if (sensorNumber === 1) {
        if (value > threshold) {
            let currentTime = Date.now();
            if (currentTime - lastPeakTime1 > 300) {
                beatCount1++;
                lastPeakTime1 = currentTime;
            }
        }

        // Calcula BPM a cada 3 segundos
        if (Date.now() - lastPeakTime1 >= 300) {
            let bpm1 = beatCount1 * 6;
            console.log(`Sensor 1 - BPM: ${bpm1}`);
            beatCount1 = 0;
        }

    } else if (sensorNumber === 2) {
        if (value > threshold) {
            let currentTime = Date.now();
            if (currentTime - lastPeakTime2 > 300) {
                beatCount2++;
                lastPeakTime2 = currentTime;
            }
        }

        // Calcula BPM a cada 3 segundos
        if (Date.now() - lastPeakTime2 >= 300) {
            let bpm2 = beatCount2 * 6;
            console.log(`Sensor 2 - BPM: ${bpm2}`);
            beatCount2 = 0;
        }
    }
}



class HeartbeatMelody {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.isPlaying = false;
    }

    startMelody(getBpm1, getIntensity1, getBpm2, getIntensity2) {
        if (this.isPlaying) return;
        this.isPlaying = true;

        const updateMelody = () => {
            if (!this.isPlaying) return;

            const bpm1 = getBpm1();
            const intensity1 = getIntensity1();
            const bpm2 = getBpm2();
            const intensity2 = getIntensity2();

            const baseFreq = 220;
            const freqVariation1 = (bpm1 % 50) + intensity1 * 2;
            const freqVariation2 = (bpm2 % 50) + intensity2 * 2;

            const melody = [
                baseFreq + freqVariation1,
                baseFreq + freqVariation2,
                baseFreq - freqVariation1,
                baseFreq - freqVariation2
            ];

            this.playNotes(melody, bpm1, bpm2);
            setTimeout(updateMelody, 1000);
        };

        updateMelody();
    }

    playNotes(notes, bpm1, bpm2) {
        let time = this.audioContext.currentTime;
        const duration = (60 / ((bpm1 + bpm2) / 2)) / 2;

        notes.forEach((freq) => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, time);

            oscillator.connect(this.gainNode);
            oscillator.start(time);
            oscillator.stop(time + duration);

            time += duration;
        });
    }

    stopMelody() {
        this.isPlaying = false;
    }
}

// Inicialização do sistema de áudio
let audioContext = null;
let melodyGenerator = null;

function startMusic() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        melodyGenerator = new HeartbeatMelody(audioContext);
    }

    const getBpmPerson1 = () => Math.floor(60 + Math.random() * 40);
    const getIntensityPerson1 = () => Math.floor(Math.random() * 10);
    const getBpmPerson2 = () => Math.floor(70 + Math.random() * 30);
    const getIntensityPerson2 = () => Math.floor(Math.random() * 10);

    melodyGenerator.startMelody(getBpmPerson1, getIntensityPerson1, getBpmPerson2, getIntensityPerson2);
}

// Parar a música após 30 segundos
setTimeout(() => {
    if (melodyGenerator) melodyGenerator.stopMelody();
}, 30000);
