# ABIS Employee Service

ABIS 員工自助服務的身分與存取語彙。此文件只定義業務概念，用來維持 LINE 與一般 Web 登入流程的用詞一致。

## Language

**EmployeeID**:
ABIS 對一名員工使用的唯一員工識別碼。
_Avoid_: LINE user ID, account ID

**LINE Identity**:
由 LINE 平台驗證後所代表的本人 LINE 身分。
_Avoid_: LINE profile, display name

**LINE Binding**:
一個 EmployeeID 與一個 LINE Identity 之間的正式一對一關係。
_Avoid_: LINE login, LINE friend

**Personal PIN**:
員工本人設定並用於一般 Web 登入的六位數 PIN。
_Avoid_: Password, Temporary PIN

**Temporary PIN**:
新進啟用或 HR 重設時，提供給單一員工、單次使用的短期登入憑證。
_Avoid_: Default PIN, 123456, Verification Code

**Verification Code**:
員工執行「忘記 PIN」時，經既有可信 LINE Binding 傳送的一次性驗證碼。
_Avoid_: Temporary PIN

**Web Session**:
員工以 EmployeeID 與 Personal PIN 驗證後取得的一般 Web 登入狀態。
_Avoid_: LINE Session

**LINE Session**:
ABIS 根據已驗證 LINE Identity 與有效 LINE Binding 建立的本人登入狀態。
_Avoid_: Web Session

**Restore First Login**:
HR 將員工憑證恢復為必須以 Temporary PIN 重新建立 Personal PIN 的狀態。
_Avoid_: Forgot PIN, Unbind LINE

**Unbind LINE**:
HR 解除 EmployeeID 與 LINE Identity 的正式綁定關係。
_Avoid_: Restore First Login, Reset PIN

**Leave Draft**:
員工尚未正式送出的新請假內容；屬於該 EmployeeID，可在 LINE 與一般 Web 間接續，正式送出前不具有 LeaveID。
_Avoid_: Leave, Returned Revision Draft

**Returned Revision Draft**:
既有 LeaveID 被退回後，用來修改並重新送出的草稿；其生命週期屬於原假單與修訂流程。
_Avoid_: Leave Draft

**Draft Attachment**:
正式送出 Leave Draft 之前，已上傳並隸屬於該 DraftID 的附件；此時尚未隸屬任何 LeaveID。
_Avoid_: Leave Attachment, Evidence URL

**Leave Attachment**:
已隸屬正式 LeaveID 的附件；可由 Draft Attachment 在正式送出時轉成，也可於送出後依規則補上傳。
_Avoid_: Draft Attachment

**Attendance Correction Request**:
員工針對某一出勤日的系統判定提出的補正申請；它只記錄員工主張與送出當下的出勤快照，不直接修改 Raw Punch、正式出勤結果或薪資。
_Avoid_: Attendance Adjustment, Raw Punch edit

**Attendance Adjustment**:
出勤補正經必要的主管與 HR 認定後，形成可供出勤／薪資計算採用的正式調整紀錄；原始 Raw Punch 仍永久保留不覆蓋。
_Avoid_: Attendance Correction Request, Raw Punch replacement

**Monthly Attendance Confirmation**:
HR 針對同一員工、同一月份的多筆待確認出勤異常建立的一張主管確認單；主管逐筆認定後，再以整張確認單完成送出。
_Avoid_: Attendance Correction Request, monthly payroll approval

**Attendance Appeal**:
員工對已完成或已駁回的 Attendance Correction Request 仍有異議時建立的新爭議案件；既有補正申請、主管／HR 認定與 Attendance Adjustment 歷程均保留，不以申訴覆寫。
_Avoid_: reopening correction, overwriting prior adjustment


## Release Control Language

**Release Set**:
一組已明確界定、彼此相容，且作為同一次正式發布單位的系統元件版本集合。
_Avoid_: latest files, newest file

**Release Authority**:
用來判定目前正式 Release Set 的唯一版本權威來源。
_Avoid_: chat history, handoff, filename

**Candidate**:
已形成 Release Set，但尚未完成全部正式發布驗證，因此還不能代表目前 Production 的版本狀態。
_Avoid_: PROD_CURRENT, deployed

**Deployed**:
某 Release Set 或 Component 已被放入 Production 環境，但不代表已完成正式驗證或已成為 PROD_CURRENT。
_Avoid_: PROD_CURRENT

**PROD_CURRENT**:
已完成必要驗證，且目前被 Release Authority 指定為正式 Production 的 Release Set。
_Avoid_: latest, newest, deployed

**Runtime**:
Production 環境實際正在執行的系統狀態。
_Avoid_: source version, intended version

**Bootstrap Gate**:
在允許正式系統修改前，用來確認 Release Authority、Source、內容完整性、Runtime 與目前工作階段彼此一致的必要檢查。
_Avoid_: smoke test

**Version Drift**:
同一 Component 的版本識別在應一致的來源之間不相符。
_Avoid_: Content Drift

**Content Drift**:
同一版本識別下的實際內容不一致。
_Avoid_: Version Drift

**Runtime Drift**:
Release Authority 所宣告的正式狀態與 Production Runtime 實際狀態不一致。
_Avoid_: Version Drift, Content Drift

**Deployment Drift**:
Source 或 Candidate 已前進，但 Production 的已部署狀態仍停留在另一組版本。
_Avoid_: Runtime Drift
