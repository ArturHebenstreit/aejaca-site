import { chromium } from "playwright";
const S = "/tmp/claude-0/-home-user-aejaca-site/d3aa302b-7fd7-5245-a0f8-398b2b69b513/scratchpad";
const zamowienie = {
  ok: true,
  orderRef: "AE20260827-3C1A1F40",
  status: "in_production",
  paidAt: "2026-08-27T10:12:00.000Z",
  requiresDetails: true,
  detailsAt: "2026-08-27T10:12:30.000Z",
  queuedAt: "2026-08-29T08:00:00.000Z",
  productionStartedAt: "2026-08-30T07:30:00.000Z",
  readyAt: null,
  shippedAt: null,
  leadDays: 21,
  deadlineAt: "2026-09-19",
  daysLeft: 20,
  deliveryMethod: "inpost_locker",
  lang: "pl",
  totalGrosze: 73000,
  itemsTotalGrosze: 73000,
  shippingGrosze: 0,
  paymentStatus: "SUCCESS",
  paymentMethod: "autopay",
  items: [
    { title: "Wykonanie projektu i modelu 3D", qty: 1, unitGrosze: 40000, lineGrosze: 40000 },
    { title: "Wykonanie silikonowej formy odlewniczej", qty: 1, unitGrosze: 20000, lineGrosze: 20000 },
    { title: "Przygotowanie prototypu pierscionka", qty: 1, unitGrosze: 13000, lineGrosze: 13000 },
  ],
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [nazwa, szer] of [["klient-os", 1200], ["klient-os-mobile", 420]]) {
  const p = await b.newPage({ viewport: { width: szer, height: 1100 } });
  await p.route("**/api/orders/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(zamowienie),
    })
  );
  await p.goto("http://localhost:5199/order/status/?ref=AE20260827-3C1A1F40&token=zeton", { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${S}/${nazwa}.png`, fullPage: true });
  await p.close();
}
await b.close();
console.log("zrzuty gotowe");
