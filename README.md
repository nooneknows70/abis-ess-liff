# abis-ess-liff

ABIS Employee Service / LIFF frontend repository.

## Release Control

本專案採用 **ABIS ESS Release Control v1**。

版本判斷不再使用「最新檔名」或修改時間，而是使用完整的 **Release Set**。

### Primary SSOT

合併 Release Control v1 後，版本 Primary SSOT 為：

`main:/ABIS_ESS_RELEASE_MANIFEST.json`

人員閱讀的整體狀態：

`ABIS_ESS_CURRENT_STATE.md`

領域與版本控制語彙：

`CONTEXT.md`

交接文件只保存歷史脈絡與下一步，不得覆蓋 Release Manifest。

## Bootstrap before production changes

任何 Production 修改前固定執行：

```text
RELEASE_MANIFEST
  -> PROD_CURRENT Release Set
  -> Source / Version
  -> SHA256
  -> Production Runtime
  -> Deployment / Properties
  -> Current Work Stage
  -> BOOTSTRAP_PASS
```

若 Manifest 無法取得或任一層不一致，停止 Production mutation。

標準阻擋狀態：

- `VERSION_AUTHORITY_UNAVAILABLE`
- `VERSION_DRIFT`
- `CONTENT_DRIFT`
- `RUNTIME_DRIFT`
- `DEPLOYMENT_DRIFT`
- `RELEASE_SET_INCOMPLETE`

只有 `BOOTSTRAP_PASS` 才允許以該 Release Set 作為正式修改基底。

## Release lifecycle

```text
CANDIDATE
  -> PRECHECK_PASS
  -> SHADOW_PASS
  -> DEPLOYED
  -> POST_DEPLOY_PASS
  -> RUNTIME_ALIGNMENT_PASS
  -> PROD_CURRENT
```

Manifest 的 `PROD_CURRENT` 指標只能在部署後驗證完成時切換。

## Initialization state

Release Control v1 目前先在 `release-control-v1` branch 建立治理層。

第一階段只建立治理檔案與語彙，不修改 Production runtime code、GitHub Pages runtime behavior 或 Apps Script Production。
