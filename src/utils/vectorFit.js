// ============================================================
// DOPASOWANIE PODGLADU DO TRESCI RYSUNKU
// ============================================================
// Rachunek jest krotki, ale latwo go zepsuc w sposob niewidoczny: podglad
// dalej cos pokazuje, tylko nie to, co trzeba. Dlatego stoi osobno i ma
// wlasny test na przypadkach z zycia (znak w rogu arkusza A4, rysunek
// wypelniajacy plotno, plik bez `viewBox`).

/**
 * Skala i przesuniecie, ktore sprowadzaja TRESC rysunku na srodek ramki
 * i powiekszaja ja tak, by wypelnila ramke.
 *
 * Wynik opisuje transformacje CSS nakladana na `<img>` rysowany z
 * `object-fit: contain`, czyli:
 *   translate(dx, dy) najpierw, potem scale(k), oba wzgledem srodka.
 *
 * @param {{w:number,h:number}} frame rozmiar ramki w pikselach
 * @param {{x,y,w,h}|null} contentBox prostokat tresci w jednostkach pliku
 * @param {{x,y,w,h}|null} canvasBox prostokat plotna, te same jednostki
 * @param {number} margines uamek ramki zostawiony na oddech
 * @returns {{k:number, dx:number, dy:number}}
 */
export function fitToContent(frame, contentBox, canvasBox, margines = 0.88) {
  const FW = frame?.w || 0;
  const FH = frame?.h || 0;
  if (!FW || !FH || !contentBox || !canvasBox || !(canvasBox.w > 0) || !(canvasBox.h > 0)) {
    return { k: 1, dx: 0, dy: 0 };
  }

  // Skala, w jakiej przegladarka rysuje CALE plotno przy `object-fit: contain`.
  const c = Math.min(FW / canvasBox.w, FH / canvasBox.h);

  // Przesuniecie srodka tresci na srodek ramki, juz w pikselach.
  const dx = -((contentBox.x + contentBox.w / 2) - (canvasBox.x + canvasBox.w / 2)) * c;
  const dy = -((contentBox.y + contentBox.h / 2) - (canvasBox.y + canvasBox.h / 2)) * c;

  const szer = contentBox.w * c;
  const wys = contentBox.h * c;
  const k = szer > 0 && wys > 0 ? Math.min(FW / szer, FH / wys) * margines : 1;

  // NIGDY NIE POMNIEJSZAMY. Rysunek wypelniajacy plotno jest juz dopasowany,
  // a zjechanie ponizej jedynki dolozyloby pustki zamiast ja usunac.
  return { k: Math.max(1, k), dx, dy };
}
