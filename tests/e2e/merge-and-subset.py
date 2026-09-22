"""E2E (Playwright, Chromium): Panel mode="merge" + маршрут з підмножиною мов.

Не входить у `npm test` (потрібен браузер). Запуск:
  VITE_E2E_STUB=1 CI=1 PUPPETEER_SKIP_DOWNLOAD=1 npx vite build --outDir /tmp/dist_e2e --emptyOutDir
  npx vite preview --outDir /tmp/dist_e2e --port 4173 &
  E2E_BASE=http://127.0.0.1:4173 E2E_DIST=/tmp/dist_e2e python3 tests/e2e/merge-and-subset.py
Змінні: E2E_CHROME — шлях до chromium (за замовчуванням — з Playwright).
Заглушка (src/e2e/MergeStub.jsx) існує лише у збірці з VITE_E2E_STUB=1.
"""
import json, re, os
from playwright.sync_api import sync_playwright
B=os.environ.get("E2E_BASE","http://127.0.0.1:4173"); CHROME=os.environ.get("E2E_CHROME") or None
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok), detail)); print(("PASS" if ok else "FAIL"), name, ("| "+str(detail)[:300]) if detail!="" else "", flush=True)
def F(name, text): return {"name":name,"mimeType":"text/plain","buffer":text.encode()}
def names(pg): return pg.eval_on_selector_all(".side-panel__filelist .side-panel__filename","els=>els.map(e=>e.textContent)")
def calls(pg): return pg.evaluate("window.__E2E_MERGE_CALLS||[]")
def head_alts(pg): return pg.eval_on_selector_all('link[rel="alternate"][hreflang]',"els=>els.map(e=>[e.getAttribute('hreflang'),e.getAttribute('href')])")

