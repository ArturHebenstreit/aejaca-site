-- AEJaCA — Extra Filament Brand Seed
-- Run against production DB to populate brands for all filament types.
-- Existing rows (pla x5, petg x4, tpu-95a x3) are already in DB.
-- This file covers: all remaining types + asa (1 extra) + pa6-cf (2 extra).
-- Pattern: INSERT ... ON CONFLICT DO NOTHING
-- Conflict key is (filament_type_id, brand, product_name) — add unique constraint if missing.

-- ── PLA+ ─────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'ePLA+', 205, 235, 45, 65, true, 'One of the most popular PLA+ brands. Noticeably tougher than standard PLA. Excellent value.'
FROM filament_types ft WHERE ft.type_id = 'pla-plus'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PLA', 200, 230, 25, 60, true, 'High-impact PLA with Nano-Reinforcement technology. Very tough for a PLA-based material.'
FROM filament_types ft WHERE ft.type_id = 'pla-plus'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'PLA+', 200, 235, 45, 60, true, 'Popular US brand. Good consistency and wide color range. Reliable across many printers.'
FROM filament_types ft WHERE ft.type_id = 'pla-plus'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Overture', 'PLA Pro', 205, 230, 45, 65, true, 'Budget-friendly PLA+ with good mechanical improvements over standard PLA. Includes build plate.'
FROM filament_types ft WHERE ft.type_id = 'pla-plus'
ON CONFLICT DO NOTHING;

-- ── PLA Silk ─────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolySilk PLA', 205, 225, 25, 60, true, 'Consistent silk finish. Strong gloss even at lower temps. Available in many metallic colors.'
FROM filament_types ft WHERE ft.type_id = 'pla-silk'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eSilk PLA', 210, 235, 45, 65, true, 'Popular silk PLA with vivid metallic sheen. Slow print speeds advised for best surface quality.'
FROM filament_types ft WHERE ft.type_id = 'pla-silk'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'PLA Silk Gold', 205, 230, 45, 60, true, 'Rich metallic look. Consistent diameter. Good value option for decorative prints.'
FROM filament_types ft WHERE ft.type_id = 'pla-silk'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'SunLu', 'Silk PLA', 210, 230, 25, 60, true, 'Very affordable silk PLA. Wide color range including dual-color silk options.'
FROM filament_types ft WHERE ft.type_id = 'pla-silk'
ON CONFLICT DO NOTHING;

-- ── PLA-CF ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PLA-CF', 205, 225, 25, 60, true, 'Combines PolyMax toughness with carbon fiber stiffness. Good surface finish for a CF material.'
FROM filament_types ft WHERE ft.type_id = 'pla-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Overture', 'PLA Carbon Fiber', 210, 230, 45, 65, true, 'Affordable PLA-CF option. Good stiffness increase over standard PLA. Matte finish.'
FROM filament_types ft WHERE ft.type_id = 'pla-cf'
ON CONFLICT DO NOTHING;

-- ── PLA HT ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PLA HT', 210, 240, 45, 80, true, 'Heat-tolerant PLA with HDT around 85°C after annealing. Good for functional parts.'
FROM filament_types ft WHERE ft.type_id = 'pla-ht'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'ColorFabb', 'HT (High Temp co-polyester)', 220, 250, 55, 75, true, 'ColorFabb HT co-polyester — HDT ~100°C. Better than PLA HT for thermal stability.'
FROM filament_types ft WHERE ft.type_id = 'pla-ht'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Extrudr', 'PLA NX2', 210, 240, 50, 80, true, 'Austrian brand. PLA NX2 HDT ~130°C after annealing. Good quality and consistency.'
FROM filament_types ft WHERE ft.type_id = 'pla-ht'
ON CONFLICT DO NOTHING;

