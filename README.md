<div align="center">
  <img src="assets/app.png" alt="Sitemap Builder Logo" width="112" height="112">

  # Sitemap Builder

  **Websites visuell planen, strukturieren und für SEO vorbereiten.**

  Sitemap Builder ist eine Desktop-App für Informationsarchitektur, Content-Planung und Website-Relaunches. Seiten lassen sich auf einem visuellen Canvas organisieren, in einer Tabelle bearbeiten, auf Qualitätsprobleme prüfen und als XML oder CSV exportieren.

  [![macOS DMG](https://github.com/nickbethke/sitemap-builder/actions/workflows/release.yml/badge.svg)](https://github.com/nickbethke/sitemap-builder/actions/workflows/release.yml)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![MōBrowser](https://img.shields.io/badge/M%C5%8DBrowser-2.14-111827)](https://mobrowser.dev/)

  [Download](https://github.com/nickbethke/sitemap-builder/releases) · [Roadmap](TODO.md) · [Fehler melden](https://github.com/nickbethke/sitemap-builder/issues)
</div>

---

## Funktionen

### Visuelle Sitemap

- Seitenhierarchien auf einem übersichtlichen Canvas planen
- Horizontales oder vertikales Layout wählen
- Seiten per Drag-and-drop neu zuordnen
- Unterseiten erstellen, duplizieren, sortieren und löschen
- Große Strukturen durchsuchen und zoomen
- Heller und dunkler Modus

### Tabellenansicht

- Alle Seiten kompakt in einer Tabelle anzeigen
- Titel, URL, Typ, Status und Verantwortliche direkt bearbeiten
- Spalten sortieren und in der Breite anpassen
- Nach Status, Seitentyp, Owner und SEO-Relevanz filtern
- Mehrere Seiten auswählen und Status gesammelt ändern

### Content- und SEO-Planung

Für jede Seite können unter anderem folgende Angaben gepflegt werden:

- Seitentitel, Beschreibung und URL-Slug
- Seitentyp und Template
- Bearbeitungsstatus und verantwortliche Person
- SEO-Titel und Meta-Description
- SEO-Relevanz und `noindex`
- Notizen und alte Redirect-URL

Die integrierte Qualitätsprüfung erkennt unter anderem:

- fehlende oder ungültige Titel und Slugs
- doppelte Slugs
- fehlende Elternseiten
- fehlende SEO-Titel und Meta-Descriptions
- zu lange SEO-Titel und Meta-Descriptions

### Projekte und Export

- Vorlagen für Unternehmenswebsites, lokale Dienstleister und Onlineshops
- Projekte als `.smap`-Datei speichern und wieder öffnen
- Automatische lokale Sicherung und Wiederherstellung
- Undo/Redo für Bearbeitungen
- XML-Sitemap für Suchmaschinen exportieren
- CSV-Datei für Redaktion und Projektmanagement exportieren

## Download

Fertige macOS-DMGs stehen unter [GitHub Releases](https://github.com/nickbethke/sitemap-builder/releases) bereit. Nach Download DMG öffnen und Sitemap Builder in Programme ziehen.

> Falls noch kein Release verfügbar ist, App wie unten beschrieben lokal bauen.

## Entwicklung

### Voraussetzungen

- Node.js `^20.20.2`, `^22.22.2` oder `>=24.14.1`
- npm
- Unterstützte Desktop-Plattform: macOS, Windows oder Linux

### Projekt starten

```bash
git clone https://github.com/nickbethke/sitemap-builder.git
cd sitemap-builder
npm ci
npm run dev
```

### Build erstellen

```bash
npm run build
```

Build-Ausgabe landet unter `build/dist/<platform>-<arch>/bin`.

### Installer packen

```bash
npm run pack
```

Auf macOS entsteht ein DMG unter `build/dist/mac-<arch>/pack`.

## Nützliche Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungs-Build starten |
| `npm run dev:build` | Entwicklungs-Build ohne Start erstellen |
| `npm run build` | Produktions-Build erstellen |
| `npm run pack` | Nativen Installer packen |
| `npm run gen` | IPC-/Protobuf-Bindings neu generieren |

## Tastenkürzel

| Aktion | macOS | Windows/Linux |
|---|---|---|
| Speichern | `⌘ S` | `Ctrl S` |
| Speichern unter | `⌘ ⇧ S` | `Ctrl Shift S` |
| Rückgängig | `⌘ Z` | `Ctrl Z` |
| Wiederholen | `⌘ ⇧ Z` | `Ctrl Shift Z` |

## Tech-Stack

- [MōBrowser](https://mobrowser.dev/) – native Desktop-Laufzeit und IPC
- [React 19](https://react.dev/) – Benutzeroberfläche
- [TypeScript](https://www.typescriptlang.org/) – typsichere Anwendungslogik
- [Vite](https://vite.dev/) – Renderer-Build
- [Tailwind CSS](https://tailwindcss.com/) – Styling
- [Radix UI](https://www.radix-ui.com/) und [Lucide](https://lucide.dev/) – UI-Komponenten und Icons

## Roadmap

Geplant sind unter anderem Website- und XML-Importe, zusätzliche Exportformate, Dashboard-Auswertungen, Content-Briefings und erweiterte Redirect-Prüfungen. Vollständige Planung steht in [`TODO.md`](TODO.md).

## Mitwirken

Fehlerberichte und Vorschläge sind über [GitHub Issues](https://github.com/nickbethke/sitemap-builder/issues) willkommen.
