// ============================================================
// PYTANIA O ODLEW Z PLIKU KLIENTA
// ============================================================
// Pytania stoja w danych, a nie w pliku strony, bo czyta je DWOJE: strona
// `/uslugi/odlew-z-pliku/`, ktorej dotycza, i wspolna sekcja `/faq/`
// z wyszukiwarka. Kopia w drugim miejscu rozjechalaby sie przy pierwszej
// poprawce, i to po cichu.
//
// LICZBY CIAGNIEMY ZE ZRODEL, a nie przepisujemy. Grubosci z `castingSpec.js`,
// koperta kolby z wyceny odlewu. Odpowiedz w FAQ jest obietnica dana klientowi,
// wiec liczba w niej ma sie ruszac razem z warsztatem.
//
// `id` jest kotwica w adresie, wiec ZOSTAJE, nawet gdy zmieni sie tresc.
import { MIN_GRUBOSC_MM, PROG_ROZBIEZNOSCI_OTWORU_MM } from "../castingSpec.js";
import { CASTING_ENVELOPE_LABEL } from "../../pricing/preciousMetalCasting.js";

// Milimetry po polsku i po niemiecku ida z przecinkiem, po angielsku z kropka.
// Koncowe zero odpada, bo "1,00 mm" czyta sie jak wynik pomiaru, a to jest prog.
function mm(wartosc, przecinek) {
  const tekst = wartosc.toFixed(2).replace(/0$/, "");
  return `${przecinek ? tekst.replace(".", ",") : tekst} mm`;
}

const SCIANA_MIN_PL = mm(MIN_GRUBOSC_MM.sciana.min, true);
const SCIANA_MIN_EN = mm(MIN_GRUBOSC_MM.sciana.min, false);
const SCIANA_PEWNE_PL = mm(MIN_GRUBOSC_MM.sciana.pewne, true);
const SCIANA_PEWNE_EN = mm(MIN_GRUBOSC_MM.sciana.pewne, false);
const OTWOR_PROG_PL = mm(PROG_ROZBIEZNOSCI_OTWORU_MM, true);
const OTWOR_PROG_EN = mm(PROG_ROZBIEZNOSCI_OTWORU_MM, false);

const STRONA = "/uslugi/odlew-z-pliku/";