-- ── PLA Wood ─────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eWood', 200, 230, 45, 60, true, '10% wood fiber content. Can be stained and sanded. Use ≥0.4mm nozzle.'
FROM filament_types ft WHERE ft.type_id = 'pla-wood'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'Wood PLA', 195, 220, 20, 55, true, 'Good wood texture. Widely available and affordable. Use open nozzle ≥0.4mm.'
FROM filament_types ft WHERE ft.type_id = 'pla-wood'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyWood', 195, 230, 25, 60, true, 'Low-density wood-like material. Lighter than regular PLA. Good for lightweight decoratives.'
FROM filament_types ft WHERE ft.type_id = 'pla-wood'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'SunLu', 'Wood PLA', 200, 225, 25, 60, true, 'Budget wood PLA option. Available in multiple wood tones. Sand and paint after printing.'
FROM filament_types ft WHERE ft.type_id = 'pla-wood'
ON CONFLICT DO NOTHING;

-- ── PLA Metal ────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eMetal Copper PLA', 200, 220, 45, 60, true, 'High metal powder content. Very heavy finish. Polishable to real copper shine. Hardened nozzle required.'
FROM filament_types ft WHERE ft.type_id = 'pla-metal'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'Metal PLA Bronze', 195, 215, 20, 55, true, 'Bronze-filled PLA. Good for decorative and art prints. Can be polished and patinated.'
FROM filament_types ft WHERE ft.type_id = 'pla-metal'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMetal', 195, 220, 25, 55, true, 'Metal-filled PLA with polishable finish. Lower abrasiveness than full metal fills.'
FROM filament_types ft WHERE ft.type_id = 'pla-metal'
ON CONFLICT DO NOTHING;

-- ── PLA Marble ───────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eMarble PLA', 200, 230, 45, 60, true, 'Classic white-grey marble swirl effect. Very easy to print. Great for vases and sculptures.'
FROM filament_types ft WHERE ft.type_id = 'pla-marble'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'Marble PLA', 195, 220, 20, 55, true, 'Consistent marble pattern throughout spool. Good value. Use standard PLA settings.'
FROM filament_types ft WHERE ft.type_id = 'pla-marble'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'SunLu', 'Marble PLA', 200, 225, 25, 60, true, 'Budget marble PLA. Attractive stone-like appearance. Compatible with PLA print profiles.'
FROM filament_types ft WHERE ft.type_id = 'pla-marble'
ON CONFLICT DO NOTHING;

-- ── TPU 85A ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Ninjatek', 'Chinchilla TPU 75A', 225, 240, 30, 50, true, 'Ultra-soft NinjaFlex-family material. Shore 75A. Direct drive only. Extremely flexible.'
FROM filament_types ft WHERE ft.type_id = 'tpu-85a'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eTPU-85A', 210, 235, 30, 50, true, 'Soft 85A TPU. Needs direct drive extruder. Very low print speed required.'
FROM filament_types ft WHERE ft.type_id = 'tpu-85a'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyFlex TPU90', 215, 235, 25, 45, true, '90A variant — softer than TPU95. Good for very flexible parts. Direct drive recommended.'
FROM filament_types ft WHERE ft.type_id = 'tpu-85a'
ON CONFLICT DO NOTHING;

-- ── TPU 45D ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Ninjatek', 'Eel TPU 60D', 220, 240, 30, 50, true, 'Very soft shore 60D elastomer. Excellent for waterproof gaskets and soft grips. Direct drive essential.'
FROM filament_types ft WHERE ft.type_id = 'tpu-45d'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'TPC 45D', 215, 240, 30, 50, true, 'BASF industrial-grade TPC 45D. Very consistent diameter. Good chemical resistance.'
FROM filament_types ft WHERE ft.type_id = 'tpu-45d'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Taulman3D', 'PCTPE', 220, 240, 45, 60, true, 'Plasticized Co-Polyamide TPE. Combines nylon toughness with elastomer flexibility. Direct drive only.'
FROM filament_types ft WHERE ft.type_id = 'tpu-45d'
ON CONFLICT DO NOTHING;

