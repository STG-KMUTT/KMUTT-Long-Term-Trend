# 📋 HANDOFF — กลับมาทำงานต่อหลังหายไปนาน

> เอกสารนี้เขียนสำหรับ **ตัวเราเองในอนาคต** (หรือคนรับช่วงต่อ) ที่กลับมาดูโปรเจกต์นี้
> หลังผ่านไปหลายเดือน/หนึ่งปี แล้วจำรายละเอียดไม่ได้แล้ว
>
> **เป้าหมาย:** อ่าน 10 นาที แล้วรู้ว่าโปรเจกต์อยู่ตรงไหน, อะไรเสร็จ, อะไรค้าง,
> อะไรน่าจะพัง, และจะเริ่มทำงานต่อยังไง
>
> _บันทึกสถานะ ณ วันที่ **2026-05-26** (commit งานสุดท้าย) — เขียนเอกสารนี้ 2026-06-05_
> _Repo: https://github.com/STG-KMUTT/KMUTT-Long-Term-Trend_

---

## 1. อ่านอันนี้ก่อน (TL;DR 60 วินาที)

- **โปรเจกต์นี้คือ:** เว็บ dashboard 2 ภาษา (ไทย/อังกฤษ) แสดงแนวโน้มระยะยาวของ KMUTT
  สำหรับผู้บริหาร เปิดดูสาธารณะ (ไม่ต้อง login) โฮสต์ฟรีบน **GitHub Pages**
- **ข้อมูลมาจากไหน:** คนกรอกข้อมูลใน **Google Sheets** → กดปุ่ม "Publish to Dashboard" →
  ระบบ sync → commit JSON → deploy เว็บใหม่อัตโนมัติ **โดยไม่ต้องแตะโค้ดหรือ Git เลย**
- **สถานะ:** โค้ดทุกส่วน **เสร็จแล้ว** และ **flow ทำงานได้จริงแบบ end-to-end** —
  ยืนยันด้วย commit `Sync from Sheets ... 2026-06-05` ที่เกิดจากการกด Publish จริงใน Sheets
  (ระบบ live แล้ว ไม่ใช่แค่ prototype)
- **สิ่งที่ต้องทำเมื่อกลับมา:** ตรวจว่า **credentials ยังไม่หมดอายุ** (ดูข้อ 5) แล้ว
  ทดลองกด Publish 1 ครั้งเพื่อยืนยันว่า flow ยังทำงาน

---

## 2. สถาปัตยกรรมโดยย่อ

```
Google Sheets (คนกรอกข้อมูล)
   │  กดปุ่ม "Publish to Dashboard" บนเมนู
   ▼
apps_script/Code.gs  ──POST──►  GitHub REST API (repository_dispatch)
   │                              event: sync-sheets
   │  (modal poll สถานะทุก 5 วิ)
   ▼
GitHub Actions: .github/workflows/sync-from-sheets.yml
   ├─ job: sync   → รัน scripts/sync_from_sheets.py
   │                 อ่าน Sheets → validate (2 ชั้น) → เขียน web/src/data/*.json
   │                 → commit + push ขึ้น main
   └─ job: deploy → build web/ → deploy ขึ้น GitHub Pages
   ▼
GitHub Pages (เว็บจริงที่คนดู)
```

รายละเอียดเต็ม + เหตุผลการออกแบบ: [`docs/architecture.md`](architecture.md)

**Stack:** Vite + React 19 + TypeScript + Tailwind v3 + ECharts | Python 3.13 + gspread (ฝั่ง sync) | Google Apps Script

---

## 3. สิ่งที่ทำเสร็จแล้ว ✅

| ส่วน | สถานะ | ไฟล์หลัก |
|---|---|---|
| เว็บ frontend (React, 2 ภาษา, 20 ชาร์ต) | ✅ เสร็จ | `web/src/` |
| ดึงข้อมูลจาก Google Sheets | ✅ เสร็จ | `scripts/sync_from_sheets.py`, `scripts/lib/` |
| Validator 2 ชั้น (Sheets rules + Python) | ✅ เสร็จ | `scripts/lib/validators.py` |
| Bootstrap สร้าง workbook ครั้งแรก | ✅ เสร็จ | `scripts/bootstrap_sheets.py` |
| ปุ่ม Publish + modal ใน Sheets | ✅ เสร็จ | `apps_script/Code.gs`, `apps_script/PublishModal.html` |
| GitHub Actions sync + deploy | ✅ เสร็จ | `.github/workflows/sync-from-sheets.yml` |
| Unit tests (pytest) | ✅ เสร็จ | `tests/` (6 ไฟล์) |
| เอกสาร (architecture, runbook, คู่มือไทย) | ✅ เสร็จ | `docs/` |

**ข้อมูล JSON ที่มีอยู่ตอนนี้ (20 ไฟล์):** students, staff, graduates, employment,
publications, research-funding, patents, income-expense, programs ฯลฯ — ดูครบใน `web/src/data/`