with sync_playwright() as p:
    b=p.chromium.launch(**({"executable_path":CHROME} if CHROME else {}),args=["--no-sandbox"])
    c=b.new_context(locale="uk-UA",viewport={"width":1280,"height":900},accept_downloads=True)
    c.add_init_script("try{localStorage.setItem('cp_consent','denied');localStorage.setItem('lang-banner-dismissed','1')}catch(e){}")
    reqs=[]
    def route(r):
        u=r.request.url
        if u.startswith(B): r.continue_()
        else: reqs.append(u); r.abort()
    c.route("**/*", route)
    pg=c.new_page(); errs=[]; cons=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: cons.append(m.text) if m.type=="error" and "Failed to load resource" not in m.text and "processAll failed" not in m.text else None)

    # ───────── MERGE MODE ─────────
    pg.goto(B+"/__e2e-merge"); pg.wait_for_selector("h1"); pg.wait_for_timeout(500)
    check("M0 stub page renders, panel closed", pg.inner_text("h1")=="E2E merge stub" and "side-panel--open" not in (pg.get_attribute("aside.side-panel","class") or ""))
    pg.set_input_files("input[type=file]", [F("a.txt","A")]); pg.wait_for_selector("aside.side-panel--open")
    check("M1 one file → panel opens, nothing processed yet", names(pg)==["a.txt"] and calls(pg)==[] and pg.inner_text(".side-panel__file-status").strip().endswith("MB"), names(pg))
    create=pg.locator("[data-merge-create]")
    check("M1b «Створити» disabled + min-files hint", create.is_disabled() and "Мінімальна кількість файлів: 2" in pg.inner_text(".side-panel__merge-info"), pg.inner_text(".side-panel__merge-info"))
    check("M1c title is «Підготовка файлу» (not «Готово до завантаження»)", pg.inner_text(".side-panel__title")=="Підготовка файлу", pg.inner_text(".side-panel__title"))
    pg.set_input_files("input[type=file]", [F("b.txt","B"),F("c.txt","C")]); pg.wait_for_timeout(200)
    check("M2 3 files in add order, still nothing processed", names(pg)==["a.txt","b.txt","c.txt"] and calls(pg)==[], names(pg))
    li=pg.locator(".side-panel__file-item")
    check("M2b «Створити» enabled, hint gone, order hint shown", create.is_enabled() and "Мінімальна" not in pg.inner_text(".side-panel__merge-info") and "Порядок файлів" in pg.inner_text(".side-panel__merge-info"))
    check("M2c first ↑ and last ↓ disabled", li.nth(0).locator("[data-move=up]").is_disabled() and li.nth(2).locator("[data-move=down]").is_disabled() and li.nth(1).locator("[data-move=up]").is_enabled())
    idx=pg.eval_on_selector_all(".side-panel__file-index","els=>els.map(e=>e.textContent)")
    check("M2d visible order numbers 1..3", idx==["1","2","3"], idx)
    aria=li.nth(1).locator("[data-move=up]").get_attribute("aria-label")
    check("M2e move buttons have accessible names", aria=="Перемістити вгору: b.txt", aria)

    # reorder with buttons
    li.nth(2).locator("[data-move=up]").click(); pg.wait_for_timeout(150)
    check("M3 ↑ on c → a,c,b", names(pg)==["a.txt","c.txt","b.txt"], names(pg))
    foc=pg.evaluate("(()=>{const a=document.activeElement;return a&&a.closest('li')&&a.closest('li').querySelector('.side-panel__filename').textContent+':'+a.dataset.move})()")
    check("M3b focus stays on the moved file's ↑ button", foc=="c.txt:up", foc)
    li.nth(0).locator("[data-move=down]").click(); pg.wait_for_timeout(150)
    check("M3c ↓ on a → c,a,b", names(pg)==["c.txt","a.txt","b.txt"], names(pg))
    # focus after reaching the edge: move c... c is at 0; move a up to edge
    li.nth(1).locator("[data-move=up]").click(); pg.wait_for_timeout(150)   # a,c,b
    foc=pg.evaluate("(()=>{const a=document.activeElement;return a&&a.closest('li')&&a.closest('li').querySelector('.side-panel__filename').textContent+':'+a.dataset.move})()")
    check("M3d at the edge focus moves to the other enabled button", foc=="a.txt:down", foc)
    # drag & drop: drag b (idx2) to first
    li.nth(2).drag_to(li.nth(0)); pg.wait_for_timeout(250)
    check("M4 drag b onto first → b,a,c", names(pg)==["b.txt","a.txt","c.txt"], names(pg))
    li.nth(0).drag_to(li.nth(2)); pg.wait_for_timeout(250)
    check("M4b drag first onto last → a,c,b", names(pg)==["a.txt","c.txt","b.txt"], names(pg))
    check("M4c dnd classes cleaned up after drop", pg.locator(".side-panel__file-item--dragging,.side-panel__file-item--over").count()==0)
    # remove
    pg.click("li[data-item-id]:has-text('c.txt') .side-panel__remove-btn"); pg.wait_for_timeout(150)
    check("M5 remove c → a,b; min still met", names(pg)==["a.txt","b.txt"] and create.is_enabled(), names(pg))
    pg.set_input_files("input[type=file]", [F("c.txt","C")]); pg.wait_for_timeout(150)
    check("M5b re-add c → a,b,c", names(pg)==["a.txt","b.txt","c.txt"], names(pg))
    pg.click("li[data-item-id]:has-text('b.txt') .side-panel__remove-btn"); pg.click("li[data-item-id]:has-text('c.txt') .side-panel__remove-btn"); pg.wait_for_timeout(150)
    check("M5c below min again → disabled + hint", create.is_disabled() and "Мінімальна" in pg.inner_text(".side-panel__merge-info"))
    pg.set_input_files("input[type=file]", [F("b.txt","B"),F("c.txt","C")]); pg.wait_for_timeout(150)  # a,b,c
    li.nth(2).locator("[data-move=up]").click(); li.nth(1).locator("[data-move=up]").click(); pg.wait_for_timeout(150)  # c,a,b
    check("M5d order for the run: c,a,b", names(pg)==["c.txt","a.txt","b.txt"], names(pg))

    # run + progress + cancel
    pg.evaluate("window.__E2E_MERGE={delay:300,steps:6}")
    create.click(); pg.wait_for_timeout(450)
    st=pg.inner_text(".side-panel__merge-info")
    check("M6 running: progress text, progress bar with value, «Скасувати» visible", "Крок" in st and pg.locator(".side-panel__merge-info progress").count()==1 and pg.locator(".side-panel__merge-info .side-panel__cancel-btn").count()==1, st)
    pv=pg.eval_on_selector(".side-panel__merge-info progress","e=>e.value")
    check("M6b progress value reported (0<v<=1)", 0<pv<=1, pv)
    check("M6c processAll got files in list order", calls(pg)==[["c.txt","a.txt","b.txt"]], calls(pg))
    check("M6d during run: create/move/remove/add disabled", create.is_disabled() and pg.locator("[data-move]:enabled").count()==0 and pg.locator(".side-panel__remove-btn:enabled").count()==0 and pg.locator(".side-panel__add-btn").is_disabled())
    pg.set_input_files("input[type=file]", [F("z.txt","Z")]); pg.wait_for_timeout(150)
    check("M6e files dropped during the run are ignored", names(pg)==["c.txt","a.txt","b.txt"], names(pg))
    pg.click(".side-panel__merge-info .side-panel__cancel-btn"); pg.wait_for_timeout(200)
    check("M7 cancel: list kept intact, «Створити» back and enabled, no result", names(pg)==["c.txt","a.txt","b.txt"] and create.is_enabled() and pg.locator(".side-panel__merge-result").count()==0 and pg.locator(".side-panel__merge-info progress").count()==0)
    pg.wait_for_timeout(2200)
    check("M7b cancelled run never produces a result later", pg.locator(".side-panel__merge-result").count()==0 and create.is_visible() and pg.locator(".side-panel__download-btn:not([data-merge-create])").count()==0)

    # full run
    pg.evaluate("window.__E2E_MERGE={delay:30,steps:3}")
    create.click(); pg.wait_for_selector(".side-panel__merge-result",timeout=5000)
    r=pg.inner_text(".side-panel__merge-result")
    check("M8 done: single result block with name and total", "merged.txt" in r and "→" in r and "MB" in r, r)
    dl=pg.locator(".side-panel__download-btn")
    check("M8b bottom button becomes the download button (create hidden)", dl.inner_text()=="Завантажити результат" and pg.locator("[data-merge-create]").count()==0, dl.inner_text())
    check("M8c title «Готово до завантаження»", pg.inner_text(".side-panel__title")=="Готово до завантаження")
    check("M8d processAll called with c,a,b (2nd call)", calls(pg)[-1]==["c.txt","a.txt","b.txt"] and len(calls(pg))==2, calls(pg))
    with pg.expect_download() as d: dl.click()
    dw=d.value; path=dw.path()
    content=open(path,encoding="utf-8").read()
    check("M9 downloads ONE file merged.txt with contents in list order (C+A+B)", dw.suggested_filename=="merged.txt" and content=="C+A+B", (dw.suggested_filename, content))
    check("M9b title «Файл завантажено»", pg.inner_text(".side-panel__title")=="Файл завантажено")
    # mutate list → result invalidated
    li.nth(0).locator("[data-move=down]").click(); pg.wait_for_timeout(200)
    check("M10 changing order invalidates result: «Створити» back, no result, title back", pg.locator(".side-panel__merge-result").count()==0 and pg.locator("[data-merge-create]").is_enabled() and pg.inner_text(".side-panel__title")=="Підготовка файлу")
    create.click(); pg.wait_for_selector(".side-panel__merge-result")
    with pg.expect_download() as d: pg.click(".side-panel__download-btn")
    check("M10b new result reflects new order (A+C+B)", open(d.value.path(),encoding="utf-8").read()=="A+C+B")
    pg.click("li[data-item-id]:has-text('b.txt') .side-panel__remove-btn"); pg.wait_for_timeout(150)
    check("M10c removing a file also invalidates result", pg.locator(".side-panel__merge-result").count()==0)
    pg.set_input_files("input[type=file]", [F("b.txt","B")]); pg.wait_for_timeout(150)
    check("M10d adding a file keeps list order (a,c,b) and result absent", names(pg)==["a.txt","c.txt","b.txt"] and pg.locator(".side-panel__merge-result").count()==0, names(pg))

    # error + retry
    n0=len(calls(pg))
    pg.evaluate("window.__E2E_MERGE={delay:20,steps:2,fail:true,failOnce:true}")
    create.click(); pg.wait_for_selector(".side-panel__merge-error",timeout=5000)
    e=pg.inner_text(".side-panel__merge-error")
    check("M11 error shown as friendly text (not raw 'boom'), role=alert", "Не вдалося створити файл" in e and "boom" not in e and pg.get_attribute(".side-panel__merge-error","role")=="alert", e)
    check("M11b list kept after error; create button still available", names(pg)==["a.txt","c.txt","b.txt"] and create.is_enabled())
    pg.click(".side-panel__merge-error .side-panel__cancel-btn"); pg.wait_for_selector(".side-panel__merge-result",timeout=5000)
    check("M11c «Повторити» re-runs with the same files → done", calls(pg)[-1]==["a.txt","c.txt","b.txt"] and len(calls(pg))==n0+2 and pg.locator(".side-panel__merge-error").count()==0, calls(pg)[n0:])
    # error then change list clears the error
    pg.evaluate("window.__E2E_MERGE={delay:10,steps:1,fail:true}")
    li.nth(0).locator("[data-move=down]").click(); pg.wait_for_timeout(100)
    create.click(); pg.wait_for_selector(".side-panel__merge-error",timeout=5000)
    li.nth(0).locator("[data-move=down]").click(); pg.wait_for_timeout(150)
    check("M11d editing the list clears a stale error", pg.locator(".side-panel__merge-error").count()==0)
    pg.evaluate("window.__E2E_MERGE={delay:10,steps:1}")

    # rejection
    pg.set_input_files("input[type=file]", [{"name":"x.png","mimeType":"image/png","buffer":b"\x89PNG"}]); pg.wait_for_timeout(200)
    check("M12 wrong type is rejected with a message, list unchanged", len(names(pg))==3 and pg.locator("[role=alert] .error-text").count()>=1, pg.inner_text(".side-panel"))
    # close panel resets
    pg.click(".side-panel__back-btn"); pg.wait_for_timeout(300)
    check("M13 closing the panel clears list and result", "side-panel--open" not in pg.get_attribute("aside.side-panel","class") and pg.locator(".side-panel__file-item").count()==0 and pg.locator(".side-panel__merge-result").count()==0)
    pg.set_input_files("input[type=file]", [F("q.txt","Q"),F("w.txt","W")]); pg.wait_for_selector("aside.side-panel--open"); pg.wait_for_timeout(200)
    create.click(); pg.wait_for_selector(".side-panel__merge-result")
    with pg.expect_download() as d: pg.click(".side-panel__download-btn")
    check("M13b works again after reset (Q+W)", open(d.value.path(),encoding="utf-8").read()=="Q+W")
    # close while running: result must be discarded
    pg.click(".side-panel__back-btn"); pg.wait_for_timeout(200)
    pg.evaluate("window.__E2E_MERGE={delay:250,steps:4}")
    pg.set_input_files("input[type=file]", [F("q.txt","Q"),F("w.txt","W")]); pg.wait_for_selector("aside.side-panel--open")
    create.click(); pg.wait_for_timeout(300); pg.click(".side-panel__back-btn"); pg.wait_for_timeout(1800)
    check("M14 closing the panel mid-run discards the late result", pg.locator(".side-panel__merge-result").count()==0 and pg.locator(".side-panel__file-item").count()==0)
    # mobile viewport smoke
    pg.evaluate("window.__E2E_MERGE={delay:20,steps:2}")
    pg.set_viewport_size({"width":390,"height":800})
    pg.set_input_files("input[type=file]", [F("q.txt","Q"),F("w.txt","W")]); pg.wait_for_selector("aside.side-panel--open"); pg.wait_for_timeout(500)
    bx=create.bounding_box()
    check("M15 mobile: «Створити» visible inside viewport", bx and bx["y"]>0 and bx["y"]+bx["height"]<=800 and bx["x"]>=0 and bx["x"]+bx["width"]<=390, bx)
    sw=pg.evaluate("document.documentElement.scrollWidth")
    check("M15b mobile: no horizontal overflow", sw<=390, sw)
    pg.screenshot(path="/tmp/e2e_merge_mobile.png")
    pg.set_viewport_size({"width":1280,"height":900})
    pg.screenshot(path="/tmp/e2e_merge_desktop.png")
    check("M16 no page errors / console errors on the stub page", not errs and not cons, (errs[:2],cons[:2]))

    # ───────── SUBSET ROUTE ─────────
    pg.goto(B+"/__e2e-merge"); pg.wait_for_selector("h1"); pg.wait_for_timeout(500)
    al=head_alts(pg); html=pg.content()
    exp=[["uk","https://compressphoto.org/__e2e-merge"],["en","https://compressphoto.org/en/__e2e-merge"],["x-default","https://compressphoto.org/en/__e2e-merge"]]
    check("S1 hreflang only uk+en, x-default = en, no ru/es", sorted(al)==sorted(exp), al)
    check("S1b no 'undefined' anywhere in the document", "undefined" not in html.lower().replace("undefined behavior",""), [m for m in re.findall(r".{30}undefined.{30}",html)][:3])
    canon=pg.get_attribute('link[rel=canonical]',"href"); check("S1c canonical (uk)", canon=="https://compressphoto.org/__e2e-merge", canon)
    ftr=pg.eval_on_selector_all(".footer__nav-link","els=>els.map(e=>e.getAttribute('href'))")
    check("S2 footer on uk shows the stub (14 links) with uk href", len(ftr)==14 and "/__e2e-merge" in ftr, ftr)
    # language switcher
    def switch(code):
        pg.locator(".ls-trigger:visible").first.click(); pg.locator(f".ls-option:has(.ls-option-code:text-is('{code}'))").first.click(); pg.wait_for_timeout(600)
    switch("EN"); check("S3 switcher uk→en stays on the tool", pg.url==B+"/en/__e2e-merge", pg.url)
    al=head_alts(pg); check("S3b en page: same hreflang set", sorted(al)==sorted(exp), al)
    check("S3c en page canonical", pg.get_attribute('link[rel=canonical]',"href")=="https://compressphoto.org/en/__e2e-merge")
    switch("RU"); check("S4 switcher en→ru: tool has no ru → goes to /ru home", pg.url==B+"/ru", pg.url)
    ftr=pg.eval_on_selector_all(".footer__nav-link","els=>els.map(e=>e.getAttribute('href'))")
    check("S4b ru footer hides the stub (13 links, no __e2e)", len(ftr)==13 and not any("__e2e" in h for h in ftr), ftr)
    pg.goto(B+"/es"); pg.wait_for_selector("h1"); pg.wait_for_timeout(400)
    ftr=pg.eval_on_selector_all(".footer__nav-link","els=>els.map(e=>e.getAttribute('href'))")
    check("S4c es footer hides the stub", len(ftr)==13 and not any("__e2e" in h for h in ftr), ftr)
    pg.goto(B+"/__e2e-merge"); pg.wait_for_selector("h1"); pg.wait_for_timeout(400); switch("ES")
    check("S4d switcher uk→es → /es home", pg.url==B+"/es", pg.url)
    # related tools
    for path,expect in [("/resize-image","/__e2e-merge"),("/en/resize-image","/en/__e2e-merge")]:
        pg.goto(B+path); pg.wait_for_selector(".related-tools__item"); pg.wait_for_timeout(300)
        hs=pg.eval_on_selector_all(".related-tools__item","els=>els.map(e=>e.getAttribute('href'))")
        check(f"S5 related on {path} lists the stub with correct href", expect in hs and len(hs)==6, hs)
    for path in ["/ru/resize-image","/es/redimensionar-imagen"]:
        pg.goto(B+path); pg.wait_for_selector(".related-tools__item"); pg.wait_for_timeout(300)
        hs=pg.eval_on_selector_all(".related-tools__item","els=>els.map(e=>e.getAttribute('href'))")
        check(f"S5b related on {path} hides the stub", len(hs)==5 and not any("__e2e" in h for h in hs), hs)
    # header links to real tools still fine on ru
    hh=pg.eval_on_selector_all("header a[href]","els=>els.map(e=>e.getAttribute('href'))")
    check("S6 header on /es has only /es links (+ no undefined)", all(h.startswith("/es") or h.startswith("http") or h.startswith("#") for h in hh) and not any("undefined" in h for h in hh), hh[:25])
    # stub in ru → NotFound, no crash
    pg.goto(B+"/ru/__e2e-merge"); pg.wait_for_timeout(600)
    check("S7 /ru/__e2e-merge (no ru version) → NotFound page, app alive", pg.locator("h1").count()>=1 and "E2E merge stub" not in pg.inner_text("body"), pg.inner_text("h1")[:60])
    check("S8 no external requests, no page errors", not reqs and not errs, (reqs[:3],errs[:2]))
    b.close()
# static artefacts
d=os.environ.get("E2E_DIST","/tmp/dist_e2e")
sm=open(d+"/sitemap.xml").read()
res.append(("S9 stub absent from sitemap and prerender", "__e2e" not in sm and not os.path.exists(d+"/__e2e-merge") and not os.path.exists(d+"/en/__e2e-merge"),""))
print(("PASS" if res[-1][1] else "FAIL"), res[-1][0])
failed=len([r for r in res if not r[1]])
print("%d checks, %d failed"%(len(res),failed))
raise SystemExit(1 if failed else 0)
