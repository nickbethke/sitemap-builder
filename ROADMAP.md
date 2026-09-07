# Roadmap — Sitemap Builder

## Vision

Sitemap Builder startet als lokales Desktop-Tool für Informationsarchitektur und SEO-Planung. Die Roadmap beschreibt den
Weg von diesem soliden Einzelplatz-Werkzeug zu einer vollwertigen Plattform für Webagenturen: erst durch ein optionales
Cloud-Angebot mit Benutzerkonten und Rechten (v2.x), danach durch die Erweiterung zu einem "Flow-Helper", der den
kompletten Projektlebenszyklus einer Agentur an einem Ort abbildet — Konzeption, Kunden-Content-Abstimmung,
Design-Handoff, Redaktion und Entwicklungs-Strukturanalyse (v3.x). Heute läuft dieser Abstimmungsprozess meist verstreut
über E-Mail, Google Docs, Word und Excel; Ziel ist, die Sitemap-Struktur als gemeinsamen Anker für all diese Schritte zu
nutzen, ohne selbst zu einem Projektmanagement- oder Medienverwaltungs-Tool zu werden.

Der lokale, kostenlose Modus ohne Login bleibt dabei durchgehend erhalten — die Cloud-/Plattform-Schritte sind ein
zusätzliches, optionales Angebot obendrauf, kein Ersatz.