-- ── TPE ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Taulman3D', 'PCTPE', 220, 245, 45, 60, true, 'Plasticized nylon-TPE blend. Shore ~40D. Chemically resistant and flexible. Needs direct drive.'
FROM filament_types ft WHERE ft.type_id = 'tpe'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eTPE', 225, 250, 40, 60, true, 'General purpose TPE. Similar to TPU but slightly stiffer. Good abrasion resistance.'
FROM filament_types ft WHERE ft.type_id = 'tpe'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Sainsmart', 'Flexible TPE', 220, 245, 40, 60, true, 'Affordable TPE option. Rubbery feel. Works on direct drive printers at slow speeds.'
FROM filament_types ft WHERE ft.type_id = 'tpe'
ON CONFLICT DO NOTHING;

-- ── PETG-CF ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Prusament', 'PETG CF', 245, 260, 75, 90, true, 'Prusament quality PETG-CF. Consistent diameter. Hardened nozzle mandatory.'
FROM filament_types ft WHERE ft.type_id = 'petg-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Overture', 'PETG Carbon Fiber', 240, 260, 70, 85, true, 'Budget PETG-CF option. Good stiffness increase over standard PETG. Matte black finish.'
FROM filament_types ft WHERE ft.type_id = 'petg-cf'
ON CONFLICT DO NOTHING;

-- ── PETG-GF ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'ePETG-GF', 240, 260, 70, 90, true, 'Glass fiber reinforced PETG. Better dimensional stability than standard PETG. Hardened nozzle needed.'
FROM filament_types ft WHERE ft.type_id = 'petg-gf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PETG GF30', 240, 265, 75, 95, true, 'Industrial BASF glass-fiber PETG. 30% GF content. Excellent dimensional stability.'
FROM filament_types ft WHERE ft.type_id = 'petg-gf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Spectrum Filaments', 'PETG CF15', 240, 260, 70, 90, true, 'Spectrum 15% carbon/glass reinforced PETG. High rigidity. Good moisture resistance.'
FROM filament_types ft WHERE ft.type_id = 'petg-gf'
ON CONFLICT DO NOTHING;

-- ── ASA (1 extra — brings total from 2 to 3) ─────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fillamentum', 'ASA Extrafill', 240, 260, 90, 110, true, 'Czech brand. Excellent color range. Very good UV and weather resistance. Enclosure required.'
FROM filament_types ft WHERE ft.type_id = 'asa'
ON CONFLICT DO NOTHING;

-- ── ASA-CF ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Bambu Lab', 'ASA-CF', 250, 270, 90, 110, true, 'Carbon fiber reinforced ASA. Stiff and UV-resistant. Requires hardened nozzle and heated enclosure.'
FROM filament_types ft WHERE ft.type_id = 'asa-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax ASA-CF', 245, 265, 90, 110, true, 'High-performance ASA-CF. Good weather resistance combined with CF stiffness.'
FROM filament_types ft WHERE ft.type_id = 'asa-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Spectrum Filaments', 'ASA CF15', 245, 265, 90, 110, true, '15% carbon fiber ASA. Excellent UV resistance. Hardened nozzle and enclosure mandatory.'
FROM filament_types ft WHERE ft.type_id = 'asa-cf'
ON CONFLICT DO NOTHING;

-- ── ABS ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Bambu Lab', 'ABS', 240, 260, 100, 120, true, 'Well-tuned ABS for Bambu printers. Lower warping tendency than generic ABS. Enclosure required.'
FROM filament_types ft WHERE ft.type_id = 'abs'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'ABS+', 230, 250, 100, 120, true, 'ABS+ with reduced warping. One of the most popular ABS options. Wide color range.'
FROM filament_types ft WHERE ft.type_id = 'abs'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Hatchbox', 'ABS', 230, 250, 100, 115, true, 'Consistent quality ABS. Good dimensional accuracy. Enclosure and ventilation required.'
FROM filament_types ft WHERE ft.type_id = 'abs'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyLite ABS', 230, 250, 100, 120, true, 'Reliable ABS with good layer adhesion. Acetone-smoothable. Fumes — ensure ventilation.'
FROM filament_types ft WHERE ft.type_id = 'abs'
ON CONFLICT DO NOTHING;

