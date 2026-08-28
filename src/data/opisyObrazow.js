// ============================================================
// OPIS OBRAZU NALEZY DO OBRAZU, NIE DO STRONY
// ============================================================
// `alt` czyta czytnik ekranu i widzi kazdy, komu obraz sie nie wczyta. Do
// 2026-08-28 stal wpisany przy kazdym uzyciu z osobna, w jednym jezyku, i
// czesto opisywal nie obraz, tylko tytul strony z dopiskiem marki
// ("Kalkulator Rozwiniecia Obraczki - AEJaCA"). Niewidomy dowiadywal sie z
// tego zera, bo tytul przeczytal chwile wczesniej z naglowka.
//
// Drugi klopot byl gorszy: ten sam obraz stoi na kilku stronach.
// `hero-toolstudio` na trzech, `hero-toolsjewelry` na trzech. Opis przypiety
// do strony rozjezdza sie przy pierwszej edycji jednej z nich i nikt tego nie
// zauwazy, bo tego napisu nie widac.
//
// Dlatego opis stoi tutaj, raz na obraz, w trzech jezykach. Strona podaje
// klucz, nie tresc.
//
// Zasada pisania: mow, co widac, krotko, bez "zdjecie" na poczatku (czytnik
// sam mowi "grafika") i bez upychania slow kluczowych. Decyzja: ADR-0025.

const OPISY = {
  "hero-toolstudio": {
    pl: "Maszyna CNC tnie blachę na stole roboczym, spod głowicy sypią się iskry, w tle regał ze stalowymi profilami.",
    en: "A CNC machine cuts sheet metal on its bed, sparks flying from the head, steel stock racked behind it.",
    de: "Eine CNC-Maschine schneidet Blech auf dem Arbeitstisch, Funken sprühen vom Kopf, dahinter ein Regal mit Stahlprofilen.",
  },
  "hero-toolsjewelry": {
    pl: "Narzędzia jubilerskie na drewnianym blacie: młotki, pilniki, szczypce, trzpień do pierścionków, zwój drutu i palnik.",
    en: "Jeweller's tools on a wooden bench: hammers, files, pliers, a ring mandrel, a coil of wire and a torch.",
    de: "Goldschmiedewerkzeug auf einer Holzplatte: Hämmer, Feilen, Zangen, Ringriegel, ein Drahtbund und ein Brenner.",
  },
  "hero-home-jewelry": {
    pl: "Pierścionek z dużym zielonym kamieniem stoi na płytce łupka, obok dwie złote obrączki z niebieskimi kamieniami i srebrny łańcuszek.",
    en: "A ring with a large green stone stands on a slate slab, beside two gold bands set with blue stones and a silver chain.",
    de: "Ein Ring mit großem grünem Stein steht auf einer Schieferplatte, daneben zwei Goldringe mit blauen Steinen und eine Silberkette.",
  },
  // `hero-home-studio.webp` i `hero-print-settings.webp` to ten sam plik,
  // bajt w bajt, wiec i opis jest jeden.
  "hero-print-settings": {
    pl: "Drukarka FDM na warsztatowym stole drukuje czarną część z kołami zębatymi, nad nią szpula pomarańczowego filamentu.",
    en: "An FDM printer on a workbench printing a black geared part, an orange filament spool feeding it from above.",
    de: "Ein FDM-Drucker auf der Werkbank druckt ein schwarzes Zahnradteil, darüber eine Spule mit orangefarbenem Filament.",
  },
  "hero-jewelry": {
    pl: "Stół jubilerski z gotowymi wyrobami: pierścionek z turkusem, złoty pierścionek z kamieniem, bransoleta i wisior, wokół młotek i szczypce.",
    en: "A jeweller's bench with finished pieces: a turquoise ring, a gold ring with a stone, a cuff and a pendant, among hammers and pliers.",
    de: "Eine Goldschmiedebank mit fertigen Stücken: ein Türkisring, ein Goldring mit Stein, ein Armreif und ein Anhänger, dazwischen Hammer und Zangen.",
  },
  "hero-studio": {
    pl: "Pracownia z trzema maszynami naraz: drukarka FDM z wydrukiem, laser CO2 grawerujący płytę i laser światłowodowy znakujący tabliczkę.",
    en: "A workshop running three machines at once: an FDM printer mid-print, a CO2 laser engraving a sheet and a fibre laser marking a plate.",
    de: "Eine Werkstatt mit drei Maschinen zugleich: ein FDM-Drucker im Druck, ein CO2-Laser beim Gravieren und ein Faserlaser beim Beschriften.",
  },
  "zywica-msla": {
    pl: "Figurka rycerza z włócznią wydrukowana z żywicy stoi na platformie drukarki MSLA podświetlonej na fioletowo.",
    en: "A resin-printed knight figurine with a spear stands on the build plate of an MSLA printer lit violet from below.",
    de: "Eine aus Harz gedruckte Ritterfigur mit Speer steht auf der violett beleuchteten Bauplattform eines MSLA-Druckers.",
  },
  "pracownia-stol": {
    pl: "Stół w pracowni: walcarka, pojemniki z kamieniami i elementami, lupa na ramieniu, młotek i szczypce na macie roboczej.",
    en: "A bench in the workshop: a rolling mill, trays of stones and findings, a magnifier on an arm, a hammer and pliers on the mat.",
    de: "Eine Werkbank in der Werkstatt: Walzwerk, Schalen mit Steinen und Zubehör, eine Lupenleuchte, Hammer und Zange auf der Matte.",
  },
  "zalozyciel-portret": {
    pl: "Artur Hebenstreit, założyciel AEJaCA, w garniturze, na tle białej ceglanej ściany.",
    en: "Artur Hebenstreit, founder of AEJaCA, in a suit against a white brick wall.",
    de: "Artur Hebenstreit, Gründer von AEJaCA, im Anzug vor einer weißen Ziegelwand.",
  },
  "zalozyciel-warsztat": {
    pl: "Artur Hebenstreit przy stole jubilerskim, w lupie nagłownej, obrabia pierścionek mikrosilnikiem, obok mikroskop stereoskopowy.",
    en: "Artur Hebenstreit at the jeweller's bench in a head magnifier, working a ring with a rotary handpiece, a stereo microscope beside him.",
    de: "Artur Hebenstreit an der Goldschmiedebank mit Kopflupe, bearbeitet einen Ring mit dem Handstück, daneben ein Stereomikroskop.",
  },
  "zalozyciel-praca": {
    pl: "Artur Hebenstreit pochylony nad pierścionkiem, w skupieniu prowadzi mikrosilnik pod lupą nagłowną.",
    en: "Artur Hebenstreit leaning over a ring, guiding the rotary handpiece under a head magnifier.",
    de: "Artur Hebenstreit über einen Ring gebeugt, führt konzentriert das Handstück unter der Kopflupe.",
  },
};

/** Opis obrazu w zadanym jezyku. Nieznany klucz oddaje pusty napis, czyli
 *  obraz ozdobny: czytnik go pominie, zamiast czytac klucz techniczny. */
export function opisObrazu(klucz, lang) {
  const wpis = OPISY[klucz];
  if (!wpis) return "";
  return wpis[lang] || wpis.pl;
}

export { OPISY };