Diese Datei ersetzt `TODO.md` als einzige Planungsquelle.
Release-Historie: [GitHub Releases](https://github.com/nickbethke/sitemap-builder/releases). Sicherheits-/Audit-Historie
liegt in `.pi/audit/` (lokal, nicht Teil des versionierten Repos).

## Versionierung

Sitemap Builder folgt SemVer (`MAJOR.MINOR.PATCH`), Git-Tags im Format `vX.Y.Z`:

- **PATCH** — Bugfix oder Security-Fix ohne Verhaltensänderung für Nutzende.
- **MINOR** — neues Feature, abwärtskompatibel; bestehende `.smap`-Projekte und Abläufe funktionieren unverändert
  weiter.
- **MAJOR** — Breaking Change: neues oder inkompatibles `.smap`-Dateiformat, entfernte Funktionen, oder ein grundlegend
  neues Betriebsmodell (z. B. Einführung von Cloud-Konten in v2.0.0, Plattform-Umbau in v3.0.0).

**Aktueller Zustand & offener Punkt:** `package.json` steht auf `0.0.1`, während bereits Git-Tags bis `v1.0.004`
existieren. Diese Diskrepanz wird mit dem nächsten Release behoben (siehe v1.0.0 unten), damit Package- und Tag-Version
wieder übereinstimmen und zukünftige Versionssprünge nachvollziehbar bleiben.

Der bestehende Release-Workflow (`.github/workflows/release.yml`) baut automatisch bei jedem Push eines `v*`-Tags für
macOS, Windows und Linux. Jeder Meilenstein in dieser Roadmap mündet perspektivisch in genau so einen Tag und ein GitHub
Release.

---

## v1.x — Desktop-App festigen

Bevor Cloud- und Plattform-Ambitionen (v2.x, v3.x) angegangen werden, muss die bestehende Desktop-App auf sauberem
Fundament stehen: Versionsstand korrekt, offene Sicherheits-/Datenintegritätsbefunde behoben und im Code verankert, und
der bestehende Funktionsumfang (Ansichten, Vorlagen, Dashboard) ausgebaut. v1.x ist bewusst abwärtskompatibel — keine
der hier geplanten Änderungen bricht bestehende `.smap`-Dateien oder erzwingt neue Abläufe.

### v1.0.0 — Versionsbasis

Reiner Hygiene-Release, der die Grundlage für alle folgenden Versionen schafft.

- [ ] `package.json`-Version auf `1.0.0` anheben, damit Tag- und Package-Version wieder synchron laufen.
- [ ] Audit-Fixes aus `.pi/audit/FIXES.md` (Befunde S-01–S-04, F-01–F-04) committen und im Repo verankern — aktuell nur
  im lokalen Arbeitsstand vorhanden, noch nicht Teil der Git-Historie.

### v1.1.0 — Datenqualität & Export-Härtung

Schließt die noch offenen Punkte aus der Sicherheits-Checkliste (P2 in `.pi/audit/CHECKLIST.md`) ab und erweitert die
Export-/Redirect-Funktionen, die für Relaunch-Projekte in Agenturen besonders relevant sind.

- [ ] `adm-zip`-Override (Befund S-02) nach einem passenden SDK-Update erneut bewerten und ggf. entfernen.
- [ ] Excel-Export für Redaktion und Projektmanagement (ergänzt bestehenden CSV-Export).
- [ ] Redirect-Manager als eigenes Tool Window statt Detailfelder pro Seite.
- [ ] Redirect-Ketten, Schleifen und doppelte Ziele automatisch erkennen.
- [ ] Redirects per CSV importieren und exportieren, für Übergaben mit Entwicklung/Hosting.

### v1.2.0 — Ansichten & Organisation

Feinschliff an den bestehenden Ansichten (Canvas, Tabelle, Baum, Kanban), Bedienbarkeit für große Sitemaps und
Barrierefreiheit.

- [ ] Spaltenbreiten in der Tabellenansicht per Drag-and-drop änderbar machen.
- [ ] Tool Window (Qualitätsprüfung) minimier- und maximierbar.
- [ ] Qualitätsprobleme nach Typ und Schwere filterbar.
- [ ] Quick-Fixes direkt aus der Qualitätsprüfung heraus anbieten, statt nur Hinweise anzuzeigen.
- [ ] Tastenkürzel vollständig dokumentieren und um fehlende Aktionen ergänzen.
- [ ] Zoom zurücksetzen und „Alles einpassen“-Aktion für den Canvas.
- [ ] Canvas per Maus verschieben (Pan), zusätzlich zu bestehendem Zoom/Scroll.
- [ ] Drag-and-drop-Verhalten bei großen Sitemaps verbessern (Performance, Zielerkennung).
- [ ] Seiten und ganze Teilbäume kopieren/einfügen.
- [ ] Barrierefreiheit der Bedienoberfläche systematisch prüfen (Tastaturnavigation, Screenreader, Kontrast).
- [ ] Beispielprojekte und Onboarding-Flow für neue Nutzende ergänzen.

### v1.3.0 — Projektübersicht / Dashboard

Ein Überblick über den Projektstand, der aktuell nur durch manuelles Filtern der Tabellenansicht entsteht.

- [ ] Anzahl Seiten je Status anzeigen.
- [ ] Fortschritt des Projekts visualisieren (z. B. Anteil fertiger vs. offener Seiten).
- [ ] Seiten pro Verantwortlichem auswerten, für Lastverteilung im Team.
- [ ] Seiten nach Typ und SEO-Priorität zusammenfassen.
- [ ] Liste offener SEO- und Inhaltsaufgaben als Einstiegspunkt in die tägliche Arbeit.

### v1.4.0 — Vorlagen & Content-Planung

Erweitert die bestehenden Projektvorlagen und legt mit Content-Briefing-Feldern bereits den Grundstein für die spätere
Kunden-Content-Abstimmung in v3.x.

- [ ] Vorlage: Agenturportfolio.
- [ ] Vorlage: Blog/Magazin.
- [ ] Vorlage: Relaunch-Projekt.
- [ ] Interne Verlinkungen zusätzlich zur reinen Hierarchie planbar machen.
- [ ] Verlinkungen als Graph visualisieren, ergänzend zur Baumstruktur.
- [ ] Content-Briefing-Felder ergänzen (Zielgruppe, Suchintention, Hauptkeyword) pro Seite.
- [ ] Seiten als Entwurf, Archiv oder extern markieren, für sauberere Statuslogik bei Relaunches.

### v1.x (laufend) — Sicherheits- & Plattformabdeckung

Kein einzelnes Versionsziel, sondern eine laufende Liste, die bei jedem v1.x-Release erneut geprüft wird. Quelle: die
verbliebenen P2/P3-Punkte aus `.pi/audit/CHECKLIST.md`, die über die acht bereits behobenen Kernbefunde hinausgehen.

- [ ] Netzwerk-Integrationstests: DNS-Rebinding, Redirects ins Privatnetz, TLS-Fehler, Timeouts, IPv6-Sonderfälle.
- [ ] XML/GZIP-Grenzfälle: XXE/DOCTYPE, Entity-Expansion, Dekompressionsbomben, Encoding/BOM-Varianten.
- [ ] Datei-I/O-Grenzfälle: fehlende Rechte, volles Speichervolumen, gesperrte Datei, abgebrochener Export.
- [ ] Lifecycle-Szenarien: Save/Open/New im Wettlauf, Dialogablehnung, Beenden mit ungespeicherten Änderungen.
- [ ] Autosave-Grenzfälle: Crash unmittelbar vor/nach Commit, blockiertes IndexedDB, Quota-Überschreitung, veralteter
  Fallback.
- [ ] Performance bei 1.000/10.000 Knoten — Canvas, Baum und Tabelle sind aktuell nicht durchgängig virtualisiert.
- [ ] Windows-/Linux-Runtime-Tests sowie Installer-Signierung/Notarisierung (aktuell nur macOS lokal geprüft,
  unsigniert).
- [ ] Crawler: `robots.txt` auswerten und hostbezogenes Rate-Limiting ergänzen.

---

## v2.x — Cloud-Angebot

Der erste große strategische Schritt: Sitemap Builder bekommt neben dem bestehenden lokalen, kostenlosen Modus ein
bezahltes Cloud-Angebot mit Benutzerkonten, Rechten und geteilten Projekten. Der lokale Modus bleibt vollständig
erhalten und bleibt Standard — ein Cloud-Konto ist ein optionales Upgrade, kein Zwangslogin.

Das Angebot gliedert sich in drei Stufen:

1. **Local (kostenlos, Status quo)** — `.smap`-Dateien lokal, kein Login, keine Cloud-Abhängigkeit. Bleibt Default für
   alle, die keine Cloud-Funktionen brauchen.
2. **Cloud SaaS (bezahlt, von uns gehostet)** — Login/Benutzerkonto, eigene und mit anderen geteilte Sitemaps,
   Rollen/Rechte pro Sitemap (Owner/Editor/Betrachter), Abrechnung nach Sitzen oder Projekten.
3. **Self-Hosted Private Cloud (bezahlt, Lizenz statt Subscription)** — dieselbe Backend-Codebasis wie Stufe 2, aber vom
   Kunden selbst betrieben (Docker-Deploy), gegen Lizenzschlüssel statt laufender Subscription. Zielgruppe: Agenturen
   und Unternehmen, die Kunden-Sitemapdaten aus Compliance- oder Vertragsgründen nicht auf fremden Servern speichern
   dürfen.

**Reihenfolge ist bewusst sequenziell, nicht parallel:** Erst wird das Cloud-SaaS-Angebot (Stufe 2) gebaut und das
Multi-Tenant-/Rechtemodell dort im echten Betrieb validiert. Das Self-Hosted-Paket (Stufe 3) verpackt danach dieselbe
Backend-Codebasis für den Betrieb beim Kunden — zwei parallele Entwicklungsstränge für ein noch unvalidiertes Modell
wären unnötiges Risiko.

### v2.0.0 — Cloud SaaS (Stufe 2)

- [ ] Benutzerkonten: Login, Registrierung, Passwort-Reset.
- [ ] Rechte-/Rollenmodell pro Sitemap (Owner, Editor, Betrachter).
- [ ] Sitemap-Freigabe an einzelne Benutzer oder Teams.
- [ ] Cloud-Synchronisation und Projektbibliothek — eigene und freigegebene Sitemaps an einem Ort.
- [ ] Abrechnung und Pricing-Tiers (Subscription, z. B. gestaffelt nach Sitzen oder Projektanzahl).
- [ ] Kommentare direkt an einzelnen Seiten der Sitemap.
- [ ] Erwähnungen und Aufgabenzuweisung für Verantwortliche.
- [ ] Freigabe-Workflow für einzelne Seiten (nicht nur für das Gesamtprojekt).
- [ ] Änderungsverlauf pro Seite, nachvollziehbar für alle Beteiligten.
- [ ] Schreibgeschützte Freigabeansicht speziell für Kunden.
- [ ] Import/Export-Funktion für Team-Übergaben zwischen Agenturen oder Abteilungen.
- [ ] Kollaboratives Bearbeiten in Echtzeit (mehrere Personen gleichzeitig an derselben Sitemap).
- [ ] Migrationspfad von lokalem `.smap` zu einem Cloud-Projekt — als Import, nie als Zwang.

### v2.1.0 — Self-Hosted Private Cloud (Stufe 3)

- [ ] Docker-/Compose-Deploy-Paket für den Betrieb auf Kunden-Infrastruktur.
- [ ] Lizenzschlüssel-Gate anstelle von Subscription-Billing.
- [ ] Eigener Update-/Versionierungskanal, getrennt vom Release-Rhythmus der eigenen SaaS-Instanz.
- [ ] Dokumentation für Betrieb, Backup und Zertifikate im Rechenzentrum des Kunden.
- [ ] Support-/SLA-Modell für Self-Hosted-Kunden definieren (Reaktionszeiten, Update-Verpflichtungen).

---

## v3.x — Agency Flow Platform

Der zweite große strategische Schritt, aufbauend auf dem in v2.x etablierten Cloud-, Konten- und Rechtemodell: Die
Sitemap wird vom Endprodukt zum zentralen Knotenpunkt eines kompletten Agentur-Workflows. Statt Konzeption,
Kunden-Content-Abstimmung, Design-Handoff, Redaktion und Entwicklungs-Übergabe über E-Mail, Google Docs, Word und Excel
zu verteilen, laufen alle diese Phasen an derselben Sitemap-Struktur — jede Seite im Baum wird zum Content-Objekt, an
dem sich Status, Kommentare, Freigaben und Referenzen für den gesamten Projektverlauf sammeln.

**Bewusste Nicht-Ziele** — damit aus der Idee kein unüberschaubares Alles-Tool wird:

- **Kein PM-/Ticketing-System.** Keine Tasks, Sprints oder Zeiterfassung. Statusfelder pro Seite bleiben
  Content-/Freigabestatus (z. B. „in Abstimmung“, „freigegeben“), keine allgemeine Projektmanagement-Funktion. Wer
  Tickets braucht, nutzt weiterhin Jira, Linear & Co. — Sitemap Builder verdrängt das nicht.
- **Keine Medien-/Asset-Verwaltung im Tool.** Bilder, Dokumente und Design-Dateien bleiben in bestehenden externen
  Diensten (Google Drive, SMB/Samba-Share, o. Ä.). Sitemap Builder speichert selbst keine Mediendateien, sondern
  verknüpft pro Seite oder Projekt nur den Ordner bzw. Link zum externen Speicherort — keine Synchronisation von
  Dateiinhalten.

**Phasen je Sitemap-Knoten:**

- [ ] **Konzeption** — die bestehende Sitemap-/Hierarchieplanung aus v1.x bleibt unverändert der fachliche Kern, auf dem
  alle weiteren Phasen aufsetzen.
- [ ] **Kunden-Content-Abstimmung** — Kommentare und Freigabe-Status direkt am Seitenknoten statt per E-Mail oder Google
  Docs; der Kunde sieht dabei ausschließlich die für ihn freigegebene Sicht (nutzt das v2.0.0-Rollenmodell).
- [ ] **Design-Handoff** — Link bzw. Referenz auf ein externes Design-Tool oder einen Ordner pro Seite, ohne eigenes
  Datei-Hosting im Tool.
- [ ] **Content-Pflege** — finaler redaktioneller Text und finale SEO-Daten pro Seite, mit sichtbarem Versionsstand
  gegenüber dem Entwurf aus der Abstimmungsphase.
- [ ] **Entwicklungs-Strukturanalyse** — Struktur-Diff bzw. Export speziell für die Entwicklung: was hat sich seit der
  letzten Dev-Übergabe an der Hierarchie geändert.
- [ ] **Ordner-Verknüpfung** — externe Speicherorte (Google Drive, SMB-Share, o. Ä.) pro Seite oder Projekt hinterlegen;
  ausschließlich als Referenz/Link, keine Synchronisation von Dateiinhalten.
- [ ] **Rollenspezifische Ansichten** je Phase (Agentur, Kunde, Designer, Entwicklung), aufbauend auf dem
  v2.0.0-Rechtemodell — jede Rolle sieht nur die für sie relevante Phase und Information.

**Ausblick KI-Anbindung:** Sobald der Abstimmungs-Workflow steht, ist KI-gestützte Unterstützung direkt im Kontext
sinnvoll — etwa Vorschläge für Seitentitel, Meta-Beschreibungen oder Content-Entwürfe während der
Kunden-Content-Abstimmung, statt als isoliertes Feature. Wird nach Etablierung der Kernphasen oben konkretisiert, nicht
vorab im Detail geplant.

---

## Später / ohne festes Ziel

Ideen, die grundsätzlich zur Vision passen, aber noch keinem konkreten Versions-Meilenstein zugeordnet sind — meist,
weil sie von externen Abhängigkeiten (APIs, Partnerintegrationen) oder vom Fortschritt in v3.x abhängen.

- [ ] Anbindung an Google Search Console.
- [ ] Anbindung an Analytics-Daten.
- [ ] CMS-Importe, z. B. WordPress, Webflow oder Contentful.
- [ ] KI-Unterstützung für Seitenvorschläge, Titel und Beschreibungen (siehe auch Ausblick in v3.x).

## Changelog

Es gibt bewusst kein separates `CHANGELOG.md`. Ab `v1.0.0`
dienen [GitHub Releases](https://github.com/nickbethke/sitemap-builder/releases) als Änderungshistorie der tatsächlich
ausgelieferten Versionen. Diese Datei bleibt ausschließlich vorausschauend und listet keine bereits erledigten Punkte —
Erledigtes wandert bei jedem Release aus der Roadmap in die zugehörigen Release Notes.