-- ── ABS-CF ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Bambu Lab', 'ABS-CF', 240, 260, 100, 120, true, 'Carbon fiber reinforced ABS. Significantly stiffer than ABS. Hardened nozzle and enclosure required.'
FROM filament_types ft WHERE ft.type_id = 'abs-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eABS-CF', 235, 255, 100, 120, true, 'CF-reinforced ABS. Good rigidity boost over standard ABS. Not acetone-smoothable.'
FROM filament_types ft WHERE ft.type_id = 'abs-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax ABS-CF', 235, 255, 100, 115, true, 'Tough ABS-CF blend. Good structural performance. Enclosure and hardened nozzle mandatory.'
FROM filament_types ft WHERE ft.type_id = 'abs-cf'
ON CONFLICT DO NOTHING;

-- ── CPE ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'ColorFabb', 'CPE+', 235, 260, 75, 95, true, 'ColorFabb''s co-polyester blend. Better chemical resistance than PETG. Can be printed transparent.'
FROM filament_types ft WHERE ft.type_id = 'cpe'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eCPE', 230, 255, 75, 95, true, 'Affordable CPE option. Good chemical and heat resistance. Slight stringing possible.'
FROM filament_types ft WHERE ft.type_id = 'cpe'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fillamentum', 'CPE HG100', 235, 260, 80, 95, true, 'Czech brand CPE. Excellent transparency option. Chemical resistant. Recommended for food-safe applications.'
FROM filament_types ft WHERE ft.type_id = 'cpe'
ON CONFLICT DO NOTHING;

-- ── PC ───────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Prusament', 'PC Blend', 270, 290, 100, 115, true, 'PC-ABS blend with improved printability. Excellent impact resistance and heat deflection.'
FROM filament_types ft WHERE ft.type_id = 'pc'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fillamentum', 'PC + ABS', 255, 275, 100, 115, true, 'Czech PC-ABS blend. Easier to print than pure PC. Good toughness and temperature resistance.'
FROM filament_types ft WHERE ft.type_id = 'pc'
ON CONFLICT DO NOTHING;

-- ── PC-ABS ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PC-ABS', 250, 270, 100, 110, true, 'Excellent impact strength. More printable than pure PC. Enclosure required for best results.'
FROM filament_types ft WHERE ft.type_id = 'pc-abs'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PC+ABS FR', 250, 270, 100, 115, true, 'Flame-retardant PC-ABS from BASF. UL94 V0 rated. For electronics housings requiring fire resistance.'
FROM filament_types ft WHERE ft.type_id = 'pc-abs'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fillamentum', 'PC + ABS', 250, 270, 100, 115, true, 'Good blend of PC strength and ABS printability. Reduced warping vs pure PC. Needs enclosure.'
FROM filament_types ft WHERE ft.type_id = 'pc-abs'
ON CONFLICT DO NOTHING;

-- ── PC-CF ────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PC-CF', 280, 310, 100, 120, true, 'Carbon fiber reinforced PC. Extremely stiff and heat resistant. Hardened nozzle and high-temp printer required.'
FROM filament_types ft WHERE ft.type_id = 'pc-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PC-CF', 285, 315, 100, 120, true, 'High-performance PC-CF from specialized engineering filament brand. Aerospace-grade rigidity.'
FROM filament_types ft WHERE ft.type_id = 'pc-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PC CF', 280, 310, 100, 120, true, 'Industrial grade PC-CF from BASF. Very demanding to print — 300°C+ hotend and heated enclosure required.'
FROM filament_types ft WHERE ft.type_id = 'pc-cf'
ON CONFLICT DO NOTHING;

-- ── PET-CF ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Bambu Lab', 'PET-CF', 255, 270, 70, 85, true, 'Bambu''s carbon fiber PET. Excellent chemical resistance and stiffness. Hardened nozzle required.'
FROM filament_types ft WHERE ft.type_id = 'pet-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PET-CF', 250, 270, 70, 90, true, 'Engineering-grade PET-CF. Very good chemical resistance and low moisture uptake vs nylon CF.'
FROM filament_types ft WHERE ft.type_id = 'pet-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMax PET-CF', 250, 265, 70, 85, true, 'PET-CF with good surface finish. Strong and stiff. Better chemical resistance than PETG-CF.'
FROM filament_types ft WHERE ft.type_id = 'pet-cf'
ON CONFLICT DO NOTHING;