---

## 4. ประวัติการทำงานโดยย่อ (เผื่ออยากเข้าใจที่มา)

โปรเจกต์ผ่าน 3 ระยะ:

1. **Prototype จาก PowerPoint** — ดึงข้อมูลกราฟจากไฟล์ `.pptx` ด้วย Python สร้าง JSON
   ทำเว็บ React ครบ 22 ชาร์ต + deploy GitHub Pages
   _(โค้ดเดิม `build_chart_json.py` ตอนนี้ **DEPRECATED** แต่เก็บไว้อ้างอิง)_
2. **ออกแบบใหม่: Google Sheets เป็นแหล่งข้อมูล** — เขียน design spec + plan แล้ว review
   หนัก **7 รอบ** (ใช้ Codex เป็น external reviewer) แก้ shell injection, deploy chain,
   concurrency, protected ranges ฯลฯ → ดูใน `docs/superpowers/specs/` และ `plans/`
3. **Implement + debug จริง** — สร้าง pipeline ครบ แล้ว debug การเชื่อมต่อจริง
   (artifact download redirect, json_equal phantom diff, Apps Script template syntax,
   CI module imports, Sheets API 429 retry)

---

## 5. ⚠️ สิ่งที่น่าจะ "พัง" เมื่อกลับมาหลัง 1 ปี — เช็คตามนี้ก่อน

นี่คือส่วนสำคัญที่สุดของเอกสาร เพราะระบบพึ่ง credentials ภายนอกที่ **มีวันหมดอายุ**

### ☐ 5.1 GitHub PAT (Personal Access Token) — น่าจะหมดอายุแล้ว
- ใช้โดย Apps Script เพื่อยิง `repository_dispatch`
- Fine-grained PAT มักตั้งหมดอายุ 90 วัน–1 ปี → **เกือบแน่ว่าต้องสร้างใหม่**
- **อาการเมื่อหมดอายุ:** กด Publish แล้ว modal ค้าง / error 401
- **วิธีแก้:** สร้าง fine-grained PAT ใหม่ (scope: Contents R/W + Actions R) →
  อัปเดต GitHub repository secret ชื่อ `GITHUB_PAT`
  _(รายละเอียด: `docs/architecture.md` ข้อ 6)_

### ☐ 5.2 Google Service Account Key — อาจถูก disable
- ใช้โดย `sync_from_sheets.py` ผ่าน gspread เพื่ออ่าน Sheets
- GCP อาจ disable key เก่าตามนโยบาย หรือ service account ถูกลบ
- **อาการ:** job `sync` ใน Actions fail ที่ขั้น auth
- **วิธีแก้:** GCP Console → IAM → Service Accounts → สร้าง key ใหม่ →
  อัปเดต secret `GOOGLE_SERVICE_ACCOUNT_JSON`
- **อย่าลืม:** service account email ต้องเป็น **Editor** บน Sheets workbook

### ☐ 5.3 Google Sheets workbook — ยังอยู่ไหม / ID ตรงไหม
- ตรวจ GitHub repository **Variable** `KMUTT_TRENDS_SHEET_ID` ว่ายังชี้ไป workbook ที่ถูกต้อง
- ถ้า workbook ถูกลบ/ย้าย → รัน `bootstrap_sheets.py` สร้างใหม่ (ดู runbook)

### ☐ 5.4 GitHub Pages — ยังเปิดอยู่ไหม
- Settings → Pages → Source ต้องเป็น **GitHub Actions**
- เช็กว่าเว็บยัง live: `https://stg-kmutt.github.io/KMUTT-Long-Term-Trend/`

### ☐ 5.5 Dependency versions — อาจมี breaking changes
- `gspread` เคยมี breaking change (6.x เปลี่ยน API สี tab — เคยแก้ไปแล้ว)
- React 19 / Vite / ECharts อาจมีเวอร์ชันใหม่
- **วิธีเช็ก:** รัน `pytest` (ดูข้อ 6) — ถ้า test เขียว แปลว่า logic ยังโอเค

---

## 6. วิธีกลับมาทำงานต่อ — ตั้งสภาพแวดล้อมจากศูนย์

### 6.1 รันเว็บ frontend (ดูหน้าตา / แก้ UI)
```bash
cd web
npm install
npm run dev          # เปิด http://localhost:5173
```

### 6.2 รัน Python tests (ตรวจว่า sync logic ยังทำงาน)
```bash
pip install -r requirements-dev.txt
pytest               # ควรเขียวทั้งหมด
```

### 6.3 ทดสอบ flow เต็มแบบ end-to-end
1. เช็ก credentials ตามข้อ 5 ให้ครบก่อน
2. เปิด Google Sheets workbook → เมนูควรมี "Publish to Dashboard"
3. แก้ค่าสักเซลล์ → กด **Publish all changes**
4. ดู modal: ควรขึ้น progress แล้วจบด้วย success
5. เช็ก GitHub Actions: มี run ชื่อ `Sync from Sheets [<correlation_id>]`
6. เช็กเว็บจริงว่าค่าอัปเดต (อาจต้อง hard-reload `Ctrl+Shift+R`)

