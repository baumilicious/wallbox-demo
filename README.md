# E.ON Wallbox Control Panel - Error Handling Demo

## Purpose

This project provides a static frontend mockup of an E.ON Wallbox web interface. Its primary goal is to demonstrate a customer support scenario where an agent guides a user through identifying and resetting a simulated Wallbox error via the interface.

It showcases how an error state is presented to the user and how it can be resolved through the troubleshooting section.

## Key Features

*   **Realistic Interface:** Mimics the look and feel of a Wallbox control panel with various sections (Charging Power, Charging Info, Energy Management, Troubleshooting, etc.).
*   **Interactive Settings:** Allows adjusting simulated settings like maximum charging power (kW) and current (A) using sliders and presets in the "Ladeleistung" section.
*   **Charging Simulation (in "Ladeinformationen"):**
    *   **Activation:** Can be started and stopped by clicking anywhere within the "Ladeinformationen" section *only when no error is active*.
    *   **Live Data Mockup:** When active, it simulates a charging process by updating values like current charging power, accumulated energy (kWh), estimated remaining time (target: 40 kWh), estimated cost (at 0.35 €/kWh), start time, and duration.
    *   **Visualization:** Includes a simple line chart showing a simulated power curve.
    *   **Error Dependency:** The simulation cannot be started or will stop if a Wallbox error is active.
*   **Error Simulation:** A button ("Fehler simulieren") in the "Fehlerbehebung" (Troubleshooting) section allows manually triggering various simulated error messages (e.g., "Kommunikationsfehler Modul B", "Überhitzung erkannt").
*   **Global Error Indicator:** A prominent banner (`🚨 Wallbox Fehler: ...`) appears at the top of the page when an error is active, displaying the specific error message.
*   **Error Reset:** A button ("Fehler zurücksetzen") in the "Fehlerbehebung" section allows resetting the simulated error, clearing the message from the troubleshooting section and the global indicator banner.

## How to Run

1.  **No Installation Needed:** This is a static web page demo. No build steps or server setup is required.
2.  **Open in Browser:** Simply open the `index.html` file directly in any modern web browser (like Chrome, Firefox, Safari, Edge).

## Demo Scenario Walkthrough (Customer Support Agent Guide)

This outlines the core steps to demonstrate the error reset functionality:

1.  **Open the Interface:** Have the user open the `index.html` file in their browser.
2.  **Identify the Error:** Point out the initial error message. It will be visible in two places:
    *   The red banner at the very top of the page (`🚨 Wallbox Fehler: ...`).
    *   Within the "Fehlerbehebung" section, next to "Aktueller Status".
3.  **Navigate to Troubleshooting:** Guide the user to click on "🛠️ Fehlerbehebung" in the left-hand navigation menu.
4.  **Reset the Error:** Instruct the user to click the "Fehler zurücksetzen" button within the "Fehlerbehebung" section.
5.  **Confirm Resolution:** Observe that the error message disappears from the "Aktueller Status" text and the red banner at the top vanishes. The Wallbox is now shown as error-free.

**Optional Steps:**

*   **Demonstrate Simulation Dependency:**
    *   With the error cleared, navigate to "📊 Ladeinformationen".
    *   Click anywhere in the main content area of this section to start the charging simulation (values will start updating).
    *   Navigate back to "🛠️ Fehlerbehebung".
    *   Click "Fehler simulieren".
    *   Return to "📊 Ladeinformationen". Note that the simulation has stopped (or cannot be started) because of the active error.
    *   Reset the error again via "Fehlerbehebung" to re-enable the simulation.
*   **Simulate Different Errors:** Use the "Fehler simulieren" button multiple times to show how different error messages might appear.

## Technical Notes

*   This is a purely static frontend demo.
*   Built with standard HTML, CSS, and vanilla JavaScript.
*   No backend, server, database, or actual hardware connection is involved or required.
*   All data and states (charging progress, errors, settings) are simulated entirely within the browser's JavaScript environment.