-- ── PA6 ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Taulman3D', 'Bridge Nylon', 245, 265, 45, 70, true, 'Semi-rigid PA6 nylon. Good for hinges and mechanical parts. Less warping than pure PA6. Must dry thoroughly.'
FROM filament_types ft WHERE ft.type_id = 'pa6'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'ePA Nylon', 240, 270, 70, 90, true, 'Standard PA6 nylon. Excellent toughness and wear resistance. Dry at 70°C for 8+ hours before printing.'
FROM filament_types ft WHERE ft.type_id = 'pa6'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMide CoPA', 240, 260, 70, 90, true, 'Co-polyamide with improved printability over pure PA6. Lower moisture sensitivity. Enclosure needed.'
FROM filament_types ft WHERE ft.type_id = 'pa6'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Markforged', 'Nylon White', 255, 270, 45, 60, true, 'Industrial PA6 from Markforged. Designed for their printers but works on open-frame with proper settings.'
FROM filament_types ft WHERE ft.type_id = 'pa6'
ON CONFLICT DO NOTHING;

-- ── PA6-CF (2 extra — brings total from 3 to 5) ──────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PAHT CF15', 265, 285, 80, 100, true, 'BASF industrial PA-HT with 15% carbon fiber. Excellent high-temperature PA performance.'
FROM filament_types ft WHERE ft.type_id = 'pa6-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PA6-CF', 260, 280, 70, 90, true, 'Specialized engineering-grade PA6-CF. High fiber loading. Very stiff with low creep at elevated temps.'
FROM filament_types ft WHERE ft.type_id = 'pa6-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Markforged', 'Onyx', 265, 280, 45, 60, true, 'Markforged''s micro carbon fiber PA6 — industry standard for PA-CF performance. Matte black only.'
FROM filament_types ft WHERE ft.type_id = 'pa6-cf'
ON CONFLICT DO NOTHING;

-- ── PA12 ─────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMide PA12', 240, 265, 70, 90, true, 'Lower moisture absorption than PA6. Better surface finish. Good for flexible-tough parts and tubing.'
FROM filament_types ft WHERE ft.type_id = 'pa12'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fiberlogy', 'Nylon PA12', 240, 265, 70, 90, true, 'Polish brand PA12. Consistent quality. Dry thoroughly before use. Good chemical resistance.'
FROM filament_types ft WHERE ft.type_id = 'pa12'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Taulman3D', '645 Nylon', 245, 265, 45, 60, true, 'Taulman 645 — semi-rigid nylon with lower warping. Good for bearings, gears and flexible joints.'
FROM filament_types ft WHERE ft.type_id = 'pa12'
ON CONFLICT DO NOTHING;

-- ── PA12-CF ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMide PA12-CF', 255, 275, 70, 90, true, 'Carbon fiber PA12 with low moisture uptake. Better surface finish than PA6-CF. Stiff and lightweight.'
FROM filament_types ft WHERE ft.type_id = 'pa12-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fiberlogy', 'PA12+CF', 255, 275, 70, 90, true, 'Polish brand PA12-CF. Good strength-to-weight ratio. Hardened nozzle required.'
FROM filament_types ft WHERE ft.type_id = 'pa12-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PA12-CF', 255, 280, 70, 90, true, 'Engineering-grade PA12-CF. Lower moisture sensitivity than PA6-CF. UAV and robotics applications.'
FROM filament_types ft WHERE ft.type_id = 'pa12-cf'
ON CONFLICT DO NOTHING;

