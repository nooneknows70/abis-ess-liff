# ABIS ESS｜LINE 出勤補正直達與 3 秒端到端目標 RC1

決策日期：2026-10-11。使用者選擇：**A — 每日管理者異常追蹤推播 → 當日有權限的異常待補正清單 → 點選案件進入補正／審核頁**。

## 本次三項唯一產品驗收目標

1. **每日兩次的員工出勤推播**：帶有單筆 `EMPLOYEE_CORRECTION` 的有效、本人授權通知，點擊後（既有 Session 已登入條件下）**直接進入對應日期及 AttendanceKey 的「可操作」補正表單**，不是 HOME、不是純「我的出勤」月份清單、也不是只出現載入中。已有有效補正單時應導向該單狀態，不得重複提交。
2. **每日出勤異常追蹤推播**：`MANAGEMENT_SITE_DAY` 開啟**通知指定廠區、指定日期的異常待補正清單**；各列點擊後導向該員工的補正案件頁。主管只能依正式權限查看／審核；HR/Admin 可依已核定政策在正式 Correction Request 流程代員工提出，不直接寫 Raw Punch / Attendance。員工 `EMPLOYEE_FOLLOWUP` 僅可看自己的清單並開啟自己的單筆補正。不可因查詢效率放鬆後端 Session/LINE 綁定、Audience、Scope、日期與案件授權。列表即使沒有案件也應顯示合法的空結果頁，而非 HOME。
3. **3 秒目標**：定義為 LINE 使用者**按下正式推播連結**至正確、已取得必要資料、可點擊操作的目標畫面完成之 elapsed time **≤3000 ms**；管理異常追蹤量測到「異常清單可操作」，清單中點個案到「補正／審核可操作」再獨立計時；員工單筆推播量測到表單可操作。不把 `doPost`、單筆 API RPC、HOME、Spinner、Skeleton、Overlay 空框或首次顯示文字等同 PASS。重新登入、冷啟動、LINE 外部網路與背景／前景分開記錄，不以其中一種有利樣本冒充所有用例均通過。不可直接宣稱可保證所有網路情境 ≤3 秒；要用實機證據驗收。

## 從目前程式碼核對到的事實及缺口

### 既有正式 @144 / LIFF HF8

- `p5a25R29ApplyBootRouteContext_` 已識別 `EMPLOYEE_CORRECTION`、`EMPLOYEE_FOLLOWUP`、`MANAGEMENT_SITE_DAY`、`MANAGEMENT_CASE`；但仍可能先顯示 HOME 並等待舊版讀取。
- `p5a25R29OpenEmployeeCorrection_` 使用 `openAttendanceDate_`，而這條路會 `refreshMyAttendance` 讀整月資料後才開 `attendanceCorrectionOverlay`。沒有完整 3 秒端到端證據。
- `p5a25R29OpenSiteDetail_` 目前先呼叫 `attendanceUnifiedSiteDetail`，後才建立 `r2SiteDetailOverlay`；對於未有補正申請但有例外的列，既有正式 UI 只顯示「待員工提出補正」，**沒有單筆可開啟補正表單的操作**；已存在補正者的「查看／審核補正」則呼叫 `p5a25R29OpenManagementCase_` 轉去 legacy Inbox。這**不符合使用者已選 A**。
- `submitAttendanceCorrection_` 現行後端檢查 `attendanceKey` 所屬 `員工ID` 必須等於 Session actor。它**只能供本人提出**，不得在前端偷偷改 employeeId 當成 HR/Admin 代送。若需開通代送，另建受伺服器權限控管、可追溯 `SubmittedByEmployeeID` / `SubmittedByRole` / `OnBehalfOf` 的正式 Correction Request API，沿用 RequestID replay、原始打卡不可變及正常主管／HR 審核；正式政策是 HR/Admin 可代送、直屬主管僅查看／審核。
- `p5rmApplyBootRoute_` 第二次執行可能 `showHome()`；現有 LIFF Draft 已有防重複 boot、保留 `liff.state`/路由 token、延後非關鍵 prefetch 的非正式候選。

### 正式環境觀測（A09701，現有 @144）

| 路徑 | 日期 / 條件 | clientRoundTripMs | 結果 |
|---|---|---:|---|
| `attendanceUnifiedSiteDetail` | XINDIAN 2026-09-29 | 4539.8 | BUSINESS_REJECTED, PERMISSION；**不得算成功性能** |
| `attendanceUnifiedMyFollowupR2Live` | 個人、0 案件 | 55800.9 | COMPLETED |
| `attendanceUnifiedSiteDetail` | XINDIAN 2026-10-02、0 案件 | 36200.2 | COMPLETED |

這些是單一 RPC 往返，不是 LINE 點擊到可操作頁。全部沒有 HF2 fast marker，沒有快速版正式 GAS 實測或完整渲染耗時。既有版本在空結果時都出現數十秒延遲，直接繼續用 legacy 整表掃描無法把 3 秒當成已完成。

## 開發順序與驗收條件

**M1｜員工單筆直達**：確認每日兩次推播真正發出哪一種 R2 RouteKind；對有效 `EMPLOYEE_CORRECTION` 保留登入後合法 token、`date`、`attendanceKey`、`correctionType`，不回 HOME；已有補正單顯示狀態；如不足以跳過整月 `myAttendance` 則需新增**極小化、本人 Session 專屬**單日檢視 API。此時不改正式推播頻率與時間。

**M2｜管理者異常清單（A）**：合法 `MANAGEMENT_SITE_DAY` → 當日／當站點待處理清單，點擊每列必有符合權限的「查看／審核／代送」入口；不從跨員工畫面呼叫只限本人 `submitAttendanceCorrection`；各角色按正式權限顯示並由後端強制檢查。現行 `attendanceUnifiedSiteDetail` 要避免每一筆不可操作／只有「待員工提出」的 dead end。已有申請與尚未申請分開處理。

**M3｜3 秒實際效能路徑**：使用事先安全衍生的當日待處理清單／單日資料與限界讀取；避免要求登入後重建全公司排班、全月考勤、原始打卡與追蹤 digest 才能展示第一個可操作頁。任何預先彙整快取都必須在後端 Session/Scope 授權後讀取，不得把姓名、出勤或 Session 放入 LIFF URL 或公開 Worker Cache。效能量測分為：LINE 開啟／驗證、Session／token 解析、指定 API、DOM 可操作。各項完成時間須有可回溯的 sanitized evidence。

**M4｜安全實機驗收**：A09701 合法 Session + 本人／管理者各 route；正常非空案件、無案件、已有補正、複數案件、多廠區／日期、跨日夜班、核准整日假／免打卡、權限拒絕、Token 過期、重登入、重複點擊、網路慢速；驗收量測完整首屏可操作時間，逐筆如實記載達標或未達標。LINE 上的通知連結原文、rt、Session、LINE Token 不寫入 Git 或 ChatGPT。

## Release 保護

- Production official Backend **@144** 為 immutable 50/50 Git `139d7461` 匹配；但 editable Apps Script HEAD 有 **五個尚未發布、與 `attendance-202609-live-fix-20261011` 完全匹配的出勤修復 JS**。任何 HF2 更新不可覆蓋／刪除那些工作。
- Release Manifest 仍 V143/STALE；HF2 PR #36、#40 與 LIFF PR #23 仍 Draft。不能因本文件、合成 CI PASS 或已確認 A 決策就宣稱 LIVE、3 秒 PASS 或安全可部署。
- 本文件僅為驗收／開發契約；無部署、正式出勤／人事／薪資資料修改、Script Property 更新、LINE 正式推播。
