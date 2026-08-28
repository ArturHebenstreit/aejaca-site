// ============================================================
// ODNOSNIKI, KTORE ZOSTAJA W JEZYKU ODWIEDZAJACEGO
// ============================================================
// Od chwili, gdy angielski stoi pod `/en/`, a niemiecki pod `/de/`, kazdy
// odnosnik pisany jako `/studio/` wyrzucalby Niemca z powrotem na polska
// wersje. Odnosnikow w serwisie jest kilkaset i pisze sie je bez namyslu,
// wiec prefiks nie moze byc czyms, o czym trzeba pamietac przy kazdym.
//
// Dlatego `Link` i `NavLink` przychodza stad, a nie prosto z routera.
// Wygladaja tak samo i biora te same wlasciwosci, tylko dopisuja prefiks
// biezacego jezyka do adresow zaczynajacych sie ukosnikiem. Adresy obce
// (`https://`, `mailto:`), kotwice (`#cennik`) i sciezki wzgledne zostaja
// nietkniete.
//
// Pilnuje tego `scripts/check-odnosniki-jezyka.mjs`: zaden plik widoku nie
// moze brac `Link`, `NavLink` ani `useNavigate` prosto z `react-router-dom`.

import { forwardRef } from "react";
import { Link as LinkRoutera, NavLink as NavLinkRoutera, Navigate as NavigateRoutera, useNavigate as useNavigateRoutera } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { sciezkaJezyka } from "../routes.js";

/** Dopisuje prefiks jezyka tam, gdzie ma to sens, i tylko tam. */
export function zJezykiem(cel, lang) {
  if (typeof cel === "string") {
    if (!cel.startsWith("/") || cel.startsWith("//")) return cel;
    return sciezkaJezyka(cel, lang);
  }
  // Router przyjmuje takze obiekt { pathname, search, hash }.
  if (cel && typeof cel === "object" && typeof cel.pathname === "string") {
    return { ...cel, pathname: sciezkaJezyka(cel.pathname, lang) };
  }
  return cel;
}

export const Link = forwardRef(function Link({ to, ...reszta }, ref) {
  const { lang } = useLanguage();
  return <LinkRoutera ref={ref} to={zJezykiem(to, lang)} {...reszta} />;
});

export const NavLink = forwardRef(function NavLink({ to, ...reszta }, ref) {
  const { lang } = useLanguage();
  return <NavLinkRoutera ref={ref} to={zJezykiem(to, lang)} {...reszta} />;
});

/** `navigate("/cart/")` trafia do `/de/cart/`, gdy klient czyta po niemiecku. */
export function useNavigate() {
  const nawiguj = useNavigateRoutera();
  const { lang } = useLanguage();
  return (cel, opcje) =>
    typeof cel === "number" ? nawiguj(cel) : nawiguj(zJezykiem(cel, lang), opcje);
}

/** Przekierowanie w drzewie, np. z nieistniejacego wpisu na spis bloga. */
export function Navigate({ to, ...reszta }) {
  const { lang } = useLanguage();
  return <NavigateRoutera to={zJezykiem(to, lang)} {...reszta} />;
}