> ถ้าติดตรงไหน → `docs/architecture.md` ข้อ 7 "Debugging tips" มี checklist อาการ/วิธีแก้

---

## 7. งานที่ยังค้าง / Next steps ที่เป็นไปได้

> _ปรับตามสถานการณ์จริงตอนกลับมา — นี่คือสิ่งที่ค้างไว้ ณ ตอนหยุด_

- ☑ **ยืนยัน flow จริงทำงานครบ** — ทำแล้ว: มี commit `Sync from Sheets` วันที่ 2026-06-05
  จากการกด Publish จริง (เมื่อกลับมาหลัง 1 ปี ควรกดทดสอบซ้ำเผื่อ credentials หมดอายุ — ดูข้อ 5)
- ☐ **ตรวจจำนวนชาร์ต** — ปัจจุบันมี 20 ชาร์ตใน 4 หมวด (Education, Personnel,
  Research, Finance) — ตรวจว่าครบตามรายงานปีล่าสุดที่ต้องการหรือยัง
- ☐ **เพิ่ม `actionlint.exe` ใน `.gitignore`** — มีไฟล์ binary นี้ค้างไม่ track อยู่
  (เป็นเครื่องมือ lint GitHub workflow บน Windows ไม่ควร commit)
- ☐ **ลบ legacy PPTX flow** — `build_chart_json.py` deprecated แล้ว
  แผนคือลบหลังใช้ Sheets flow ครบ 1 รอบปีการศึกษา
- ☐ **อัปเดตข้อมูลปีใหม่** — ถ้ากลับมาเพราะถึงรอบรายงานปีใหม่
  → แค่กรอกข้อมูลใน Sheets แล้ว Publish (ไม่ต้องแก้โค้ด)

---

## 8. แผนที่ไฟล์สำคัญ (ไปอ่านโค้ดเริ่มตรงไหน)

```
.
├── README.md                         ← ภาพรวม + วิธี dev เบื้องต้น
├── docs/
│   ├── HANDOFF.md                    ← ★ ไฟล์นี้ (เริ่มที่นี่)
│   ├── architecture.md               ← สถาปัตยกรรมเต็ม + debugging tips
│   ├── runbook-initial-setup.md      ← ตั้ง repo + Sheets + secrets ครั้งแรก
│   ├── data-collector-guide-th.md    ← คู่มือคนกรอกข้อมูล (ภาษาไทย)
│   └── superpowers/
│       ├── specs/  ...-design.md     ← design spec (เหตุผลการออกแบบ, 7 รอบ review)
│       └── plans/  ...-source.md     ← implementation plan ละเอียด
├── apps_script/
│   ├── Code.gs                       ← ฝั่ง server: ยิง dispatch + poll สถานะ
│   └── PublishModal.html             ← ฝั่ง client: modal progress ใน Sheets
├── scripts/
│   ├── sync_from_sheets.py           ← orchestrator หลัก (parse→validate→write)
│   ├── bootstrap_sheets.py           ← สร้าง workbook ครั้งแรก
│   └── lib/                          ← sheets_client, parsers, validators, writer, types
├── tests/                            ← pytest (6 ไฟล์)
├── web/                              ← React app
│   └── src/data/*.json               ← ข้อมูลกราฟ (generated — อย่าแก้มือ)
├── .github/workflows/
│   ├── sync-from-sheets.yml          ← workflow sync + deploy (trigger ด้วย dispatch)
│   └── deploy.yml                    ← deploy เดิม (trigger ด้วย push main)
└── build_chart_json.py               ← DEPRECATED legacy PPTX flow
```

---

## 9. ลิงก์เอกสารทั้งหมด

| เอกสาร | ใช้เมื่อ |
|---|---|
| [`README.md`](../README.md) | เริ่มต้น, รัน dev |
| [`docs/architecture.md`](architecture.md) | เข้าใจระบบเต็ม, แก้ปัญหา |
| [`docs/runbook-initial-setup.md`](runbook-initial-setup.md) | ตั้งระบบใหม่จากศูนย์ (secrets, bootstrap, Apps Script) |
| [`docs/data-collector-guide-th.md`](data-collector-guide-th.md) | สอนคนกรอกข้อมูล |
| [design spec](superpowers/specs/2026-05-25-google-sheets-data-source-design.md) | เหตุผลเบื้องหลังการตัดสินใจ |
| [implementation plan](superpowers/plans/2026-05-25-google-sheets-data-source.md) | รายละเอียดแต่ละ task |

---

_หากเอกสารนี้ขัดกับสภาพจริงในโค้ด → เชื่อโค้ด แล้วอัปเดตเอกสารนี้_