export default [
  {
    id: "czy-mam-powiekszyc-model-o-skurcz",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Czy mam powiększyć model o skurcz przed wysłaniem?",
      en: "Should I scale the model for shrinkage before sending it?",
      de: "Soll ich das Modell vor dem Senden auf Schwund skalieren?",
    },
    a: {
      pl: "Nie trzeba. Model ma mieć wymiary gotowego wyrobu, a skurcz dokładamy sami, mnożnikiem właściwym dla zamówionego stopu. Jeśli plik jest już powiększony, wystarczy wskazać w kreatorze stop, dla którego był skalowany: doskalujemy wtedy samą różnicę, więc skurcz nie wchodzi dwa razy.",
      en: "There is no need. The model should carry the finished dimensions and we add shrinkage ourselves, with the factor for the ordered alloy. If the file is already enlarged, just name the alloy it was scaled for in the configurator: we then add only the difference, so shrinkage is never applied twice.",
      de: "Nicht nötig. Das Modell soll die Fertigmaße tragen, den Schwund ergänzen wir selbst, mit dem Faktor der bestellten Legierung. Ist die Datei bereits vergrößert, nennen Sie im Konfigurator die Legierung, für die skaliert wurde: dann ergänzen wir nur die Differenz, der Schwund wirkt also nie doppelt.",
    },
  },
  {
    id: "najcienciejsza-scianka-do-odlewu",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Jak cienką ściankę jeszcze odlejecie?",
      en: "How thin a wall will you still cast?",
      de: "Wie dünn darf die Wand für den Guss sein?",
    },
    a: {
      pl: `Granica wynosi ${SCIANA_MIN_PL} i poniżej niej odlew się nie wypełni, więc takiego zamówienia nie przyjmujemy. Od ${SCIANA_MIN_PL} do ${SCIANA_PEWNE_PL} odlejemy, ale bez obietnicy pełnego odwzorowania, a kreator mówi o tym przy wgraniu pliku. Powyżej ${SCIANA_PEWNE_PL} odwzorowanie jest pewne.`,
      en: `The limit is ${SCIANA_MIN_EN}, and below it the casting will not fill, so we do not take such an order. Between ${SCIANA_MIN_EN} and ${SCIANA_PEWNE_EN} we will cast, but without a promise of full reproduction, and the configurator says so at upload. Above ${SCIANA_PEWNE_EN} reproduction is certain.`,
      de: `Die Grenze liegt bei ${SCIANA_MIN_PL}, darunter füllt sich der Guss nicht, eine solche Bestellung nehmen wir nicht an. Zwischen ${SCIANA_MIN_PL} und ${SCIANA_PEWNE_PL} gießen wir, aber ohne Zusage vollständiger Abformung, der Konfigurator sagt das beim Hochladen. Über ${SCIANA_PEWNE_PL} ist die Abformung sicher.`,
    },
  },
  {
    id: "co-gdy-odlew-nie-wyjdzie",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Co się dzieje, gdy odlew nie wyjdzie?",
      en: "What happens if the casting fails?",
      de: "Was passiert, wenn der Guss misslingt?",
    },
    a: {
      pl: "Rozstrzyga to, co pokazało sprawdzenie modelu. Gdy sprawdzenie nie zgłosiło nic, a odlew wyszedł wadliwy, powtarzamy go na własny koszt. Gdy przed zamówieniem padło ostrzeżenie o cesze modelu i mimo niego zamówienie zostało złożone, powtórka idzie na koszt zamawiającego. Dlatego ostrzeżenia pokazujemy przed dodaniem do koszyka, a nie po odlaniu.",
      en: "It is decided by what the model check showed. If the check reported nothing and the casting came out faulty, we repeat it at our own cost. If a warning about a feature of the model was shown before ordering and the order was placed anyway, the repeat is at the customer's cost. That is why warnings appear before the item goes into the basket, not after casting.",
      de: "Entscheidend ist, was die Modellprüfung angezeigt hat. Hat die Prüfung nichts gemeldet und der Guss ist fehlerhaft, wiederholen wir ihn auf unsere Kosten. Wurde vor der Bestellung eine Warnung zu einem Merkmal des Modells angezeigt und trotzdem bestellt, geht die Wiederholung zu Lasten des Bestellers. Deshalb erscheinen Warnungen vor dem Legen in den Warenkorb und nicht nach dem Guss.",
    },
  },
  {
    id: "czy-dodac-wlew-do-modelu",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Czy mam dodać do modelu układ wlewowy?",
      en: "Should I add a sprue system to the model?",
      de: "Soll ich ein Angusssystem am Modell ergänzen?",
    },
    a: {
      pl: "Nie. Kanały i stożek wlewowy ustawiamy sami, bo ich miejsce zależy od tego, jak model stanie w kolbie i którędy metal ma najdłuższą drogę. Wlew domodelowany w pliku i tak trzeba by odciąć, a ślad po nim zostaje w miejscu wybranym nie przez odlewnika.",
      en: "No. We set the sprues and the pouring cone ourselves, because their position depends on how the model stands in the flask and where the metal has the furthest to travel. A sprue modelled into the file would have to be cut off anyway, and its mark would sit where the caster did not choose.",
      de: "Nein. Kanäle und Gusstrichter setzen wir selbst, denn ihre Lage hängt davon ab, wie das Modell in der Küvette steht und wo das Metall den weitesten Weg hat. Ein in der Datei modellierter Anguss müsste ohnehin abgetrennt werden, und seine Spur säße an einer Stelle, die nicht der Gießer gewählt hat.",
    },
  },
  {
    id: "jaki-format-pliku-do-odlewu",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "W jakim formacie przysłać plik i w jakich jednostkach?",
      en: "Which file format and which units should I send?",
      de: "In welchem Format und in welchen Einheiten soll ich die Datei schicken?",
    },
    a: {
      pl: "Przyjmujemy STL, OBJ, 3MF, STEP i STP, do 60 MB. STL i OBJ nie niosą jednostki w formacie, więc czytamy je jako milimetry. 3MF i STEP jednostkę niosą i wtedy bierzemy ją z pliku. Model ma być jedną zamkniętą bryłą, bez otwartych krawędzi.",
      en: "We accept STL, OBJ, 3MF, STEP and STP, up to 60 MB. STL and OBJ carry no unit in the format, so we read them as millimetres. 3MF and STEP do carry a unit and then we take it from the file. The model has to be a single closed solid, with no open edges.",
      de: "Wir nehmen STL, OBJ, 3MF, STEP und STP, bis 60 MB. STL und OBJ tragen im Format keine Einheit, wir lesen sie daher als Millimeter. 3MF und STEP tragen eine Einheit, dann übernehmen wir sie aus der Datei. Das Modell muss ein einziger geschlossener Körper ohne offene Kanten sein.",
    },
  },
  {
    id: "jak-duzy-wyrob-odlejecie-z-pliku",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Jak duży wyrób odlejecie z pliku?",
      en: "How large a piece can you cast from a file?",
      de: "Wie groß darf ein Stück aus der Datei sein?",
    },
    a: {
      pl: `Model musi zmieścić się w świetle kolby, czyli ${CASTING_ENVELOPE_LABEL}. Liczy się przekątna podstawy, bo kolba jest walcem: rzecz płaska i szeroka mieści się lepiej, niż wygląda na trzech wymiarach. Co większe, prowadzimy przez wycenę indywidualną, bo wymaga innej kolby i innego ułożenia.`,
      en: `The model has to fit the flask envelope, that is ${CASTING_ENVELOPE_LABEL}. What counts is the diagonal of the footprint, because a flask is a cylinder: a flat, wide piece fits better than three numbers suggest. Anything larger goes through an individual quote, since it needs a different flask and a different setup.`,
      de: `Das Modell muss in den Küvettenraum passen, also ${CASTING_ENVELOPE_LABEL}. Maßgeblich ist die Diagonale der Grundfläche, denn die Küvette ist ein Zylinder: ein flaches, breites Stück passt besser, als drei Zahlen vermuten lassen. Alles Größere läuft über die Einzelkalkulation, denn es braucht eine andere Küvette und eine andere Anordnung.`,
    },
  },
  {
    id: "otwor-obraczki-w-pliku-do-odlewu",
    temat: "studio",
    strona: STRONA,
    q: {
      pl: "Jaki otwór ma mieć obrączka w pliku?",
      en: "What inner diameter should a ring have in the file?",
      de: "Welchen Innendurchmesser soll ein Ring in der Datei haben?",
    },
    a: {
      pl: `Docelowy, czyli ten, który ma mieć gotowy wyrób. Naddatek na szlif odejmujemy sami, bo szlif otwór powiększa. W kreatorze podajesz średnicę w wyrobie gotowym, a my porównujemy ją z otworem zmierzonym w pliku: przy różnicy większej niż ${OTWOR_PROG_PL} zamówienie się zatrzymuje, bo roztoczenie otworu zabiera grubość szyny i nie robimy tego bez rozmowy.`,
      en: `The target one, the diameter the finished piece should have. We subtract the grinding allowance ourselves, because grinding makes a hole larger. In the configurator you give the finished inner diameter and we compare it with the hole measured in the file: if they differ by more than ${OTWOR_PROG_EN}, the order stops, because opening the hole eats into the shank and we do not do that without talking to you.`,
      de: `Den Zielwert, also den Durchmesser des fertigen Stücks. Das Schleifaufmaß ziehen wir selbst ab, denn Schleifen vergrößert eine Bohrung. Im Konfigurator nennen Sie den fertigen Innendurchmesser, wir vergleichen ihn mit der in der Datei gemessenen Bohrung: bei mehr als ${OTWOR_PROG_PL} Abweichung stoppt die Bestellung, denn das Aufweiten geht auf die Schienenstärke und das tun wir nicht ohne Rücksprache.`,
    },
  },
];