-- ── PA66-CF ──────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PA66-CF', 265, 290, 80, 100, true, 'PA66-CF for high-temp industrial applications. Up to 180°C service temp. Very demanding to print.'
FROM filament_types ft WHERE ft.type_id = 'pa66-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PAHT CF15', 270, 295, 80, 100, true, 'BASF high-temp PA with 15% CF. Exceptional stiffness at elevated temperatures. Industrial grade.'
FROM filament_types ft WHERE ft.type_id = 'pa66-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMide PA6-CF HT', 265, 290, 80, 100, true, 'High-temp resistant PA-CF from Polymaker. Good for automotive under-hood components.'
FROM filament_types ft WHERE ft.type_id = 'pa66-cf'
ON CONFLICT DO NOTHING;

-- ── PPA-CF ───────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PPA CF', 285, 315, 100, 120, true, 'BASF Polyphthalamide with CF reinforcement. Up to 200°C continuous service. Industrial use only.'
FROM filament_types ft WHERE ft.type_id = 'ppa-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PPA-CF', 280, 315, 100, 120, true, 'Specialty PPA-CF from 3DXTech. Aerospace-grade heat resistance. Requires 350°C hotend and heated chamber.'
FROM filament_types ft WHERE ft.type_id = 'ppa-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Solvay', 'Amodel PPA', 280, 310, 100, 130, true, 'Solvay/Syensqo PPA compounds used in high-temp FFF — best-in-class thermal performance for PPA.'
FROM filament_types ft WHERE ft.type_id = 'ppa-cf'
ON CONFLICT DO NOTHING;

-- ── PP ───────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PP GF30', 225, 250, 85, 100, true, 'Glass-fiber reinforced PP from BASF. Reduced warping vs pure PP. Chemical-resistant structural parts.'
FROM filament_types ft WHERE ft.type_id = 'pp'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'PP', 220, 250, 85, 100, true, 'Pure PP with good chemical resistance. Requires PP build surface for adhesion. Living hinges possible.'
FROM filament_types ft WHERE ft.type_id = 'pp'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'FormFutura', 'Reynolds 531 PP', 220, 250, 85, 100, true, 'Premium Dutch PP filament. Improved adhesion formulation. Lightweight and chemically resistant.'
FROM filament_types ft WHERE ft.type_id = 'pp'
ON CONFLICT DO NOTHING;

-- ── PP-CF ────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'CarbonX PP-CF', 230, 255, 85, 100, true, 'Carbon fiber PP for lightweight chemical-resistant structural parts. All PP adhesion challenges apply.'
FROM filament_types ft WHERE ft.type_id = 'pp-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PP CF', 230, 255, 85, 100, true, 'BASF PP-CF. Stiff and lightweight. Excellent chemical resistance. PP bed surface required.'
FROM filament_types ft WHERE ft.type_id = 'pp-cf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyPropylene CF', 230, 255, 85, 100, true, 'PP with CF reinforcement. Hardened nozzle and specialized bed surface required. Very difficult.'
FROM filament_types ft WHERE ft.type_id = 'pp-cf'
ON CONFLICT DO NOTHING;

-- ── PPS ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'PPS-CF', 300, 340, 120, 150, true, 'PPS with carbon fiber from 3DXTech. Flame retardant UL94-V0. Up to 220°C service. Specialist printer required.'
FROM filament_types ft WHERE ft.type_id = 'pps'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PPS', 305, 340, 120, 150, true, 'BASF Ultrafuse PPS — one of few consumer-accessible PPS options. Extreme heat and chemical resistance.'
FROM filament_types ft WHERE ft.type_id = 'pps'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Solvay', 'Ryton PPS', 310, 345, 130, 150, true, 'Solvay Ryton PPS — industry reference for PPS. Requires 400°C+ printer. Unmatched chemical and heat resistance.'
FROM filament_types ft WHERE ft.type_id = 'pps'
ON CONFLICT DO NOTHING;

