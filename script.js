document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const navLinks = document.querySelectorAll('nav a.nav-link');
    const sections = document.querySelectorAll('.einstellungs-sektion');
    const ladeleistungRange = document.getElementById('ladeleistung-range');
    const ladeleistungWertSpan = document.getElementById('ladeleistung-wert');
    const ladestromRange = document.getElementById('ladestrom-range');
    const ladestromWertSpan = document.getElementById('ladestrom-wert');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const aktuelleLadeleistungInfo = document.getElementById('aktuelle-ladeleistung-info');
    const geladeneEnergieInfo = document.getElementById('geladene-energie-info');
    const verbleibendeZeitInfo = document.getElementById('verbleibende-zeit-info');
    const kostenInfo = document.getElementById('kosten-info');
    const startzeitInfo = document.getElementById('startzeit-info');
    const dauerInfo = document.getElementById('dauer-info');
    const firmwareUpdateBtn = document.getElementById('firmware-update-btn');
    const firmwareStatus = document.getElementById('firmware-status');
    const fehlerStatusAnzeige = document.getElementById('fehler-status-anzeige'); // On troubleshooting page
    const fehlerResetBtn = document.getElementById('fehler-reset-btn');
    const fehlerSimulierenBtn = document.getElementById('fehler-simulieren-btn');
    const globalErrorIndicator = document.getElementById('global-error-indicator'); // New global indicator
    const ctx = document.getElementById('ladeinfo-chart')?.getContext('2d');
    let ladeChart;

    // --- State Simulation ---
    let simulatedState = {
        ladeleistung: 11,
        ladestrom: 16,
        geladeneEnergie: 0,
        ladezeitSekunden: 0,
        kostenProKWh: 0.35,
        isCharging: false,
        timerInterval: null,
        errorMessage: "Kommunikationsfehler Modul B", // Initial error set
        chargeStartTime: null,
        lastmanagementAktiv: false,
        maxGesamtleistung: 25,
        pvUeberschussAktiv: false,
        minPvLeistung: 1.4,
        minLadestromPv: 6
    };

    // --- Constants ---
    const VOLTAGE = 230;
    const PHASES = 3;

    // --- Navigation Logic ---
    function showSection(targetId) {
        sections.forEach(section => section.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
        const targetLink = document.querySelector(`nav a[href="#${targetId}"]`);
        if (targetLink) targetLink.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            if (targetId !== 'ladeinformationen' && simulatedState.isCharging) {
                stopChargingSimulation();
            }
        });
    });

    const initialActiveSection = document.querySelector('.einstellungs-sektion.active');
    if (!initialActiveSection && sections.length > 0) {
        showSection(sections[0].id);
    } else if (initialActiveSection) {
        const initialActiveLink = document.querySelector(`nav a[href="#${initialActiveSection.id}"]`);
         if (initialActiveLink) initialActiveLink.classList.add('active');
    }

    // --- Ladeleistung / Ladestrom Logic ---
    function ampsToKw(amps) {
        return ((amps * VOLTAGE * PHASES) / 1000).toFixed(1);
    }

    function kwToAmps(kw) {
        return Math.round((kw * 1000) / (VOLTAGE * PHASES));
    }

    function updateLeistungFromKw(wertKw) {
        const kw = parseFloat(wertKw);
        const amps = kwToAmps(kw);
        simulatedState.ladeleistung = kw;
        simulatedState.ladestrom = amps;
        if (ladeleistungWertSpan) ladeleistungWertSpan.textContent = `${kw.toFixed(1)} kW`;
        if (ladestromRange) ladestromRange.value = amps;
        if (ladestromWertSpan) ladestromWertSpan.textContent = `${amps} A`;
        if (aktuelleLadeleistungInfo) aktuelleLadeleistungInfo.textContent = `${kw.toFixed(1)} kW`;
        createOrUpdateChart(kw);
        if (simulatedState.isCharging) updateChargingInfo();
    }

     function updateLeistungFromAmps(wertAmps) {
        const amps = parseInt(wertAmps, 10);
        const kw = ampsToKw(amps);
        simulatedState.ladeleistung = parseFloat(kw);
        simulatedState.ladestrom = amps;
        if (ladeleistungRange) ladeleistungRange.value = kw;
        if (ladeleistungWertSpan) ladeleistungWertSpan.textContent = `${kw} kW`;
        if (ladestromWertSpan) ladestromWertSpan.textContent = `${amps} A`;
        if (aktuelleLadeleistungInfo) aktuelleLadeleistungInfo.textContent = `${kw} kW`;
        createOrUpdateChart(parseFloat(kw));
        if (simulatedState.isCharging) updateChargingInfo();
    }

    if (ladeleistungRange) {
        updateLeistungFromKw(ladeleistungRange.value);
        ladeleistungRange.addEventListener('input', () => updateLeistungFromKw(ladeleistungRange.value));
    }
     if (ladestromRange) {
         updateLeistungFromAmps(ladestromRange.value);
         ladestromRange.addEventListener('input', () => updateLeistungFromAmps(ladestromRange.value));
     }

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const kw = button.dataset.kw;
            const a = button.dataset.a;
            if (ladeleistungRange) ladeleistungRange.value = kw;
            if (ladestromRange) ladestromRange.value = a;
            updateLeistungFromKw(kw);
        });
    });

    // --- Charging Simulation ---
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

     function formatTimeHHMM(date) {
        if (!date) return '--:--';
        const h = date.getHours();
        const m = date.getMinutes();
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }


    function updateChargingInfo() {
        simulatedState.geladeneEnergie += simulatedState.ladeleistung * (1 / 3600);
        simulatedState.ladezeitSekunden += 1;
        const targetEnergie = 40;
        const verbleibendeEnergie = Math.max(0, targetEnergie - simulatedState.geladeneEnergie);
        const verbleibendeSekunden = (simulatedState.ladeleistung > 0) ? (verbleibendeEnergie / simulatedState.ladeleistung) * 3600 : 0;

        if (geladeneEnergieInfo) geladeneEnergieInfo.textContent = `${simulatedState.geladeneEnergie.toFixed(2)} kWh`;
        if (verbleibendeZeitInfo) verbleibendeZeitInfo.textContent = formatTime(verbleibendeSekunden);
        if (kostenInfo) kostenInfo.textContent = `${(simulatedState.geladeneEnergie * simulatedState.kostenProKWh).toFixed(2)} €`;
        if (dauerInfo) dauerInfo.textContent = formatTime(simulatedState.ladezeitSekunden);
    }

    function startChargingSimulation() {
        if (simulatedState.isCharging || simulatedState.errorMessage) return;
        simulatedState.isCharging = true;
        simulatedState.ladezeitSekunden = 0;
        simulatedState.geladeneEnergie = 0;
        simulatedState.chargeStartTime = new Date();

        if(startzeitInfo) startzeitInfo.textContent = formatTimeHHMM(simulatedState.chargeStartTime);
        if(dauerInfo) dauerInfo.textContent = formatTime(0);

        updateChargingInfo();
        simulatedState.timerInterval = setInterval(updateChargingInfo, 1000);
        console.log("Charging simulation started");
        document.getElementById('ladeinformationen')?.classList.add('charging');
    }

    function stopChargingSimulation() {
        if (!simulatedState.isCharging) return;
        simulatedState.isCharging = false;
        clearInterval(simulatedState.timerInterval);
        simulatedState.timerInterval = null;
        simulatedState.chargeStartTime = null;
        console.log("Charging simulation stopped");
        document.getElementById('ladeinformationen')?.classList.remove('charging');
    }

    const ladeInfoSection = document.getElementById('ladeinformationen');
    if (ladeInfoSection) {
        ladeInfoSection.addEventListener('click', () => {
            if (simulatedState.errorMessage) return;
            if (simulatedState.isCharging) {
                stopChargingSimulation();
            } else {
                startChargingSimulation();
            }
        });
         ladeInfoSection.style.cursor = 'pointer';
         ladeInfoSection.title = 'Klicken zum Starten/Stoppen der Ladesimulation (nur wenn kein Fehler vorliegt)';
    }

    // --- Chart Implementation ---
    function createOrUpdateChart(leistung = 7.4) {
        if (!ctx) return;
        const labels = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];
        const dataPoints = labels.map((_, index) => Math.max(0, leistung - Math.random() * (leistung / 2) - index * (leistung / labels.length) )).map(val => val.toFixed(1));
        const data = {
            labels: labels,
            datasets: [{
                label: `Simulierter Ladeverlauf (max. ${leistung.toFixed(1)} kW)`,
                data: dataPoints,
                fill: true,
                borderColor: 'rgb(40, 167, 69)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.3
            }]
        };
        const config = {
            type: 'line', data: data,
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Ladeleistung (kW)' } },
                    x: { title: { display: true, text: 'Zeit' } }
                },
                plugins: { legend: { display: false } }
            }
        };
        if (ladeChart) { ladeChart.data = data; ladeChart.update(); }
        else { ladeChart = new Chart(ctx, config); }
    }

    createOrUpdateChart(simulatedState.ladeleistung);

    // --- Firmware Update Logic ---
    if (firmwareUpdateBtn && firmwareStatus) {
        firmwareUpdateBtn.addEventListener('click', () => {
            firmwareStatus.textContent = 'Suche nach Updates...';
            firmwareUpdateBtn.disabled = true;
            setTimeout(() => {
                const updateFound = Math.random() > 0.7;
                if (updateFound) {
                     firmwareStatus.innerHTML = 'Update verfügbar (Version 2.2.0)! <button id="install-update-btn">Installieren</button>';
                     document.getElementById('install-update-btn')?.addEventListener('click', () => {
                         firmwareStatus.textContent = 'Update wird installiert...';
                         setTimeout(() => {
                             firmwareStatus.textContent = 'Update erfolgreich installiert. Version: 2.2.0';
                             document.getElementById('firmware-version').textContent = '2.2.0';
                             firmwareUpdateBtn.disabled = false;
                         }, 3000);
                     });
                } else {
                    firmwareStatus.textContent = 'Firmware ist aktuell.';
                    firmwareUpdateBtn.disabled = false;
                }
            }, 2500);
        });
    }

    // --- Error Handling Logic ---
    function updateFehlerStatus() {
        // Update status on troubleshooting page
        if (fehlerStatusAnzeige) {
            if (simulatedState.errorMessage) {
                fehlerStatusAnzeige.textContent = `Fehler: ${simulatedState.errorMessage}`;
                fehlerStatusAnzeige.style.color = 'red';
                stopChargingSimulation(); // Stop charging on error
            } else {
                fehlerStatusAnzeige.textContent = 'Keine Fehler';
                fehlerStatusAnzeige.style.color = 'green';
            }
        }
        // Update global indicator
        if (globalErrorIndicator) {
             if (simulatedState.errorMessage) {
                globalErrorIndicator.textContent = `🚨 Wallbox Fehler: ${simulatedState.errorMessage}`;
                globalErrorIndicator.style.display = 'block'; // Show indicator
             } else {
                 globalErrorIndicator.style.display = 'none'; // Hide indicator
             }
        }
    }

    if (fehlerSimulierenBtn) {
        fehlerSimulierenBtn.addEventListener('click', () => {
            const errors = ['Überhitzung erkannt', 'Kommunikationsfehler', 'Interner Speicher voll', 'Ladekabel nicht erkannt'];
            simulatedState.errorMessage = errors[Math.floor(Math.random() * errors.length)];
            updateFehlerStatus();
        });
    }

    if (fehlerResetBtn) {
        fehlerResetBtn.addEventListener('click', () => {
            simulatedState.errorMessage = null;
            updateFehlerStatus();
        });
    }

    // Initial error status display
    updateFehlerStatus();

    // --- Energie Management Logic (Placeholders) ---
    const lastmanagementCheckbox = document.getElementById('lastmanagement');
    const maxGesamtleistungInput = document.getElementById('max-gesamtleistung');
    const solarstromCheckbox = document.getElementById('solarstrom');
    const minPvLeistungInput = document.getElementById('min-pv-leistung');
    const minLadestromPvInput = document.getElementById('min-ladestrom-pv');

    if(lastmanagementCheckbox) {
        lastmanagementCheckbox.addEventListener('change', (e) => {
            simulatedState.lastmanagementAktiv = e.target.checked;
            console.log('Lastmanagement aktiv:', simulatedState.lastmanagementAktiv);
        });
    }
     if(maxGesamtleistungInput) {
        maxGesamtleistungInput.addEventListener('change', (e) => {
            simulatedState.maxGesamtleistung = parseFloat(e.target.value);
            console.log('Max. Gesamtleistung:', simulatedState.maxGesamtleistung);
        });
    }
     if(solarstromCheckbox) {
        solarstromCheckbox.addEventListener('change', (e) => {
            simulatedState.pvUeberschussAktiv = e.target.checked;
            console.log('PV Überschuss aktiv:', simulatedState.pvUeberschussAktiv);
        });
    }
    if(minPvLeistungInput) {
        minPvLeistungInput.addEventListener('change', (e) => {
            simulatedState.minPvLeistung = parseFloat(e.target.value);
            console.log('Min. PV Leistung:', simulatedState.minPvLeistung);
        });
    }
    if(minLadestromPvInput) {
        minLadestromPvInput.addEventListener('change', (e) => {
            simulatedState.minLadestromPv = parseInt(e.target.value, 10);
            console.log('Min. Ladestrom PV:', simulatedState.minLadestromPv);
        });
    }

}); // End of DOMContentLoaded
