# 🗑️ Leipzig Abfallkalender Sync

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge" alt="License: MIT">
  <img src="https://img.shields.io/badge/GitHub%20Pages-Ready-blue.svg?style=for-the-badge&logo=github" alt="GitHub Pages">
  <img src="https://img.shields.io/badge/API-Direct-brightgreen.svg?style=for-the-badge" alt="Direct API">
</p>

<p align="center">
  <strong>Ein-Klick-Synchronisation der Entsorgungstermine der Stadtreinigung Leipzig für Deinen Kalender.</strong><br>
  Kompatibel mit <strong>Google Calendar, Apple Kalender (iPhone / Mac), Outlook Web, Microsoft 365, Android & .ICS Download</strong>.
</p>

<p align="center">
  <a href="https://sibbl.github.io/ics-abfall-leipzig/"><strong>🌐 Live Demo öffnen »</strong></a>
</p>

---

## ✨ Features

- 🔎 **Live API Autocomplete**: Fragt Straßen und Hausnummern direkt von der offiziellen API der Stadtreinigung Leipzig ab.
- 🏠 **Hausnummern-Erkennung**: Schnelle Auswahl Deiner genauen Hausnummer.
- ⚙️ **Custom Reminders & Zeiten**:
  - Ganztägige Termine oder Zeitraum (05:30 – 13:30 Uhr).
  - Benachrichtigungen / Alarme (am Abholtag um 05:00 Uhr, am Vortag um 20:00 Uhr, etc.).
- 📱 **Multi-Provider Ein-Klick-Buttons**:
  - 🔵 **Google Calendar** (Web & Android App) – Automatisches Abo mit Live-Updates.
  - 🍏 **Apple Kalender** (iPhone, iPad, Mac) – Direktes Abo per `webcal://`.
  - 🟦 **Outlook Web & Microsoft 365** – Einbinden in Online-Kalender.
  - 📥 **.ICS Download** – Für Thunderbird, Outlook Desktop und alle Offline-Kalender.
  - 📋 **iCal Feed-Link kopieren** – Für die manuelle Eingabe mit 1-Klick Clipboard Copy.
- ⭐ **Favoriten-Funktion**: Speichert Deine Adressen lokal im Browser (`localStorage`).

---

## 🛠️ Installation & Lokale Entwicklung

Die App besteht aus reinem Vanilla HTML5, CSS3 und JavaScript (ES6+).

```bash
# Repository klonen
git clone https://github.com/sibbl/ics-abfall-leipzig.git
cd ics-abfall-leipzig

# Lokalen Webserver starten (z.B. Python)
python3 -m http.server 8080
```
Öffne danach `http://localhost:8080` im Browser.

---

## 🌐 Deployment auf GitHub Pages

1. Gehe in Deinem Repository auf **Settings** ➔ **Pages**.
2. Wähle bei **Source**: `Deploy from a branch`.
3. Wähle Branch `main` und `/ (root)` aus und klicke auf **Save**.
4. Die App ist unter `https://<dein-username>.github.io/ics-abfall-leipzig/` erreichbar!

---

## 📄 Lizenz

Vertrieben unter der **[MIT Lizenz](LICENSE)**. Frei nutzbar, veränderbar und weiterverwendbar.

---

<p align="center">
  Gemacht mit ❤️ für Leipzig. Datenquelle: <a href="https://stadtreinigung-leipzig.de/wir-kommen-zu-ihnen/abfallkalender" target="_blank" rel="noopener">Stadtreinigung Leipzig</a>
</p>