-- ── PEEK ─────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'PEEK', 360, 400, 120, 160, true, 'Pure PEEK filament. Medical and aerospace grade available. Requires dedicated PEEK-capable printer at 380-400°C.'
FROM filament_types ft WHERE ft.type_id = 'peek'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Fiberlogy', 'PEEK', 370, 410, 130, 160, true, 'European PEEK from Fiberlogy. Very consistent diameter. Biocompatible grades available. Extremely expensive.'
FROM filament_types ft WHERE ft.type_id = 'peek'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PEEK Ultrafuse', 365, 400, 120, 160, true, 'BASF industrial PEEK. Excellent batch-to-batch consistency. UL94-V0 and biocompatible certifications.'
FROM filament_types ft WHERE ft.type_id = 'peek'
ON CONFLICT DO NOTHING;

-- ── PEI / Ultem ──────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'PEI 9085', 360, 400, 140, 160, true, 'Ultem 9085 PEI — FAA-certified flame retardant. Aerospace standard. Requires specialist 400°C printer.'
FROM filament_types ft WHERE ft.type_id = 'pei-ultem'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PEI 1010', 355, 395, 140, 160, true, 'Ultem 1010 PEI from BASF. Highest heat resistance PEI variant — HDT 217°C. Medical and aerospace grade.'
FROM filament_types ft WHERE ft.type_id = 'pei-ultem'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyUltem', 360, 400, 140, 160, true, 'Consumer-accessible PEI/Ultem from Polymaker. Requires 400°C hotend and heated chamber above 140°C.'
FROM filament_types ft WHERE ft.type_id = 'pei-ultem'
ON CONFLICT DO NOTHING;

-- ── PVA ──────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Bambu Lab', 'Support for PLA', 190, 210, 35, 55, true, 'Water-soluble PVA support optimized for Bambu AMS. Excellent compatibility with Bambu PLA.'
FROM filament_types ft WHERE ft.type_id = 'pva'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Devil Design', 'PVA', 185, 205, 35, 55, true, 'Affordable PVA support material. Dissolves in warm water. Store vacuum-sealed when not in use.'
FROM filament_types ft WHERE ft.type_id = 'pva'
ON CONFLICT DO NOTHING;

-- ── HIPS ─────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'eSUN', 'eHIPS', 230, 245, 100, 115, true, 'D-limonene soluble support for ABS. Good price. Dissolves cleanly leaving smooth surface.'
FROM filament_types ft WHERE ft.type_id = 'hips'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Devil Design', 'HIPS', 230, 245, 100, 115, true, 'HIPS support material. Compatible with ABS printing temperatures. Use D-limonene for dissolution.'
FROM filament_types ft WHERE ft.type_id = 'hips'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Sainsmart', 'HIPS', 230, 245, 100, 115, true, 'Budget HIPS option. Dissolves in D-limonene. Ventilation required during printing.'
FROM filament_types ft WHERE ft.type_id = 'hips'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'FormFutura', 'EasyFil HIPS', 230, 245, 100, 115, true, 'Dutch brand HIPS. Good dimensional consistency. Compatible with ABS enclosure printing conditions.'
FROM filament_types ft WHERE ft.type_id = 'hips'
ON CONFLICT DO NOTHING;

-- ── PA-GF ────────────────────────────────────────────────────────────────────
INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'BASF Ultrafuse', 'PAHT CF15', 250, 280, 70, 90, true, 'High-temp PA with glass/CF reinforcement from BASF. Dimensional stability under load at elevated temps.'
FROM filament_types ft WHERE ft.type_id = 'pa-gf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, '3DXTech', 'GF Nylon', 250, 275, 70, 90, true, 'Glass fiber reinforced nylon. High stiffness and dimensional stability. Hardened nozzle required.'
FROM filament_types ft WHERE ft.type_id = 'pa-gf'
ON CONFLICT DO NOTHING;

INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, is_verified, notes_en)
SELECT ft.id, 'Polymaker', 'PolyMide PA6-GF', 250, 275, 70, 90, true, 'Glass-fiber PA6 with reduced warping vs CF versions. Good structural performance and lower abrasion.'
FROM filament_types ft WHERE ft.type_id = 'pa-gf'
ON CONFLICT DO NOTHING;
