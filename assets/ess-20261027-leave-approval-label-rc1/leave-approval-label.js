/**
 * ABIS ESS: manager leave-approval button text only.
 * No changes to ASSIGN_PROXY action, authorization, or leave state machine.
 * A read-only backend flag limits the label to cases that can finalize approval.
 */
(function () {
  'use strict';

  if (typeof renderLeaveInbox_ !== 'function') return;
  const originalRenderLeaveInbox = renderLeaveInbox_;

  renderLeaveInbox_ = function (list) {
    const result = originalRenderLeaveInbox.apply(this, arguments);
    if (!Array.isArray(list)) return result;

    const eligibleIds = new Set(
      list.filter(function (item) {
        return item && item.role === 'MANAGER_ASSIGN' &&
          item.assignProxyFinalizesLeave === true;
      }).map(function (item) { return String(item.leaveId || ''); })
    );
    if (!eligibleIds.size) return result;

    const container = document.getElementById('inboxList');
    if (!container) return result;
    const lang = typeof currentLang === 'string' ? currentLang : 'ZH';
    const label = lang === 'ZH' ? '核准申請' :
      (typeof tr === 'function' ? tr('managerApprove') : '核准申請');

    container.querySelectorAll('button[onclick*="ASSIGN_PROXY"]').forEach(function (button) {
      const action = button.getAttribute('onclick') || '';
      const match = /^approveAction\('([^']+)','ASSIGN_PROXY',this\)$/.exec(action);
      if (match && eligibleIds.has(match[1])) button.textContent = label;
    });

    return result;
  };
})();
