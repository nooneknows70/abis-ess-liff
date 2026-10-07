# ABIS ESS Current State

> 本文件提供人員閱讀的目前狀態摘要，不是版本 SSOT。  
> 正式版本權威為 `ABIS_ESS_RELEASE_MANIFEST.json`。在 Release Control 初始化完成前，所有 Production 元件仍須視為未完成 Runtime 對齊驗證。

## Release Control

- Control model: `ABIS_ESS_RELEASE_CONTROL_V1`
- Repository: `nooneknows70/abis-ess-liff`
- Primary branch: `main`
- Initialization branch: `release-control-v1`
- Initialization base: `main@531819441f5d40c53ed9423a3bd0dadf9343ea6a`
- Release status: `INITIALIZING`
- PROD_CURRENT Release Set: **尚未建立**
- Production mutation during initialization: **NONE**

## Bootstrap Inventory — 2026-10-07

已完成 Git 端唯讀 Inventory。

### Git source 已確認存在

| Component | Observed state | Authority |
| --- | --- | --- |
| LIFF bridge | `index.html` / bridge version `P5A1-RM-FAST4_ROUTE_FIRST_RC1_1_TOKEN_REFRESH_20261007` | UNVERIFIED |
| Frontend base bundle | HF8 / `assets/ess-20261007-rc13-hf8` | UNVERIFIED |
| Attendance hold overlay | HF8.1 / `assets/ess-20261007-rc13-hf81/attendance-hold-hf81.js` | UNVERIFIED |
| Attendance schedule | Reported 38E, source still external to this repo | UNVERIFIED |
| Attendance live incremental | Reported R2174, source still external to this repo | UNVERIFIED |
| Apps Script backend | External source not yet captured and aligned | UNVERIFIED |

`UNVERIFIED` 的意思不是「版本錯誤」，而是尚未完成 Source + SHA256 + Production Runtime 三層一致性驗證。

## Git evidence

- Current `main` head at initialization: `531819441f5d40c53ed9423a3bd0dadf9343ea6a`
- HF8 base bundle exists in Git.
- HF8.1 is an overlay on top of the base frontend asset set，不應視為完整替代 bundle。
- Existing HF8 asset manifest declares preserved backend versions for Attendance Unified 38E and R2174; this is source evidence only, not Runtime proof.
- `CONTEXT.md` already serves as the project glossary.
- `README.md` previously contained only the repository title.
- `main` branch protection was not enabled at inventory time.

## Version authority rule

不要再以「哪個檔案最新」判斷正式版本。

正式問題應為：

> 目前 `PROD_CURRENT Release Set` 是哪一組？

以下資訊不得單獨決定正式版本：

- 檔名中的 `FINAL`、`LATEST`、HF/R 編號
- 修改日期
- 聊天紀錄
- handoff 文件
- 單一 Git 檔案比其他檔案更新

只有通過 Release Control Bootstrap Gate 的相容組合，才能成為 `PROD_CURRENT`。

## Bootstrap Gate

正式修改 Production 前固定檢查：

1. 取得 `ABIS_ESS_RELEASE_MANIFEST.json`
2. 解析 `PROD_CURRENT Release Set`
3. 取得 Manifest 指定 Source
4. 驗證 Version
5. 驗證 SHA256
6. 驗證 Production Runtime
7. 驗證 Deployment / Properties
8. 驗證 Current Work Stage
9. 全部通過後才回傳 `BOOTSTRAP_PASS`

任何一層不一致，Production mutation 必須停止。

## Current work

- Module: `R2180`
- Name: `PUNCH_EXEMPT_PERIOD`
- Stage: `R2180-A`
- Status: `PLANNED`

Release Control 初始化完成前，可以做架構分析與唯讀盤點；不得把未驗證舊檔當作 Production 修改基底。

## Next release-control step

1. 合併 Release Control governance PR。
2. 執行完整 Bootstrap Inventory。
3. 取得 Apps Script Backend / Attendance 正式 source。
4. 計算 SHA256。
5. 建立唯讀 `systemReleaseStatus` Runtime API。
6. 完成 Manifest / Source / Runtime 三層對齊。
7. 將通過驗證的 Release Set 升格為 `PROD_CURRENT`。
