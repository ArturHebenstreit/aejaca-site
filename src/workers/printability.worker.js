// ============================================================
// ANALIZA DRUKOWALNOSCI, WATEK ROBOCZY
// ============================================================
// Analiza duzego modelu trwa sekundy: przy pol miliona trojkatow topologia
// zajmuje okolo trzech sekund, a grubosc scianek kolejna. Na watku glownym
// oznaczaloby to zamrozona karte, nieruchomy podglad 3D i przegladarke
// proponujaca zamkniecie strony. Dlatego liczy to worker.
//
// Przez granice watku ida wylacznie dane proste. Trojkaty przychodza jako
// jedna plaska tablica `Float32Array`, przekazywana bez kopiowania, a wracaja
// same liczby raportu. Struktura zagniezdzona (tablica tablic punktow) byla
// odrzucona: przy 490 tysiacach trojkatow samo jej sklonowanie kosztuje
// wiecej niz cala analiza.
//
// Watek glowny i tak parsuje plik, bo podglad 3D potrzebuje tej samej
// geometrii. Splaszczenie jej do `Float32Array` to jedno przejscie po
// tablicy, wiec nie parsujemy niczego dwa razy.

import { analyzePrintability } from "../analysis/printability.js";

self.onmessage = (e) => {
  const { positions, tech, nozzleId, samples } = e.data || {};
  try {
    if (!positions || positions.length < 9) {
      self.postMessage({ ok: false, error: "empty" });
      return;
    }

    // Odtworzenie ksztaltu, ktorego oczekuje modul analizy. Trzymamy go w tej
    // postaci, bo dzieki temu te same funkcje da sie uruchomic w Node przy
    // testach, na siatkach pisanych recznie.
    const count = Math.floor(positions.length / 9);
    const triangles = new Array(count);
    for (let i = 0, o = 0; i < count; i++, o += 9) {
      triangles[i] = [
        [positions[o], positions[o + 1], positions[o + 2]],
        [positions[o + 3], positions[o + 4], positions[o + 5]],
        [positions[o + 6], positions[o + 7], positions[o + 8]],
      ];
    }

    const report = analyzePrintability(triangles, { tech, nozzleId, samples });
    self.postMessage({ ok: true, report });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err?.message || err) });
  }
};
