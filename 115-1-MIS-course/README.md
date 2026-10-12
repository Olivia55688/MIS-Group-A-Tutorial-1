# 校園設備報修系統

這是一個適合 MIS 課堂使用的最小前後端範例。學生透過網頁表單建立報修單，Flask 後端接收報修資料、產生案件編號，再將結果回傳網頁。報修者也可附上 JPG／PNG 圖片，後端會驗證並暫存在記憶體中，供前台與管理後台查看。

## 系統需求

- Windows 10/11
- Python 3.13.x
- 瀏覽器（Edge、Chrome 皆可）

## 第一次啟動

在此專案資料夾開啟 PowerShell，依序執行：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

看到下列訊息後，以瀏覽器開啟 <http://127.0.0.1:5000>：

```text
Running on http://127.0.0.1:5000
```

按 `Ctrl + C` 可停止伺服器。

管理後台位址為 <http://127.0.0.1:5000/admin>。可在此查看案件並更新狀態。

## 第二次以後啟動

```powershell
.\.venv\Scripts\python.exe app.py
```

## 給學生的觀察重點

1. 在 `templates/index.html` 找到表單欄位。
2. 在 `static/app.js` 找到 `fetch("/api/tickets")`：前端在這裡呼叫後端 API。
3. 在 `app.py` 找到 `@app.post("/api/tickets")`：Python 在這裡接收、驗證並回傳資料。
4. 在 `templates/admin.html` 與 `static/admin.js` 看管理員如何透過 `PATCH /api/tickets/<案件編號>` 更新狀態。
5. 在 `static/app.js` 查看圖片選取、預覽與前端驗證；在 `app.py` 查看圖片上傳驗證與暫存 API。

## 報修圖片

- 圖片為非必填欄位，最多 3 張，每張上限 10MB，僅接受 JPG／PNG。
- 前端提供圖片預覽、刪除與拖曳選取；手機支援使用裝置相機拍照。
- 圖片不寫入資料庫或磁碟，只暫存在伺服器記憶體；停止或重啟程式後會清除。
- 可在報修頁面或管理後台點擊縮圖，以燈箱檢視原圖及旋轉圖片。

## 課堂微調任務

範例已包含「聯絡方式」欄位。課堂上可請學生自行新增另一個欄位，例如「學號」或「報修類別」，讓它能從網頁表單一路送到後端，並顯示在案件清單中。

## 注意事項

本範例把案件資料存在 Python 的記憶體中，停止或重啟程式後，資料會清空。這是刻意保留的教學簡化；資料庫是後續延伸主題。
