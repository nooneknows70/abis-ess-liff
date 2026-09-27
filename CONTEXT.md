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
