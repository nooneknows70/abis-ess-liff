// ABIS HOME live-attendance patch RC1 | production HF1 base | 2026-10-07
/* ABIS ESS STATIC ASSET BUNDLE | FAST4 RC1.3 | 2026-10-07 */

/* ===== CORE_POST ===== */
const P5A1_LIFF_ENTRY_URL='https://liff.line.me/2011584842-AmO1bbHY';
const P5A1_LINE_FAST_WINDOW_MS=5*60*1000;
const P5A1_LINE_FAST_UNTIL_KEY='abis_p5a1_line_fast_until_v1';
const P5A1_LINE_TIMEOUT_DRAFT_KEY='abis_p5a1_line_timeout_draft_v1';
const P5A1_LINE_TIMEOUT_DRAFT_TTL_MS=60*60*1000;
const P5A1_LEAVE_DRAFT_FORM_TYPE='NEW_LEAVE';
const P5A1_LEAVE_DRAFT_AUTOSAVE_MS=12000;
let p5a1LineReauthStarted=false;
let p5a108DraftId='',p5a108DraftVersion=0,p5a108DraftDirty=false,p5a108DraftTimer=null,p5a108DraftInFlight=false,p5a108DraftConflict=false,p5a108DraftLoadSeq=0;
let p5a109DraftAttachments=[],p5a109AttachmentBusy=false;
let attendanceFocusDate_='',accountPanel_='';
let sessionToken='',firstPinSetupToken='',firstPinEmployeeId='',forgotPinResetToken='',forgotPinEmployeeId='',rememberedEmployeeId='',homeData=null,currentLang='ZH',returnedEditLeaveId='';
try{sessionToken=localStorage.getItem('abis_session')||'';rememberedEmployeeId=localStorage.getItem('abis_employee_id')||'';currentLang=localStorage.getItem('abis_lang')||'ZH';}catch(e){}
if(ABIS_SERVER_BOOT&&ABIS_SERVER_BOOT.sessionToken){sessionToken=String(ABIS_SERVER_BOOT.sessionToken||'');if(ABIS_SERVER_BOOT.employeeId)rememberedEmployeeId=String(ABIS_SERVER_BOOT.employeeId||'').toUpperCase();if(ABIS_SERVER_BOOT.home)homeData=ABIS_SERVER_BOOT.home;try{localStorage.setItem('abis_session',sessionToken);localStorage.setItem(P5A1_LINE_FAST_UNTIL_KEY,String(Date.now()+P5A1_LINE_FAST_WINDOW_MS));if(rememberedEmployeeId)localStorage.setItem('abis_employee_id',rememberedEmployeeId)}catch(e){}}
if(!['ZH','VI','TH'].includes(currentLang))currentLang='ZH';
const $=id=>document.getElementById(id);let myLeavesCache=null,inboxCache=null,taskSummaryCache=null,taskInboxCache={},activeTaskFilter='ALL',activeTaskInboxData=null,notificationCache=null,notificationFilterCache={},activeNotificationFilter='ALL',activeNotificationData=null,notificationLoading=false,proxyAssignmentsCache=null,dashboardCache=null,attendanceCache=null,attendanceViewMode='calendar',prefetchStarted=false,departmentConflictTimer=null,departmentConflictSeq=0,currentDepartmentConflicts=[],proxyAvailabilityTimer=null,proxyAvailabilitySeq=0,lineBindingStatusCache=null,lineBindingLoading=false,operationSeq=0,activeOperationId=0,operationTimers=[],mutationBusy=false,hrCredentialResultsCache=[],hrCredentialSelected=null;

// ============================================================================
// PERF2 | Authenticated in-memory read cache + single-flight + staged prefetch
// Version: ABIS_ESS_PERF2_RC1_20261005
// - No persistent employee-data cache.
// - No API contract change.
// - Mutations remain authoritative and invalidate existing domain caches.
// - Avoids duplicate reads when background prefetch and a user tap overlap.
// ============================================================================
const ABIS_ESS_PERF2_VERSION_='ABIS_ESS_PERF2_RC1_20261005';
const ABIS_PERF2_TTL_={leaves:60000,attendance:45000,taskSummary:30000,taskInbox:30000,notifications:60000,proxy:120000};
const ABIS_PERF2_STAMP_=Object.create(null),ABIS_PERF2_INFLIGHT_=Object.create(null),ABIS_PERF2_TIMING_=Object.create(null);
function abisPerf2Now_(){return Date.now()}
function abisPerf2Fresh_(key,ttl){const t=Number(ABIS_PERF2_STAMP_[key]||0);return !!t&&(abisPerf2Now_()-t)<Number(ttl||0)}
function abisPerf2Mark_(key){ABIS_PERF2_STAMP_[key]=abisPerf2Now_()}
function abisPerf2Invalidate_(keys){(Array.isArray(keys)?keys:[keys]).forEach(function(k){if(k)delete ABIS_PERF2_STAMP_[k]})}
function abisPerf2Record_(key,start,source){ABIS_PERF2_TIMING_[key]={ms:Math.max(0,Math.round(performance.now()-start)),source:source||'network',at:abisPerf2Now_()}}
function abisPerf2SingleFlight_(key,loader){if(ABIS_PERF2_INFLIGHT_[key])return ABIS_PERF2_INFLIGHT_[key];const started=performance.now();const p=Promise.resolve().then(loader).then(function(v){abisPerf2Mark_(key);abisPerf2Record_(key,started,'network');return v}).finally(function(){delete ABIS_PERF2_INFLIGHT_[key]});ABIS_PERF2_INFLIGHT_[key]=p;return p}
function abisPerf2Idle_(fn,delay){const run=function(){try{if(typeof requestIdleCallback==='function')requestIdleCallback(function(){fn()},{timeout:1200});else setTimeout(fn,0)}catch(e){setTimeout(fn,0)}};setTimeout(run,Math.max(0,Number(delay||0)))}
function abisPerf2TaskViewFromAll_(filter){const f=p5a1Rc2TaskFilterNormalize_(filter);const all=taskInboxCache&&taskInboxCache.ALL;if(!all||!Array.isArray(all.tasks)||f==='ALL')return all||null;const tasks=all.tasks.filter(function(x){return String(x&&x.Category||x&&x.category||'').toUpperCase()===f});return Object.assign({},all,{filter:f,count:tasks.length,tasks:tasks})}
async function abisPerf2LoadLeaves_(){return abisPerf2SingleFlight_('leaves',async function(){const list=await call('myLeaves',{sessionToken});myLeavesCache=list;return list})}
async function abisPerf2LoadAttendance_(month){month=String(month||currentMonthKey());return abisPerf2SingleFlight_('attendance:'+month,async function(){const data=await call('myAttendance',{sessionToken,month:month});attendanceCache=data;abisPerf2Mark_('attendance:'+month);return data})}
async function abisPerf2LoadTaskSummary_(){return abisPerf2SingleFlight_('taskSummary',async function(){const data=await call('taskSummary',{sessionToken});taskSummaryCache=data&&data.taskSummary?data.taskSummary:{total:0,returnedLeave:0,attendanceException:0,approval:0,supplement:0};return taskSummaryCache})}
async function abisPerf2LoadTaskInbox_(filter){const f=p5a1Rc2TaskFilterNormalize_(filter);const key='taskInbox:'+f;return abisPerf2SingleFlight_(key,async function(){const data=await call('taskInbox',{sessionToken,filter:f});const out=data||{filter:f,taskSummary:{total:0,returnedLeave:0,attendanceException:0,approval:0,supplement:0},count:0,tasks:[]};taskInboxCache[f]=out;if(out.taskSummary){taskSummaryCache=out.taskSummary;abisPerf2Mark_('taskSummary')}return out})}
async function abisPerf2LoadNotifications_(filter){const f=p5a1Rc2NotificationFilterNormalize_(filter);const key='notifications:'+f;return abisPerf2SingleFlight_(key,async function(){const data=await call('notifications',{sessionToken,filter:f,limit:100});notificationFilterCache[f]=data;if(f==='ALL')notificationCache=data;return data})}
async function abisPerf2LoadProxy_(){return abisPerf2SingleFlight_('proxy',async function(){const list=await call('proxyAssignments',{sessionToken});proxyAssignmentsCache=list;return list})}
function abisEssPerf2Status_(){return {version:ABIS_ESS_PERF2_VERSION_,stamps:Object.assign({},ABIS_PERF2_STAMP_),inflight:Object.keys(ABIS_PERF2_INFLIGHT_),timing:Object.assign({},ABIS_PERF2_TIMING_),caches:{leaves:myLeavesCache!==null,attendance:!!attendanceCache,taskSummary:!!taskSummaryCache,taskInbox:Object.keys(taskInboxCache||{}),notifications:Object.keys(notificationFilterCache||{}),proxy:proxyAssignmentsCache!==null}}}

// FAST1M6: visual navigation state follows the currently visible app section.
function p5a1SetActiveNav_(key){
  document.querySelectorAll('#app .nav button[data-nav-key]').forEach(function(btn){
    const on=String(btn.dataset.navKey||'')===String(key||'');
    btn.classList.toggle('active',on);
    if(on)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  });
}
function p5a1SyncActiveNav_(){
  const map=[['home','home'],['leaveForm','leave'],['leaves','leaves'],['attendance','attendance'],['inbox','inbox'],['dashboard','dashboard'],['hrCredentialAdmin','hr']];
  for(const pair of map){const el=$(pair[0]);if(el&&!el.classList.contains('hide')){p5a1SetActiveNav_(pair[1]);return pair[1]}}
  return '';
}
function p5a1InstallActiveNavObserver_(){
  const ids=['home','account','recentRecords','leaveForm','leaves','attendance','inbox','notifications','dashboard','hrCredentialAdmin'];
  const obs=new MutationObserver(function(){p5a1SyncActiveNav_()});
  ids.forEach(function(id){const el=$(id);if(el)obs.observe(el,{attributes:true,attributeFilter:['class']})});
  p5a1SyncActiveNav_();
}

const NET_I18N={
  ZH:{transmitting:'資料傳輸中…',doNotRepeat:'請勿關閉頁面或重複操作。',processing:'系統處理中…',slow:'網路較慢，仍在等待伺服器回應…',verySlow:'等待時間較長，系統仍在等候回應；請勿重複送出。',checkingResult:'連線中斷，正在重新確認伺服器狀態…',resultUnknown:'結果尚未確認',unknownDetail:'請勿重複操作；系統正在重新同步目前狀態。',resynced:'狀態已重新同步',resyncedDetail:'請確認畫面上的假單／簽核狀態後再繼續。',stillUnknown:'結果仍未確認',stillUnknownDetail:'請勿重複送出或重複簽核。請重新開啟頁面或按下「重新同步狀態」後再確認。',retrySync:'重新同步狀態',operationFailed:'操作未完成',loadingData:'資料載入中…',loadDone:'資料載入完成',loginSending:'登入驗證中…',pinSending:'PIN 設定資料傳輸中…',checkingProxy:'正在確認代理人狀態…',checkingConflict:'正在確認同時請假與人力重疊…',submittingLeave:'假單資料傳輸中…',submittedLeave:'假單已送出',approvalSending:'簽核資料傳輸中…',approvalDone:'簽核已完成',withdrawSending:'撤回資料傳輸中…',withdrawDone:'撤回已完成',lineSending:'LINE 綁定資料準備中…',cancelled:'已取消，資料未送出',partialLoadFail:'部分背景資料載入失敗',conflictCheckFail:'人力重疊檢查失敗',conflictCheckFailDetail:'送出前系統會再次檢查；目前不可視為「無重疊」。',lineCheckFail:'LINE 狀態檢查失敗',refreshAfterSuccessFail:'操作已完成，但畫面重新整理失敗；請手動重新讀取清單確認。',busy:'前一筆操作尚未完成，請勿重複點擊。',syncing:'正在重新同步畫面資料…',syncDone:'重新同步完成',localLogout:'本機已登出',logoutUnknown:'伺服器登出狀態未確認，但本機登入資料已清除。'},
  VI:{transmitting:'Đang truyền dữ liệu…',doNotRepeat:'Không đóng trang hoặc thao tác lặp lại.',processing:'Hệ thống đang xử lý…',slow:'Mạng chậm, vẫn đang chờ phản hồi máy chủ…',verySlow:'Đang chờ lâu hơn bình thường; không gửi lại thao tác.',checkingResult:'Mất kết nối, đang kiểm tra lại trạng thái máy chủ…',resultUnknown:'Chưa xác nhận được kết quả',unknownDetail:'Không thao tác lặp lại; hệ thống đang đồng bộ lại trạng thái.',resynced:'Đã đồng bộ lại trạng thái',resyncedDetail:'Hãy kiểm tra trạng thái đơn/phê duyệt trên màn hình trước khi tiếp tục.',stillUnknown:'Vẫn chưa xác nhận được kết quả',stillUnknownDetail:'Không gửi lại hoặc phê duyệt lại. Hãy mở lại trang hoặc bấm “Đồng bộ lại trạng thái”.',retrySync:'Đồng bộ lại trạng thái',operationFailed:'Thao tác chưa hoàn tất',loadingData:'Đang tải dữ liệu…',loadDone:'Đã tải dữ liệu',loginSending:'Đang xác minh đăng nhập…',pinSending:'Đang truyền dữ liệu PIN…',checkingProxy:'Đang kiểm tra người thay thế…',checkingConflict:'Đang kiểm tra trùng lịch nghỉ…',submittingLeave:'Đang gửi đơn nghỉ…',submittedLeave:'Đã gửi đơn nghỉ',approvalSending:'Đang gửi dữ liệu phê duyệt…',approvalDone:'Đã hoàn tất phê duyệt',withdrawSending:'Đang gửi yêu cầu rút đơn…',withdrawDone:'Đã rút đơn',lineSending:'Đang chuẩn bị liên kết LINE…',cancelled:'Đã hủy, chưa gửi dữ liệu',partialLoadFail:'Một phần dữ liệu nền tải thất bại',conflictCheckFail:'Kiểm tra trùng nhân lực thất bại',conflictCheckFailDetail:'Hệ thống sẽ kiểm tra lại trước khi gửi; hiện không được xem là “không trùng”.',lineCheckFail:'Kiểm tra trạng thái LINE thất bại',refreshAfterSuccessFail:'Thao tác đã hoàn tất nhưng làm mới màn hình thất bại; hãy tải lại danh sách để kiểm tra.',busy:'Thao tác trước chưa hoàn tất. Không bấm lặp lại.',syncing:'Đang đồng bộ lại dữ liệu màn hình…',syncDone:'Đồng bộ lại hoàn tất',localLogout:'Đã đăng xuất trên thiết bị',logoutUnknown:'Chưa xác nhận đăng xuất phía máy chủ, nhưng dữ liệu đăng nhập cục bộ đã được xóa.'},
  TH:{transmitting:'กำลังส่งข้อมูล…',doNotRepeat:'โปรดอย่าปิดหน้าเว็บหรือทำรายการซ้ำ',processing:'ระบบกำลังประมวลผล…',slow:'เครือข่ายช้า กำลังรอการตอบกลับจากเซิร์ฟเวอร์…',verySlow:'รอนานกว่าปกติ โปรดอย่าส่งรายการซ้ำ',checkingResult:'การเชื่อมต่อขาดหาย กำลังตรวจสอบสถานะกับเซิร์ฟเวอร์อีกครั้ง…',resultUnknown:'ยังยืนยันผลไม่ได้',unknownDetail:'โปรดอย่าทำรายการซ้ำ ระบบกำลังซิงก์สถานะอีกครั้ง',resynced:'ซิงก์สถานะใหม่แล้ว',resyncedDetail:'โปรดตรวจสอบสถานะใบลา/การอนุมัติบนหน้าจอก่อนดำเนินการต่อ',stillUnknown:'ยังยืนยันผลไม่ได้',stillUnknownDetail:'อย่าส่งหรืออนุมัติซ้ำ ให้เปิดหน้าใหม่หรือกด “ซิงก์สถานะอีกครั้ง”',retrySync:'ซิงก์สถานะอีกครั้ง',operationFailed:'รายการยังไม่เสร็จสิ้น',loadingData:'กำลังโหลดข้อมูล…',loadDone:'โหลดข้อมูลแล้ว',loginSending:'กำลังตรวจสอบการเข้าสู่ระบบ…',pinSending:'กำลังส่งข้อมูล PIN…',checkingProxy:'กำลังตรวจสอบผู้แทน…',checkingConflict:'กำลังตรวจสอบการลาซ้ำช่วงเวลา…',submittingLeave:'กำลังส่งใบลา…',submittedLeave:'ส่งใบลาแล้ว',approvalSending:'กำลังส่งข้อมูลอนุมัติ…',approvalDone:'อนุมัติเสร็จแล้ว',withdrawSending:'กำลังส่งคำขอถอนใบลา…',withdrawDone:'ถอนใบลาแล้ว',lineSending:'กำลังเตรียมการเชื่อม LINE…',cancelled:'ยกเลิกแล้ว ยังไม่ได้ส่งข้อมูล',partialLoadFail:'โหลดข้อมูลเบื้องหลังบางส่วนล้มเหลว',conflictCheckFail:'ตรวจสอบกำลังคนซ้ำล้มเหลว',conflictCheckFailDetail:'ระบบจะตรวจอีกครั้งก่อนส่ง ตอนนี้ห้ามถือว่า “ไม่มีรายการซ้ำ”',lineCheckFail:'ตรวจสอบสถานะ LINE ล้มเหลว',refreshAfterSuccessFail:'รายการเสร็จแล้ว แต่รีเฟรชหน้าจอล้มเหลว โปรดโหลดรายการใหม่เพื่อตรวจสอบ',busy:'รายการก่อนหน้ายังไม่เสร็จ โปรดอย่ากดซ้ำ',syncing:'กำลังซิงก์ข้อมูลหน้าจออีกครั้ง…',syncDone:'ซิงก์ข้อมูลเสร็จแล้ว',localLogout:'ออกจากระบบในเครื่องแล้ว',logoutUnknown:'ยังยืนยันการออกจากระบบฝั่งเซิร์ฟเวอร์ไม่ได้ แต่ลบข้อมูลล็อกอินในเครื่องแล้ว'}
};
function tr(k){return (I18N[currentLang]&&I18N[currentLang][k])||I18N.ZH[k]||k}function nt(k){return (NET_I18N[currentLang]&&NET_I18N[currentLang][k])||NET_I18N.ZH[k]||k}function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function apiError_(value,kind){const msg=value&&value.message?value.message:String(value||'Unknown error'),e=new Error(msg);e.kind=kind||'BUSINESS';return e}
function p5a1BootSource_(){return String(ABIS_SERVER_BOOT&&ABIS_SERVER_BOOT.source||'').toUpperCase()}
function p5a1IsLineBoot_(){return p5a1BootSource_().indexOf('LINE')===0}
function p5a1IsLineFastBoot_(){return p5a1BootSource_()==='LINE_FAST'}
function p5a1LineFastWindowValid_(){try{return Number(localStorage.getItem(P5A1_LINE_FAST_UNTIL_KEY)||0)>Date.now()}catch(e){return false}}
function p5a1ClearLineFast_(){try{localStorage.removeItem(P5A1_LINE_FAST_UNTIL_KEY)}catch(e){}}

// P5A1-RM RM-02B2: open the employee service directly at the requested Rich Menu destination.
// Navigation only. No approval/reject/payroll mutation can be triggered by this route value.
let p5rmBootRouteApplied_=false;
function p5rmBootRoute_(){
  const route=String(ABIS_SERVER_BOOT&&ABIS_SERVER_BOOT.route||'').trim().toLowerCase();
  return ['home','leave','leaves','attendance','payroll','inbox','account'].includes(route)?route:'home';
}
// P5A25_R2_FULL_INDEX_20261003
function p5a25R29BootContext_(){const c=ABIS_SERVER_BOOT&&ABIS_SERVER_BOOT.routeContext;return c&&typeof c==='object'&&c.routeKind?c:null}
function p5a25R29CloseOverlay_(id){const el=$(id);if(el)el.remove()}
function p5a25R29CorrectionType_(ctx,d){let t=String(ctx&&ctx.correctionType||'').toUpperCase();if(t==='AUTO_SINGLE_PUNCH'){if(d&&d.missingIn&&!d.missingOut)t='MISSING_IN';else if(d&&d.missingOut&&!d.missingIn)t='MISSING_OUT';else t='MISSING_BOTH'}return ['MISSING_IN','MISSING_OUT','MISSING_BOTH','WRONG_IN','WRONG_OUT','SHIFT_SCHEDULE','OTHER'].includes(t)?t:'OTHER'}
async function p5a25R29OpenEmployeeCorrection_(ctx){const date=String(ctx&&ctx.date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){message('Deep Link 日期無效。','warning');return}await openAttendanceDate_(encodeURIComponent(date));const days=attendanceCache&&Array.isArray(attendanceCache.days)?attendanceCache.days:[],key=String(ctx.attendanceKey||''),d=days.find(x=>key&&String(x.attendanceKey||'')===key)||days.find(x=>String(x.date||'')===date);if(!d){message('找不到此日期的出勤資料。','warning');return}if(d.activeCorrection||ctx.existingCorrectionId){message(c2t('existing'),'warning');rc2ApplyAttendanceFocus_();return}if(!d.correctionEnabled){message(c2t('notAvailable'),'warning');return}openAttendanceCorrection_(encodeURIComponent(String(d.attendanceKey||'')));const focus=$('attendanceCorrectionOverlay');if(focus){focus.classList.add('r2-deeplink-focus');const back=focus.querySelector('.confirm-actions .secondary');if(back)back.textContent=currentLang==='VI'?'Quay lại':currentLang==='TH'?'กลับ':'返回'}const type=$('attCorrType');if(type){type.value=p5a25R29CorrectionType_(ctx,d);p5a202CorrectionToggle_()}const reason=$('attCorrReason');if(reason&&!reason.value)reason.placeholder=currentLang==='VI'?'Vui lòng nhập lý do điều chỉnh':currentLang==='TH'?'กรุณาระบุเหตุผลการแก้ไข':'請簡要填寫補正原因'}
async function p5a25R29OpenFollowupCase_(encodedKey,encodedType,encodedDate){p5a25R29CloseOverlay_('r2FollowupOverlay');return p5a25R29OpenEmployeeCorrection_({attendanceKey:decodeURIComponent(encodedKey||''),correctionType:decodeURIComponent(encodedType||''),date:decodeURIComponent(encodedDate||'')})}
async function p5a25R29OpenMyFollowup_(){const data=await call('attendanceUnifiedMyFollowupR2Live',{sessionToken});p5a25R29CloseOverlay_('r2FollowupOverlay');const overlay=document.createElement('div');overlay.id='r2FollowupOverlay';overlay.className='confirm-backdrop';const rows=Array.isArray(data&&data.rows)?data.rows:[];const cards=rows.map(x=>{const canOpen=!x.existingCorrectionId;return `<div class="att-work-card"><b>${escapeHtml(x.date||'')}｜${escapeHtml(x.status||'')}</b><div class="tiny">${escapeHtml(x.exceptionCode||'')}${x.existingCorrectionStatus?`｜${escapeHtml(x.existingCorrectionStatus)}`:''}</div>${canOpen?`<button type="button" class="secondary small" onclick="p5a25R29OpenFollowupCase_('${encodeURIComponent(String(x.attendanceKey||''))}','${encodeURIComponent(String(x.correctionType||''))}','${encodeURIComponent(String(x.date||''))}')">${currentLang==='VI'?'Điều chỉnh':currentLang==='TH'?'แก้ไข':'立即補正'}</button>`:`<div class="tiny muted">${escapeHtml(c2t('existing'))}</div>`}</div>`}).join('');overlay.innerHTML=`<div class="confirm-dialog" style="max-width:620px;max-height:86vh;overflow:auto"><h2>${currentLang==='VI'?'Chấm công cần xử lý':currentLang==='TH'?'รายการลงเวลาที่ต้องดำเนินการ':'出勤待處理'}</h2><div class="notice tiny">${currentLang==='VI'?'Thiếu chấm công':currentLang==='TH'?'ขาดการลงเวลา':'缺卡'}：${Number(data.missingCardDays||0)} ${currentLang==='ZH'?'天':''}　${currentLang==='VI'?'Bất thường khác':currentLang==='TH'?'ความผิดปกติอื่น':'其他出勤異常'}：${Number(data.otherAbnormalDays||0)} ${currentLang==='ZH'?'天':''}</div>${cards||`<div class="muted">${currentLang==='VI'?'Không có mục cần xử lý':currentLang==='TH'?'ไม่มีรายการที่ต้องดำเนินการ':'目前沒有待處理出勤異常'}</div>`}<div class="confirm-actions"><button type="button" onclick="p5a25R29CloseOverlay_('r2FollowupOverlay')">${escapeHtml(c2t('cancel'))}</button></div></div>`;document.body.appendChild(overlay)}
async function p5a25R29OpenManagementCase_(encodedEmployeeId,encodedDate){const employeeId=decodeURIComponent(String(encodedEmployeeId||'')),date=decodeURIComponent(String(encodedDate||''));p5a25R29CloseOverlay_('r2SiteDetailOverlay');await refreshLegacyInbox_('');requestAnimationFrame(()=>{const cards=[...document.querySelectorAll('.att-work-card')],target=cards.find(el=>el.innerText.includes(String(employeeId||''))&&el.innerText.includes(String(date||'')));if(target){target.classList.add('rc2-focus-target');try{target.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){target.scrollIntoView()};setTimeout(()=>target.classList.remove('rc2-focus-target'),1800)}})}
async function p5a25R29OpenSiteDetail_(ctx){const data=await call('attendanceUnifiedSiteDetail',{sessionToken,date:ctx.date,scopeCode:ctx.scopeValue});p5a25R29CloseOverlay_('r2SiteDetailOverlay');const overlay=document.createElement('div');overlay.id='r2SiteDetailOverlay';overlay.className='confirm-backdrop';const rows=Array.isArray(data&&data.rows)?data.rows:[];const cards=rows.map(x=>{const leave=x.leave?`<div class="tiny">請假：${escapeHtml(x.leave.leaveType||'')}｜${Number(x.leave.leaveHours||0)} HR｜${Number(x.leave.leaveDays||0)} 天<br>代理人：${escapeHtml(x.leave.proxyName||x.leave.proxyId||'-')}</div>`:'';const corr=x.correction?`<button type="button" class="secondary small" onclick="p5a25R29OpenManagementCase_('${encodeURIComponent(String(x.employeeId||''))}','${encodeURIComponent(String(x.date||''))}')">查看／審核補正</button>`:(x.exceptionCodes&&x.exceptionCodes.length?`<div class="tiny muted">待員工提出補正</div>`:'');return `<div class="att-work-card"><div><b>${escapeHtml(x.name||'')}（${escapeHtml(x.employeeId||'')}）</b> <span class="pill">${escapeHtml(x.status||'')}</span></div><div class="tiny">${escapeHtml(x.date||'')}｜${escapeHtml(x.shiftName||x.shiftCode||'-')}<br>應打卡：${escapeHtml(x.expectedStart||'-')}–${escapeHtml(x.expectedEnd||'-')}<br>實際打卡：${escapeHtml(x.firstIn||'--')} / ${escapeHtml(x.lastOut||'--')}</div>${leave}${corr}</div>`}).join('');overlay.innerHTML=`<div class="confirm-dialog" style="max-width:720px;max-height:88vh;overflow:auto"><h2>${escapeHtml(data.scopeLabel||'')}｜${escapeHtml(data.date||'')} 出勤明細</h2>${cards||'<div class="muted">本日無異常或請假明細</div>'}<div class="confirm-actions"><button type="button" onclick="p5a25R29CloseOverlay_('r2SiteDetailOverlay')">關閉</button></div></div>`;document.body.appendChild(overlay)}
async function p5a25R29ApplyBootRouteContext_(){const ctx=p5a25R29BootContext_();if(!ctx)return false;try{const kind=String(ctx.routeKind||'').toUpperCase();if(kind==='EMPLOYEE_CORRECTION'){await p5a25R29OpenEmployeeCorrection_(ctx);return true}if(kind==='EMPLOYEE_FOLLOWUP'){await p5a25R29OpenMyFollowup_();return true}if(kind==='MANAGEMENT_SITE_DAY'){await p5a25R29OpenSiteDetail_(ctx);return true}if(kind==='MANAGEMENT_CASE'){await p5a25R29OpenManagementCase_(encodeURIComponent(String(ctx.subjectEmployeeId||'')),encodeURIComponent(String(ctx.date||'')));return true}return false}catch(e){message(e&&e.message?e.message:String(e),'warning');return false}}
function p5rmApplyBootRoute_(){
  if(p5rmBootRouteApplied_){showHome();return}
  p5rmBootRouteApplied_=true;
  if(p5a25R29BootContext_()){p5a25R29ApplyBootRouteContext_();return}
  const route=p5rmBootRoute_();
  if(route==='leave'){showLeaveForm();return}
  if(route==='leaves'){refreshLeaves();return}
  if(route==='attendance'){refreshMyAttendance();return}
  if(route==='inbox'){refreshInbox();return}
  if(route==='account'){accountPanel_='';showMyAccount_();return}
  // payroll is reserved for the future payroll module; until that page exists, fall back safely to Home.
  showHome();
}
function p5a1IsLineSessionExpiryError_(e){if(!p5a1IsLineBoot_())return false;const msg=String(e&&e.message?e.message:e||'');return /LINE 登入已閒置逾時|登入已逾時|登入已失效|LINE 綁定已失效/.test(msg)}
function p5a1SaveLineTimeoutDraft_(){try{const form=$('leaveForm');if(!form||form.classList.contains('hide'))return false;const employeeId=String((homeData&&homeData.employee&&homeData.employee.id)||ABIS_SERVER_BOOT.employeeId||rememberedEmployeeId||'').toUpperCase();if(!employeeId)return false;localStorage.setItem(P5A1_LINE_TIMEOUT_DRAFT_KEY,JSON.stringify({employeeId:employeeId,savedAt:Date.now(),returnedEditLeaveId:String(returnedEditLeaveId||''),leave:currentLeaveDraft()}));return true}catch(e){return false}}
function p5a1FullLiffUrl_(){const route=encodeURIComponent(p5rmBootRoute_());return P5A1_LIFF_ENTRY_URL+'/?route='+route+'&force=1'}
function p5a1RedirectToFullLiff_(){p5a1ClearLineFast_();const url=p5a1FullLiffUrl_();try{window.location.replace(url)}catch(e){window.location.href=url}}
function p5a1ShowLineReauthGate_(){if(document.getElementById('p5a1LineReauthGate'))return;const title=currentLang==='VI'?'Phiên LINE đã hết hạn':currentLang==='TH'?'เซสชัน LINE หมดอายุ':'LINE 登入已逾時';const body=currentLang==='VI'?'Nhấn nút bên dưới để xác minh lại danh tính LINE. Nội dung đơn chưa gửi sẽ được khôi phục sau khi xác minh.':currentLang==='TH'?'กดปุ่มด้านล่างเพื่อยืนยันตัวตน LINE ใหม่ หลังยืนยันแล้ว ระบบจะกู้คืนข้อมูลใบลาที่ยังไม่ได้ส่ง':'請重新驗證 LINE 身分。驗證完成後，尚未送出的請假內容會自動復原。';const button=currentLang==='VI'?'Xác minh lại LINE':currentLang==='TH'?'ยืนยัน LINE ใหม่':'重新驗證 LINE 身分';const gate=document.createElement('div');gate.id='p5a1LineReauthGate';gate.className='line-reauth-gate';gate.innerHTML=`<div class="line-reauth-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p><a class="line-auth-link" href="${escapeHtml(p5a1FullLiffUrl_())}" target="_top">${escapeHtml(button)}</a></div>`;document.body.appendChild(gate)}
function p5a1StartLineReauth_(e){if(p5a1LineReauthStarted||!p5a1IsLineSessionExpiryError_(e))return false;p5a1LineReauthStarted=true;p5a1SaveLineTimeoutDraft_();try{localStorage.removeItem('abis_session')}catch(ignore){}p5a1ClearLineFast_();sessionToken='';if(p5a1IsLineFastBoot_()){p5a1RedirectToFullLiff_();return true}p5a1ShowLineReauthGate_();return true}
function call(action,payload){
  const busyTicket=(typeof abisAsyncBeginRpcForRecentClick_==='function')?abisAsyncBeginRpcForRecentClick_(action):null;
  const p=new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>{if(r&&r.ok){resolve(r.data);return}const e=apiError_(r&&r.error?r.error:'系統未回傳成功狀態','BUSINESS');p5a1StartLineReauth_(e);reject(e)}).withFailureHandler(e=>reject(apiError_(e,'TRANSPORT'))).api(action,payload||{}));
  if(!busyTicket)return p;
  return p.finally(()=>{try{abisAsyncReleaseBusy_(busyTicket)}catch(ignore){}});
}

function p5a109Text_(k){const zh={title:'請假附件',hint:'可上傳圖片或 PDF；最多 3 個，每個 8MB。附件會跟隨草稿跨裝置保存。',upload:'上傳附件',none:'尚未上傳附件',remove:'移除',deleting:'正在移除附件…',uploading:'附件上傳中…',tooMany:'草稿附件最多 3 個',needFile:'請先選擇附件',deleteConfirm:'確定移除此草稿附件？',uploadDone:'附件已保存到草稿',deleteDone:'草稿附件已移除'};const vi={title:'Tệp đính kèm đơn nghỉ',hint:'Ảnh hoặc PDF; tối đa 3 tệp, mỗi tệp 8MB. Tệp được lưu cùng bản nháp trên các thiết bị.',upload:'Tải tệp lên',none:'Chưa có tệp',remove:'Xóa',deleting:'Đang xóa tệp đính kèm…',uploading:'Đang tải tệp…',tooMany:'Tối đa 3 tệp cho bản nháp',needFile:'Hãy chọn tệp trước',deleteConfirm:'Xóa tệp khỏi bản nháp?',uploadDone:'Đã lưu tệp vào bản nháp',deleteDone:'Đã xóa tệp khỏi bản nháp'};const th={title:'ไฟล์แนบใบลา',hint:'รองรับรูปภาพหรือ PDF สูงสุด 3 ไฟล์ ไฟล์ละ 8MB และบันทึกตามร่างข้ามอุปกรณ์',upload:'อัปโหลดไฟล์',none:'ยังไม่มีไฟล์แนบ',remove:'ลบ',deleting:'กำลังลบไฟล์แนบ…',uploading:'กำลังอัปโหลด…',tooMany:'ร่างแนบไฟล์ได้สูงสุด 3 ไฟล์',needFile:'โปรดเลือกไฟล์ก่อน',deleteConfirm:'ลบไฟล์แนบนี้ออกจากร่างหรือไม่?',uploadDone:'บันทึกไฟล์ไว้กับร่างแล้ว',deleteDone:'ลบไฟล์จากร่างแล้ว'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[k]||k}
function p5a109RenderDraftAttachments_(){const box=$('draftAttachmentBox'),list=$('draftAttachmentList'),title=$('draftAttachmentTitle'),hint=$('draftAttachmentHint'),btn=$('draftAttachmentUploadBtn');if(title)title.textContent=p5a109Text_('title');if(hint)hint.textContent=p5a109Text_('hint');if(btn)btn.textContent=p5a109AttachmentBusy?p5a109Text_('uploading'):p5a109Text_('upload');if(!list)return;if(!p5a109DraftAttachments.length){list.innerHTML=`<span class="muted">${escapeHtml(p5a109Text_('none'))}</span>`;return}list.innerHTML=p5a109DraftAttachments.map(x=>`<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px;flex-wrap:wrap"><span>${escapeHtml(x.name||x.attachmentId||'')}</span><span style="display:flex;gap:6px"><button type="button" class="secondary small" onclick="p5a110AccessAttachment_('${escapeHtml(x.attachmentId||'')}','VIEW',this)">${escapeHtml(p5a110Text_('view'))}</button><button type="button" class="secondary small" onclick="p5a110AccessAttachment_('${escapeHtml(x.attachmentId||'')}','DOWNLOAD',this)">${escapeHtml(p5a110Text_('download'))}</button><button type="button" class="secondary small" onclick="p5a109DeleteDraftAttachment_('${escapeHtml(x.attachmentId||'')}',this)">${escapeHtml(p5a109Text_('remove'))}</button></span></div>`).join('')}
function p5a109ResetAttachments_(){p5a109DraftAttachments=[];p5a109AttachmentBusy=false;const input=$('draftAttachmentFiles');if(input)input.value='';p5a109RenderDraftAttachments_()}
async function p5a109LoadDraftAttachments_(){if(!sessionToken||!p5a108DraftId){p5a109ResetAttachments_();return[]}try{const r=await call('listDraftAttachments',{sessionToken,draftId:p5a108DraftId});p5a109DraftAttachments=Array.isArray(r&&r.files)?r.files:[];p5a109RenderDraftAttachments_();return p5a109DraftAttachments}catch(e){if(!p5a1LineReauthStarted)message(e&&e.message?e.message:String(e),'warning');return[]}}
async function p5a109EnsureDraftForAttachment_(){if(p5a108DraftConflict)return false;if(!p5a108DraftId){p5a108DraftDirty=true;const ok=await p5a108SaveDraftNow_(false);if(!ok||!p5a108DraftId)return false}else if(p5a108DraftDirty){const ok=await p5a108SaveDraftNow_(false);if(!ok)return false}return true}
function p5a109FileBase64_(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||'').split(',').pop()||'');reader.onerror=()=>reject(new Error(file.name||'FileReader error'));reader.readAsDataURL(file)})}
async function p5a109UploadDraftAttachments_(){if(returnedEditLeaveId)return;const input=$('draftAttachmentFiles'),files=Array.from(input&&input.files||[]);if(!files.length){message(p5a109Text_('needFile'),'warning');return}if(p5a109DraftAttachments.length+files.length>3){message(p5a109Text_('tooMany'),'warning');return}if(p5a109AttachmentBusy)return;const op=beginOperation_(p5a109Text_('uploading'),nt('doNotRepeat'));p5a109AttachmentBusy=true;p5a109RenderDraftAttachments_();try{if(!await p5a109EnsureDraftForAttachment_()){finishOperationFailure_(op,new Error(p5a108DraftText_('saveFail')));return}const payload=[];for(const f of files){if(f.size>8*1024*1024)throw new Error(`${f.name} 超過 8MB`);payload.push({name:f.name,mimeType:f.type||'application/octet-stream',base64:await p5a109FileBase64_(f)})}const r=await call('uploadDraftAttachments',{sessionToken,draftId:p5a108DraftId,files:payload,uploadBatchId:'DA-'+Date.now()+'-'+p4a13Uuid_()});p5a109DraftAttachments=Array.isArray(r&&r.files)?r.files:[];if(input)input.value='';finishOperationSuccess_(op,p5a109Text_('uploadDone'),`${files.length}`);message(p5a109Text_('uploadDone'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning')}finally{p5a109AttachmentBusy=false;p5a109RenderDraftAttachments_()}}
async function p5a109DeleteDraftAttachment_(attachmentId,triggerBtn){if(!attachmentId||p5a109AttachmentBusy||!p5a108DraftId)return;if(!confirm(p5a109Text_('deleteConfirm')))return;const op=beginOperation_(p5a109Text_('deleting'),nt('doNotRepeat'),triggerBtn);p5a109AttachmentBusy=true;const list=$('draftAttachmentList');if(list)list.querySelectorAll('button').forEach(btn=>{if(btn!==triggerBtn)btn.disabled=true});try{const r=await call('deleteDraftAttachment',{sessionToken,draftId:p5a108DraftId,attachmentId});p5a109DraftAttachments=Array.isArray(r&&r.files)?r.files:[];finishOperationSuccess_(op,p5a109Text_('deleteDone'),'');message(p5a109Text_('deleteDone'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning')}finally{p5a109AttachmentBusy=false;p5a109RenderDraftAttachments_()}}
function p5a110Text_(k){const zh={view:'查看',download:'下載',close:'關閉',loading:'正在讀取附件…',failed:'附件讀取失敗',viewWorking:'正在驗證權限並讀取附件…',downloadWorking:'正在準備下載附件…',viewDone:'附件已讀取',downloadDone:'附件下載已開始',buttonWorking:'處理中…',pdfHint:'Chrome 安全限制下，PDF 不在此頁內嵌顯示。請點下方按鈕在新分頁開啟。',pdfOpen:'在新分頁開啟 PDF'};const vi={view:'Xem',download:'Tải xuống',close:'Đóng',loading:'Đang đọc tệp…',failed:'Không thể đọc tệp',viewWorking:'Đang xác minh quyền và đọc tệp…',downloadWorking:'Đang chuẩn bị tải tệp…',viewDone:'Đã đọc tệp',downloadDone:'Đã bắt đầu tải tệp',buttonWorking:'Đang xử lý…',pdfHint:'Do giới hạn bảo mật của Chrome, PDF không được nhúng trong trang này. Hãy mở PDF trong tab mới.',pdfOpen:'Mở PDF trong tab mới'};const th={view:'ดู',download:'ดาวน์โหลด',close:'ปิด',loading:'กำลังอ่านไฟล์…',failed:'อ่านไฟล์ไม่สำเร็จ',viewWorking:'กำลังตรวจสอบสิทธิ์และอ่านไฟล์…',downloadWorking:'กำลังเตรียมดาวน์โหลดไฟล์…',viewDone:'อ่านไฟล์แล้ว',downloadDone:'เริ่มดาวน์โหลดไฟล์แล้ว',buttonWorking:'กำลังดำเนินการ…',pdfHint:'เนื่องจากข้อจำกัดด้านความปลอดภัยของ Chrome ระบบจะไม่ฝัง PDF ในหน้านี้ โปรดเปิดในแท็บใหม่',pdfOpen:'เปิด PDF ในแท็บใหม่'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[k]||k}
let p5a110ViewerUrl_='';
function p5a110Base64Blob_(base64,mime){const raw=atob(String(base64||'')),len=raw.length,arr=new Uint8Array(len);for(let i=0;i<len;i++)arr[i]=raw.charCodeAt(i);return new Blob([arr],{type:mime||'application/octet-stream'})}
function p5a110CloseViewer_(){const modal=$('p5a110AttachmentViewer'),body=$('p5a110AttachmentViewerBody');if(modal)modal.classList.add('hide');if(body)body.innerHTML='';if(p5a110ViewerUrl_){try{URL.revokeObjectURL(p5a110ViewerUrl_)}catch(e){}p5a110ViewerUrl_=''}}
async function p5a110AccessAttachment_(attachmentId,action,triggerBtn){if(!attachmentId||!sessionToken)return;const act=String(action||'VIEW').toUpperCase(),workingText=act==='DOWNLOAD'?p5a110Text_('downloadWorking'):p5a110Text_('viewWorking'),doneText=act==='DOWNLOAD'?p5a110Text_('downloadDone'):p5a110Text_('viewDone'),originalBtnText=triggerBtn?triggerBtn.textContent:'';const op=beginOperation_(workingText,nt('doNotRepeat'));if(triggerBtn){triggerBtn.disabled=true;triggerBtn.textContent=p5a110Text_('buttonWorking')}let body=null,modal=null,title=null;if(act==='VIEW'){modal=$('p5a110AttachmentViewer');body=$('p5a110AttachmentViewerBody');title=$('p5a110AttachmentViewerTitle');if(title)title.textContent=p5a110Text_('loading');if(body)body.innerHTML=`<div class="muted">${escapeHtml(p5a110Text_('loading'))}</div>`;if(modal)modal.classList.remove('hide')}try{const r=await call('getAttachmentContent',{sessionToken,attachmentId,action:act});const blob=p5a110Base64Blob_(r&&r.base64,r&&r.mimeType),url=URL.createObjectURL(blob),name=String(r&&r.name||'attachment');if(act==='DOWNLOAD'){const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);finishOperationSuccess_(op,doneText,name);return}if(p5a110ViewerUrl_)try{URL.revokeObjectURL(p5a110ViewerUrl_)}catch(ignore){}p5a110ViewerUrl_=url;if(title)title.textContent=name;if(body){const mime=String(r&&r.mimeType||'');if(mime.indexOf('image/')===0){body.innerHTML=`<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" style="display:block;max-width:100%;max-height:72vh;margin:auto">`}else if(mime==='application/pdf'){body.innerHTML=`<div class="notice" style="margin-bottom:12px">${escapeHtml(p5a110Text_('pdfHint'))}</div><a class="secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none">${escapeHtml(p5a110Text_('pdfOpen'))}</a>`}else{body.innerHTML=`<div class="notice">${escapeHtml(name)}</div><a class="secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none">${escapeHtml(p5a110Text_('view'))}</a>`}}finishOperationSuccess_(op,doneText,name)}catch(e){if(act==='VIEW')p5a110CloseViewer_();finishOperationFailure_(op,e);message(e&&e.message?e.message:p5a110Text_('failed'),'warning')}finally{if(triggerBtn&&triggerBtn.isConnected){triggerBtn.disabled=false;triggerBtn.textContent=originalBtnText}}}
function p5a108DraftText_(k){const zh={saved:'草稿已儲存',saving:'草稿儲存中…',restored:'已恢復未送出的請假草稿',conflict:'其他裝置已有較新的草稿版本',loadLatest:'其他裝置已有較新的草稿。是否載入最新版本？目前畫面尚未覆寫伺服器資料。',saveFail:'草稿自動儲存失敗',syncBeforeSubmit:'正在同步草稿…',discard:'放棄草稿',discardConfirm:'確定放棄這份未送出的請假草稿？尚未送出的草稿附件也會一併刪除。',discarding:'正在放棄草稿…',discardDone:'草稿已放棄',discardConflict:'草稿已有較新的版本。請先載入最新版後，再重新按「放棄草稿」。',discardMissing:'目前沒有可放棄的草稿',inactiveLatest:'這份草稿已在其他視窗完成、放棄或失效。按「確定」後將同步伺服器狀態並清空目前舊草稿畫面。',inactiveSynced:'草稿狀態已同步，舊草稿畫面已清除'};const vi={saved:'Đã lưu bản nháp',saving:'Đang lưu bản nháp…',restored:'Đã khôi phục bản nháp nghỉ chưa gửi',conflict:'Thiết bị khác có bản nháp mới hơn',loadLatest:'Thiết bị khác có bản nháp mới hơn. Tải phiên bản mới nhất?',saveFail:'Tự động lưu bản nháp thất bại',syncBeforeSubmit:'Đang đồng bộ bản nháp…',discard:'Bỏ bản nháp',discardConfirm:'Bạn có chắc muốn bỏ bản nháp đơn nghỉ chưa gửi này? Các tệp đính kèm nháp chưa gửi cũng sẽ bị xóa.',discarding:'Đang bỏ bản nháp…',discardDone:'Đã bỏ bản nháp',discardConflict:'Có phiên bản bản nháp mới hơn. Hãy tải phiên bản mới nhất rồi bấm “Bỏ bản nháp” lại.',discardMissing:'Không có bản nháp để bỏ',inactiveLatest:'Bản nháp này đã được hoàn tất, hủy hoặc mất hiệu lực ở cửa sổ khác. Nhấn OK để đồng bộ trạng thái máy chủ và xóa màn hình bản nháp cũ.',inactiveSynced:'Đã đồng bộ trạng thái bản nháp và xóa màn hình bản nháp cũ'};const th={saved:'บันทึกร่างแล้ว',saving:'กำลังบันทึกร่าง…',restored:'กู้คืนร่างใบลาที่ยังไม่ได้ส่งแล้ว',conflict:'อุปกรณ์อื่นมีร่างที่ใหม่กว่า',loadLatest:'อุปกรณ์อื่นมีร่างที่ใหม่กว่า ต้องการโหลดเวอร์ชันล่าสุดหรือไม่?',saveFail:'บันทึกร่างอัตโนมัติล้มเหลว',syncBeforeSubmit:'กำลังซิงก์ร่าง…',discard:'ยกเลิกร่าง',discardConfirm:'ยืนยันยกเลิกร่างใบลาที่ยังไม่ได้ส่งนี้หรือไม่? ไฟล์แนบร่างที่ยังไม่ได้ส่งจะถูกลบด้วย',discarding:'กำลังยกเลิกร่าง…',discardDone:'ยกเลิกร่างแล้ว',discardConflict:'มีร่างเวอร์ชันใหม่กว่า โปรดโหลดเวอร์ชันล่าสุด แล้วกด “ยกเลิกร่าง” อีกครั้ง',discardMissing:'ไม่มีร่างที่ยกเลิกได้',inactiveLatest:'ร่างนี้ถูกดำเนินการเสร็จ ยกเลิก หรือหมดอายุในหน้าต่างอื่นแล้ว กดตกลงเพื่อซิงก์สถานะจากเซิร์ฟเวอร์และล้างหน้าร่างเก่า',inactiveSynced:'ซิงก์สถานะร่างแล้ว และล้างหน้าร่างเก่าเรียบร้อย'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[k]||k}
function p5a108SetDraftStatus_(text,kind){const el=$('leaveDraftStatus');if(!el)return;el.textContent=text||'';el.classList.toggle('hide',!text);el.style.color=kind==='error'?'#b91c1c':kind==='warning'?'#92400e':''}
function p5a108UpdateDiscardButton_(){const btn=$('discardLeaveDraftBtn');if(!btn)return;btn.textContent=p5a108DraftText_('discard');btn.classList.toggle('hide',!p5a108DraftId||!!returnedEditLeaveId)}
function p5a108ResetDraftState_(){clearTimeout(p5a108DraftTimer);p5a108DraftTimer=null;p5a108DraftId='';p5a108DraftVersion=0;p5a108DraftDirty=false;p5a108DraftInFlight=false;p5a108DraftConflict=false;p5a108SetDraftStatus_('', '');p5a109ResetAttachments_();p5a108UpdateDiscardButton_()}
function p5a108ApplyDraftPayload_(d){d=d||{};$('leaveType').value=d.leaveTypeCode||$('leaveType').value||'';refreshApplicationModes();if(d.applicationType)$('applicationType').value=d.applicationType;toggleTimeFields();$('startDate').value=d.startDate||'';$('endDate').value=d.endDate||d.startDate||'';$('startTime').value=d.startTime||'';$('endTime').value=d.endTime||'';fillProxyCandidates();if(!$('proxyId').disabled)$('proxyId').value=d.proxyEmployeeId||'';$('handover').value=d.handover||'';$('reason').value=d.reason||'';$('attachmentUrl').value=d.attachmentUrl||'';$('emergency').checked=!!d.emergency;scheduleDepartmentConflictCheck()}
function p5a108AdoptServerDraft_(draft,apply){if(!draft){p5a108DraftId='';p5a108DraftVersion=0;p5a108DraftConflict=false;p5a108UpdateDiscardButton_();return}p5a108DraftId=String(draft.draftId||'');p5a108DraftVersion=Number(draft.version||0);p5a108DraftConflict=false;p5a108DraftDirty=false;if(apply)p5a108ApplyDraftPayload_(draft.payload||{});p5a108SetDraftStatus_(`${p5a108DraftText_('saved')} · v${p5a108DraftVersion}`,'');p5a108UpdateDiscardButton_()}
async function p5a108LoadDraft_(notify){if(!sessionToken||returnedEditLeaveId||!homeData||!homeData.canSubmitLeave)return null;const seq=++p5a108DraftLoadSeq;try{const r=await call('getLeaveDraft',{sessionToken,formType:P5A1_LEAVE_DRAFT_FORM_TYPE});if(seq!==p5a108DraftLoadSeq)return null;if(r&&r.draft){p5a108AdoptServerDraft_(r.draft,true);await p5a109LoadDraftAttachments_();if(notify)message(p5a108DraftText_('restored'),'success');return r.draft}p5a108ResetDraftState_();return null}catch(e){if(!p5a1LineReauthStarted)message(e&&e.message?e.message:String(e),'warning');return null}}
function p5a108ScheduleSave_(important){if(returnedEditLeaveId||!sessionToken||!homeData||!homeData.canSubmitLeave||p5a108DraftConflict)return;p5a108DraftDirty=true;clearTimeout(p5a108DraftTimer);p5a108DraftTimer=setTimeout(function(){p5a108SaveDraftNow_(true)},important?1200:P5A1_LEAVE_DRAFT_AUTOSAVE_MS)}
async function p5a108SaveDraftNow_(silent){if(returnedEditLeaveId||!p5a108DraftDirty||p5a108DraftInFlight||!sessionToken)return !p5a108DraftConflict;p5a108DraftInFlight=true;clearTimeout(p5a108DraftTimer);p5a108DraftTimer=null;p5a108SetDraftStatus_(p5a108DraftText_('saving'),'');const leave=currentLeaveDraft();try{const r=await call('saveLeaveDraft',{sessionToken,formType:P5A1_LEAVE_DRAFT_FORM_TYPE,draftId:p5a108DraftId,expectedVersion:p5a108DraftVersion,leave});if(r&&r.conflict){p5a108DraftConflict=true;p5a108SetDraftStatus_(p5a108DraftText_('conflict'),'warning');const latest=r.draft||null;if(latest){const latestStatus=String(latest.status||'ACTIVE').toUpperCase();if(latestStatus!=='ACTIVE'){if(confirm(p5a108DraftText_('inactiveLatest'))){p5a108DraftLoadSeq++;p5a108ResetDraftState_();p4a142ResetSubmittedLeaveForm_();message(p5a108DraftText_('inactiveSynced'),'success')}return false}if(confirm(p5a108DraftText_('loadLatest'))){p5a108AdoptServerDraft_(latest,true);await p5a109LoadDraftAttachments_();message(p5a108DraftText_('restored'),'success')}}return false}if(r&&r.draft)p5a108AdoptServerDraft_(r.draft,false);p5a108DraftDirty=false;return true}catch(e){p5a108SetDraftStatus_(p5a108DraftText_('saveFail'),'warning');if(!silent&&!p5a1LineReauthStarted)message(e&&e.message?e.message:String(e),'warning');return false}finally{p5a108DraftInFlight=false}}
async function p5a108FlushDraft_(){if(returnedEditLeaveId)return true;clearTimeout(p5a108DraftTimer);p5a108DraftTimer=null;if(!p5a108DraftDirty)return !p5a108DraftConflict;p5a108SetDraftStatus_(p5a108DraftText_('syncBeforeSubmit'),'');return await p5a108SaveDraftNow_(false)}
async function p5a108DiscardLeaveDraft_(triggerBtn){if(returnedEditLeaveId)return;if(!p5a108DraftId){message(p5a108DraftText_('discardMissing'),'warning');p5a108UpdateDiscardButton_();return}if(mutationBusy){message(nt('busy'),'warning');return}if(p5a108DraftInFlight){message(p5a108DraftText_('saving'),'warning');return}if(p5a108DraftConflict){message(p5a108DraftText_('discardConflict'),'warning');return}if(!confirm(p5a108DraftText_('discardConfirm')))return;mutationBusy=true;setAreaBusy_('leaveForm',true);const draftId=p5a108DraftId,expectedVersion=p5a108DraftVersion,op=beginOperation_(p5a108DraftText_('discarding'),nt('doNotRepeat'),triggerBtn);let completed=false;try{const r=await call('discardLeaveDraft',{sessionToken,draftId:draftId,expectedVersion:p5a108DraftVersion});if(r&&r.conflict){p5a108DraftConflict=true;p5a108SetDraftStatus_(p5a108DraftText_('conflict'),'warning');if(r.draft&&confirm(p5a108DraftText_('loadLatest'))){p5a108AdoptServerDraft_(r.draft,true);await p5a109LoadDraftAttachments_();message(p5a108DraftText_('restored'),'success')}throw new Error(p5a108DraftText_('discardConflict'))}if(!r||(!r.discarded&&!r.alreadyInactive))throw new Error(p5a108DraftText_('discardMissing'));completed=true}catch(e){const uncertain=!!(e&&e.kind==='TRANSPORT');if(uncertain){updateOperation_(op,nt('checkingResult'),nt('unknownDetail'),'warning');try{const state=await call('getLeaveDraft',{sessionToken,formType:P5A1_LEAVE_DRAFT_FORM_TYPE});const active=state&&state.draft?state.draft:null;if(!active||String(active.draftId||'')!==String(draftId)){completed=true}else if(Number(active.version||0)!==Number(expectedVersion||0)){p5a108AdoptServerDraft_(active,true);await p5a109LoadDraftAttachments_();p5a108DraftConflict=false;throw new Error(p5a108DraftText_('discardConflict'))}}catch(recheck){if(recheck&&recheck.message===p5a108DraftText_('discardConflict')){e=recheck}else{mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationUnknown_(op,nt('stillUnknown'),nt('stillUnknownDetail'),true);return}}}if(!completed){mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning');return}}if(completed){p5a108DraftLoadSeq++;p5a108ResetDraftState_();p4a142ResetSubmittedLeaveForm_();mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationSuccess_(op,p5a108DraftText_('discardDone'),'');message(p5a108DraftText_('discardDone'),'success')}}
function p5a108InstallDraftListeners_(){const important=new Set(['leaveType','applicationType','startDate','endDate','startTime','endTime','proxyId','emergency']);['leaveType','applicationType','startDate','endDate','startTime','endTime','proxyId','handover','reason','attachmentUrl','emergency'].forEach(id=>{const el=$(id);if(!el)return;const event=(el.tagName==='TEXTAREA'||id==='attachmentUrl')?'input':'change';el.addEventListener(event,function(){p5a108ScheduleSave_(important.has(id))})});document.addEventListener('visibilitychange',function(){if(document.hidden&&p5a108DraftDirty&&!returnedEditLeaveId)p5a108SaveDraftNow_(true)})}
const P4A13_SUBMIT_PENDING_KEY='abis_p4a13_pending_submit_v1';
function p4a13Uuid_(){try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return String(Date.now())+'-'+Math.random().toString(16).slice(2)+'-'+Math.random().toString(16).slice(2)}
function p4a13Fingerprint_(leave){const s=JSON.stringify(leave||{});let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return ('00000000'+(h>>>0).toString(16)).slice(-8)+'-'+s.length}
function p4a13ReadPendingSubmit_(){try{const x=JSON.parse(localStorage.getItem(P4A13_SUBMIT_PENDING_KEY)||'null');if(!x||!x.requestId||!x.fingerprint)return null;if(Date.now()-Number(x.createdAt||0)>24*3600000){localStorage.removeItem(P4A13_SUBMIT_PENDING_KEY);return null}return x}catch(e){return null}}
function p4a13RequestIdForLeave_(leave){const fp=p4a13Fingerprint_(leave),old=p4a13ReadPendingSubmit_();if(old&&old.fingerprint===fp)return old.requestId;const requestId='WEB-SUBMIT-'+Date.now()+'-'+p4a13Uuid_();try{localStorage.setItem(P4A13_SUBMIT_PENDING_KEY,JSON.stringify({requestId:requestId,fingerprint:fp,createdAt:Date.now()}))}catch(e){}return requestId}
function p4a13ClearPendingSubmit_(requestId){try{const old=p4a13ReadPendingSubmit_();if(!old||!requestId||old.requestId===requestId)localStorage.removeItem(P4A13_SUBMIT_PENDING_KEY)}catch(e){}}
function p4a13Sleep_(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function p4a13ConfirmSubmitResult_(requestId,op){const delays=[0,700,1400,2600,4500];for(const delay of delays){if(delay)await p4a13Sleep_(delay);updateOperation_(op,nt('checkingResult'),nt('doNotRepeat'),'warning');try{const s=await call('submitLeaveStatus',{sessionToken,requestId});if(s&&s.found&&s.result)return s.result}catch(e){}}return null}
const P4A132_APPROVAL_PENDING_KEY='abis_p4a132_pending_approval_v1';
function p4a132ApprovalFingerprint_(x){return p4a13Fingerprint_({leaveId:String(x&&x.leaveId||''),action:String(x&&x.action||''),comment:String(x&&x.comment||''),proxyEmployeeId:String(x&&x.proxyEmployeeId||'')})}
function p4a132ReadPendingApproval_(){try{const x=JSON.parse(localStorage.getItem(P4A132_APPROVAL_PENDING_KEY)||'null');if(!x||!x.requestId||!x.fingerprint)return null;if(Date.now()-Number(x.createdAt||0)>24*3600000){localStorage.removeItem(P4A132_APPROVAL_PENDING_KEY);return null}return x}catch(e){return null}}
function p4a132RequestIdForApproval_(x){const fp=p4a132ApprovalFingerprint_(x),old=p4a132ReadPendingApproval_();if(old&&old.fingerprint===fp)return old.requestId;const requestId='WEB-APPROVAL-'+Date.now()+'-'+p4a13Uuid_();try{localStorage.setItem(P4A132_APPROVAL_PENDING_KEY,JSON.stringify({requestId:requestId,fingerprint:fp,createdAt:Date.now(),leaveId:String(x&&x.leaveId||''),action:String(x&&x.action||'')}))}catch(e){}return requestId}
function p4a132ClearPendingApproval_(requestId){try{const old=p4a132ReadPendingApproval_();if(!old||!requestId||old.requestId===requestId)localStorage.removeItem(P4A132_APPROVAL_PENDING_KEY)}catch(e){}}
function p4a132UncertainError_(e){const msg=String(e&&e.message?e.message:e||'');return !!(e&&e.kind==='TRANSPORT')||/系統未回傳成功狀態|Unknown error|ScriptError|Network|網路|連線|逾時|timeout/i.test(msg)}
async function p4a132ConfirmApprovalResult_(requestId,leaveId,op,extended){const delays=extended?[0,700,1400,2600,4500]:[0];for(const delay of delays){if(delay)await p4a13Sleep_(delay);updateOperation_(op,nt('checkingResult'),nt('doNotRepeat'),'warning');try{const s=await call('approvalActionStatus',{sessionToken,requestId,leaveId});if(s&&s.found&&s.result)return s.result}catch(ignore){}}return null}
async function p4a132FinishApprovalSuccess_(r,op,requestId){p4a132ClearPendingApproval_(requestId);mutationBusy=false;setAreaBusy_('inbox',false);myLeavesCache=null;inboxCache=null;dashboardCache=null;const successText=`${tr('completed')}：${statusLabel(r.status)}`;finishOperationSuccess_(op,nt('approvalDone'),successText);message(successText,'success');try{const list=await call('inbox',{sessionToken});inboxCache=list;setInboxCount(list.length);renderInbox(list);homeData=await call('home',{sessionToken});setInboxCount(homeData.pendingApprovalCount||0);renderHome()}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}}

function opClock_(){try{return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}catch(e){return new Date().toTimeString().slice(0,8)}}function clearOperationTimers_(){operationTimers.forEach(x=>clearTimeout(x));operationTimers=[]}function renderOperationStatus_(kind,title,detail,withRetry){const el=$('opStatus');if(!el)return;const spinner=kind==='working'?'<span class="op-spinner"></span>':'';const retry=withRetry?`<button class="secondary small" onclick="manualResyncState()">${escapeHtml(nt('retrySync'))}</button>`:'';el.className=`op-status ${kind||'working'}`;el.innerHTML=`<div class="op-head">${spinner}<span>${escapeHtml(title||'')}</span><span class="op-time">${escapeHtml(opClock_())}</span></div>${detail?`<div class="op-detail">${escapeHtml(detail)}</div>`:''}${retry}`;el.classList.remove('hide')}
/* ==========================================================================
 * ABIS ESS GLOBAL ASYNC BUTTON RC1 | 2026-10-06
 *
 * Frozen interaction rule:
 * - User-triggered backend reads immediately show a locked loading button.
 * - Read:      正在讀取中… / Đang tải… / กำลังโหลด…
 * - Process:   正在處理中… / Đang xử lý… / กำลังประมวลผล…
 * - Submit:    正在送出中… / Đang gửi… / กำลังส่ง…
 * - Generate:  正在產生中… / Đang tạo… / กำลังสร้าง…
 * - Background PERF2 prefetch never creates button loading feedback.
 * - Cache hits that do not call backend do not fake a loading state.
 * - Button display: original visible text < 6 chars => spinner only; >= 6 chars => spinner + short processing label.
 * - Full semantic state remains in aria-label / operation-status feedback.
 * - Re-rendered buttons are rebound by fingerprint while the request is active.
 * ======================================================================= */
const ABIS_ESS_GLOBAL_ASYNC_BUTTON_VERSION_='ABIS_ESS_GLOBAL_ASYNC_BUTTON_RC1_3_STRUCTURED_CARD_20261006';
const ABIS_ASYNC_CAPTURE_WINDOW_MS_=450;
let ABIS_ASYNC_RECENT_CLICK_=null;
let ABIS_ASYNC_BUSY_SEQ_=0;
const ABIS_ASYNC_BUSY_GROUPS_=Object.create(null);
const ABIS_ASYNC_BUSY_TICKETS_=Object.create(null);
let ABIS_ASYNC_BUSY_OBSERVER_=null;
let ABIS_ASYNC_OBSERVER_PENDING_=false;

function abisAsyncText_(kind){
  const k=String(kind||'READ').toUpperCase();
  const lang=(typeof currentLang==='string'?currentLang:'ZH');
  const map={
    ZH:{READ:'正在讀取中…',PROCESS:'正在處理中…',SUBMIT:'正在送出中…',GENERATE:'正在產生中…'},
    VI:{READ:'Đang tải…',PROCESS:'Đang xử lý…',SUBMIT:'Đang gửi…',GENERATE:'Đang tạo…'},
    TH:{READ:'กำลังโหลด…',PROCESS:'กำลังประมวลผล…',SUBMIT:'กำลังส่ง…',GENERATE:'กำลังสร้าง…'}
  };
  return (map[lang]&&map[lang][k])||map.ZH[k]||map.ZH.READ;
}

function abisAsyncShortText_(){
  const lang=(typeof currentLang==='string'?currentLang:'ZH');
  if(lang==='VI')return 'Đang xử lý';
  if(lang==='TH')return 'กำลังทำ';
  return '處理中';
}

function abisAsyncTextLength_(value){
  const s=String(value||'').replace(/\s+/g,'').trim();
  if(!s)return 0;
  try{
    if(typeof Intl!=='undefined'&&Intl.Segmenter){
      const seg=new Intl.Segmenter(undefined,{granularity:'grapheme'});
      return Array.from(seg.segment(s)).length;
    }
  }catch(ignore){}
  return Array.from(s).length;
}

function abisAsyncVisualLabelForText_(originalText){
  return abisAsyncTextLength_(originalText)<6?'':abisAsyncShortText_();
}

function abisAsyncKindForAction_(action){
  const a=String(action||'').toLowerCase();
  if(/export|generate|pdf|xlsx|snapshotfile|createfile/.test(a))return 'GENERATE';
  if(/submit|resubmit|send|upload/.test(a))return 'SUBMIT';
  if(/save|create|update|set|delete|remove|withdraw|approve|reject|action|unbind|bind|restore|reissue|acknowledge|complete|login|logout|reset|apply|cancel|finalize|finalise/.test(a))return 'PROCESS';
  return 'READ';
}

function abisAsyncKindForTitle_(title){
  const s=String(title||'').toLowerCase();
  if(/載入|讀取|loading|load|đang tải|กำลังโหลด/.test(s))return 'READ';
  if(/產生|匯出|generate|export|đang tạo|กำลังสร้าง/.test(s))return 'GENERATE';
  if(/送出|傳輸|提交|submit|send|gửi|ส่ง/.test(s))return 'SUBMIT';
  return 'PROCESS';
}

function abisAsyncButtonFingerprint_(btn){
  if(!btn)return null;
  const id=String(btn.id||'').trim();
  const onclick=String(btn.getAttribute&&btn.getAttribute('onclick')||'').replace(/\s+/g,' ').trim();
  const cls=Array.from(btn.classList||[]).filter(x=>x!=='is-busy'&&x!=='abis-async-busy'&&x!=='abis-async-structured').sort().join(' ');
  const text=String(btn.textContent||'').replace(/\s+/g,' ').trim().slice(0,120);
  const key=id?'ID:'+id:(onclick?'ONCLICK:'+onclick:'CLASS:'+cls+'|TEXT:'+text);
  return {key:key,id:id,onclick:onclick,classes:cls,text:text};
}

function abisAsyncFindButton_(fp){
  if(!fp)return null;
  if(fp.id){const byId=document.getElementById(fp.id);if(byId&&byId.tagName==='BUTTON')return byId;}
  const buttons=Array.from(document.querySelectorAll('button'));
  if(fp.onclick){const hit=buttons.find(b=>String(b.getAttribute('onclick')||'').replace(/\s+/g,' ').trim()===fp.onclick);if(hit)return hit;}
  return buttons.find(function(b){
    const cls=Array.from(b.classList||[]).filter(x=>x!=='is-busy'&&x!=='abis-async-busy'&&x!=='abis-async-structured').sort().join(' ');
    const text=String(b.textContent||'').replace(/\s+/g,' ').trim().slice(0,120);
    return cls===fp.classes&&text===fp.text;
  })||null;
}

function abisAsyncIsStructuredButton_(btn){
  if(!btn)return false;
  if(btn.matches&&btn.matches('.abis-m7x-row,.abis-m72-case,.abis-m71-employee-row,.abis-m8-report-card,.abis-m7x-report-card,.rc2-account-row,.abis-m2-tool-row'))return true;
  const children=Array.from(btn.children||[]).filter(function(x){return !(x.classList&&x.classList.contains('abis-async-button-overlay'));});
  if(children.length>=2)return true;
  try{
    const r=btn.getBoundingClientRect();
    if(r&&r.height>=72&&children.length>=1)return true;
  }catch(ignore){}
  return false;
}

function abisAsyncOverlay_(btn,visualLabel){
  if(!btn)return;
  let overlay=null;
  Array.from(btn.children||[]).forEach(function(x){if(x.classList&&x.classList.contains('abis-async-button-overlay'))overlay=x;});
  if(!overlay){
    overlay=document.createElement('span');
    overlay.className='abis-async-button-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<span class="abis-async-button-spinner"></span><span class="abis-async-button-label"></span>';
    btn.appendChild(overlay);
  }
  const text=overlay.querySelector('.abis-async-button-label');
  const next=String(visualLabel||'');
  overlay.classList.toggle('is-spinner-only',!next);
  if(text&&text.textContent!==next)text.textContent=next;
}

function abisAsyncApplyToButton_(btn,label,group){
  if(!btn||!btn.isConnected)return;
  const groupKey=group&&group.fingerprint?String(group.fingerprint.key||''):'';
  const nextLabel=label||abisAsyncText_('READ');
  const originalText=group&&group.fingerprint?group.fingerprint.text:String(btn.textContent||'').replace(/\s+/g,' ').trim();
  const visualLabel=group&&Object.prototype.hasOwnProperty.call(group,'visualLabel')?group.visualLabel:abisAsyncVisualLabelForText_(originalText);
  const existingOverlay=Array.from(btn.children||[]).some(function(x){return x.classList&&x.classList.contains('abis-async-button-overlay');});
  if(groupKey&&btn.dataset.abisAsyncGroupKey===groupKey&&btn.getAttribute('aria-busy')==='true'&&existingOverlay){
    if(group&&group.buttons)group.buttons.add(btn);
    return;
  }
  if(!btn.dataset.abisAsyncArmed){
    btn.dataset.abisAsyncArmed='Y';
    btn.dataset.abisAsyncOriginalDisabled=btn.disabled?'Y':'N';
    btn.dataset.abisAsyncHadAriaLabel=btn.hasAttribute('aria-label')?'Y':'N';
    btn.dataset.abisAsyncOriginalAriaLabel=btn.getAttribute('aria-label')||'';
  }
  if(groupKey)btn.dataset.abisAsyncGroupKey=groupKey;
  try{btn.style.setProperty('--abis-async-busy-fg',getComputedStyle(btn).color||'#142640')}catch(ignore){}
  btn.disabled=true;
  btn.setAttribute('aria-busy','true');
  if(btn.getAttribute('aria-label')!==nextLabel)btn.setAttribute('aria-label',nextLabel);
  const structured=group&&Object.prototype.hasOwnProperty.call(group,'structured')?!!group.structured:abisAsyncIsStructuredButton_(btn);
  btn.classList.toggle('abis-async-structured',structured);
  btn.classList.add('is-busy','abis-async-busy');
  abisAsyncOverlay_(btn,visualLabel);
  if(group&&group.buttons)group.buttons.add(btn);
}

function abisAsyncClearButton_(btn){
  if(!btn)return;
  try{Array.from(btn.children||[]).forEach(function(x){if(x.classList&&x.classList.contains('abis-async-button-overlay'))x.remove();});}catch(ignore){}
  btn.classList.remove('abis-async-busy','abis-async-structured');
  btn.removeAttribute('aria-busy');
  if(btn.dataset.abisAsyncArmed){
    btn.disabled=btn.dataset.abisAsyncOriginalDisabled==='Y';
    if(btn.dataset.abisAsyncHadAriaLabel==='Y')btn.setAttribute('aria-label',btn.dataset.abisAsyncOriginalAriaLabel||'');
    else btn.removeAttribute('aria-label');
    delete btn.dataset.abisAsyncArmed;
    delete btn.dataset.abisAsyncOriginalDisabled;
    delete btn.dataset.abisAsyncHadAriaLabel;
    delete btn.dataset.abisAsyncOriginalAriaLabel;
    delete btn.dataset.abisAsyncGroupKey;
  }
  try{btn.style.removeProperty('--abis-async-busy-fg')}catch(ignore){}
  if(!btn.dataset.busyOriginalDisabled)btn.classList.remove('is-busy');
}

function abisAsyncEnsureObserver_(){
  if(ABIS_ASYNC_BUSY_OBSERVER_||typeof MutationObserver!=='function')return;
  ABIS_ASYNC_BUSY_OBSERVER_=new MutationObserver(function(){
    if(ABIS_ASYNC_OBSERVER_PENDING_||!Object.keys(ABIS_ASYNC_BUSY_GROUPS_).length)return;
    ABIS_ASYNC_OBSERVER_PENDING_=true;
    const run=function(){
      ABIS_ASYNC_OBSERVER_PENDING_=false;
      Object.keys(ABIS_ASYNC_BUSY_GROUPS_).forEach(function(key){
        const g=ABIS_ASYNC_BUSY_GROUPS_[key];
        if(!g||g.count<1)return;
        const btn=abisAsyncFindButton_(g.fingerprint);
        if(!btn)return;
        const alreadyBound=btn.dataset.abisAsyncGroupKey===String(g.fingerprint&&g.fingerprint.key||'')&&btn.getAttribute('aria-busy')==='true'&&Array.from(btn.children||[]).some(function(x){return x.classList&&x.classList.contains('abis-async-button-overlay');});
        if(!alreadyBound)abisAsyncApplyToButton_(btn,g.label,g);
      });
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
  });
  try{ABIS_ASYNC_BUSY_OBSERVER_.observe(document.documentElement,{childList:true,subtree:true})}catch(ignore){}
}

function abisAsyncAcquireBusy_(btn,label,source,persistent){
  if(!btn)return null;
  const fp=abisAsyncButtonFingerprint_(btn);
  if(!fp||!fp.key)return null;
  let g=ABIS_ASYNC_BUSY_GROUPS_[fp.key];
  if(!g){g=ABIS_ASYNC_BUSY_GROUPS_[fp.key]={fingerprint:fp,label:label||abisAsyncText_('READ'),visualLabel:abisAsyncVisualLabelForText_(fp.text),structured:abisAsyncIsStructuredButton_(btn),count:0,buttons:new Set(),persistent:false,sources:{}};}
  g.count++;
  g.label=label||g.label;
  if(persistent)g.persistent=true;
  g.sources[String(source||'unknown')]=true;
  const ticket=++ABIS_ASYNC_BUSY_SEQ_;
  ABIS_ASYNC_BUSY_TICKETS_[ticket]=fp.key;
  const target=btn.isConnected?btn:abisAsyncFindButton_(fp);
  if(target)abisAsyncApplyToButton_(target,g.label,g);
  abisAsyncEnsureObserver_();
  return ticket;
}

function abisAsyncReleaseBusy_(ticket){
  const key=ABIS_ASYNC_BUSY_TICKETS_[ticket];
  if(!key)return;
  delete ABIS_ASYNC_BUSY_TICKETS_[ticket];
  const g=ABIS_ASYNC_BUSY_GROUPS_[key];
  if(!g)return;
  g.count=Math.max(0,Number(g.count||0)-1);
  if(g.count>0)return;
  delete ABIS_ASYNC_BUSY_GROUPS_[key];
  Array.from(g.buttons||[]).forEach(function(btn){if(btn&&btn.isConnected)abisAsyncClearButton_(btn);});
  const current=abisAsyncFindButton_(g.fingerprint);
  if(current)abisAsyncClearButton_(current);
}

function abisAsyncCaptureClick_(btn){
  if(!btn||btn.disabled)return;
  ABIS_ASYNC_RECENT_CLICK_={button:btn,fingerprint:abisAsyncButtonFingerprint_(btn),at:Date.now()};
}

function abisAsyncBeginRpcForRecentClick_(action){
  const ctx=ABIS_ASYNC_RECENT_CLICK_;
  if(!ctx||Date.now()-Number(ctx.at||0)>ABIS_ASYNC_CAPTURE_WINDOW_MS_)return null;
  const fp=ctx.fingerprint;
  if(!fp||!fp.key)return null;
  const existing=ABIS_ASYNC_BUSY_GROUPS_[fp.key];
  if(existing&&existing.persistent)return null;
  const btn=(ctx.button&&ctx.button.isConnected)?ctx.button:abisAsyncFindButton_(fp);
  if(!btn)return null;
  if(btn.getAttribute('aria-busy')==='true'&&btn.classList.contains('abis-async-busy'))return null;
  const kind=abisAsyncKindForAction_(action);
  return abisAsyncAcquireBusy_(btn,abisAsyncText_(kind),'rpc:'+String(action||''),false);
}

function abisEssAsyncButtonStatus_(){
  return {
    version:ABIS_ESS_GLOBAL_ASYNC_BUTTON_VERSION_,
    activeGroups:Object.keys(ABIS_ASYNC_BUSY_GROUPS_),
    activeTicketCount:Object.keys(ABIS_ASYNC_BUSY_TICKETS_).length,
    captureWindowMs:ABIS_ASYNC_CAPTURE_WINDOW_MS_
  };
}
try{window.ABIS_ESS_GLOBAL_ASYNC_BUTTON=Object.freeze({version:ABIS_ESS_GLOBAL_ASYNC_BUTTON_VERSION_})}catch(ignore){}

// RC1.3 global action-feedback standard: every server-backed button gets immediate button state + shared status bar.
// RC1.4 UI invariant: any backend action button must show an immediate busy state and operation-status feedback.
let p5a114LastClickedButton_=null,p5a114LastClickedAt_=0;const p5a114OperationButtons_={};
// FAST1M5: navigation is last-click-wins. Read-only top navigation may overlap at the transport layer,
// but only the newest navigation may keep a busy button or update the visible page/status.
let p5a1NavSeq_=0;
function p5a1IsTopNavButton_(btn){return !!(btn&&btn.closest&&btn.closest('#app > .card .nav'))}
function p5a1ReleaseStaleNavButtons_(keepBtn){Object.keys(p5a114OperationButtons_).forEach(function(k){const st=p5a114OperationButtons_[k];if(st&&p5a1IsTopNavButton_(st.btn)&&st.btn!==keepBtn)p5a114ReleaseOperationButton_(Number(k))})}
function p5a1SupersedeActiveNavOperation_(nextBtn){const st=p5a114OperationButtons_[activeOperationId];if(st&&p5a1IsTopNavButton_(st.btn)&&st.btn!==nextBtn){clearOperationTimers_();p5a114ReleaseOperationButton_(activeOperationId);activeOperationId=++operationSeq;const el=$('opStatus');if(el)el.classList.add('hide')}p5a1ReleaseStaleNavButtons_(nextBtn)}
function p5a1CurrentNavSeq_(){return p5a1NavSeq_}
function p5a1NavStillCurrent_(seq){return Number(seq)===Number(p5a1NavSeq_)}
document.addEventListener('click',function(ev){const btn=ev.target&&ev.target.closest?ev.target.closest('button'):null;if(!btn||btn.disabled)return;if(btn.closest&&btn.closest('#p4a14ConfirmModal'))return;if(p5a1IsTopNavButton_(btn)){p5a1NavSeq_++;p5a1SupersedeActiveNavOperation_(btn)}p5a114LastClickedButton_=btn;p5a114LastClickedAt_=Date.now();abisAsyncCaptureClick_(btn)},true);
function p5a114BindOperationButton_(id,explicitBtn,busyTitle){const btn=explicitBtn||p5a114LastClickedButton_;if(!btn||!btn.isConnected)return;if(!explicitBtn&&Date.now()-p5a114LastClickedAt_>ABIS_ASYNC_CAPTURE_WINDOW_MS_)return;p5a114LastClickedButton_=null;const structured=btn.children&&btn.children.length>0;const state={btn:btn,text:btn.dataset.originalText||btn.textContent,html:btn.innerHTML,disabled:btn.dataset.busyOriginalDisabled==='Y'||(!btn.dataset.busyOriginalDisabled&&btn.disabled),textChanged:!structured,navSeq:p5a1IsTopNavButton_(btn)?p5a1NavSeq_:0,busyTicket:null};const kind=abisAsyncKindForTitle_(busyTitle||'');state.busyTicket=abisAsyncAcquireBusy_(btn,abisAsyncText_(kind),'operation:'+id,true);p5a114OperationButtons_[id]=state;if(!state.busyTicket){btn.disabled=true;btn.setAttribute('aria-busy','true');btn.classList.add('is-busy');if(!structured)btn.textContent=abisAsyncText_(kind)}}
function p5a114ReleaseOperationButton_(id){const state=p5a114OperationButtons_[id];if(!state)return;delete p5a114OperationButtons_[id];if(state.busyTicket){try{abisAsyncReleaseBusy_(state.busyTicket)}catch(ignore){}}const btn=state.btn;if(!btn||!btn.isConnected)return;btn.removeAttribute('aria-busy');btn.classList.remove('abis-async-busy');if(state.textChanged)btn.textContent=state.text;else if(btn.innerHTML!==state.html)btn.innerHTML=state.html;btn.disabled=!!state.disabled;if(!btn.dataset.busyOriginalDisabled)btn.classList.remove('is-busy')}
function beginOperation_(title,detail,triggerBtn){clearOperationTimers_();const id=++operationSeq;activeOperationId=id;renderOperationStatus_('working',title||nt('transmitting'),detail||nt('doNotRepeat'));p5a114BindOperationButton_(id,triggerBtn,title);operationTimers.push(setTimeout(()=>{if(activeOperationId===id)renderOperationStatus_('working',nt('processing'),nt('doNotRepeat'))},3500));operationTimers.push(setTimeout(()=>{if(activeOperationId===id)renderOperationStatus_('warning',nt('slow'),p4a14t('waitServer'))},9000));operationTimers.push(setTimeout(()=>{if(activeOperationId===id)renderOperationStatus_('warning',nt('verySlow'),p4a14t('waitServer'))},25000));return id}function updateOperation_(id,title,detail,kind){if(activeOperationId!==id)return;renderOperationStatus_(kind||'working',title,detail)}function finishOperationSuccess_(id,title,detail){if(activeOperationId!==id)return;clearOperationTimers_();p5a114ReleaseOperationButton_(id);renderOperationStatus_('success',title,detail||'');operationTimers.push(setTimeout(()=>{if(activeOperationId===id){const el=$('opStatus');if(el)el.classList.add('hide')}},12000))}function finishOperationFailure_(id,error){if(activeOperationId!==id)return;clearOperationTimers_();p5a114ReleaseOperationButton_(id);renderOperationStatus_('error',nt('operationFailed'),error&&error.message?error.message:String(error||''))}function finishOperationUnknown_(id,title,detail,withRetry){if(activeOperationId!==id)return;clearOperationTimers_();p5a114ReleaseOperationButton_(id);renderOperationStatus_('error',title||nt('resultUnknown'),detail||nt('unknownDetail'),withRetry!==false)}
function setAreaBusy_(areaId,busy,busyText){const root=$(areaId);if(!root)return;root.querySelectorAll('button').forEach(btn=>{if(busy){if(btn.dataset.busyOriginalDisabled===undefined)btn.dataset.busyOriginalDisabled=btn.disabled?'Y':'N';if(btn.dataset.originalHtml===undefined)btn.dataset.originalHtml=btn.innerHTML;btn.disabled=true;btn.classList.add('is-busy');if(busyText&&(!btn.children||btn.children.length===0)){btn.dataset.busyTextApplied='Y';btn.textContent=busyText}}else{const wasDisabled=btn.dataset.busyOriginalDisabled==='Y';btn.disabled=wasDisabled;delete btn.dataset.busyOriginalDisabled;btn.classList.remove('is-busy');if(btn.dataset.busyTextApplied==='Y'&&btn.dataset.originalHtml!==undefined)btn.innerHTML=btn.dataset.originalHtml;delete btn.dataset.busyTextApplied;delete btn.dataset.originalHtml}})}
async function reconcileAfterTransport_(context,id){updateOperation_(id,nt('checkingResult'),nt('unknownDetail'),'warning');try{if(context==='submit'||context==='withdraw'||context==='all'){myLeavesCache=await call('myLeaves',{sessionToken});if(!$('leaves').classList.contains('hide'))renderLeaves(myLeavesCache)}if(context==='approval'||context==='all'){inboxCache=await call('inbox',{sessionToken});setInboxCount(inboxCache.length);if(!$('inbox').classList.contains('hide'))renderInbox(inboxCache)}if(sessionToken){homeData=await call('home',{sessionToken});renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0)}mutationBusy=false;setAreaBusy_('leaveForm',false);setAreaBusy_('inbox',false);setAreaBusy_('leaves',false);clearOperationTimers_();p5a114ReleaseOperationButton_(id);renderOperationStatus_('warning',nt('resynced'),nt('resyncedDetail'));return true}catch(re){finishOperationUnknown_(id,nt('stillUnknown'),nt('stillUnknownDetail'),true);return false}}
async function manualResyncState(){const id=beginOperation_(nt('syncing'),nt('doNotRepeat'));try{if(sessionToken){homeData=await call('home',{sessionToken});myLeavesCache=await call('myLeaves',{sessionToken});inboxCache=await call('inbox',{sessionToken});setInboxCount(inboxCache.length);renderHome();fillLeaveTypes();fillProxyCandidates();if(!$('leaves').classList.contains('hide'))renderLeaves(myLeavesCache);if(!$('inbox').classList.contains('hide'))renderInbox(inboxCache)}mutationBusy=false;setAreaBusy_('leaveForm',false);setAreaBusy_('inbox',false);setAreaBusy_('leaves',false);finishOperationSuccess_(id,nt('syncDone'),nt('resyncedDetail'))}catch(e){finishOperationUnknown_(id,nt('stillUnknown'),nt('stillUnknownDetail'),true)}}
let messageSeq_=0;function clearMessage(){messageSeq_++;const el=$('msg');if(el)el.innerHTML=''}function message(text,type='error'){const seq=++messageSeq_,cls=type==='warning'?'notice':type,el=$('msg');if(!el)return;el.innerHTML=`<div class="${cls}">${escapeHtml(text)}</div>`;if(type==='success'||type==='info'||type==='warning')setTimeout(()=>{if(messageSeq_===seq&&$('msg'))$('msg').innerHTML=''},type==='warning'?15000:12000)}
let p4a14ConfirmResolver_=null;
function p4a14CloseConfirm_(answer){const modal=$('p4a14ConfirmModal');if(modal)modal.classList.add('hide');const resolve=p4a14ConfirmResolver_;p4a14ConfirmResolver_=null;if(resolve)resolve(!!answer)}
function p4a14Confirm_(title,body,confirmText){return new Promise(resolve=>{const modal=$('p4a14ConfirmModal'),titleEl=$('p4a14ConfirmTitle'),bodyEl=$('p4a14ConfirmBody'),cancelBtn=$('p4a14ConfirmCancel'),okBtn=$('p4a14ConfirmOk');if(!modal||!titleEl||!bodyEl||!cancelBtn||!okBtn){resolve(confirm(body||title||''));return}if(p4a14ConfirmResolver_)p4a14CloseConfirm_(false);titleEl.textContent=title||'';bodyEl.textContent=body||'';cancelBtn.textContent=p4a14t('cancelAction');okBtn.textContent=confirmText||p4a14t('confirmWithdraw');p4a14ConfirmResolver_=resolve;modal.classList.remove('hide');setTimeout(()=>okBtn.focus(),0)})}
const P5A1_THEME_KEY_='abis_theme';
function p5a1StoredTheme_(){try{const t=localStorage.getItem(P5A1_THEME_KEY_);return t==='light'||t==='dark'?t:''}catch(e){return ''}}
function p5a1EffectiveTheme_(){const stored=p5a1StoredTheme_();if(stored)return stored;try{return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){return 'light'}}
function p5a1ThemeLabel_(effective){if(currentLang==='VI')return effective==='dark'?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối';if(currentLang==='TH')return effective==='dark'?'เปลี่ยนเป็นโหมดสว่าง':'เปลี่ยนเป็นโหมดมืด';return effective==='dark'?'切換為淺色模式':'切換為深色模式'}
function p5a1ApplyThemeUi_(){const btn=$('themeToggle'),icon=$('themeToggleIcon');if(!btn||!icon)return;const effective=p5a1EffectiveTheme_();icon.textContent=effective==='dark'?'☀':'☾';const label=p5a1ThemeLabel_(effective);btn.setAttribute('aria-label',label);btn.setAttribute('title',label);btn.dataset.effectiveTheme=effective}
function toggleTheme(){const next=p5a1EffectiveTheme_()==='dark'?'light':'dark';try{localStorage.setItem(P5A1_THEME_KEY_,next)}catch(e){}document.documentElement.setAttribute('data-theme',next);p5a1ApplyThemeUi_()}
try{if(window.matchMedia){const mq=window.matchMedia('(prefers-color-scheme: dark)');const sync=()=>{if(!p5a1StoredTheme_())p5a1ApplyThemeUi_()};if(mq.addEventListener)mq.addEventListener('change',sync);else if(mq.addListener)mq.addListener(sync)}}catch(e){}
function applyStaticI18n(){document.documentElement.lang=currentLang==='VI'?'vi':currentLang==='TH'?'th':'zh-Hant';p5a1ApplyThemeUi_();document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=tr(el.dataset.i18n));document.querySelectorAll('[data-i18n-html]').forEach(el=>el.innerHTML=tr(el.dataset.i18nHtml));document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=tr(el.dataset.i18nPlaceholder));['ZH','VI','TH'].forEach(c=>{const b=$('lang'+c);if(b)b.classList.toggle('active',c===currentLang)});configureDashboardNav();configureHrCredentialNav();if(hrCredentialResultsCache.length)renderHrCredentialResults_(hrCredentialResultsCache);if(hrCredentialSelected)renderHrCredentialDetail_(hrCredentialSelected);if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function preferredLanguageToUi_(value){const x=String(value||'').trim().replace(/_/g,'-').toUpperCase();return x==='VI'||x==='VI-VN'?'VI':x==='TH'||x==='TH-TH'?'TH':'ZH'}
function uiToPreferredLanguage_(code){return code==='VI'?'vi-VN':code==='TH'?'th-TH':'zh-TW'}
function preferredLanguageLabel_(value){const ui=preferredLanguageToUi_(value);return ui==='VI'?'Tiếng Việt':ui==='TH'?'ไทย':'繁體中文'}
function setLanguage(code,persist){currentLang=['ZH','VI','TH'].includes(code)?code:'ZH';if(persist){try{localStorage.setItem('abis_lang',currentLang)}catch(e){}}applyStaticI18n();p5a108UpdateDiscardButton_();if(homeData){renderHome();fillLeaveTypes();fillProxyCandidates();if(myLeavesCache)renderLeaves(myLeavesCache);if(inboxCache)renderInbox(inboxCache);if(dashboardCache)renderDashboard(dashboardCache);if(attendanceCache)renderMyAttendance_(attendanceCache);if($('account')&&!$('account').classList.contains('hide'))renderMyAccount_();if($('recentRecords')&&!$('recentRecords').classList.contains('hide'))renderRecentRecords_();if($('notifications')&&!$('notifications').classList.contains('hide'))renderNotificationCenter_()}}
async function setPreferredLanguageUi_(code,triggerBtn){const ui=['ZH','VI','TH'].includes(code)?code:'ZH',preferredLanguage=uiToPreferredLanguage_(ui);if(!sessionToken||!homeData||!homeData.employee){setLanguage(ui,true);return}const current=String(homeData.employee.preferredLanguage||'');if(current===preferredLanguage&&currentLang===ui){setLanguage(ui,true);return}const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);try{const r=await call('setPreferredLanguage',{sessionToken,preferredLanguage});homeData.employee.preferredLanguage=r.preferredLanguage||preferredLanguage;setLanguage(preferredLanguageToUi_(homeData.employee.preferredLanguage),true);accountPanel_='language';if($('account')&&!$('account').classList.contains('hide'))renderMyAccount_();finishOperationSuccess_(op,currentLang==='VI'?'Đã lưu ngôn ngữ':currentLang==='TH'?'บันทึกภาษาแล้ว':'語言設定已儲存','');message(currentLang==='VI'?'Ngôn ngữ tài khoản đã cập nhật.':currentLang==='TH'?'อัปเดตภาษาบัญชีแล้ว':'帳號語言已更新。','success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function p5a1ChooseLanguage_(code,triggerBtn){const app=$('app'),loggedIn=!!(sessionToken&&app&&!app.classList.contains('hide'));if(loggedIn){setPreferredLanguageUi_(code,triggerBtn);return}setLanguage(code,true)}
function leaveTypeLabel(x){const code=String(x&&x.code||x&&x.leaveTypeCode||'');if(currentLang==='VI')return (x&&x.nameVi)||LEAVE_VI[code]||(x&&x.name)||(x&&x.leaveType)||code;if(currentLang==='TH')return LEAVE_TH[code]||(x&&x.name)||(x&&x.leaveType)||code;return (x&&x.name)||(x&&x.leaveType)||code}function statusLabel(s){return (STATUS[currentLang]&&STATUS[currentLang][s])||s}function roleLabel(r){return (ROLE[currentLang]&&ROLE[currentLang][r])||r}function sourceLabel(s){return (SOURCE[currentLang]&&SOURCE[currentLang][s])||s}function modeLabel(m){return (MODE[currentLang]&&MODE[currentLang][m])||m}
function hideAuthScreens_(){['lineBoot','login','forgotPin','resetPin','setPin'].forEach(id=>{const el=$(id);if(el)el.classList.add('hide')})}function showLogin(){document.body.classList.remove('inner-view','home-view');hideAuthScreens_();$('login').classList.remove('hide');$('app').classList.add('hide');if(rememberedEmployeeId&&!$('loginId').value){$('loginId').value=rememberedEmployeeId;$('rememberId').checked=true}}function showForgotPin(){hideAuthScreens_();forgotPinResetToken='';forgotPinEmployeeId='';$('forgotEmployeeId').value=$('loginId').value.trim().toUpperCase()||rememberedEmployeeId||'';$('forgotPin').classList.remove('hide');$('app').classList.add('hide')}function cancelForgotPin(){forgotPinResetToken='';forgotPinEmployeeId='';$('resetCode').value='';$('resetNewPin').value='';$('resetNewPin2').value='';showLogin()}function showResetPin_(r){forgotPinResetToken=r.resetToken||'';forgotPinEmployeeId=(r.employeeId||'').toUpperCase();$('resetEmployeeId').value=forgotPinEmployeeId;$('resetCode').value='';$('resetNewPin').value='';$('resetNewPin2').value='';hideAuthScreens_();$('resetPin').classList.remove('hide');$('app').classList.add('hide')}function showPinSetup(r){if(r.language)setLanguage(r.language,true);firstPinSetupToken=r.setupToken||'';firstPinEmployeeId=r.employeeId||'';$('setupId').value=firstPinEmployeeId;$('setupPin').value='';$('setupPin2').value='';hideAuthScreens_();$('setPin').classList.remove('hide');$('app').classList.add('hide')}function cancelPinSetup(){firstPinSetupToken='';firstPinEmployeeId='';showLogin()}function hideAppSections(){document.body.classList.remove('home-view');document.body.classList.add('inner-view');const lf=$('leaveForm');if(lf&&!lf.classList.contains('hide')&&p5a108DraftDirty&&!returnedEditLeaveId)p5a108SaveDraftNow_(true);const hr=$('hrCredentialAdmin');if(hr&&!hr.classList.contains('hide'))clearHrOneTimePin_();['home','account','recentRecords','leaveForm','leaves','attendance','inbox','notifications','dashboard','hrCredentialAdmin'].forEach(id=>{const el=$(id);if(el)el.classList.add('hide')});if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}function showHome(){hideAppSections();document.body.classList.remove('inner-view');document.body.classList.add('home-view');$('home').classList.remove('hide');renderHome();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function resetReturnedEditUi_(){returnedEditLeaveId='';const hint=$('returnedEditHint'),save=$('saveReturnedDraftBtn'),cancel=$('cancelReturnedEditBtn'),submit=$('submitLeaveBtn');if(hint){hint.classList.add('hide');hint.innerHTML=''}if(save){save.classList.add('hide');save.textContent=p4t('saveDraft')}if(cancel){cancel.classList.add('hide');cancel.textContent=p4t('cancelEdit')}if(submit){submit.textContent=tr('submitLeave')}}
function showLeaveForm(keepReturnedEdit,skipDraftLoad){if(!homeData||!homeData.canSubmitLeave){message(tr('noSubmit'));return}if(!keepReturnedEdit)resetReturnedEditUi_();hideAppSections();$('leaveForm').classList.remove('hide');const dab=$('draftAttachmentBox');if(dab)dab.classList.toggle('hide',!!keepReturnedEdit);p5a109RenderDraftAttachments_();p5a108UpdateDiscardButton_();refreshApplicationModes();if(!keepReturnedEdit&&!skipDraftLoad)setTimeout(function(){p5a108LoadDraft_(true)},0)}
function returnedLeaveById_(leaveId){return (myLeavesCache||[]).find(x=>String(x.leaveId)===String(leaveId))||null}
function beginReturnedEdit_(leaveId){p5a108ResetDraftState_();const x=returnedLeaveById_(leaveId);if(!x||x.status!=='RETURNED'){message('此假單目前不是退回修改狀態');return}const d=x.returnedDraft||x;returnedEditLeaveId=leaveId;showLeaveForm(true);$('leaveType').value=d.leaveTypeCode||x.leaveTypeCode||'';refreshApplicationModes();$('applicationType').value=d.applicationType||x.applicationType||'HOURLY';toggleTimeFields();$('startDate').value=d.startDate||x.startDate||'';$('endDate').value=d.endDate||x.endDate||x.startDate||'';$('startTime').value=d.startTime||x.startTime||'';$('endTime').value=d.endTime||x.endTime||'';fillProxyCandidates();if(!$('proxyId').disabled)$('proxyId').value=d.proxyEmployeeId!==undefined?d.proxyEmployeeId:(x.proxyId||'');$('handover').value=d.handover!==undefined?d.handover:(x.handover||'');$('reason').value=d.reason!==undefined?d.reason:(x.reason||'');$('emergency').checked=!!d.emergency;const rr=[x.returnReasonCode,x.returnReasonNote].filter(Boolean).join('｜')||p4t('noReturnReason');const hint=x.returnScopeType==='GROUP'?p4t('groupHint'):p4t('singleHint');$('returnedEditHint').innerHTML=`<b>${escapeHtml(p4t('editTitle'))}</b><br>${escapeHtml(p4t('returnReason'))}：${escapeHtml(rr)}<br>${escapeHtml(hint)}`;$('returnedEditHint').classList.remove('hide');$('saveReturnedDraftBtn').classList.remove('hide');$('saveReturnedDraftBtn').textContent=p4t('saveDraft');$('cancelReturnedEditBtn').classList.remove('hide');$('cancelReturnedEditBtn').textContent=p4t('cancelEdit');$('submitLeaveBtn').textContent=x.returnScopeType==='GROUP'?p4t('returnedGroupResubmit'):p4t('returnedResubmit');scheduleDepartmentConflictCheck()}
function cancelReturnedEdit_(){resetReturnedEditUi_();refreshLeaves()}
function weakPersonalPin_(pin){return ['000000','111111','222222','333333','444444','555555','666666','777777','888888','999999','123456','654321'].includes(String(pin||''))}async function requestForgotPinCode(){const btn=$('forgotSendBtn'),employeeId=$('forgotEmployeeId').value.trim().toUpperCase();if(!employeeId){message(tr('employeeId'));return}const op=beginOperation_(nt('loginSending'),nt('doNotRepeat'));try{btn.disabled=true;btn.textContent=nt('transmitting');const r=await call('requestPinReset',{employeeId});showResetPin_(r);finishOperationSuccess_(op,tr('resetCodeSent'),'');message(tr('resetCodeSent'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{btn.disabled=false;btn.textContent=tr('sendVerifyCode')}}async function completeForgotPinReset(){const btn=$('resetPinBtn'),code=$('resetCode').value.trim(),pin=$('resetNewPin').value,pin2=$('resetNewPin2').value;if(!/^\d{6}$/.test(code)){message(tr('verifyCode'));return}if(!/^\d{6}$/.test(pin)){message(tr('pinDigits'));return}if(weakPersonalPin_(pin)){message(tr('pinDefaultNo'));return}if(pin!==pin2){message(tr('pinMismatch'));return}const op=beginOperation_(nt('pinSending'),nt('doNotRepeat'));try{btn.disabled=true;btn.textContent=nt('transmitting');const r=await call('completePinReset',{employeeId:forgotPinEmployeeId,resetToken:forgotPinResetToken,code:code,newPin:pin});forgotPinResetToken='';sessionToken=r.sessionToken;try{localStorage.setItem('abis_session',sessionToken);localStorage.setItem('abis_employee_id',forgotPinEmployeeId)}catch(e){}rememberedEmployeeId=forgotPinEmployeeId;if(r.home){homeData=r.home;enterApp();finishOperationSuccess_(op,tr('resetDone'),'')}else{finishOperationSuccess_(op,tr('resetDone'),'');await boot()}}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{btn.disabled=false;btn.textContent=tr('resetAndLogin')}}async function completeFirstPin(){const btn=$('setupPinBtn'),pin=$('setupPin').value,pin2=$('setupPin2').value;if(!/^\d{6}$/.test(pin)){message(tr('pinDigits'));return}if(weakPersonalPin_(pin)){message(tr('pinDefaultNo'));return}if(pin!==pin2){message(tr('pinMismatch'));return}const op=beginOperation_(nt('pinSending'),nt('doNotRepeat'));try{btn.disabled=true;btn.textContent=nt('transmitting');const r=await call('completeFirstLoginPin',{employeeId:firstPinEmployeeId,setupToken:firstPinSetupToken,newPin:pin});firstPinSetupToken='';firstPinEmployeeId='';sessionToken=r.sessionToken;try{localStorage.setItem('abis_session',sessionToken)}catch(e){}if($('rememberId').checked){try{localStorage.setItem('abis_employee_id',$('setupId').value)}catch(e){}rememberedEmployeeId=$('setupId').value}if(r.home){homeData=r.home;enterApp();finishOperationSuccess_(op,tr('setupDone'),'')}else{finishOperationSuccess_(op,tr('setupDone'),'');await boot()}}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{btn.disabled=false;btn.textContent=tr('setAndLogin')}}
async function login(){clearMessage();const btn=$('loginBtn'),employeeId=$('loginId').value.trim().toUpperCase(),op=beginOperation_(nt('loginSending'),nt('doNotRepeat'));try{btn.disabled=true;btn.textContent=nt('transmitting');const r=await call('login',{employeeId,pin:$('loginPin').value});if(r.requiresPinSetup){finishOperationSuccess_(op,tr('setupPin'),'');if($('rememberId').checked){try{localStorage.setItem('abis_employee_id',employeeId)}catch(e){}rememberedEmployeeId=employeeId}showPinSetup(r);return}sessionToken=r.sessionToken;try{localStorage.setItem('abis_session',sessionToken)}catch(e){}if($('rememberId').checked){try{localStorage.setItem('abis_employee_id',employeeId)}catch(e){}rememberedEmployeeId=employeeId}else{try{localStorage.removeItem('abis_employee_id')}catch(e){}rememberedEmployeeId=''}if(r.home){homeData=r.home;enterApp();finishOperationSuccess_(op,tr('login'),'')}else{finishOperationSuccess_(op,tr('login'),'');await boot()}}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{btn.disabled=false;btn.textContent=tr('login')}}
let p5a1Fast4HomeHydrateStarted_=false;
function p5a1Fast4BootstrapNeedsRefresh_(){return !!(homeData&&(homeData.__fast4Partial||homeData.__fast4Resume))}
async function p5a1Fast4HydrateHome_(){
  if(p5a1Fast4HomeHydrateStarted_||!sessionToken||!p5a1Fast4BootstrapNeedsRefresh_())return homeData;
  p5a1Fast4HomeHydrateStarted_=true;
  const t0=performance.now();
  try{
    const fresh=await call('home',{sessionToken});
    if(!fresh||!fresh.employee)throw new Error('FAST4 home refresh returned no employee');
    homeData=fresh;
    if(homeData.employee)setLanguage(preferredLanguageToUi_(homeData.employee.preferredLanguage||homeData.employee.language||'zh-TW'),true);
    fillLeaveTypes();
    fillProxyCandidates();
    setInboxCount(homeData.pendingApprovalCount||0);
    configureDashboardNav();
    configureHrCredentialNav();
    const homeEl=$('home'),accountEl=$('account');
    if(homeEl&&!homeEl.classList.contains('hide'))renderHome();
    if(accountEl&&!accountEl.classList.contains('hide'))renderMyAccount_();
    ABIS_PERF2_TIMING_.fast4HomeRefresh={ms:Math.max(0,Math.round(performance.now()-t0)),ok:true,at:abisPerf2Now_()};
    return homeData;
  }catch(e){
    p5a1Fast4HomeHydrateStarted_=false;
    ABIS_PERF2_TIMING_.fast4HomeRefresh={ms:Math.max(0,Math.round(performance.now()-t0)),ok:false,error:String(e&&e.message?e.message:e).slice(0,180),at:abisPerf2Now_()};
    return homeData;
  }
}
function enterApp(){clearMessage();if(homeData&&homeData.employee){setLanguage(preferredLanguageToUi_(homeData.employee.preferredLanguage||homeData.employee.language||'zh-TW'),true);}hideAuthScreens_();$('app').classList.remove('hide');document.body.classList.remove('inner-view');document.body.classList.add('home-view');fhInstallAttendanceForegroundRefresh_();const t0=performance.now(),fast4Bootstrap=p5a1Fast4BootstrapNeedsRefresh_(),bootRouteNow=p5rmBootRoute_();renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0);configureDashboardNav();configureHrCredentialNav();p5rmApplyBootRoute_();ABIS_PERF2_TIMING_.homeFirstPaint={ms:Math.max(0,Math.round(performance.now()-t0)),source:fast4Bootstrap?'fast4-bootstrap':'local-homeData',route:bootRouteNow,at:abisPerf2Now_()};if(fast4Bootstrap){abisPerf2Idle_(function(){p5a1Fast4HydrateHome_().then(function(){prefetchSecondaryData()})},1500)}else{abisPerf2Idle_(function(){prefetchSecondaryData()},800)}abisPerf2Idle_(function(){refreshLineBindingStatus()},1600);if(p5a1IsLineBoot_())setTimeout(function(){p5a1RestoreLineTimeoutDraft_()},0)}
async function boot(){if(p5a1IsLineFastBoot_()&&!p5a1LineFastWindowValid_()){p5a1RedirectToFullLiff_();return}if(!sessionToken){if(p5a1IsLineFastBoot_()){p5a1RedirectToFullLiff_();return}showLogin();return}if(p5a1BootSource_()==='LINE'&&homeData){enterApp();return}const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{homeData=await call('home',{sessionToken});enterApp();finishOperationSuccess_(op,nt('loadDone'),'')}catch(e){finishOperationFailure_(op,e);try{localStorage.removeItem('abis_session')}catch(x){}p5a1ClearLineFast_();sessionToken='';if(p5a1IsLineFastBoot_()){p5a1RedirectToFullLiff_();return}showLogin();message(e&&e.message?e.message:String(e))}}
async function prefetchSecondaryData(){
  if(prefetchStarted||!sessionToken)return;
  prefetchStarted=true;
  const failures=[],route=p5rmBootRoute_();
  const jobs=[];
  if(route!=='leaves')jobs.push(async function(){try{await abisPerf2LoadLeaves_();if(!$('home').classList.contains('hide'))renderHome()}catch(e){failures.push('我的假單')}});
  jobs.push(async function(){try{await abisPerf2LoadTaskSummary_();setInboxCount(Number(taskSummaryCache&&taskSummaryCache.total||0));if(!$('home').classList.contains('hide'))renderHome()}catch(e){failures.push('Unified Task Summary')}});
  jobs.push(async function(){try{await abisPerf2LoadNotifications_('ALL');if(!$('home').classList.contains('hide'))renderHome()}catch(e){failures.push('Notification Center')}});
  jobs.push(async function(){try{await abisPerf2LoadAttendance_(currentMonthKey());if(!$('home').classList.contains('hide'))renderHome()}catch(e){failures.push('我的出勤')}});
  if(route!=='inbox')jobs.push(async function(){try{await abisPerf2LoadTaskInbox_('ALL');setInboxCount(Number(taskSummaryCache&&taskSummaryCache.total||0));if(!$('home').classList.contains('hide'))renderHome()}catch(e){failures.push('待我處理')}});
  jobs.push(async function(){try{await abisPerf2LoadProxy_()}catch(e){proxyAssignmentsCache=[];failures.push('代理任務')}});
  let cursor=0;
  async function worker(){while(cursor<jobs.length){const i=cursor++;await jobs[i]();await new Promise(function(r){setTimeout(r,60)})}}
  await Promise.all([worker(),worker()]);
  if(!$('home').classList.contains('hide'))renderHome();
  if(typeof abisEssPerf2ManagementPrefetch_==='function')abisPerf2Idle_(function(){abisEssPerf2ManagementPrefetch_()},1800);
  if(failures.length)message(nt('partialLoadFail')+'：'+failures.join('、'),'warning')
}
async function hydrateFrozenHome_(){if(!sessionToken||attendanceCache||!$('home')||$('home').classList.contains('hide'))return;try{await abisPerf2LoadAttendance_(currentMonthKey());if(!$('home').classList.contains('hide'))renderHome()}catch(e){/* Home remains usable without attendance hydration. */}}
let FH_ATTENDANCE_FOREGROUND_INSTALLED_=false,FH_ATTENDANCE_REFRESH_TIMER_=0;
function fhRefreshAttendanceIfStale_(){
  if(!sessionToken||document.hidden||!$('home')||$('home').classList.contains('hide'))return;
  const month=currentMonthKey(),key='attendance:'+month;
  if(abisPerf2Fresh_(key,ABIS_PERF2_TTL_.attendance))return;
  return abisPerf2LoadAttendance_(month).then(function(){
    if($('home')&&!$('home').classList.contains('hide'))renderHome();
  }).catch(function(){});
}
function fhInstallAttendanceForegroundRefresh_(){
  if(FH_ATTENDANCE_FOREGROUND_INSTALLED_)return;
  FH_ATTENDANCE_FOREGROUND_INSTALLED_=true;
  document.addEventListener('visibilitychange',function(){if(!document.hidden)fhRefreshAttendanceIfStale_()});
  window.addEventListener('focus',function(){fhRefreshAttendanceIfStale_()});
  FH_ATTENDANCE_REFRESH_TIMER_=window.setInterval(function(){fhRefreshAttendanceIfStale_()},60000);
}
function canManageCredentials_(){const p=String(homeData&&homeData.employee&&homeData.employee.approvalPermission||'').toUpperCase();return p==='HR'||p==='ADMIN'}
function configureHrCredentialNav(){const nav=$('hrCredentialNav');if(!nav)return;nav.classList.toggle('hide',!canManageCredentials_());const label=nav.querySelector('.nav-label');if(label){label.dataset.i18n='hrCredentialAdmin';label.textContent=tr('hrCredentialAdmin')}}
function clearHrOneTimePin_(){const box=$('hrOneTimePinBox');if(box){box.innerHTML='';box.classList.add('hide')}}
function openHrCredentialAdmin(){if(!canManageCredentials_()){message('無權限');return}hideAppSections();$('hrCredentialAdmin').classList.remove('hide');configureHrCredentialNav()}
const ABIS_HR_ACCOUNT_I18N_={
  ZH:{credentialState:'帳號狀態',tempPinStatus:'臨時 PIN 狀態',accountLanguage:'帳號語言',accountLanguageHint:'帳號層語言，LINE／LIFF／Web ESS 共用',restoreLogin:'重設登入憑證',unknownStatus:'未知狀態',unknownDelivery:'未知交付狀態'},
  VI:{credentialState:'Trạng thái tài khoản',tempPinStatus:'Trạng thái PIN tạm thời',accountLanguage:'Ngôn ngữ tài khoản',accountLanguageHint:'Ngôn ngữ tài khoản dùng chung cho LINE / LIFF / Web ESS',restoreLogin:'Đặt lại thông tin đăng nhập',unknownStatus:'Trạng thái không xác định',unknownDelivery:'Trạng thái giao mã không xác định'},
  TH:{credentialState:'สถานะบัญชี',tempPinStatus:'สถานะ PIN ชั่วคราว',accountLanguage:'ภาษาบัญชี',accountLanguageHint:'ภาษาบัญชีใช้ร่วมกันสำหรับ LINE / LIFF / Web ESS',restoreLogin:'รีเซ็ตข้อมูลเข้าสู่ระบบ',unknownStatus:'สถานะไม่ทราบ',unknownDelivery:'สถานะการส่งมอบไม่ทราบ'}
};
function hrAccountText_(k){const d=ABIS_HR_ACCOUNT_I18N_[currentLang]||ABIS_HR_ACCOUNT_I18N_.ZH;return d[k]||ABIS_HR_ACCOUNT_I18N_.ZH[k]||k}
function hrStateText_(s){const code=String(s||'').toUpperCase();const zh={ACTIVE:'正常',TEMP_PIN_REQUIRED:'需要臨時 PIN',DISABLED:'已停用',NO_CREDENTIAL:'無登入憑證'};const vi={ACTIVE:'Đang hoạt động',TEMP_PIN_REQUIRED:'Cần PIN tạm thời',DISABLED:'Đã vô hiệu hóa',NO_CREDENTIAL:'Không có thông tin đăng nhập'};const th={ACTIVE:'ใช้งานปกติ',TEMP_PIN_REQUIRED:'ต้องใช้ PIN ชั่วคราว',DISABLED:'ปิดใช้งาน',NO_CREDENTIAL:'ไม่มีข้อมูลเข้าสู่ระบบ'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[code]||hrAccountText_('unknownStatus')}
function hrTempText_(s){const code=String(s||'').toUpperCase();const zh={NOT_REQUIRED:'不需要',ACTIVE:'有效中',EXPIRED:'已過期',EXHAUSTED:'錯誤次數已用盡',NOT_ISSUED:'尚未產生',VERIFIED_WAITING_NEW_PIN:'已驗證，等待設定新 PIN'};const vi={NOT_REQUIRED:'Không cần',ACTIVE:'Đang hiệu lực',EXPIRED:'Đã hết hạn',EXHAUSTED:'Đã hết số lần thử',NOT_ISSUED:'Chưa cấp',VERIFIED_WAITING_NEW_PIN:'Đã xác minh, chờ đặt PIN mới'};const th={NOT_REQUIRED:'ไม่จำเป็น',ACTIVE:'ยังใช้ได้',EXPIRED:'หมดอายุ',EXHAUSTED:'ใช้จำนวนครั้งผิดครบแล้ว',NOT_ISSUED:'ยังไม่ได้ออก',VERIFIED_WAITING_NEW_PIN:'ยืนยันแล้ว รอตั้ง PIN ใหม่'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[code]||hrAccountText_('unknownStatus')}
function hrDeliveryText_(s){const code=String(s||'').toUpperCase();const zh={NOT_ISSUED:'尚未產生',LINE_PENDING:'LINE 發送中',LINE_SENT:'LINE 已送達',LINE_FAILED:'LINE 發送失敗',HR_ONE_TIME_DISPLAY:'等待 HR 安全交付',HR_DELIVERED:'HR 已確認交付',VERIFIED_WAITING_NEW_PIN:'員工已驗證臨時 PIN',COMPLETED:'已完成',COMPLETED_BY_FORGOT_PIN:'已透過忘記 PIN 流程完成',EXPIRED:'已過期',EXHAUSTED:'已失效'};const vi={NOT_ISSUED:'Chưa cấp',LINE_PENDING:'Đang gửi LINE',LINE_SENT:'Đã gửi LINE',LINE_FAILED:'Gửi LINE thất bại',HR_ONE_TIME_DISPLAY:'Chờ HR giao an toàn',HR_DELIVERED:'HR đã xác nhận giao',VERIFIED_WAITING_NEW_PIN:'Nhân viên đã xác minh PIN tạm thời',COMPLETED:'Hoàn tất',COMPLETED_BY_FORGOT_PIN:'Đã hoàn tất qua quy trình Quên PIN',EXPIRED:'Hết hạn',EXHAUSTED:'Mất hiệu lực'};const th={NOT_ISSUED:'ยังไม่ได้ออก',LINE_PENDING:'กำลังส่ง LINE',LINE_SENT:'ส่ง LINE แล้ว',LINE_FAILED:'ส่ง LINE ไม่สำเร็จ',HR_ONE_TIME_DISPLAY:'รอ HR ส่งมอบอย่างปลอดภัย',HR_DELIVERED:'HR ยืนยันการส่งมอบแล้ว',VERIFIED_WAITING_NEW_PIN:'พนักงานยืนยัน PIN ชั่วคราวแล้ว',COMPLETED:'เสร็จสิ้น',COMPLETED_BY_FORGOT_PIN:'เสร็จสิ้นผ่านกระบวนการลืม PIN',EXPIRED:'หมดอายุ',EXHAUSTED:'ใช้ไม่ได้แล้ว'};const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;return m[code]||hrAccountText_('unknownDelivery')}
function hrFormatDateTime_(v){if(!v)return'-';try{return new Date(v).toLocaleString()}catch(e){return String(v)}}
async function hrSearchCredentialEmployees(){if(!canManageCredentials_()){message('無權限');return}const q=$('hrEmployeeQuery').value.trim();if(!q){message(tr('hrSearchPlaceholder'),'warning');return}clearHrOneTimePin_();const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{const list=await call('hrCredentialSearch',{sessionToken,query:q});hrCredentialResultsCache=Array.isArray(list)?list:[];renderHrCredentialResults_(hrCredentialResultsCache);finishOperationSuccess_(op,nt('loadDone'),'')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function renderHrCredentialResults_(list){const el=$('hrCredentialResults');if(!el)return;el.innerHTML=(list&&list.length)?list.map(x=>`<div class="hr-account"><b>${escapeHtml(x.name||'')} <span class="pill">${escapeHtml(x.employeeId||'')}</span></b><div class="tiny">${escapeHtml(x.department||'')}${x.location?' · '+escapeHtml(x.location):''}</div><div class="tiny" style="margin-top:5px">${escapeHtml(hrStateText_(x.credentialState))} · LINE ${escapeHtml(x.lineBound?tr('bound'):tr('unbound'))}</div><button class="secondary small" onclick="hrOpenCredential('${escapeHtml(x.employeeId||'')}')">${escapeHtml(tr('hrViewAccount'))}</button></div>`).join(''):`<div class="muted" style="margin-top:12px">${escapeHtml(tr('hrNoResults'))}</div>`}
async function hrOpenCredential(employeeId,preservePin){if(!preservePin)clearHrOneTimePin_();const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{const d=await call('hrCredentialDetail',{sessionToken,employeeId});hrCredentialSelected=d;renderHrCredentialDetail_(d);finishOperationSuccess_(op,nt('loadDone'),'')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function hrReasonOptions_(){return `<option value="FORGOT_PIN">${escapeHtml(tr('hrReasonForgot'))}</option><option value="DEVICE_ACCOUNT_ISSUE">${escapeHtml(tr('hrReasonDevice'))}</option><option value="NEW_EMPLOYEE">${escapeHtml(tr('hrReasonNew'))}</option><option value="SECURITY_RESET">${escapeHtml(tr('hrReasonSecurity'))}</option><option value="OTHER">${escapeHtml(tr('hrReasonOther'))}</option>`}
function hrPreferredLanguageEditor_(d){const p=String(d&&d.preferredLanguage||'zh-TW');return `<div class="hr-action-box"><h3>${escapeHtml(hrAccountText_('accountLanguage'))}</h3><div class="tiny">${escapeHtml(hrAccountText_('accountLanguageHint'))}</div><select id="hrPreferredLanguage" style="margin-top:8px"><option value="zh-TW" ${p==='zh-TW'?'selected':''}>繁體中文 · zh-TW</option><option value="vi-VN" ${p==='vi-VN'?'selected':''}>Tiếng Việt · vi-VN</option><option value="th-TH" ${p==='th-TH'?'selected':''}>ไทย · th-TH</option></select><button type="button" class="secondary" onclick="hrSavePreferredLanguage_(this)">${escapeHtml(currentLang==='VI'?'Lưu ngôn ngữ':currentLang==='TH'?'บันทึกภาษา':'儲存語言')}</button></div>`}
async function hrSavePreferredLanguage_(triggerBtn){const d=hrCredentialSelected,sel=$('hrPreferredLanguage');if(!d||!d.employeeId||!sel)return;const preferredLanguage=sel.value,op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);try{const r=await call('hrSetPreferredLanguage',{sessionToken,employeeId:d.employeeId,preferredLanguage});d.preferredLanguage=r.preferredLanguage;hrCredentialSelected=d;renderHrCredentialDetail_(d);if(homeData&&homeData.employee&&String(homeData.employee.id||'').toUpperCase()===String(d.employeeId||'').toUpperCase()){homeData.employee.preferredLanguage=r.preferredLanguage;setLanguage(preferredLanguageToUi_(r.preferredLanguage),true)}finishOperationSuccess_(op,currentLang==='VI'?'Đã lưu ngôn ngữ':currentLang==='TH'?'บันทึกภาษาแล้ว':'語言設定已儲存','')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function renderHrCredentialDetail_(d){
  const el=$('hrCredentialDetail');
  if(!el||!d)return;

  const credentialAction=d.credentialState==='ACTIVE'&&d.canRestore
    ?`<div class="hr-action-box"><h3>${escapeHtml(hrAccountText_('restoreLogin'))}</h3><label>${escapeHtml(tr('hrRestoreReason'))}</label><select id="hrResetReason">${hrReasonOptions_()}</select><label>${escapeHtml(tr('hrRestoreNote'))}</label><textarea id="hrResetNote"></textarea><button class="danger" onclick="hrRestoreSelectedCredential(this)">${escapeHtml(hrAccountText_('restoreLogin'))}</button></div>`
    :(d.canReissue?`<div class="hr-action-box"><button class="danger" onclick="hrReissueSelectedCredential(this)">${escapeHtml(tr('hrReissue'))}</button></div>`:'');

  const unbindAction=d.lineBound&&d.canUnbind
    ?`<div class="hr-action-box"><h3>${escapeHtml(tr('hrUnbindLine'))}</h3><div class="notice tiny">${escapeHtml(tr('hrUnbindHint'))}</div><button class="danger" onclick="hrUnbindSelectedLine(this)">${escapeHtml(tr('hrUnbindLine'))}</button></div>`
    :'';

  const credentialState=String(d.credentialState||'').toUpperCase();
  const tempPinStatus=String(d.temporaryPinStatus||'').toUpperCase();

  /*
   * Temporary PIN fields are contextual, not permanent account metadata.
   * ACTIVE accounts with NOT_REQUIRED must not show stale delivery/audit state.
   * Show these fields only while the account is actually in a Temporary PIN flow.
   */
  const showTempPin=[
    'ACTIVE',
    'EXPIRED',
    'EXHAUSTED',
    'NOT_ISSUED',
    'VERIFIED_WAITING_NEW_PIN'
  ].includes(tempPinStatus) || credentialState==='TEMP_PIN_REQUIRED';

  const tempPinStatusHtml=showTempPin
    ?`<div class="hr-status-box"><span>${escapeHtml(hrAccountText_('tempPinStatus'))}</span><b>${escapeHtml(hrTempText_(d.temporaryPinStatus))}</b></div>`+
     `<div class="hr-status-box"><span>${escapeHtml(tr('hrDeliveryStatus'))}</span><b>${escapeHtml(hrDeliveryText_(d.deliveryStatus)||'-')}</b></div>`+
     `<div class="hr-status-box"><span>${escapeHtml(tr('hrExpiresAt'))}</span><b>${escapeHtml(hrFormatDateTime_(d.expiresAt))}</b></div>`
    :'';

  el.innerHTML=`<div class="hr-action-box"><h3>${escapeHtml(tr('hrDetailTitle'))}</h3><b>${escapeHtml(d.name||'')} <span class="pill">${escapeHtml(d.employeeId||'')}</span></b><div class="tiny">${escapeHtml(d.department||'')}${d.location?' · '+escapeHtml(d.location):''}</div><div class="hr-status-grid"><div class="hr-status-box"><span>${escapeHtml(hrAccountText_('credentialState'))}</span><b>${escapeHtml(hrStateText_(d.credentialState))}</b></div><div class="hr-status-box"><span>${escapeHtml(tr('hrLineBinding'))}</span><b>${escapeHtml(d.lineBound?tr('bound'):tr('unbound'))}</b></div>${tempPinStatusHtml}</div>${hrPreferredLanguageEditor_(d)}${credentialAction}${unbindAction}</div>`;
}

function hrCredentialDangerConfirm_(kind,d){
  const mode=String(kind||'').toUpperCase();
  const name=String(d&&d.name||'');
  const employeeId=String(d&&d.employeeId||'');
  const lang=['VI','TH'].includes(currentLang)?currentLang:'ZH';
  const dict={
    ZH:{
      cancel:'取消',
      RESET:{title:'重設登入憑證？',confirm:'確認重設',body:'重設後：\n• 目前 Web Session 將失效\n• 目前 LINE Session 將失效\n• 員工需重新完成登入流程'},
      UNBIND:{title:'解除 LINE 綁定？',confirm:'確認解除',body:'只會：\n• 解除 LINE 綁定\n• 撤銷 LINE Session\n\n不會影響：\n• 個人 PIN\n• Web Session'}
    },
    VI:{
      cancel:'Hủy',
      RESET:{title:'Đặt lại thông tin đăng nhập?',confirm:'Xác nhận đặt lại',body:'Sau khi đặt lại:\n• Web Session hiện tại sẽ mất hiệu lực\n• LINE Session hiện tại sẽ mất hiệu lực\n• Nhân viên phải đăng nhập lại'},
      UNBIND:{title:'Hủy liên kết LINE?',confirm:'Xác nhận hủy liên kết',body:'Chỉ thực hiện:\n• Hủy liên kết LINE\n• Thu hồi LINE Session\n\nKhông ảnh hưởng:\n• PIN cá nhân\n• Web Session'}
    },
    TH:{
      cancel:'ยกเลิก',
      RESET:{title:'รีเซ็ตข้อมูลเข้าสู่ระบบ?',confirm:'ยืนยันการรีเซ็ต',body:'หลังรีเซ็ต:\n• Web Session ปัจจุบันจะหมดอายุ\n• LINE Session ปัจจุบันจะหมดอายุ\n• พนักงานต้องเข้าสู่ระบบใหม่'},
      UNBIND:{title:'ยกเลิกการเชื่อม LINE?',confirm:'ยืนยันการยกเลิก',body:'จะดำเนินการเฉพาะ:\n• ยกเลิกการเชื่อม LINE\n• เพิกถอน LINE Session\n\nไม่กระทบ:\n• PIN ส่วนบุคคล\n• Web Session'}
    }
  };
  const pack=dict[lang]||dict.ZH;
  const copy=pack[mode]||pack.RESET;
  return new Promise(function(resolve){
    const old=$('hrCredentialConfirmOverlay');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='hrCredentialConfirmOverlay';
    overlay.className='confirm-backdrop';
    overlay.setAttribute('role','presentation');
    overlay.innerHTML=`<div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="hrCredentialConfirmTitle"><h2 id="hrCredentialConfirmTitle">${escapeHtml(copy.title)}</h2><div class="confirm-body"><b>${escapeHtml(name)}（${escapeHtml(employeeId)}）</b><br><br>${escapeHtml(copy.body)}</div><div class="confirm-actions"><button type="button" class="secondary" data-hr-confirm-cancel>${escapeHtml(pack.cancel)}</button><button type="button" class="danger" data-hr-confirm-ok>${escapeHtml(copy.confirm)}</button></div></div>`;
    document.body.appendChild(overlay);
    const cancelBtn=overlay.querySelector('[data-hr-confirm-cancel]');
    const okBtn=overlay.querySelector('[data-hr-confirm-ok]');
    let settled=false;
    function close(result){
      if(settled)return;
      settled=true;
      document.removeEventListener('keydown',onKey,true);
      if(overlay&&overlay.isConnected)overlay.remove();
      resolve(!!result);
    }
    function onKey(e){
      if(e&&e.key==='Escape'){
        e.preventDefault();
        close(false);
      }
    }
    if(cancelBtn)cancelBtn.addEventListener('click',function(){close(false)});
    if(okBtn)okBtn.addEventListener('click',function(){close(true)});
    overlay.addEventListener('click',function(e){
      if(e.target===overlay){
        e.preventDefault();
      }
    });
    document.addEventListener('keydown',onKey,true);
    requestAnimationFrame(function(){try{cancelBtn&&cancelBtn.focus()}catch(ignore){}});
  });
}

async function hrRestoreSelectedCredential(triggerBtn){
  const d=hrCredentialSelected;
  if(!d||!d.employeeId)return;
  const reason=$('hrResetReason')?$('hrResetReason').value:'';
  const note=$('hrResetNote')?$('hrResetNote').value.trim():'';
  if(reason==='OTHER'&&!note){message(tr('hrRestoreNote'));return}
  const confirmed=await hrCredentialDangerConfirm_('RESET',d);
  if(!confirmed)return;
  mutationBusy=true;
  setAreaBusy_('hrCredentialAdmin',true);
  const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);
  try{
    const r=await call('hrRestoreFirstLogin',{sessionToken,employeeId:d.employeeId,reasonCode:reason,reasonNote:note,requestId:'HR-RESTORE-'+Date.now()+'-'+p4a13Uuid_()});
    const fresh=await call('hrCredentialDetail',{sessionToken,employeeId:d.employeeId});
    hrCredentialSelected=fresh;
    renderHrCredentialDetail_(fresh);
    finishOperationSuccess_(op,tr('hrResetDone'),'');
    if(r.displayOnce&&r.temporaryPin)hrShowOneTimePin_(r);
    else message(r.deliveryStatus==='LINE_SENT'?tr('hrLineSent'):tr('hrResetDone'),'success')
  }catch(e){
    finishOperationFailure_(op,e);
    message(e&&e.message?e.message:String(e))
  }finally{
    mutationBusy=false;
    setAreaBusy_('hrCredentialAdmin',false)
  }
}
async function hrReissueSelectedCredential(triggerBtn){const d=hrCredentialSelected;if(!d||!d.employeeId)return;const confirmText=currentLang==='VI'?'Tạo Temporary PIN mới? PIN cũ sẽ mất hiệu lực.':currentLang==='TH'?'สร้าง Temporary PIN ใหม่หรือไม่? PIN เดิมจะใช้ไม่ได้ทันที':'確定重新產生 Temporary PIN？舊的 Temporary PIN 將立即失效。';if(!confirm(confirmText))return;mutationBusy=true;setAreaBusy_('hrCredentialAdmin',true);const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);try{const r=await call('hrReissueTemporaryPin',{sessionToken,employeeId:d.employeeId,requestId:'HR-REISSUE-'+Date.now()+'-'+p4a13Uuid_()});const fresh=await call('hrCredentialDetail',{sessionToken,employeeId:d.employeeId});hrCredentialSelected=fresh;renderHrCredentialDetail_(fresh);finishOperationSuccess_(op,tr('hrResetDone'),'');if(r.displayOnce&&r.temporaryPin)hrShowOneTimePin_(r);else message(r.deliveryStatus==='LINE_SENT'?tr('hrLineSent'):tr('hrResetDone'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{mutationBusy=false;setAreaBusy_('hrCredentialAdmin',false)}}
async function hrUnbindSelectedLine(triggerBtn){
  const d=hrCredentialSelected;
  if(!d||!d.employeeId||!d.lineBound)return;
  const confirmed=await hrCredentialDangerConfirm_('UNBIND',d);
  if(!confirmed)return;
  mutationBusy=true;
  setAreaBusy_('hrCredentialAdmin',true);
  const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);
  try{
    const r=await call('hrUnbindLine',{sessionToken,employeeId:d.employeeId,requestId:'HR-UNBIND-'+Date.now()+'-'+p4a13Uuid_()});
    hrCredentialSelected=r.detail||null;
    if(hrCredentialSelected)renderHrCredentialDetail_(hrCredentialSelected);
    if(homeData&&homeData.employee&&String(homeData.employee.id||'').toUpperCase()===String(d.employeeId||'').toUpperCase()){
      lineBindingStatusCache=null;
      renderHome()
    }
    finishOperationSuccess_(op,tr('hrUnbindDone'),'');
    if(r.currentSessionRevoked){
      try{localStorage.removeItem('abis_session')}catch(e){}
      p5a1ClearLineFast_();
      sessionToken='';
      showLogin();
      message(tr('hrUnbindSelfLineSession'),'warning')
    }else{
      message(tr('hrUnbindDone'),'success')
    }
  }catch(e){
    finishOperationFailure_(op,e);
    message(e&&e.message?e.message:String(e))
  }finally{
    mutationBusy=false;
    setAreaBusy_('hrCredentialAdmin',false)
  }
}
function hrShowOneTimePin_(r){const box=$('hrOneTimePinBox');if(!box)return;box.innerHTML=`<div class="temp-pin-once"><h3>${escapeHtml(tr('hrOneTimeTitle'))}</h3><div class="temp-pin-code">${escapeHtml(r.temporaryPin||'')}</div><div class="tiny">${escapeHtml(tr('hrOneTimeWarning'))}<br>${escapeHtml(tr('hrExpiresAt'))}：${escapeHtml(hrFormatDateTime_(r.expiresAt))}</div><button onclick="hrAcknowledgePinDelivery('${escapeHtml(r.employeeId||'')}','${escapeHtml(r.tempPinEventId||'')}',this)">${escapeHtml(tr('hrDelivered'))}</button></div>`;box.classList.remove('hide');try{box.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}}
async function hrAcknowledgePinDelivery(employeeId,eventId,triggerBtn){const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);try{const d=await call('hrAcknowledgeTemporaryPinDelivery',{sessionToken,employeeId,tempPinEventId:eventId});clearHrOneTimePin_();hrCredentialSelected=d;renderHrCredentialDetail_(d);finishOperationSuccess_(op,tr('hrDelivered'),'');message(tr('hrDelivered'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}

function configureDashboardNav(){const nav=$('dashboardNav');if(!nav)return;const d=homeData&&homeData.leaveDashboard;nav.classList.toggle('hide',!(d&&d.canView));const key=d&&d.isTopApprover?'companyDashboard':'leaveDashboard';const label=nav.querySelector('.nav-label');if(label){label.dataset.i18n=key;label.textContent=tr(key)}}
function lineBindingCardHtml(){const s=lineBindingStatusCache,loading=lineBindingLoading&&s===null;if(loading||s===null)return `<div class="line-card"><div class="line-card-title"><span>${tr('lineNotice')}</span><span class="pill">${tr('checking')}</span></div><div class="line-status"><span class="line-dot"></span><span>${tr('checkingBinding')}</span></div><div class="line-meta">${tr('lineOnlyNotice')}</div><button class="secondary small" disabled>${tr('loading')}</button></div>`;if(s&&s.error)return `<div class="line-card"><div class="line-card-title"><span>${tr('lineNotice')}</span><span class="pill">${escapeHtml(nt('lineCheckFail'))}</span></div><div class="line-status"><span class="line-dot warn"></span><span>${escapeHtml(nt('lineCheckFail'))}</span></div><div class="line-meta">${escapeHtml(s.error)}</div><button class="secondary small" onclick="refreshLineBindingStatus(true)">${escapeHtml(nt('retrySync'))}</button></div>`;if(s.bound){const verified=s.lastVerifiedAt?escapeHtml(s.lastVerifiedAt):tr('noRecord'),notify=s.notificationsEnabled?tr('enabled'):tr('disabled'),notified=s.lastNotificationAt?`<br>${tr('lastNotify')}：${escapeHtml(s.lastNotificationAt)}`:'';return `<div class="line-card"><div class="line-card-title"><span>${tr('lineNotice')}</span><span class="pill">${tr('bound')}</span></div><div class="line-status"><span class="line-dot bound"></span><span>${tr('lineBound')}</span></div><div class="line-meta">${tr('notify')}：${notify}<br>${tr('lastVerify')}：${verified}${notified}<br>${tr('lineOnlyNotice')}</div><button id="lineBindBtn" class="secondary small" onclick="startLineBind()">${tr('reverifyLine')}</button></div>`}return `<div class="line-card"><div class="line-card-title"><span>${tr('lineNotice')}</span><span class="pill">${tr('unbound')}</span></div><div class="line-status"><span class="line-dot warn"></span><span>${tr('lineUnbound')}</span></div><div class="line-meta">${tr('lineUnboundHint')}</div><button id="lineBindBtn" class="small" onclick="startLineBind()">${tr('bindLine')}</button></div>`}
function renderLineBindingStatus(){const el=$('lineBindingBox');if(el)el.innerHTML=lineBindingCardHtml()}async function refreshLineBindingStatus(force){if(!sessionToken||lineBindingLoading)return;if(lineBindingStatusCache!==null&&!force){renderLineBindingStatus();if($('account')&&!$('account').classList.contains('hide'))renderMyAccount_();return}lineBindingLoading=true;renderLineBindingStatus();try{lineBindingStatusCache=await call('lineBindingStatus',{sessionToken})}catch(e){lineBindingStatusCache={bound:false,error:e&&e.message?e.message:String(e)}}finally{lineBindingLoading=false;renderLineBindingStatus();if($('account')&&!$('account').classList.contains('hide'))renderMyAccount_()}}
async function startLineBind(){if(!sessionToken){message(tr('loginExpired'));showLogin();return}const btn=$('lineBindBtn'),op=beginOperation_(nt('lineSending'),nt('doNotRepeat'));try{if(btn){btn.disabled=true;btn.textContent=nt('transmitting')}const r=await call('beginLineBind',{sessionToken});if(!r||!r.authorizationUrl)throw new Error('LINE authorization URL missing');if(btn){const link=document.createElement('a');link.id='lineAuthLink';link.className='line-auth-link';link.href=r.authorizationUrl;link.target='_top';link.textContent=lineBindingStatusCache&&lineBindingStatusCache.bound?tr('goLineReverify'):tr('goLineBind');btn.replaceWith(link)}finishOperationSuccess_(op,tr('lineReady'),'');message(tr('lineReady'),'success')}catch(e){finishOperationFailure_(op,e);if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=lineBindingStatusCache&&lineBindingStatusCache.bound?tr('reverifyLine'):tr('bindLine')}message(e&&e.message?e.message:String(e))}}
function proxyAssignmentsHtml(){if(proxyAssignmentsCache===null)return '';if(!proxyAssignmentsCache.length)return '';return `<div class="proxy-card"><div class="leave-total-title">${tr('myProxyAssignments')}</div>${proxyAssignmentsCache.map(x=>`<div class="proxy-item"><b>${escapeHtml(x.employeeName)}（${escapeHtml(x.employeeId)}）</b><br><span class="tiny">${tr('date')}：${escapeHtml(x.startDate)}${x.endDate&&x.endDate!==x.startDate?' ～ '+escapeHtml(x.endDate):''}｜${Number(x.days||0).toFixed(1)} ${tr('days')} / ${Number(x.hours||0).toFixed(1)} HR｜${statusLabel(x.status)}</span>${x.handover?`<br><span class="tiny">${tr('handoverShort')}：${escapeHtml(x.handover)}</span>`:''}</div>`).join('')}</div>`}
function annualQuotaHtml_(){if(!homeData||!homeData.canSubmitLeave||!homeData.leaveAnnualQuota)return '';const q=homeData.leaveAnnualQuota||{};const fmt=n=>Number(n||0).toFixed(2);const zh=currentLang==='ZH';const vi=currentLang==='VI';const title=zh?'年度假別額度':vi?'Hạn mức nghỉ hằng năm':'สิทธิการลารายปี';const pp=zh?'事假共同池':vi?'Nhóm nghỉ việc riêng':'โควตาลากิจรวม';const fc=zh?'家庭照顧假':vi?'Nghỉ chăm sóc gia đình':'ลาเพื่อดูแลครอบครัว';const sk=zh?'未住院普通傷病假':vi?'Nghỉ ốm thông thường (không nằm viện)':'ลาป่วยทั่วไป (ไม่ได้นอนโรงพยาบาล)';return `<div class="leave-total-box"><div class="leave-total-title">${title}</div><div class="leave-total-row"><span>${pp}</span><span>${fmt(q.personalPool)} / 14.00</span></div><div class="leave-total-row"><span>${fc}</span><span>${fmt(q.familyCare)} / 7.00</span></div><div class="leave-total-row"><span>${sk}</span><span>${fmt(q.sick)} / 30.00</span></div></div>`;}


const RC2_ACCOUNT_I18N={
ZH:{account:'我的帳號',personal:'個人資料',language:'語言設定',changePin:'修改 PIN',line:'LINE 綁定狀態',contactHr:'聯絡 HR',inquiries:'我的詢問',management:'管理工具',logout:'登出',employeeId:'員工編號',category:'身分類別',department:'部門',location:'工作地點',shift:'班別',permission:'權限',bound:'已綁定',unbound:'未綁定',localLanguageNote:'此設定為帳號層 PreferredLanguage，LINE 通知、LIFF 與 Web ESS 共用；缺值預設繁體中文。',changePinHint:'目前安全規則沿用 LINE 驗證的 PIN 重設流程。系統會先安全登出，再進入既有的 LINE 驗證重設流程。',contactHrHint:'請透過 ABIS 官方 LINE 對話視窗聯絡 HR。目前系統尚未建立 HR 詢問送件 API。',inquiriesHint:'目前尚無可讀取的「我的詢問」資料來源；此入口先保留，不會建立假的詢問紀錄。',managementNone:'此帳號目前沒有管理工具權限。',accountManagement:'帳號管理',recent:'近期紀錄'},
VI:{account:'Tài khoản của tôi',personal:'Thông tin cá nhân',language:'Ngôn ngữ',changePin:'Đổi PIN',line:'Trạng thái LINE',contactHr:'Liên hệ HR',inquiries:'Câu hỏi của tôi',management:'Công cụ quản lý',logout:'Đăng xuất',employeeId:'Mã nhân viên',category:'Loại nhân viên',department:'Bộ phận',location:'Địa điểm',shift:'Ca',permission:'Quyền',bound:'Đã liên kết',unbound:'Chưa liên kết',localLanguageNote:'Đây là PreferredLanguage cấp tài khoản, dùng chung cho thông báo LINE, LIFF và Web ESS; mặc định là tiếng Trung phồn thể.',changePinHint:'Quy tắc an toàn hiện dùng quy trình đặt lại PIN qua xác minh LINE. Hệ thống sẽ đăng xuất an toàn trước rồi mở quy trình đặt lại hiện có.',contactHrHint:'Hãy liên hệ HR trong cuộc trò chuyện LINE chính thức của ABIS. Hiện hệ thống chưa có API gửi yêu cầu HR.',inquiriesHint:'Hiện chưa có nguồn dữ liệu cho “Câu hỏi của tôi”; mục này được giữ lại và không tạo dữ liệu giả.',managementNone:'Tài khoản này hiện không có quyền công cụ quản lý.',accountManagement:'Quản lý tài khoản',recent:'Gần đây'},
TH:{account:'บัญชีของฉัน',personal:'ข้อมูลส่วนตัว',language:'ภาษา',changePin:'เปลี่ยน PIN',line:'สถานะการเชื่อม LINE',contactHr:'ติดต่อ HR',inquiries:'คำถามของฉัน',management:'เครื่องมือจัดการ',logout:'ออกจากระบบ',employeeId:'รหัสพนักงาน',category:'ประเภทพนักงาน',department:'แผนก',location:'สถานที่ทำงาน',shift:'กะ',permission:'สิทธิ์',bound:'เชื่อมแล้ว',unbound:'ยังไม่เชื่อม',localLanguageNote:'นี่คือ PreferredLanguage ระดับบัญชี ใช้ร่วมกันสำหรับ LINE, LIFF และ Web ESS; หากไม่มีค่าจะใช้ภาษาจีนตัวเต็ม',changePinHint:'กฎความปลอดภัยปัจจุบันใช้ขั้นตอนรีเซ็ต PIN ผ่านการยืนยัน LINE ระบบจะออกจากระบบอย่างปลอดภัยก่อน แล้วเปิดขั้นตอนรีเซ็ตที่มีอยู่',contactHrHint:'กรุณาติดต่อ HR ผ่านหน้าสนทนา LINE Official ของ ABIS ขณะนี้ระบบยังไม่มี API ส่งคำถามถึง HR',inquiriesHint:'ขณะนี้ยังไม่มีแหล่งข้อมูล “คำถามของฉัน”; เก็บทางเข้านี้ไว้โดยไม่สร้างข้อมูลปลอม',managementNone:'บัญชีนี้ไม่มีสิทธิ์ใช้เครื่องมือจัดการในขณะนี้',accountManagement:'จัดการบัญชี',recent:'รายการล่าสุด'}
};
function acct_(k){return (RC2_ACCOUNT_I18N[currentLang]&&RC2_ACCOUNT_I18N[currentLang][k])||RC2_ACCOUNT_I18N.ZH[k]||k}
function rc2AccountRoleText_(e){const parts=[e.category,e.department].filter(Boolean);return parts.join('｜')||String(e.approvalPermission||'')}
function rc2AccountLineValue_(){if(lineBindingLoading&&lineBindingStatusCache===null)return tr('checking');if(lineBindingStatusCache&&lineBindingStatusCache.error)return nt('lineCheckFail');return lineBindingStatusCache&&lineBindingStatusCache.bound?acct_('bound'):acct_('unbound')}
function rc2CanViewDashboard_(){const d=homeData&&homeData.leaveDashboard;return !!(d&&d.canView)}
function rc2ManagementToolsHtml_(){const tools=[];if(rc2CanViewDashboard_()){const d=homeData.leaveDashboard||{},label=d.isTopApprover?tr('companyDashboard'):tr('leaveDashboard');tools.push(`<button type="button" class="secondary" onclick="refreshDashboard()">${escapeHtml(label)}</button>`)}if(canManageCredentials_())tools.push(`<button type="button" class="secondary" onclick="openHrCredentialAdmin()">${escapeHtml(acct_('accountManagement'))}</button>`);return tools.length?`<div class="rc2-management-grid">${tools.join('')}</div>`:`<div class="muted">${escapeHtml(acct_('managementNone'))}</div>`}
function rc2AccountPanelHtml_(panel){const e=homeData&&homeData.employee||{};if(panel==='personal')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('personal'))}</h3><div class="rc2-account-detail"><span>${escapeHtml(acct_('employeeId'))}</span><span>${escapeHtml(e.id||'—')}</span><span>${escapeHtml(acct_('category'))}</span><span>${escapeHtml(e.category||'—')}</span><span>${escapeHtml(acct_('department'))}</span><span>${escapeHtml(e.department||'—')}</span><span>${escapeHtml(acct_('location'))}</span><span>${escapeHtml(e.location||'—')}</span><span>${escapeHtml(acct_('shift'))}</span><span>${escapeHtml(e.shift||'—')}</span><span>${escapeHtml(acct_('permission'))}</span><span>${escapeHtml(e.approvalPermission||'—')}</span></div></div>`;if(panel==='language')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('language'))}</h3><div class="rc2-lang-grid"><button type="button" class="${currentLang==='ZH'?'':'secondary'}" onclick="setPreferredLanguageUi_('ZH',this)">繁體中文</button><button type="button" class="${currentLang==='VI'?'':'secondary'}" onclick="setPreferredLanguageUi_('VI',this)">Tiếng Việt</button><button type="button" class="${currentLang==='TH'?'':'secondary'}" onclick="setPreferredLanguageUi_('TH',this)">ไทย</button></div><div class="tiny muted" style="margin-top:10px">${escapeHtml(acct_('localLanguageNote'))}</div></div>`;if(panel==='line')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('line'))}</h3><div id="lineBindingBox">${lineBindingCardHtml()}</div></div>`;if(panel==='changePin')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('changePin'))}</h3><div class="notice tiny">${escapeHtml(acct_('changePinHint'))}</div><button type="button" class="secondary" onclick="rc2BeginChangePin_()">${escapeHtml(acct_('changePin'))}</button></div>`;if(panel==='contact')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('contactHr'))}</h3><div class="notice tiny">${escapeHtml(acct_('contactHrHint'))}</div></div>`;if(panel==='inquiries')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('inquiries'))}</h3><div class="muted">${escapeHtml(acct_('inquiriesHint'))}</div></div>`;if(panel==='management')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('management'))}</h3>${rc2ManagementToolsHtml_()}</div>`;return ''}
function rc2OpenAccountPanel_(panel){accountPanel_=String(panel||'');renderMyAccount_();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}}
function renderMyAccount_(){const box=$('accountContent');if(!box||!homeData)return;const e=homeData.employee||{},name=String(e.name||e.id||'ABIS'),role=rc2AccountRoleText_(e),lang=preferredLanguageLabel_(e.preferredLanguage||uiToPreferredLanguage_(currentLang)),managementVisible=rc2CanViewDashboard_()||canManageCredentials_();if(accountPanel_){box.innerHTML=`<div class="rc2-account-wrap"><div id="accountPanel">${rc2AccountPanelHtml_(accountPanel_)}</div></div>`;if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();return}box.innerHTML=`<div class="rc2-account-wrap"><h2 style="margin:0">${escapeHtml(acct_('account'))}</h2><div class="rc2-account-profile"><div class="rc2-account-avatar">${escapeHtml((name.trim().charAt(0)||'A').toUpperCase())}</div><div><div class="rc2-account-name">${escapeHtml(name)}</div><div class="rc2-account-meta">${escapeHtml(role)}</div></div></div><div class="rc2-account-menu"><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('personal')"><b>${escapeHtml(acct_('personal'))}</b><span class="rc2-value">${escapeHtml(e.id||'')}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('language')"><b>${escapeHtml(acct_('language'))}</b><span class="rc2-value">${escapeHtml(lang)}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('changePin')"><b>${escapeHtml(acct_('changePin'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('line')"><b>${escapeHtml(acct_('line'))}</b><span class="rc2-value">${escapeHtml(rc2AccountLineValue_())}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('contact')"><b>${escapeHtml(acct_('contactHr'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('inquiries')"><b>${escapeHtml(acct_('inquiries'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button>${managementVisible?`<button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('management')"><b>${escapeHtml(acct_('management'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button>`:''}</div><button type="button" class="rc2-account-logout" onclick="logout()">${escapeHtml(acct_('logout'))}</button></div>`;if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function showMyAccount_(){hideAppSections();document.body.classList.remove('home-view');const el=$('account');if(!el)return;el.classList.remove('hide');renderMyAccount_();refreshLineBindingStatus();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}}
async function rc2BeginChangePin_(){const eid=String(homeData&&homeData.employee&&homeData.employee.id||rememberedEmployeeId||'').toUpperCase();await logout();if(eid){rememberedEmployeeId=eid;try{localStorage.setItem('abis_employee_id',eid)}catch(e){}const loginId=$('loginId');if(loginId)loginId.value=eid}showForgotPin();const f=$('forgotEmployeeId');if(f&&eid)f.value=eid}
function rc2TodayKey_(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function rc2SafeDomId_(v){return String(v||'').replace(/[^A-Za-z0-9_-]/g,'_')}
function rc2RecentTimestamp_(v,fallback){const candidates=[v&&v.updatedAt,v&&v.lastUpdatedAt,v&&v.submittedAt,v&&v.createdAt,v&&v.appliedAt,fallback];for(const x of candidates){if(!x)continue;const t=Date.parse(String(x));if(Number.isFinite(t))return t}return 0}
function fhRecentItems_(limit){const items=[];(Array.isArray(myLeavesCache)?myLeavesCache:[]).forEach(x=>{const date=String(x.startDate||''),stamp=rc2RecentTimestamp_(x,date),leaveId=String(x.leaveId||'');items.push({kind:'LEAVE',stamp,date,label:leaveTypeLabel(x)+(x.hours!=null?' · '+String(x.hours)+' HR':''),state:statusLabel(x.status),bad:String(x.status||'').toUpperCase()==='RETURNED',target:leaveId})});if(attendanceCache&&Array.isArray(attendanceCache.days)){attendanceCache.days.forEach(d=>{if(!d||!d.date)return;const noPunch=!d.firstIn&&!d.lastOut&&Number(d.actualHours||0)<=0,leave=p5a2LeaveForDate_(d.date);if(leave&&noPunch)return;const meaningful=!!(d.firstIn||d.lastOut||d.anomalyCode||Number(d.actualHours||0)>0||Number(d.leaveHours||0)>0);if(!meaningful)return;const st=p5a2AttendanceStatus_(d),label=d.anomalyDescription||d.anomalyCode||(currentLang==='VI'?'Chấm công':currentLang==='TH'?'บันทึกเวลา':'出勤')+(Number(d.actualHours||0)>0?' · '+p5a2AttendanceFmt_(d.actualHours)+' HR':'');items.push({kind:'ATTENDANCE',stamp:rc2RecentTimestamp_(d,d.date+'T23:59:59'),date:String(d.date||''),label:label,state:st.text,bad:!!d.anomalyCode,target:String(d.date||'')})})}items.sort((a,b)=>b.stamp-a.stamp||String(b.date).localeCompare(String(a.date)));return items.slice(0,Number(limit||3))}
function fhRecentItemHtml_(x){const dt=String(x.date||'').slice(5).replace('-','/'),action=x.kind==='LEAVE'?`openLeaveDetail_('${encodeURIComponent(String(x.target||''))}')`:`openAttendanceDate_('${encodeURIComponent(String(x.target||''))}')`;return `<button type="button" class="fh-list-row" onclick="${action}"><span class="fh-list-date">${escapeHtml(dt||'—')}</span><span class="fh-list-main">${escapeHtml(x.label||'')}</span><span class="fh-list-state ${x.bad?'bad':''}">${escapeHtml(x.state||'')}</span><span class="fh-chevron">›</span></button>`}
function renderRecentRecords_(){const title=$('recentRecordsTitle'),list=$('recentRecordsList');if(title)title.textContent=acct_('recent');if(list){const items=fhRecentItems_(20);list.innerHTML=items.length?items.map(fhRecentItemHtml_).join(''):`<div class="muted">${escapeHtml(fht_('noRecent'))}</div>`}}
function showRecentRecords_(){hideAppSections();const el=$('recentRecords');if(!el)return;el.classList.remove('hide');renderRecentRecords_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}}
function rc2ApplyAttendanceFocus_(){const date=String(attendanceFocusDate_||'');if(!date)return;attendanceFocusDate_='';const id='attendance-day-'+rc2SafeDomId_(date);requestAnimationFrame(()=>{const el=$(id);if(!el)return;el.classList.add('rc2-focus-target');try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){el.scrollIntoView()};setTimeout(()=>el.classList.remove('rc2-focus-target'),1600)})}
async function openAttendanceDate_(encodedDate,triggerBtn){const date=decodeURIComponent(String(encodedDate||''));if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){await refreshMyAttendance(triggerBtn);return}attendanceFocusDate_=date;attendanceViewMode='detail';const monthEl=$('attendanceMonth');if(monthEl)monthEl.value=date.slice(0,7);if(!attendanceCache||String(attendanceCache.month||'')!==date.slice(0,7))attendanceCache=null;await refreshMyAttendance(triggerBtn);rc2ApplyAttendanceFocus_()}
async function openTodayAttendance_(triggerBtn){return openAttendanceDate_(encodeURIComponent(rc2TodayKey_()),triggerBtn)}
function rc2ScrollLeave_(leaveId){const id='leave-detail-'+rc2SafeDomId_(leaveId);requestAnimationFrame(()=>{const el=$(id);if(!el)return;el.classList.add('rc2-focus-target');try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){el.scrollIntoView()};setTimeout(()=>el.classList.remove('rc2-focus-target'),1600)})}
async function openLeaveDetail_(encodedLeaveId){const leaveId=decodeURIComponent(String(encodedLeaveId||''));await refreshLeaves(leaveId)}

const FROZEN_HOME_I18N={
ZH:{tagline:'更簡單的工作．更好的每一天',viaLine:'由 LINE 進入',viaWeb:'WEB 登入',dashboard:'Dashboard',today:'今日狀態',todayShift:'今日班別',clockIn:'上班時間',clockOut:'下班時間',todayState:'今日狀態',normal:'正常',notYet:'尚未到班',waiting:'等待打卡',inProgress:'出勤中',leaveDay:'請假',restDay:'排休',missingIn:'缺上班卡',missingOut:'缺下班卡',late:'遲到',early:'早退',correctionPending:'補正處理中',anomaly:'出勤異常',safe:'平安出勤\n是最好的開始！',tasks:'待處理事項',viewAll:'查看全部',returned:'請假退回',attendanceException:'出勤異常',pendingApproval:'待簽核',supplement:'補件',recent:'近期紀錄',quick:'快捷入口',requestLeave:'我要請假',requestLeaveSub:'申請各類假別',myLeaves:'我的假單',myLeavesSub:'查詢申請進度',myAttendance:'我的出勤',myAttendanceSub:'查看打卡與出勤紀錄',inbox:'待我處理',inboxSub:'審核與待辦事項',notices:'通知摘要',noNotice:'目前沒有新通知',noRecent:'目前沒有近期紀錄',leaveReturnedNotice:'有 {n} 筆假單被退回，請確認內容',attendanceNotice:'有 {n} 筆出勤異常待確認',approvalNotice:'有 {n} 筆待處理事項',justNow:'目前',loading:'載入中',notificationCenter:'通知中心'},
VI:{tagline:'Công việc đơn giản hơn · Mỗi ngày tốt hơn',viaLine:'Mở từ LINE',viaWeb:'Đăng nhập WEB',dashboard:'Dashboard',today:'Hôm nay',todayShift:'Ca hôm nay',clockIn:'Giờ vào',clockOut:'Giờ ra',todayState:'Trạng thái',normal:'Bình thường',notYet:'Chưa đến ca',waiting:'Chờ chấm công',inProgress:'Đang làm việc',leaveDay:'Nghỉ phép',restDay:'Ngày nghỉ',missingIn:'Thiếu giờ vào',missingOut:'Thiếu giờ ra',late:'Đi muộn',early:'Về sớm',correctionPending:'Đang xử lý điều chỉnh',anomaly:'Bất thường',safe:'Đi làm an toàn\nKhởi đầu ngày tốt đẹp!',tasks:'Việc cần xử lý',viewAll:'Xem tất cả',returned:'Đơn bị trả',attendanceException:'Bất thường',pendingApproval:'Chờ duyệt',supplement:'Bổ sung',recent:'Gần đây',quick:'Truy cập nhanh',requestLeave:'Xin nghỉ',requestLeaveSub:'Gửi đơn nghỉ',myLeaves:'Đơn của tôi',myLeavesSub:'Xem tiến độ',myAttendance:'Chấm công',myAttendanceSub:'Xem chấm công',inbox:'Chờ tôi xử lý',inboxSub:'Duyệt và xử lý',notices:'Thông báo',noNotice:'Hiện không có thông báo mới',noRecent:'Hiện không có bản ghi gần đây',leaveReturnedNotice:'Có {n} đơn bị trả lại',attendanceNotice:'Có {n} bất thường chấm công cần xác nhận',approvalNotice:'Có {n} việc đang chờ xử lý',justNow:'Hiện tại',loading:'Đang tải',notificationCenter:'Trung tâm thông báo'},
TH:{tagline:'ทำงานง่ายขึ้น · ทุกวันดีขึ้น',viaLine:'เข้าจาก LINE',viaWeb:'เข้าสู่ระบบ WEB',dashboard:'Dashboard',today:'สถานะวันนี้',todayShift:'กะวันนี้',clockIn:'เวลาเข้า',clockOut:'เวลาออก',todayState:'สถานะวันนี้',normal:'ปกติ',notYet:'ยังไม่ถึงเวลาเข้างาน',waiting:'รอลงเวลาเข้างาน',inProgress:'กำลังทำงาน',leaveDay:'ลา',restDay:'วันหยุด',missingIn:'ขาดเวลาเข้า',missingOut:'ขาดเวลาออก',late:'มาสาย',early:'ออกก่อนเวลา',correctionPending:'กำลังดำเนินการแก้ไข',anomaly:'เวลาผิดปกติ',safe:'เข้างานอย่างปลอดภัย\nเริ่มต้นวันที่ดี!',tasks:'งานที่ต้องจัดการ',viewAll:'ดูทั้งหมด',returned:'ใบลาถูกส่งกลับ',attendanceException:'เวลาผิดปกติ',pendingApproval:'รออนุมัติ',supplement:'เอกสารเพิ่ม',recent:'รายการล่าสุด',quick:'ทางลัด',requestLeave:'ขอลา',requestLeaveSub:'ยื่นคำขอลา',myLeaves:'ใบลาของฉัน',myLeavesSub:'ดูความคืบหน้า',myAttendance:'เวลาทำงาน',myAttendanceSub:'ดูบันทึกเวลา',inbox:'รอฉันจัดการ',inboxSub:'อนุมัติและงานค้าง',notices:'สรุปการแจ้งเตือน',noNotice:'ไม่มีการแจ้งเตือนใหม่',noRecent:'ไม่มีรายการล่าสุด',leaveReturnedNotice:'มีใบลาถูกส่งกลับ {n} รายการ',attendanceNotice:'มีข้อมูลเวลาผิดปกติ {n} รายการ',approvalNotice:'มีงานรอดำเนินการ {n} รายการ',justNow:'ขณะนี้',loading:'กำลังโหลด',notificationCenter:'ศูนย์แจ้งเตือน'}
};
function fht_(k){return (FROZEN_HOME_I18N[currentLang]&&FROZEN_HOME_I18N[currentLang][k])||FROZEN_HOME_I18N.ZH[k]||k}
function fhFmt_(s,n){return String(s||'').replace('{n}',String(n))}
function fhLocale_(){return currentLang==='VI'?'vi-VN':currentLang==='TH'?'th-TH':'zh-TW'}
function fhDate_(){try{return new Intl.DateTimeFormat(fhLocale_(),{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date())}catch(e){return new Date().toLocaleDateString()}}
function fhTime_(v){if(!v)return '—';const x=String(v);const m=x.match(/(?:T|\s)(\d{2}:\d{2})/);return m?m[1]:(/^\d{1,2}:\d{2}/.test(x)?x.slice(0,5):x)}
function fhTodayAttendance_(){const days=attendanceCache&&Array.isArray(attendanceCache.days)?attendanceCache.days:[];const d=new Date(),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return days.find(x=>String(x.date)===key)||(homeData&&(homeData.todayAttendance||homeData.today))||null}
function fhTodayStatus_(d){
  if(!d)return '—';
  const leave=p5a2LeaveForDate_(d.date),noPunch=!d.firstIn&&!d.lastOut&&Number(d.actualHours||0)<=0;
  if(leave&&noPunch&&Number(d.expectedHours||0)>0)return p5a2LeaveWorkflowStatus_(leave).text;
  const raw=String(d.attendanceStatus||d.todayStatus||d.statusText||'').trim();
  if((raw==='出勤進行中'||raw==='IN_PROGRESS'||raw==='ON_DUTY')&&!d.firstIn&&!d.lastOut&&d.expectedStart){
    const date=String(d.date||'').slice(0,10),time=String(d.expectedStart||'').match(/(\d{1,2}):(\d{2})/);
    if(date&&time){
      const p=date.split('-').map(Number),start=new Date(p[0],p[1]-1,p[2],Number(time[1]),Number(time[2]),0,0).getTime(),now=Date.now();
      if(isFinite(start)){
        if(now<start)return fht_('notYet');
        if(now<=start+15*60000)return fht_('waiting');
        return fht_('missingIn');
      }
    }
  }
  const code=raw.toUpperCase().replace(/[\s-]+/g,'_');
  const direct={
    '尚未到班':'notYet','待出勤':'notYet','NOT_STARTED':'notYet','WAITING':'notYet','PENDING':'notYet',
    '出勤中':'inProgress','出勤進行中':'inProgress','部分請假（當日進行中）':'inProgress','WORKING':'inProgress','IN_PROGRESS':'inProgress','ON_DUTY':'inProgress',
    '正常':'normal','出勤':'normal','NORMAL':'normal','COMPLETE':'normal','COMPLETED':'normal',
    '請假':'leaveDay','LEAVE':'leaveDay','LEAVE_DAY':'leaveDay',
    '排休':'restDay','休假':'restDay','OFF':'restDay','REST':'restDay','REST_DAY':'restDay',
    '缺上班卡':'missingIn','MISSING_IN':'missingIn',
    '缺下班卡':'missingOut','MISSING_OUT':'missingOut',
    '遲到':'late','LATE':'late','LATE_OVER_60':'late',
    '早退':'early','EARLY':'early','EARLY_LEAVE':'early',
    '補正處理中':'correctionPending','CORRECTION_PENDING':'correctionPending'
  };
  const directKey=direct[raw]||direct[code];
  if(directKey)return fht_(directKey);
  if(Number(d.leaveHours||0)>0)return fht_('leaveDay');
  if(Number(d.expectedHours||0)<=0&&Number(d.actualHours||0)<=0)return fht_('restDay');
  const correctionStatus=String((d.activeCorrection&&d.activeCorrection.status)||d.correctionStatus||'').toUpperCase();
  if(['SUBMITTED','MANAGER_CONFIRMED','HR_PENDING','APPLY_PENDING'].includes(correctionStatus))return fht_('correctionPending');
  const anomaly=String(d.anomalyCode||'').toUpperCase();
  if(anomaly){
    if(anomaly.indexOf('MISSING_IN')>=0||anomaly==='NO_PUNCH')return fht_('missingIn');
    if(anomaly.indexOf('MISSING_OUT')>=0||anomaly==='SINGLE_PUNCH')return fht_('missingOut');
    if(anomaly.indexOf('LATE')>=0)return fht_('late');
    if(anomaly.indexOf('EARLY')>=0)return fht_('early');
    return fht_('anomaly');
  }
  if(d.missingIn)return fht_('missingIn');
  if(d.missingOut)return fht_('missingOut');
  if(Number(d.lateMinutes||0)>0)return fht_('late');
  if(Number(d.earlyMinutes||0)>0)return fht_('early');
  if(d.firstIn&&!d.lastOut)return fht_('inProgress');
  if(d.lastOut)return fht_('normal');
  return raw||'—';
}
function fhInboxCount_(){if(Array.isArray(inboxCache))return inboxCache.length;if(inboxCache&&typeof inboxCache==='object')return Number((inboxCache.leave||[]).length)+Number(inboxCache.attendance&&inboxCache.attendance.count||0);return Number(homeData&&homeData.pendingApprovalCount||0)}
function fhReturnedLeaves_(){return (Array.isArray(myLeavesCache)?myLeavesCache:[]).filter(x=>String(x.status||'').toUpperCase()==='RETURNED'||String(x.status||'')==='退回修改')}
function fhAttendanceExceptionCount_(){if(attendanceCache&&attendanceCache.summary)return Number(attendanceCache.summary.exceptionDays||0);return Number(homeData&&homeData.attendanceExceptionCount||0)}
function fhSupplementCount_(){if(homeData&&homeData.pendingEvidenceCount!=null)return Number(homeData.pendingEvidenceCount||0);return 0}
function fhIcon_(kind){const icons={calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',list:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',building:'<svg viewBox="0 0 24 24"><path d="M5 21V5h10v16M15 10h4v11M8 8h2M8 12h2M8 16h2M12 8h1M12 12h1M12 16h1"/></svg>',check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',doc:'<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/></svg>',userlist:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><path d="M3 20c.5-4 2-6 5-6s4.5 2 5 6M15 8h6M15 12h6M15 16h6"/></svg>'};return icons[kind]||icons.list}
function fhRecentHtml_(){const items=fhRecentItems_(3);return items.length?items.map(fhRecentItemHtml_).join(''):`<div class="fh-empty">${escapeHtml(fht_('noRecent'))}</div>`}
function p5a1Rc2NotificationT_(k){const zh={all:'全部',unread:'未讀',system:'系統',announcement:'公告',hr:'HR',task:'待辦',markAll:'全部標為已讀',noNotice:'目前沒有通知',loading:'載入中',readDone:'已標為已讀',general:'一般通知'};const vi={all:'Tất cả',unread:'Chưa đọc',system:'Hệ thống',announcement:'Thông báo',hr:'HR',task:'Việc cần xử lý',markAll:'Đánh dấu tất cả đã đọc',noNotice:'Hiện không có thông báo',loading:'Đang tải',readDone:'Đã đánh dấu đã đọc',general:'Thông báo'};const th={all:'ทั้งหมด',unread:'ยังไม่อ่าน',system:'ระบบ',announcement:'ประกาศ',hr:'HR',task:'งานที่ต้องทำ',markAll:'ทำเครื่องหมายว่าอ่านทั้งหมด',noNotice:'ไม่มีการแจ้งเตือน',loading:'กำลังโหลด',readDone:'ทำเครื่องหมายว่าอ่านแล้ว',general:'การแจ้งเตือน'};return (currentLang==='VI'?vi:currentLang==='TH'?th:zh)[k]||k}
function p5a1Rc2NotificationFilterNormalize_(filter){const f=String(filter||'ALL').trim().toUpperCase();return ['ALL','UNREAD','SYSTEM','ANNOUNCEMENT','HR','TASK'].includes(f)?f:'ALL'}
function p5a1Rc2NotificationFilterLabel_(filter){const f=p5a1Rc2NotificationFilterNormalize_(filter);return p5a1Rc2NotificationT_({ALL:'all',UNREAD:'unread',SYSTEM:'system',ANNOUNCEMENT:'announcement',HR:'hr',TASK:'task'}[f]||'all')}
function p5a1Rc2GeneralNotifications_(){const items=notificationCache&&Array.isArray(notificationCache.items)?notificationCache.items:[];return items.filter(x=>!x.isActionable)}
function p5a1Rc2GeneralUnreadCount_(){return Number(notificationCache&&notificationCache.summary&&notificationCache.summary.generalUnread||0)}
function p5a1Rc2NotificationTone_(n){const c=String(n&&n.category||'').toUpperCase();return c==='HR'?'orange':c==='ANNOUNCEMENT'?'blue':''}
function p5a1Rc2NotificationTime_(v){const s=String(v||'');if(!s)return'';const m=s.match(/(\d{2}-\d{2})\s+(\d{2}:\d{2})/);return m?m[1].replace('-','/')+' '+m[2]:s}
function fhNoticeItems_(){return p5a1Rc2GeneralNotifications_().map(n=>({notificationId:String(n.notificationId||''),tone:p5a1Rc2NotificationTone_(n),text:String(n.title||n.body||p5a1Rc2NotificationT_('general')),time:p5a1Rc2NotificationTime_(n.createdAt),unread:!!n.unread}))}
function fhNoticesHtml_(limit){const a=fhNoticeItems_(),x=limit?a.slice(0,limit):a;if(!x.length)return `<div class="fh-empty">${escapeHtml(fht_('noNotice'))}</div>`;return x.map(n=>`<div class="fh-notice-row" role="button" tabindex="0" onclick="openNotification_('${encodeURIComponent(n.notificationId)}')"><span class="fh-notice-dot ${n.tone}" style="${n.unread?'':'opacity:.22'}"></span><span class="fh-notice-text">${escapeHtml(n.text)}</span><span class="fh-notice-time">${escapeHtml(n.time)}</span></div>`).join('')}
function p5a1Rc2NotificationTabsHtml_(active){return ['ALL','UNREAD','SYSTEM','ANNOUNCEMENT','HR'].map(f=>`<button type="button" class="${f===active?'':'secondary'} small" onclick="refreshNotifications_('${f}')">${escapeHtml(p5a1Rc2NotificationFilterLabel_(f))}</button>`).join('')}
function p5a1Rc2NotificationCategoryLabel_(c){return p5a1Rc2NotificationFilterLabel_(String(c||'SYSTEM').toUpperCase())}
function p5a1Rc2NotificationRowsHtml_(data){const items=Array.isArray(data&&data.items)?data.items:[];if(!items.length)return `<div class="notification-empty">${escapeHtml(p5a1Rc2NotificationT_('noNotice'))}</div>`;return items.map(n=>{const id=encodeURIComponent(String(n.notificationId||'')),category=String(n.category||'SYSTEM').toUpperCase(),body=String(n.body||''),created=String(n.createdAt||''),unread=!!n.unread,actionable=!!n.isActionable;return `<div class="notification-row ${unread?'unread':''}" role="button" tabindex="0" onclick="openNotification_('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openNotification_('${id}')}">${unread?'<span class="notification-unread-dot"></span>':''}<div class="notification-row-title">${escapeHtml(n.title||p5a1Rc2NotificationT_('general'))}</div>${body?`<div class="notification-row-body">${escapeHtml(body)}</div>`:''}<div class="notification-row-meta"><span class="notification-category ${actionable?'notification-task-link':''}">${escapeHtml(p5a1Rc2NotificationCategoryLabel_(category))}</span><span>${escapeHtml(p5a1Rc2NotificationTime_(created))}</span></div></div>`}).join('')}
function renderNotificationCenter_(){const title=$('notificationCenterTitle'),tabs=$('notificationTabs'),list=$('notificationCenterList'),mark=$('notificationMarkAllBtn');if(title)title.textContent=fht_('notificationCenter');if(mark)mark.textContent=p5a1Rc2NotificationT_('markAll');if(tabs)tabs.innerHTML=p5a1Rc2NotificationTabsHtml_(activeNotificationFilter);const data=activeNotificationData||notificationFilterCache[activeNotificationFilter]||(activeNotificationFilter==='ALL'?notificationCache:null);if(list)list.innerHTML=data?p5a1Rc2NotificationRowsHtml_(data):`<div class="notification-empty">${escapeHtml(p5a1Rc2NotificationT_('loading'))}</div>`}
async function refreshNotifications_(filter){const f=p5a1Rc2NotificationFilterNormalize_(filter);activeNotificationFilter=f;const cached=notificationFilterCache[f]||(f==='ALL'?notificationCache:null);if(cached){activeNotificationData=cached;renderNotificationCenter_();if(abisPerf2Fresh_('notifications:'+f,ABIS_PERF2_TTL_.notifications))return cached}else{activeNotificationData=null;renderNotificationCenter_()}if(notificationLoading&&ABIS_PERF2_INFLIGHT_['notifications:'+f])return ABIS_PERF2_INFLIGHT_['notifications:'+f];notificationLoading=true;try{const data=await abisPerf2LoadNotifications_(f);activeNotificationData=data;if(!$('notifications').classList.contains('hide'))renderNotificationCenter_();if(!$('home').classList.contains('hide'))renderHome();return data}catch(e){message(e&&e.message?e.message:String(e),'warning');return null}finally{notificationLoading=false}}
async function showNotificationCenter_(filter){hideAppSections();const el=$('notifications');if(!el){showHome();return}el.classList.remove('hide');activeNotificationFilter=p5a1Rc2NotificationFilterNormalize_(filter||activeNotificationFilter||'ALL');activeNotificationData=notificationFilterCache[activeNotificationFilter]||(activeNotificationFilter==='ALL'?notificationCache:null);renderNotificationCenter_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}await refreshNotifications_(activeNotificationFilter)}
async function markAllNotificationsRead_(){const btn=$('notificationMarkAllBtn'),op=beginOperation_(nt('transmitting'),nt('doNotRepeat'),btn);try{await call('markAllNotificationsRead',{sessionToken});notificationCache=null;notificationFilterCache={};activeNotificationData=null;finishOperationSuccess_(op,p5a1Rc2NotificationT_('readDone'),'');await refreshNotifications_(activeNotificationFilter);if(activeNotificationFilter!=='ALL'){try{const all=await call('notifications',{sessionToken,filter:'ALL',limit:100});notificationCache=all;notificationFilterCache.ALL=all}catch(ignore){}}if(!$('home').classList.contains('hide'))renderHome()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
async function p5a1Rc2MarkNotificationRead_(notificationId){if(!notificationId)return;try{await call('markNotificationRead',{sessionToken,notificationId});Object.keys(notificationFilterCache||{}).forEach(k=>{const d=notificationFilterCache[k];if(!d||!Array.isArray(d.items))return;const hit=(d.items||[]).find(n=>String(n.notificationId||'')===String(notificationId)),wasUnread=!!(hit&&hit.unread);if(hit){hit.unread=false;hit.readAt='READ'}if(wasUnread&&d.summary){d.summary.unread=Math.max(0,Number(d.summary.unread||0)-1);if(!hit.isActionable)d.summary.generalUnread=Math.max(0,Number(d.summary.generalUnread||0)-1)}})}catch(ignore){}}
async function openNotification_(encodedNotificationId){const notificationId=decodeURIComponent(String(encodedNotificationId||''));const pools=[];if(activeNotificationData&&Array.isArray(activeNotificationData.items))pools.push(activeNotificationData.items);if(notificationCache&&Array.isArray(notificationCache.items))pools.push(notificationCache.items);let n=null;for(const p of pools){n=p.find(x=>String(x.notificationId||'')===notificationId);if(n)break}if(!n){await refreshNotifications_('ALL');n=notificationCache&&Array.isArray(notificationCache.items)?notificationCache.items.find(x=>String(x.notificationId||'')===notificationId):null}if(!n)return;await p5a1Rc2MarkNotificationRead_(notificationId);if(!$('home').classList.contains('hide'))renderHome();const route=String(n.route||'').toUpperCase(),target=String(n.routeTargetId||n.taskId||'');if(route==='TASK_INBOX'){await refreshInbox('ALL');if(target&&activeTaskInboxData&&Array.isArray(activeTaskInboxData.tasks)&&activeTaskInboxData.tasks.some(t=>String(t.TaskID||'')===target)){await p5a1Rc2OpenTask_(encodeURIComponent(target),null)}return}if(route==='MY_ATTENDANCE'){attendanceCache=null;attendanceViewMode='detail';await refreshMyAttendance();return}if(route==='MY_LEAVES'){myLeavesCache=null;if(target){try{await openLeaveDetail_(encodeURIComponent(target));return}catch(ignore){}}await refreshLeaves();return}showNotificationCenter_(activeNotificationFilter)}

function fhUpdateHeader_(e){const name=String(e&&e.name||'ABIS'),avatar=$('headerAvatar'),nameEl=$('headerUserName'),sourceEl=$('entrySourceText');if(avatar)avatar.textContent=(name.trim().charAt(0)||'A').toUpperCase();if(nameEl)nameEl.textContent=name;if(sourceEl)sourceEl.textContent=p5a1IsLineBoot_()?fht_('viaLine'):fht_('viaWeb');document.querySelectorAll('[data-home-i18n]').forEach(el=>{const k=el.getAttribute('data-home-i18n');el.textContent=fht_(k)});const dot=$('homeBellDot');if(dot)dot.classList.toggle('hide',p5a1Rc2GeneralUnreadCount_()===0)}
function renderHome(){if(!homeData)return;const e=homeData.employee||{},today=fhTodayAttendance_(),taskSummary=taskSummaryCache||null,inbox=taskSummary?Number(taskSummary.approval||0):'—',returned=taskSummary?Number(taskSummary.returnedLeave||0):'—',ex=taskSummary?Number(taskSummary.attendanceException||0):'—',supp=taskSummary?Number(taskSummary.supplement||0):'—';fhUpdateHeader_(e);document.body.classList.add('home-view');const shift=(today&&(today.shiftName||today.shiftCode))||e.shift||'—',inTime=fhTime_(today&&today.firstIn),outTime=fhTime_(today&&today.lastOut),status=today?fhTodayStatus_(today):(homeData.todayStatus||'—');$('leaveNav').classList.toggle('hide',!homeData.canSubmitLeave);$('home').innerHTML=`
<div class="home-dashboard-title"><strong>${escapeHtml(tr('home'))}</strong><span>${escapeHtml(fht_('dashboard'))}</span></div>
<div class="fh-card fh-today-clickable" role="button" tabindex="0" onclick="openTodayAttendance_()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTodayAttendance_()}"><div class="fh-card-head"><div class="fh-head-left"><span class="fh-round-icon">${fhIcon_('calendar')}</span><span class="fh-card-title">${escapeHtml(fht_('today'))}</span></div><span class="fh-date">${escapeHtml(fhDate_())}</span></div><div class="fh-today-grid"><div class="fh-status-list"><div class="fh-status-row">${fhIcon_('building')}<span class="fh-status-label">${escapeHtml(fht_('todayShift'))}</span><span class="fh-status-value">${escapeHtml(shift)}</span></div><div class="fh-status-row">${fhIcon_('clock')}<span class="fh-status-label">${escapeHtml(fht_('clockIn'))}</span><span class="fh-status-value">${escapeHtml(inTime)}</span></div><div class="fh-status-row">${fhIcon_('clock')}<span class="fh-status-label">${escapeHtml(fht_('clockOut'))}</span><span class="fh-status-value">${escapeHtml(outTime)}</span></div><div class="fh-status-row">${fhIcon_('check')}<span class="fh-status-label">${escapeHtml(fht_('todayState'))}</span><span class="fh-status-pill">${escapeHtml(status)}</span></div></div><div class="fh-today-art">${escapeHtml(fht_('safe')).replace('\\n','<br>')}</div></div></div>
<div class="fh-card"><div class="fh-card-head"><div class="fh-head-left"><span class="fh-round-icon">${fhIcon_('list')}</span><span class="fh-card-title">${escapeHtml(fht_('tasks'))}</span></div><button class="fh-head-action" type="button" onclick="refreshInbox('ALL')">${escapeHtml(fht_('viewAll'))} ›</button></div><div class="fh-task-grid"><button class="fh-task red" type="button" onclick="refreshInbox('RETURNED_LEAVE')"><span class="fh-task-label">${escapeHtml(fht_('returned'))}</span><b>${returned}</b></button><button class="fh-task orange" type="button" onclick="refreshInbox('ATTENDANCE_EXCEPTION')"><span class="fh-task-label">${escapeHtml(fht_('attendanceException'))}</span><b>${ex}</b></button><button class="fh-task blue" type="button" onclick="refreshInbox('APPROVAL')"><span class="fh-task-label">${escapeHtml(fht_('pendingApproval'))}</span><b>${inbox}</b></button><button class="fh-task purple" type="button" onclick="refreshInbox('SUPPLEMENT')"><span class="fh-task-label">${escapeHtml(fht_('supplement'))}</span><b>${supp}</b></button></div></div>
<div class="fh-card"><div class="fh-card-head"><div class="fh-head-left"><span class="fh-round-icon">${fhIcon_('clock')}</span><span class="fh-card-title">${escapeHtml(fht_('recent'))}</span></div><button class="fh-head-action" type="button" onclick="showRecentRecords_()">${escapeHtml(fht_('viewAll'))} ›</button></div><div class="fh-list">${fhRecentHtml_()}</div></div>
<div class="fh-card"><div class="fh-card-head"><div class="fh-head-left"><span class="fh-round-icon">${fhIcon_('grid')}</span><span class="fh-card-title">${escapeHtml(fht_('quick'))}</span></div></div><div class="fh-quick-grid"><button class="fh-quick green" type="button" onclick="showLeaveForm()"><span class="fh-quick-icon">${fhIcon_('calendar')}</span><span class="fh-quick-copy"><b>${escapeHtml(fht_('requestLeave'))}</b><span>${escapeHtml(fht_('requestLeaveSub'))}</span></span><span class="fh-chevron">›</span></button><button class="fh-quick blue" type="button" onclick="refreshLeaves()"><span class="fh-quick-icon">${fhIcon_('doc')}</span><span class="fh-quick-copy"><b>${escapeHtml(fht_('myLeaves'))}</b><span>${escapeHtml(fht_('myLeavesSub'))}</span></span><span class="fh-chevron">›</span></button><button class="fh-quick teal" type="button" onclick="refreshMyAttendance(this)"><span class="fh-quick-icon">${fhIcon_('clock')}</span><span class="fh-quick-copy"><b>${escapeHtml(fht_('myAttendance'))}</b><span>${escapeHtml(fht_('myAttendanceSub'))}</span></span><span class="fh-chevron">›</span></button><button class="fh-quick orange" type="button" onclick="refreshInbox()"><span class="fh-quick-icon">${fhIcon_('userlist')}</span><span class="fh-quick-copy"><b>${escapeHtml(fht_('inbox'))}</b><span>${escapeHtml(fht_('inboxSub'))}</span></span><span class="fh-chevron">›</span></button></div></div>
<div class="fh-card" id="homeNoticeCard"><div class="fh-card-head"><div class="fh-head-left"><span class="fh-round-icon">${fhIcon_('bell')}</span><span class="fh-card-title">${escapeHtml(fht_('notices'))}</span></div><button class="fh-head-action" type="button" onclick="showNotificationCenter_()">${escapeHtml(fht_('viewAll'))} ›</button></div>${fhNoticesHtml_(2)}</div>
<div class="frozen-build-note">ABIS ESS / LINE · HOME-RC2-08H BULK WEEKLY REST</div>`;fhUpdateHeader_(e)}
function fillLeaveTypes(){const s=$('leaveType');if(!homeData||!homeData.canSubmitLeave){s.innerHTML='';return}s.innerHTML=homeData.leaveTypes.map(x=>`<option value="${escapeHtml(x.code)}">${escapeHtml(leaveTypeLabel(x))}</option>`).join('');refreshApplicationModes()}function currentLeaveRule(){return homeData.leaveTypes.find(x=>x.code===$('leaveType').value)||homeData.leaveTypes[0]}function localizedUnit(v){if(currentLang==='ZH')return v;const mVI={'小時/日':'giờ/ngày','小時':'giờ','日':'ngày','小時主帳 / 整日/前半班/後半班':'giờ / cả ngày / nửa ca'},mTH={'小時/日':'ชั่วโมง/วัน','小時':'ชั่วโมง','日':'วัน','小時主帳 / 整日/前半班/後半班':'ชั่วโมง / เต็มวัน / ครึ่งกะ'};return (currentLang==='VI'?mVI:mTH)[v]||v}function proofLabel(a){return a==='NONE'?tr('proofNone'):a==='MAY_SUPPLEMENT'?tr('proofMay'):a==='MUST_SUPPLEMENT'?tr('proofMust'):tr('proofHr')}function refreshApplicationModes(){const r=currentLeaveRule();if(!r)return;const s=$('applicationType');s.innerHTML=(r.modes||['HOURLY']).map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(modeLabel(m))}</option>`).join('');toggleTimeFields();$('leaveRuleHint').textContent=`${tr('unit')}：${localizedUnit(r.unitType||'')}；${tr('minimum')}：${r.minUnit||''}；${tr('proof')}：${proofLabel(r.attachmentRule||'NONE')}。${tr('calendarHint')}`;scheduleDepartmentConflictCheck()}function toggleTimeFields(){$('timeFields').classList.toggle('hide',$('applicationType').value!=='HOURLY')}function currentLeaveDraft(){return{leaveTypeCode:$('leaveType').value,applicationType:$('applicationType').value,startDate:$('startDate').value,endDate:$('endDate').value||$('startDate').value,startTime:$('startTime').value,endTime:$('endTime').value,proxyEmployeeId:$('proxyId').value,handover:$('handover').value,reason:$('reason').value,attachmentUrl:$('attachmentUrl').value,emergency:$('emergency').checked}}
function p5a1ReadLineTimeoutDraft_(){try{const raw=localStorage.getItem(P5A1_LINE_TIMEOUT_DRAFT_KEY);if(!raw)return null;const x=JSON.parse(raw);if(!x||!x.employeeId||!x.leave||Date.now()-Number(x.savedAt||0)>P5A1_LINE_TIMEOUT_DRAFT_TTL_MS){localStorage.removeItem(P5A1_LINE_TIMEOUT_DRAFT_KEY);return null}return x}catch(e){try{localStorage.removeItem(P5A1_LINE_TIMEOUT_DRAFT_KEY)}catch(ignore){}return null}}
function p5a1ApplyLineTimeoutDraft_(x){const d=x&&x.leave||{};$('leaveType').value=d.leaveTypeCode||'';refreshApplicationModes();$('applicationType').value=d.applicationType||'HOURLY';toggleTimeFields();$('startDate').value=d.startDate||'';$('endDate').value=d.endDate||d.startDate||'';$('startTime').value=d.startTime||'';$('endTime').value=d.endTime||'';fillProxyCandidates();if(!$('proxyId').disabled)$('proxyId').value=d.proxyEmployeeId||'';$('handover').value=d.handover||'';$('reason').value=d.reason||'';$('attachmentUrl').value=d.attachmentUrl||'';$('emergency').checked=!!d.emergency;scheduleDepartmentConflictCheck()}
async function p5a1RestoreLineTimeoutDraft_(){if(!p5a1IsLineBoot_()||!homeData||!homeData.employee)return;const x=p5a1ReadLineTimeoutDraft_();if(!x)return;const employeeId=String(homeData.employee.id||'').toUpperCase();if(String(x.employeeId||'').toUpperCase()!==employeeId){try{localStorage.removeItem(P5A1_LINE_TIMEOUT_DRAFT_KEY)}catch(ignore){}return}try{if(x.returnedEditLeaveId){const list=await call('myLeaves',{sessionToken});myLeavesCache=list;const target=(list||[]).find(v=>String(v.leaveId)===String(x.returnedEditLeaveId)&&String(v.status)==='RETURNED');if(!target)throw new Error('原退回假單狀態已變更，未自動復原修改畫面');beginReturnedEdit_(x.returnedEditLeaveId);p5a1ApplyLineTimeoutDraft_(x)}else{showLeaveForm(false,true);await p5a108LoadDraft_(false);p5a1ApplyLineTimeoutDraft_(x);p5a108DraftDirty=true;await p5a108SaveDraftNow_(true)}try{localStorage.removeItem(P5A1_LINE_TIMEOUT_DRAFT_KEY)}catch(ignore){}message(currentLang==='VI'?'Đã xác minh lại LINE và khôi phục nội dung đơn chưa gửi.':currentLang==='TH'?'ยืนยัน LINE ใหม่แล้ว และกู้คืนข้อมูลใบลาที่ยังไม่ได้ส่ง':'LINE 身分已重新驗證，未送出的請假內容已復原。','success')}catch(e){try{localStorage.removeItem(P5A1_LINE_TIMEOUT_DRAFT_KEY)}catch(ignore){}message(e&&e.message?e.message:String(e),'warning')}}
function departmentConflictInputReady(){if(!$('startDate').value||!$('applicationType').value)return false;if($('applicationType').value==='HOURLY'&&(!$('startTime').value||!$('endTime').value))return false;return true}function clearDepartmentConflictWarning(){currentDepartmentConflicts=[];const el=$('departmentConflictWarning');if(el){el.innerHTML='';el.classList.add('hide')}}function renderDepartmentConflictWarning(list,managerMode){
  const rows=Array.isArray(list)?list:[];
  if(!rows.length)return'';
  const site=String((rows.find(x=>x&&x.location)||{}).location||'').trim();
  const siteTag=site?`【${escapeHtml(site)}】`:'';
  const baseTitle=currentLang==='VI'?(managerMode?'Cùng thời gian đã có đồng nghiệp trong bộ phận xin nghỉ. Hãy kiểm tra bố trí nhân lực trước khi duyệt.':'Cùng thời gian đã có đồng nghiệp trong bộ phận xin nghỉ. Nên điều chỉnh để tránh thiếu người.'):currentLang==='TH'?(managerMode?'มีเพื่อนร่วมแผนกลาหยุดในช่วงเวลาเดียวกัน กรุณาตรวจสอบกำลังคนก่อนอนุมัติ':'มีเพื่อนร่วมแผนกลาหยุดในช่วงเวลาเดียวกัน แนะนำให้ปรับวันหรือเวลาเพื่อลดการขาดกำลังคน'):(managerMode?'同廠別、同部門同時段已有其他同事請假，核准前請確認該廠人力安排。':'同廠別、同部門同時段已有其他同事請假，建議調整日期或時段避免該廠人力重疊。');
  const title=siteTag+baseTitle;
  const items=rows.map(x=>`<div>• <b>${escapeHtml(x.employeeName||x.employeeId||tr('conflictEmployee'))}</b>${x.location?`（${escapeHtml(x.location)}）`:''}｜${escapeHtml(x.overlapText||tr('conflictOverlap'))}｜${escapeHtml(x.statusGroup||tr('inProgress'))}</div>`).join('');
  return `<div><b>${tr('departmentConflict')}</b><br>${title}<div class="dept-conflict-list">${items}</div></div>`
}function scheduleDepartmentConflictCheck(){clearTimeout(departmentConflictTimer);scheduleProxyAvailabilityCheck();if(!departmentConflictInputReady()){clearDepartmentConflictWarning();return}departmentConflictTimer=setTimeout(checkDepartmentLeaveConflicts,350)}async function checkDepartmentLeaveConflicts(){if(!departmentConflictInputReady()){clearDepartmentConflictWarning();return[]}const seq=++departmentConflictSeq;try{const list=await call('departmentLeaveConflicts',{sessionToken,leave:currentLeaveDraft()});if(seq!==departmentConflictSeq)return currentDepartmentConflicts;currentDepartmentConflicts=Array.isArray(list)?list:[];const el=$('departmentConflictWarning');if(currentDepartmentConflicts.length){el.innerHTML=renderDepartmentConflictWarning(currentDepartmentConflicts,false);el.classList.remove('hide')}else{el.innerHTML='';el.classList.add('hide')}return currentDepartmentConflicts}catch(e){if(seq===departmentConflictSeq){currentDepartmentConflicts=[];const el=$('departmentConflictWarning');if(el){el.innerHTML=`<div class="status-inline-fail"><b>${escapeHtml(nt('conflictCheckFail'))}</b><br>${escapeHtml(nt('conflictCheckFailDetail'))}<br>${escapeHtml(e&&e.message?e.message:String(e))}</div>`;el.classList.remove('hide')}}return null}}
function clearProxyAvailabilityWarning(){const el=$('proxyAvailabilityWarning');if(el){el.innerHTML='';el.classList.add('hide')}}function renderProxyAvailabilityWarning(result,proxyName){const when=result&&result.conflictText?`<br><span class="tiny">${escapeHtml(result.conflictText)}</span>`:'';const text=currentLang==='VI'?'Người thay thế này đã có lịch nghỉ được duyệt trong thời gian đó. Hãy chọn người khác.':currentLang==='TH'?'ผู้แทนคนนี้มีวันลาที่อนุมัติแล้วในช่วงเวลาดังกล่าว กรุณาเลือกคนอื่น':'此代理人該時段已有已核准假單，請選擇其他代理人。';return `<b>${escapeHtml(proxyName||tr('proxy'))}</b><br>${text}${when}`}function scheduleProxyAvailabilityCheck(){clearTimeout(proxyAvailabilityTimer);const s=$('proxyId');if(!s||s.disabled||!s.value||!departmentConflictInputReady()){clearProxyAvailabilityWarning();return}proxyAvailabilityTimer=setTimeout(checkSelectedProxyAvailability,250)}async function checkSelectedProxyAvailability(){const s=$('proxyId');if(!s||s.disabled||!s.value||!departmentConflictInputReady()){clearProxyAvailabilityWarning();return true}const proxyId=s.value,proxyName=(s.options[s.selectedIndex]&&s.options[s.selectedIndex].textContent)||proxyId,seq=++proxyAvailabilitySeq;try{const result=await call('proxyAvailability',{sessionToken,leave:currentLeaveDraft(),proxyEmployeeId:proxyId});if(seq!==proxyAvailabilitySeq||s.value!==proxyId)return true;if(result&&result.available!==false){clearProxyAvailabilityWarning();return true}const el=$('proxyAvailabilityWarning');el.innerHTML=renderProxyAvailabilityWarning(result,proxyName);el.classList.remove('hide');s.value='';return false}catch(e){if(seq===proxyAvailabilitySeq)message(e&&e.message?e.message:String(e));return false}}
function fillProxyCandidates(){clearProxyAvailabilityWarning();const s=$('proxyId');if(!homeData||!homeData.canSubmitLeave){s.innerHTML='';return}if(homeData.employee.proxyMode==='SUPERVISOR_ASSIGN'){s.innerHTML=`<option value="">${tr('managerAssign')}</option>`;s.disabled=true;$('proxyHint').textContent=tr('managerAssignHint');return}s.disabled=false;s.innerHTML=`<option value="">${tr('select')}</option>`+homeData.proxyCandidates.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}（${escapeHtml(x.id)}｜${escapeHtml(sourceLabel(x.source))}）</option>`).join('');$('proxyHint').textContent=tr('proxyHint')}
function p4a142ResetSubmittedLeaveForm_(){resetReturnedEditUi_();['startDate','endDate','startTime','endTime','handover','reason','attachmentUrl'].forEach(id=>{const el=$(id);if(el)el.value=''});const emergency=$('emergency');if(emergency)emergency.checked=false;p5a109ResetAttachments_();clearDepartmentConflictWarning();clearProxyAvailabilityWarning();if(homeData&&homeData.canSubmitLeave){fillLeaveTypes();fillProxyCandidates()}}
async function p4a13FinishSubmitSuccess_(r,op,requestId,recovered){p4a13ClearPendingSubmit_(requestId);const attachmentPromotionWarning=r&&r.attachmentPromotion&&r.attachmentPromotion.ok===false?(currentLang==='VI'?'Đơn đã gửi nhưng việc chuyển tệp đính kèm chưa hoàn tất; hệ thống vẫn giữ tệp để đối soát.':currentLang==='TH'?'ส่งใบลาแล้ว แต่การย้ายไฟล์แนบยังไม่เสร็จ ระบบยังเก็บไฟล์ไว้เพื่อตรวจสอบ':'假單已送出，但附件轉正式索引尚未完成；系統仍保留附件供後續對帳。'):'';p5a108ResetDraftState_();myLeavesCache=null;inboxCache=null;dashboardCache=null;const msg=currentLang==='VI'?`Đã gửi ${r.leaveId}, trạng thái: ${statusLabel(r.status)}, ${r.hours} HR`:currentLang==='TH'?`ส่ง ${r.leaveId} แล้ว สถานะ: ${statusLabel(r.status)}, ${r.hours} HR`:`已送出 ${r.leaveId}，狀態：${r.status}，${r.hours} HR`;finishOperationSuccess_(op,recovered?nt('resynced'):nt('submittedLeave'),msg);message(msg,'success');if(attachmentPromotionWarning)message(attachmentPromotionWarning,'warning');p4a142ResetSubmittedLeaveForm_();hideAppSections();$('leaves').classList.remove('hide');const leaveList=$('leaveList');if(leaveList)leaveList.innerHTML=`<div class="notice"><b>${escapeHtml(msg)}</b><br><span class="tiny">${escapeHtml(tr('loading'))}</span></div>`;mutationBusy=false;setAreaBusy_('leaveForm',false);let refreshFailed=false;try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;renderLeaves(list)}catch(refreshErr){refreshFailed=true;if(leaveList)leaveList.innerHTML=`<div class="notice"><b>${escapeHtml(msg)}</b><br>${escapeHtml(nt('refreshAfterSuccessFail'))}</div><button class="secondary small" onclick="refreshLeaves()">${escapeHtml(nt('retrySync'))}</button>`}try{homeData=await call('home',{sessionToken});renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){refreshFailed=true}if(refreshFailed)message(nt('refreshAfterSuccessFail'),'warning');try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}}
async function submitLeave(){if(returnedEditLeaveId){await saveAndResubmitReturned_();return}if(mutationBusy){message(nt('busy'),'warning');return}mutationBusy=true;setAreaBusy_('leaveForm',true,nt('transmitting'));const op=beginOperation_(nt('transmitting'),nt('doNotRepeat'));let leave=currentLeaveDraft();let r=null,requestId='';try{const draftReady=await p5a108FlushDraft_();if(!draftReady){mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,new Error(p5a108DraftText_('conflict')));return}leave=currentLeaveDraft();if(leave.proxyEmployeeId&&!leave.emergency){updateOperation_(op,nt('checkingProxy'),nt('doNotRepeat'));const pr=await call('proxyAvailability',{sessionToken,leave,proxyEmployeeId:leave.proxyEmployeeId});if(pr&&pr.available===false){const s=$('proxyId'),pn=(s.options[s.selectedIndex]&&s.options[s.selectedIndex].textContent)||leave.proxyEmployeeId,el=$('proxyAvailabilityWarning');el.innerHTML=renderProxyAvailabilityWarning(pr,pn);el.classList.remove('hide');s.value='';mutationBusy=false;setAreaBusy_('leaveForm',false);clearOperationTimers_();p5a114ReleaseOperationButton_(op);renderOperationStatus_('warning',nt('operationFailed'),'代理人該時段不可用');return}}updateOperation_(op,nt('checkingConflict'),nt('doNotRepeat'));const conflicts=await call('departmentLeaveConflicts',{sessionToken,leave});currentDepartmentConflicts=Array.isArray(conflicts)?conflicts:[];if(currentDepartmentConflicts.length){const names=currentDepartmentConflicts.map(x=>x.employeeName||x.employeeId).filter(Boolean).join('、');const msg=currentLang==='VI'?`Cùng thời gian đã có ${names} xin nghỉ.
Bạn vẫn muốn gửi đơn này?`:currentLang==='TH'?`ช่วงเวลาเดียวกันมี ${names} ลางานอยู่
ยังต้องการส่งคำขอนี้หรือไม่?`:`同部門同時段已有 ${names} 請假。
建議錯開日期或時段，避免同時缺員。

仍要送出此假單嗎？`;if(!confirm(msg)){const el=$('departmentConflictWarning');el.innerHTML=renderDepartmentConflictWarning(currentDepartmentConflicts,false);el.classList.remove('hide');mutationBusy=false;setAreaBusy_('leaveForm',false);clearOperationTimers_();p5a114ReleaseOperationButton_(op);renderOperationStatus_('warning',nt('cancelled'),'');return}}requestId=p4a13RequestIdForLeave_(leave);updateOperation_(op,nt('submittingLeave'),nt('doNotRepeat'));r=await call('submitLeave',{sessionToken,leave,requestId,draftId:p5a108DraftId,draftVersion:p5a108DraftVersion})}catch(e){if(requestId){updateOperation_(op,nt('checkingResult'),nt('unknownDetail'),'warning');const recovered=await p4a13ConfirmSubmitResult_(requestId,op);if(recovered){await p4a13FinishSubmitSuccess_(recovered,op,requestId,true);return}const uncertain=(e&&e.kind==='TRANSPORT')||String(e&&e.message||'').includes('系統未回傳成功狀態');if(uncertain){mutationBusy=false;setAreaBusy_('leaveForm',false);const detail=currentLang==='VI'?'Chưa xác nhận được kết quả. Nếu gửi lại mà nội dung không đổi, hệ thống sẽ dùng cùng RequestID và không tạo đơn thứ hai.':currentLang==='TH'?'ยังยืนยันผลไม่ได้ หากส่งอีกครั้งโดยไม่เปลี่ยนข้อมูล ระบบจะใช้ RequestID เดิมและจะไม่สร้างใบลาซ้ำ':'結果仍未確認。若內容未變直接再次按送出，系統會沿用同一 RequestID，不會建立第二張假單。';finishOperationUnknown_(op,nt('stillUnknown'),detail,true);message(detail,'warning');return}}mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}await p4a13FinishSubmitSuccess_(r,op,requestId,false)}

async function saveReturnedDraftOnly_(){
  if(!returnedEditLeaveId){message('找不到退回假單');return}
  if(mutationBusy){message(nt('busy'),'warning');return}
  mutationBusy=true;setAreaBusy_('leaveForm',true,nt('transmitting'));const op=beginOperation_(nt('transmitting'),nt('doNotRepeat'));
  try{await call('saveReturnedDraft',{sessionToken,leaveId:returnedEditLeaveId,leave:currentLeaveDraft()});mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationSuccess_(op,p4t('draftSaved'),'');message(p4t('draftSaved'),'success');myLeavesCache=await call('myLeaves',{sessionToken});resetReturnedEditUi_();hideAppSections();$('leaves').classList.remove('hide');renderLeaves(myLeavesCache)}
  catch(e){mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}
}
async function saveAndResubmitReturned_(){
  if(!returnedEditLeaveId){message('找不到退回假單');return}
  if(!confirm(p4t('resubmitConfirm')))return;
  if(mutationBusy){message(nt('busy'),'warning');return}
  const leaveId=returnedEditLeaveId;mutationBusy=true;setAreaBusy_('leaveForm',true);const submitBtn=$('submitLeaveBtn');if(submitBtn)submitBtn.textContent=p4a14t('resubmitting');const op=beginOperation_(p4a14t('resubmitting'),nt('doNotRepeat'));
  try{
    await call('saveReturnedDraft',{sessionToken,leaveId,leave:currentLeaveDraft()});
    updateOperation_(op,p4a14t('resubmitting'),nt('doNotRepeat'));
    await call('resubmitReturned',{sessionToken,leaveId});
  }catch(e){
    if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('submit',op);if(!synced)message(nt('stillUnknown'),'error');return}
    mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return
  }
  mutationBusy=false;setAreaBusy_('leaveForm',false);resetReturnedEditUi_();myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,p4t('resubmitDone'),'');message(p4t('resubmitDone'),'success');
  try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;hideAppSections();$('leaves').classList.remove('hide');renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}
}
async function resubmitReturnedDirect_(leaveId,triggerBtn){
  const x=returnedLeaveById_(leaveId);if(!x||x.status!=='RETURNED'){message('此假單目前不是退回修改狀態');return}
  if(!confirm(p4t('resubmitConfirm')))return;
  if(mutationBusy){message(nt('busy'),'warning');return}
  mutationBusy=true;setAreaBusy_('leaves',true);if(triggerBtn)triggerBtn.textContent=p4a14t('resubmitting');const op=beginOperation_(p4a14t('resubmitting'),nt('doNotRepeat'),triggerBtn);
  try{await call('resubmitReturned',{sessionToken,leaveId})}catch(e){if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('submit',op);if(!synced)message(nt('stillUnknown'),'error');return}mutationBusy=false;setAreaBusy_('leaves',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}
  mutationBusy=false;setAreaBusy_('leaves',false);myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,p4t('resubmitDone'),'');message(p4t('resubmitDone'),'success');try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}
}

function p5a2AttendanceMonthValue_(){const el=$('attendanceMonth');if(el&&el.value)return el.value;const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function p5a2AttendanceFmt_(v,digits){const n=Number(v||0);return Number.isFinite(n)?n.toFixed(digits==null?1:digits):'0'}
function p5a2TimeOnly_(value){
  if(value==null||value==='')return '-';
  const s=String(value).trim();
  let m=s.match(/(?:^|[T\s])(\d{1,2}):(\d{2})(?::\d{2})?(?:\s|$|[+Z])/i);
  if(!m)m=s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if(!m)m=s.match(/\b(\d{1,2}):(\d{2})\b/);
  if(!m)return s;
  const h=Number(m[1]),min=Number(m[2]);
  if(!Number.isFinite(h)||!Number.isFinite(min)||h<0||h>23||min<0||min>59)return s;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
// P5A1-RM-HOME-FROZEN-RC2-P0 / Q47:
// Approved leave and OFF/rest are authoritative before punch-derived anomalies.
// This prevents an approved leave day from being shown as missing-punch/anomaly.
function p5a2LeaveClosed_(status){
  const s=String(status||'').trim().toUpperCase();
  return ['已撤回','已駁回','已取消','WITHDRAWN','REJECTED','CANCELLED','CANCELED'].includes(s);
}
function p5a2LeaveForDate_(date){
  const key=String(date||'').slice(0,10);
  if(!key||!Array.isArray(myLeavesCache))return null;
  return myLeavesCache.find(function(x){
    if(!x||p5a2LeaveClosed_(x.status))return false;
    const s=String(x.startDate||'').slice(0,10),e=String(x.endDate||x.startDate||'').slice(0,10);
    return !!s&&s<=key&&key<=(e||s);
  })||null;
}
function p5a2LeaveWorkflowStatus_(leave){
  const raw=String(leave&&leave.status||'').trim(),upper=raw.toUpperCase();
  if(raw==='已核准'||upper==='APPROVED')return {key:'leave-day',text:a2t('leaveDay')};
  const label=statusLabel(raw)||raw;
  return {key:'leave-day',text:label||(currentLang==='VI'?'Đơn nghỉ đang chờ xử lý':currentLang==='TH'?'คำขอลากำลังรอดำเนินการ':'請假待確認')};
}
function p5a2AttendanceStatus_(d){
  if(!d)return {key:'rest',text:a2t('rest')};
  const leave=p5a2LeaveForDate_(d.date);
  const noPunch=!d.firstIn&&!d.lastOut&&Number(d.actualHours||0)<=0;
  if(leave&&noPunch&&Number(d.expectedHours||0)>0)return p5a2LeaveWorkflowStatus_(leave);
  if(Number(d.leaveHours||0)>0)return {key:'leave-day',text:a2t('leaveDay')};
  if(Number(d.expectedHours||0)<=0&&Number(d.actualHours||0)<=0)return {key:'rest',text:a2t('rest')};
  if(d.anomalyCode||(d.exceptions&&d.exceptions.length)||d.missingIn||d.missingOut||Number(d.lateMinutes||0)>=16||Number(d.earlyMinutes||0)>0)return {key:'bad',text:a2t('anomaly')};
  return {key:'normal',text:a2t('normal')};
}
function p5a2AttendanceSummaryHtml_(data){const s=data.summary||{};return `<h3>${escapeHtml(a2t('summary'))}</h3><div class="att-summary"><div class="att-kpi"><b>${Number(s.attendanceDays||0)}</b><span>${escapeHtml(a2t('attendanceDays'))}</span></div><div class="att-kpi"><b>${Number(s.lateCount||0)} / ${p5a2AttendanceFmt_(s.lateMinutes,0)}</b><span>${escapeHtml(a2t('late'))} (${escapeHtml(a2t('times'))}/${escapeHtml(a2t('minutes'))})</span></div><div class="att-kpi"><b>${Number(s.earlyCount||0)} / ${p5a2AttendanceFmt_(s.earlyMinutes,0)}</b><span>${escapeHtml(a2t('early'))} (${escapeHtml(a2t('times'))}/${escapeHtml(a2t('minutes'))})</span></div><div class="att-kpi"><b>${Number(s.exceptionDays||0)}</b><span>${escapeHtml(a2t('exceptions'))}</span></div><div class="att-kpi"><b>${p5a2AttendanceFmt_(s.leaveHours)} HR</b><span>${escapeHtml(a2t('leaveHours'))}</span></div><div class="att-kpi"><b>${p5a2AttendanceFmt_(s.overtimeHours)} HR</b><span>${escapeHtml(a2t('overtimeHours'))}</span></div><div class="att-kpi"><b>${p5a2AttendanceFmt_(s.actualHours)} HR</b><span>${escapeHtml(a2t('actualHours'))}</span></div><div class="att-kpi"><b>${p5a2AttendanceFmt_(s.expectedHours)} HR</b><span>${escapeHtml(a2t('expectedHours'))}</span></div><div class="att-kpi"><b>${Number(s.missingPunchDays||0)}</b><span>${escapeHtml(a2t('missingPunch'))}</span></div></div>`}
function p5a2AttendanceWarningsHtml_(data){let h=`<div class="notice tiny">${escapeHtml(a2t('readOnly'))}</div>`;if(String(data.month||'')<'2026-10'||(data.days||[]).some(x=>String(x.closingStatus||'').toUpperCase()==='PILOT'))h+=`<div class="att-warning">${escapeHtml(a2t('pilot'))}</div>`;if((data.coverageWarnings||[]).length)h+=`<div class="att-warning"><b>${escapeHtml(a2t('coverageGap'))}</b><br>${(data.coverageWarnings||[]).map(x=>`${escapeHtml(x.firstAffectedDate||'')} ~ ${escapeHtml(x.lastAffectedDate||'')}`).join('<br>')}</div>`;return h}
function p5a2AttendanceCalendarHtml_(data){const map={};(data.days||[]).forEach(d=>map[d.date]=d);const [y,m]=String(data.month||'').split('-').map(Number);if(!y||!m)return '';const first=new Date(y,m-1,1),last=new Date(y,m,0),start=first.getDay();const heads=currentLang==='VI'?['CN','T2','T3','T4','T5','T6','T7']:currentLang==='TH'?['อา','จ','อ','พ','พฤ','ศ','ส']:['日','一','二','三','四','五','六'];let cells='';for(let i=0;i<start;i++)cells+='<div class="att-day empty"></div>';for(let day=1;day<=last.getDate();day++){const key=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`,d=map[key],st=p5a2AttendanceStatus_(d);let line='';if(d){const bits=[];if(Number(d.actualHours||0)>0)bits.push(`${p5a2AttendanceFmt_(d.actualHours)}HR`);if(Number(d.lateMinutes||0)>0)bits.push(`${a2t('late')} ${p5a2AttendanceFmt_(d.lateMinutes,0)}${a2t('minutes')}`);if(Number(d.leaveHours||0)>0)bits.push(`${a2t('leave')} ${p5a2AttendanceFmt_(d.leaveHours)}HR`);if(d.anomalyCode)bits.push(d.anomalyCode);line=bits.slice(0,2).map(escapeHtml).join('<br>')}cells+=`<div class="att-day ${escapeHtml(st.key)}"><div class="att-day-num">${day}</div><div class="att-day-status"><b>${escapeHtml(st.text)}</b>${line?'<br>'+line:''}</div></div>`}return `<div class="att-calendar-head">${heads.map(x=>`<div>${escapeHtml(x)}</div>`).join('')}</div><div class="att-calendar">${cells}</div>`}
function p5a202CorrectionStatusLabel_(status){const x=String(status||'').toUpperCase();if(x==='SUBMITTED')return c2t('pending');if(x==='MANAGER_CONFIRMED')return c2t('managerConfirmed');if(x==='MANAGER_REJECTED')return c2t('managerRejected');if(x==='HR_PENDING')return c2t('hrPending');if(x==='APPLY_PENDING')return currentLang==='ZH'?'已核准／等待系統重算':currentLang==='VI'?'Đã duyệt / chờ hệ thống tính lại':'อนุมัติแล้ว / รอระบบคำนวณใหม่';if(x==='HR_REJECTED')return currentLang==='ZH'?'HR 未採認':currentLang==='VI'?'HR không chấp nhận':'HR ไม่รับรอง';if(x==='COMPLETED')return c2t('completed');if(x==='CANCELLED')return c2t('cancelled');return x||'-'}
function p5a202CorrectionTypeLabel_(type){const m={MISSING_IN:'missingIn',MISSING_OUT:'missingOut',MISSING_BOTH:'missingBoth',WRONG_IN:'wrongIn',WRONG_OUT:'wrongOut',SHIFT_SCHEDULE:'shift',OTHER:'other'};return c2t(m[String(type||'').toUpperCase()]||'other')}
function p5a202CorrectionStateHtml_(d){const items=Array.isArray(d.correctionRequests)?d.correctionRequests:[];const active=d.activeCorrection||null;const latest=items.length?items[0]:null;const activeAppeal=d.activeAppeal||null;let html='';if(active){html+=`<div class="att-correction-state pending"><b>${escapeHtml(c2t('requestHistory'))}：</b>${escapeHtml(p5a202CorrectionTypeLabel_(active.requestType))}｜${escapeHtml(p5a202CorrectionStatusLabel_(active.status))}${active.submittedAt?'｜'+escapeHtml(active.submittedAt):''}</div>`}else if(latest){const st=String(latest.status||'').toUpperCase(),cls=(st==='MANAGER_REJECTED'||st==='HR_REJECTED')?'reject':'done';html+=`<div class="att-correction-state ${cls}"><b>${escapeHtml(c2t('requestHistory'))}：</b>${escapeHtml(p5a202CorrectionTypeLabel_(latest.requestType))}｜${escapeHtml(p5a202CorrectionStatusLabel_(latest.status))}</div>`;if(['COMPLETED','MANAGER_REJECTED','HR_REJECTED'].includes(st)){if(activeAppeal)html+=`<div class="tiny">${escapeHtml(a2rct('appeal'))}：${escapeHtml(activeAppeal.status||'')}</div>`;else html+=`<div class="att-correction-actions"><button type="button" class="secondary small" onclick="openAttendanceAppeal_('${encodeURIComponent(latest.correctionRequestId||'')}','${encodeURIComponent(d.attendanceKey||'')}',this)">${escapeHtml(a2rct('appeal'))}</button></div>`}}if(d.correctionEnabled&&!active){html+=`<div class="att-correction-actions"><button type="button" class="secondary small" onclick="openAttendanceCorrection_('${encodeURIComponent(d.attendanceKey||'')}')">${escapeHtml(c2t('request'))}</button></div>`}return html}
function p5a2AttendanceDetailHtml_(data){const days=(data.days||[]).slice().sort((a,b)=>String(b&&b.date||'').localeCompare(String(a&&a.date||'')));if(!days.length)return `<div class="muted">${escapeHtml(a2t('noDataMonth'))}</div>`;return days.map(d=>{const st=p5a2AttendanceStatus_(d),raw=(d.rawPunches||[]);const rawHtml=raw.length?raw.map(p=>escapeHtml(p5a2TimeOnly_(p.dateTime||p.time||''))).join(' · '):escapeHtml(a2t('none'));const ex=(d.exceptions||[]).map(x=>escapeHtml(x.name||x.code||'')).join('、');return `<div id="attendance-day-${rc2SafeDomId_(d.date||'')}" class="att-detail" data-attendance-date="${escapeHtml(d.date||'')}"><div><b>${escapeHtml(d.date||'')}</b> <span class="pill">${escapeHtml(st.text)}</span></div><div class="tiny">${escapeHtml(a2t('shift'))}：${escapeHtml(d.shiftName||d.shiftCode||'-')}</div><div class="att-detail-grid"><div>${escapeHtml(a2t('expected'))}：${escapeHtml(p5a2TimeOnly_(d.expectedStart))}–${escapeHtml(p5a2TimeOnly_(d.expectedEnd))} / ${p5a2AttendanceFmt_(d.expectedHours)} HR</div><div>${escapeHtml(a2t('actual'))}：${p5a2AttendanceFmt_(d.actualHours)} HR</div><div>${escapeHtml(a2t('firstIn'))}：${escapeHtml(p5a2TimeOnly_(d.firstIn))}</div><div>${escapeHtml(a2t('lastOut'))}：${escapeHtml(p5a2TimeOnly_(d.lastOut))}</div><div>${escapeHtml(a2t('late'))}：${p5a2AttendanceFmt_(d.lateMinutes,0)} ${escapeHtml(a2t('minutes'))}</div><div>${escapeHtml(a2t('early'))}：${p5a2AttendanceFmt_(d.earlyMinutes,0)} ${escapeHtml(a2t('minutes'))}</div><div>${escapeHtml(a2t('leave'))}：${p5a2AttendanceFmt_(d.leaveHours)} HR</div><div>${escapeHtml(a2t('overtime'))}：${p5a2AttendanceFmt_(d.overtimeHours)} HR</div><div>${escapeHtml(a2t('missingIn'))}：${d.missingIn?'Y':'N'}</div><div>${escapeHtml(a2t('missingOut'))}：${d.missingOut?'Y':'N'}</div><div>${escapeHtml(a2t('adjustment'))}：${p5a2AttendanceFmt_(d.adjustmentHours)} HR</div><div>${escapeHtml(a2t('closing'))}：${escapeHtml(d.closingStatus||'-')}</div></div><div class="att-punches"><b>${escapeHtml(a2t('rawPunch'))}</b>：${rawHtml}</div><div class="tiny" style="margin-top:6px"><b>${escapeHtml(a2t('systemDecision'))}</b>：${escapeHtml(d.attendanceStatus||'-')}${d.anomalyCode?'｜'+escapeHtml(d.anomalyCode):''}${d.anomalyDescription?'｜'+escapeHtml(d.anomalyDescription):''}${ex?'｜'+ex:''}</div>${p5a202CorrectionStateHtml_(d)}</div>`}).join('')}
function p5a202FindDay_(attendanceKey){return attendanceCache&&Array.isArray(attendanceCache.days)?attendanceCache.days.find(d=>String(d.attendanceKey||'')===String(attendanceKey||'')):null}
function p5a202DateAddOne_(dateKey){const p=String(dateKey||'').split('-').map(Number);if(p.length!==3)return dateKey;const d=new Date(p[0],p[1]-1,p[2]+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function p5a202DateTimeLocal_(d,value,isOut){const v=String(value||'').trim();let m=v.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);if(m)return `${m[1]}T${m[2]}:${m[3]}`;const t=p5a2TimeOnly_(v);if(!/^\d{2}:\d{2}$/.test(t))return '';let date=d.date;const expectedStart=p5a2TimeOnly_(d.expectedStart),expectedEnd=p5a2TimeOnly_(d.expectedEnd);if(isOut&&expectedStart&&expectedEnd&&expectedEnd<expectedStart&&t<expectedStart)date=p5a202DateAddOne_(date);return `${date}T${t}`}
function p5a202CorrectionTypeOptions_(){return [['',c2t('selectType')],['MISSING_IN',c2t('missingIn')],['MISSING_OUT',c2t('missingOut')],['MISSING_BOTH',c2t('missingBoth')],['WRONG_IN',c2t('wrongIn')],['WRONG_OUT',c2t('wrongOut')],['SHIFT_SCHEDULE',c2t('shift')],['OTHER',c2t('other')]].map(x=>`<option value="${x[0]}">${escapeHtml(x[1])}</option>`).join('')}
function closeAttendanceCorrection_(){const el=$('attendanceCorrectionOverlay');if(el)el.remove()}
function p5a202CorrectionToggle_(){const type=$('attCorrType')?$('attCorrType').value:'';const inBox=$('attCorrInBox'),outBox=$('attCorrOutBox');const needIn=['MISSING_IN','MISSING_BOTH','WRONG_IN'].includes(type),needOut=['MISSING_OUT','MISSING_BOTH','WRONG_OUT'].includes(type);if(inBox)inBox.classList.toggle('hide',!needIn);if(outBox)outBox.classList.toggle('hide',!needOut)}
function openAttendanceCorrection_(encodedKey){const key=decodeURIComponent(String(encodedKey||''));const d=p5a202FindDay_(key);if(!d||!d.correctionEnabled){message(c2t('notAvailable'),'warning');return}if(d.activeCorrection){message(c2t('existing'),'warning');return}closeAttendanceCorrection_();const overlay=document.createElement('div');overlay.id='attendanceCorrectionOverlay';overlay.className='confirm-backdrop';const inDefault=p5a202DateTimeLocal_(d,d.firstIn||d.expectedStart,false),outDefault=p5a202DateTimeLocal_(d,d.lastOut||d.expectedEnd,true);overlay.innerHTML=`<div class="confirm-dialog att-correction-form"><h2>${escapeHtml(c2t('title'))}</h2><div class="current-box"><b>${escapeHtml(d.date||'')}</b><br>${escapeHtml(a2t('shift'))}：${escapeHtml(d.shiftName||d.shiftCode||'-')}<br>${escapeHtml(a2t('expected'))}：${escapeHtml(p5a2TimeOnly_(d.expectedStart))}–${escapeHtml(p5a2TimeOnly_(d.expectedEnd))}<br>${escapeHtml(a2t('firstIn'))}：${escapeHtml(p5a2TimeOnly_(d.firstIn))}　${escapeHtml(a2t('lastOut'))}：${escapeHtml(p5a2TimeOnly_(d.lastOut))}</div><div class="notice tiny">${escapeHtml(c2t('systemWillNotChange'))}</div><label>${escapeHtml(c2t('type'))}</label><select id="attCorrType" onchange="p5a202CorrectionToggle_()">${p5a202CorrectionTypeOptions_()}</select><div id="attCorrInBox" class="hide"><label>${escapeHtml(c2t('correctIn'))}</label><input id="attCorrFirstIn" type="datetime-local" value="${escapeHtml(inDefault)}"></div><div id="attCorrOutBox" class="hide"><label>${escapeHtml(c2t('correctOut'))}</label><input id="attCorrLastOut" type="datetime-local" value="${escapeHtml(outDefault)}"></div><label>${escapeHtml(c2t('reason'))}</label><textarea id="attCorrReason" maxlength="500"></textarea><div class="confirm-actions"><button type="button" class="secondary" onclick="closeAttendanceCorrection_()">${escapeHtml(c2t('cancel'))}</button><button id="attCorrSubmit" type="button">${escapeHtml(c2t('submit'))}</button></div></div>`;document.body.appendChild(overlay);$('attCorrSubmit').onclick=function(){submitAttendanceCorrectionUi_(d,this)};setTimeout(()=>{$('attCorrType')&&$('attCorrType').focus()},0)}
async function submitAttendanceCorrectionUi_(d,triggerBtn){if(mutationBusy){message(nt('busy'),'warning');return}const type=$('attCorrType').value,reason=$('attCorrReason').value.trim(),requestedFirstIn=$('attCorrFirstIn').value||'',requestedLastOut=$('attCorrLastOut').value||'';if(!type){message(c2t('selectType'),'warning');return}if(!reason){message(c2t('reasonRequired'),'warning');return}const needIn=['MISSING_IN','MISSING_BOTH','WRONG_IN'].includes(type),needOut=['MISSING_OUT','MISSING_BOTH','WRONG_OUT'].includes(type);if((needIn&&!requestedFirstIn)||(needOut&&!requestedLastOut)){message(c2t('timeRequired'),'warning');return}const requestId=`ATT-CORR-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;mutationBusy=true;const op=beginOperation_(c2t('submitting'),nt('doNotRepeat'),triggerBtn);let success=false;try{await call('submitAttendanceCorrection',{sessionToken,attendanceKey:d.attendanceKey,requestType:type,requestedFirstIn:needIn?requestedFirstIn:'',requestedLastOut:needOut?requestedLastOut:'',reason,requestId});success=true}catch(e){if(e&&e.kind==='TRANSPORT'){try{const st=await call('attendanceCorrectionStatus',{sessionToken,requestId});if(st&&st.found)success=true}catch(ignore){}if(!success){mutationBusy=false;finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);return}}else{mutationBusy=false;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}}if(success){closeAttendanceCorrection_();try{const data=await call('myAttendance',{sessionToken,month:p5a2AttendanceMonthValue_()});attendanceCache=data;attendanceViewMode='detail';renderMyAttendance_(data);finishOperationSuccess_(op,c2t('submitted'),'');message(c2t('submitted'),'success')}catch(refreshErr){finishOperationSuccess_(op,c2t('submitted'),nt('refreshAfterSuccessFail'));message(nt('refreshAfterSuccessFail'),'warning')}}mutationBusy=false}
function renderMyAttendance_(data){attendanceCache=data||null;const box=$('attendanceContent');if(!box||!data)return;const calendarActive=attendanceViewMode==='calendar';box.innerHTML=p5a2AttendanceWarningsHtml_(data)+p5a2AttendanceSummaryHtml_(data)+`<div class="att-tabs"><button type="button" class="${calendarActive?'active':''}" onclick="setAttendanceView_('calendar')">${escapeHtml(a2t('calendar'))}</button><button type="button" class="${!calendarActive?'active':''}" onclick="setAttendanceView_('detail')">${escapeHtml(a2t('detail'))}</button></div><div id="attendanceViewBody">${calendarActive?p5a2AttendanceCalendarHtml_(data):p5a2AttendanceDetailHtml_(data)}</div><div class="tiny" style="margin-top:12px">${escapeHtml(a2t('source'))}：${escapeHtml(data.source||'')}</div>`;if(!calendarActive&&attendanceFocusDate_)rc2ApplyAttendanceFocus_()}
function setAttendanceView_(mode){attendanceViewMode=mode==='detail'?'detail':'calendar';if(attendanceCache)renderMyAttendance_(attendanceCache)}
async function refreshMyAttendance(triggerBtn){const navSeq=p5a1CurrentNavSeq_();hideAppSections();$('attendance').classList.remove('hide');const monthEl=$('attendanceMonth');if(monthEl&&!monthEl.value)monthEl.value=p5a2AttendanceMonthValue_();const month=p5a2AttendanceMonthValue_();const same=attendanceCache&&attendanceCache.month===month;if(same){renderMyAttendance_(attendanceCache);if(abisPerf2Fresh_('attendance:'+month,ABIS_PERF2_TTL_.attendance))return attendanceCache}else $('attendanceContent').innerHTML=`<div class="muted">${escapeHtml(a2t('loadingAttendance'))}</div>`;if(same){abisPerf2LoadAttendance_(month).then(function(data){if(p5a1NavStillCurrent_(navSeq)&&data&&data.month===month)renderMyAttendance_(data)}).catch(function(){});return attendanceCache}const op=beginOperation_(a2t('loadingAttendance'),nt('doNotRepeat'),triggerBtn);try{const data=await abisPerf2LoadAttendance_(month);if(!p5a1NavStillCurrent_(navSeq))return data;renderMyAttendance_(data);finishOperationSuccess_(op,a2t('loadDone'),'');return data}catch(e){if(!p5a1NavStillCurrent_(navSeq))return null;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return null}}

function renderLeaves(list){$('leaveList').innerHTML=list.length?list.map(x=>{const canWithdraw=!['已核准','已取消','已駁回','已撤回'].includes(String(x.status)),proxyText=x.proxyName?escapeHtml(x.proxyName):(x.proxyId?escapeHtml(x.proxyId):(x.proxyRequired?tr('pendingProxy'):tr('noProxy'))),attachments=Array.isArray(x.attachments)?x.attachments:[],attachmentText=attachments.length?`<div class="tiny" style="margin-top:6px"><b>${tr('attachmentWord')}：</b>${attachments.map(a=>`<span style="display:inline-flex;gap:4px;align-items:center;margin:2px 8px 2px 0">${escapeHtml(a.name||a.attachmentId||'')}<button type="button" class="secondary small" onclick="p5a110AccessAttachment_('${escapeHtml(a.attachmentId||'')}','VIEW',this)">${escapeHtml(p5a110Text_('view'))}</button><button type="button" class="secondary small" onclick="p5a110AccessAttachment_('${escapeHtml(a.attachmentId||'')}','DOWNLOAD',this)">${escapeHtml(p5a110Text_('download'))}</button></span>`).join('')}</div>`:(x.attachmentNames&&x.attachmentNames.length?`<br><span class="tiny">${tr('attachmentWord')}：${escapeHtml(x.attachmentNames.join('、'))}</span>`:''),returned=x.status==='RETURNED',returnText=returned?`<div class="notice tiny"><b>${escapeHtml(p4t('returnReason'))}</b>：${escapeHtml([x.returnReasonCode,x.returnReasonNote].filter(Boolean).join('｜')||p4t('noReturnReason'))}<br>${escapeHtml(x.returnScopeType==='GROUP'?p4t('groupHint'):p4t('singleHint'))}</div>`:'',returnedActions=returned?`<div class="row-actions"><button class="secondary small" onclick="beginReturnedEdit_('${escapeHtml(x.leaveId)}')">${escapeHtml(p4t('returnedEdit'))}</button><button class="small" onclick="resubmitReturnedDirect_('${escapeHtml(x.leaveId)}',this)">${escapeHtml(x.returnScopeType==='GROUP'?p4t('returnedGroupResubmit'):p4t('returnedResubmit'))}</button></div>`:'';return `<div id="leave-detail-${rc2SafeDomId_(x.leaveId||'')}" class="leave" data-leave-id="${escapeHtml(x.leaveId||'')}"><b>${escapeHtml(leaveTypeLabel(x))}</b> <span class="pill">${escapeHtml(statusLabel(x.status))}</span><br><span class="muted">${escapeHtml(x.startDate)} ${escapeHtml(x.startTime||'')} · ${escapeHtml(x.hours)} HR · ${escapeHtml(x.leaveId)}</span><br><span class="tiny">${tr('proxyLabel')}：${proxyText}</span>${attachmentText}${returnText}${returnedActions}${canWithdraw?`<button class="secondary small" onclick="withdrawLeave('${escapeHtml(x.leaveId)}',this)">${tr('withdraw')}</button>`:''}</div>`}).join(''):tr('noData')}async function refreshLeaves(focusLeaveId){const navSeq=p5a1CurrentNavSeq_();hideAppSections();$('leaves').classList.remove('hide');const has=myLeavesCache!==null;if(has){renderLeaves(myLeavesCache);if(focusLeaveId)rc2ScrollLeave_(focusLeaveId);if(abisPerf2Fresh_('leaves',ABIS_PERF2_TTL_.leaves))return myLeavesCache;abisPerf2LoadLeaves_().then(function(list){if(!p5a1NavStillCurrent_(navSeq))return;renderLeaves(list);if(focusLeaveId)rc2ScrollLeave_(focusLeaveId)}).catch(function(){});return myLeavesCache}$('leaveList').innerHTML=`<div class="muted">${tr('loading')}</div>`;const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{const list=await abisPerf2LoadLeaves_();if(!p5a1NavStillCurrent_(navSeq))return list;renderLeaves(list);if(focusLeaveId)rc2ScrollLeave_(focusLeaveId);finishOperationSuccess_(op,nt('loadDone'),'');return list}catch(e){if(!p5a1NavStillCurrent_(navSeq))return null;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return null}}async function withdrawLeave(leaveId,triggerBtn){if(mutationBusy){message(nt('busy'),'warning');return}const reasonInput=prompt(tr('withdrawReason'));if(reasonInput===null)return;const confirmed=await p4a14Confirm_(p4a14t('withdrawConfirmTitle'),p4a14t('withdrawConfirmBody'),p4a14t('confirmWithdraw'));if(!confirmed)return;const reason=reasonInput||'';mutationBusy=true;setAreaBusy_('leaves',true,nt('withdrawSending'));const op=beginOperation_(nt('withdrawSending'),nt('doNotRepeat'),triggerBtn);try{await call('withdrawLeave',{sessionToken,leaveId,reason})}catch(e){if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('withdraw',op);if(!synced)message(nt('stillUnknown'),'error');return}mutationBusy=false;setAreaBusy_('leaves',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}mutationBusy=false;setAreaBusy_('leaves',false);myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,nt('withdrawDone'),tr('withdrawn'));message(tr('withdrawn'),'success');try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}}
function setInboxCount(n){const el=$('inboxCount');if(!el)return;el.textContent=n;el.classList.toggle('hide',!n)}
function p5a1Rc2TaskFilterNormalize_(filter){const f=String(filter||'ALL').trim().toUpperCase();return ['ALL','RETURNED_LEAVE','ATTENDANCE_EXCEPTION','APPROVAL','SUPPLEMENT'].includes(f)?f:'ALL'}
function p5a1Rc2TaskFilterLabel_(filter){const f=p5a1Rc2TaskFilterNormalize_(filter);const zh={ALL:'全部',RETURNED_LEAVE:'請假退回',ATTENDANCE_EXCEPTION:'出勤異常',APPROVAL:'待簽核',SUPPLEMENT:'待補件'},vi={ALL:'Tất cả',RETURNED_LEAVE:'Đơn bị trả lại',ATTENDANCE_EXCEPTION:'Bất thường chấm công',APPROVAL:'Chờ phê duyệt',SUPPLEMENT:'Chờ bổ sung'},th={ALL:'ทั้งหมด',RETURNED_LEAVE:'ใบลาถูกส่งกลับ',ATTENDANCE_EXCEPTION:'ความผิดปกติการลงเวลา',APPROVAL:'รออนุมัติ',SUPPLEMENT:'รอเอกสารเพิ่ม'};return (currentLang==='VI'?vi:currentLang==='TH'?th:zh)[f]||f}
function p5a1Rc2TaskActionText_(task){const a=Array.isArray(task&&task.AllowedActions)?task.AllowedActions:[];if(a.includes('RESUBMIT'))return currentLang==='VI'?'Mở để sửa':'開啟修改';if(a.includes('UPLOAD_SUPPLEMENT'))return currentLang==='VI'?'Mở để bổ sung':'開啟補件';if(a.includes('APPROVE'))return currentLang==='VI'?'Mở xử lý':'開啟處理';if(a.includes('CORRECT'))return currentLang==='VI'?'Mở chấm công':'開啟出勤';return currentLang==='VI'?'Mở':'開啟'}
function p5a1Rc2TaskFiltersHtml_(active){return ['ALL','RETURNED_LEAVE','ATTENDANCE_EXCEPTION','APPROVAL','SUPPLEMENT'].map(f=>`<button type="button" class="${f===active?'':'secondary'} small" style="width:auto;margin:0" onclick="refreshInbox('${f}')">${escapeHtml(p5a1Rc2TaskFilterLabel_(f))}</button>`).join('')}
function p5a1Rc2TaskDateKey_(task){
  const meta=task&&typeof task.Meta==='object'?task.Meta:(task&&typeof task.meta==='object'?task.meta:{});
  const candidates=[meta.date,task&&task.RouteTargetID,task&&task.routeTargetId,task&&task.Subtitle];
  for(const v of candidates){
    const s=String(v||'').trim(),m=s.match(/\d{4}-\d{2}-\d{2}/);if(m)return m[0];
    const head=s.split(/[｜|]/)[0].trim(),d=new Date(head);
    if(head&&!isNaN(d.getTime()))return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  return '';
}
function p5a1Rc2TaskDateText_(task){
  const key=p5a1Rc2TaskDateKey_(task);if(!key)return '';
  const p=key.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2]);
  try{return new Intl.DateTimeFormat(fhLocale_(),{month:'numeric',day:'numeric',weekday:'short'}).format(d)}catch(e){return key.slice(5).replace('-','/')}
}
function p5a1Rc2AttendanceExceptionCode_(task){
  const meta=task&&typeof task.Meta==='object'?task.Meta:(task&&typeof task.meta==='object'?task.meta:{});
  let code=String(meta.exceptionCode||meta.code||'').trim().toUpperCase();
  if(code)return code;
  const s=String(task&&task.Subtitle||'').toUpperCase(),parts=s.split(/[｜|]/).map(x=>x.trim()).filter(Boolean);
  return parts.length?parts[parts.length-1]:'';
}
function p5a1Rc2AttendanceExceptionCopy_(code){
  const zh={
    MISSING_IN:['缺上班卡','沒有找到上班打卡，請確認或補正。'],
    MISSING_OUT:['缺下班卡','沒有找到下班打卡，請確認或補正。'],
    NO_PUNCH:['上下班皆未打卡','當日沒有找到打卡紀錄，請確認或補正。'],
    SINGLE_PUNCH:['打卡不完整','當日只有一筆打卡，請確認或補正。'],
    LATE:['遲到','上班打卡晚於班別時間，請確認。'],
    LATE_OVER_30:['遲到超過 30 分鐘','請確認當日出勤狀況。'],
    EARLY_LEAVE:['早退','下班打卡早於班別時間，請確認。'],
    PUNCH_ON_REST_DAY:['排休日有打卡','排休日出現打卡，請確認是否為臨時出勤。'],
    PUNCH_ON_NONWORKDAY:['非工作日有打卡','非工作日出現打卡，請確認是否為臨時出勤。']
  };
  const vi={MISSING_IN:['Thiếu giờ vào','Không tìm thấy chấm công vào ca.'],MISSING_OUT:['Thiếu giờ ra','Không tìm thấy chấm công tan ca.'],NO_PUNCH:['Không có chấm công','Không tìm thấy dữ liệu chấm công trong ngày.'],SINGLE_PUNCH:['Chấm công chưa đủ','Trong ngày chỉ có một lần chấm công.'],LATE:['Đi muộn','Vui lòng kiểm tra giờ vào ca.'],LATE_OVER_30:['Đi muộn trên 30 phút','Vui lòng kiểm tra tình trạng đi làm.'],EARLY_LEAVE:['Về sớm','Vui lòng kiểm tra giờ tan ca.'],PUNCH_ON_REST_DAY:['Có chấm công ngày nghỉ','Vui lòng xác nhận có đi làm đột xuất hay không.'],PUNCH_ON_NONWORKDAY:['Có chấm công ngày không làm việc','Vui lòng xác nhận có đi làm đột xuất hay không.']};
  const th={MISSING_IN:['ขาดเวลาเข้างาน','ไม่พบการลงเวลาเข้างาน โปรดตรวจสอบหรือแก้ไข'],MISSING_OUT:['ขาดเวลาออกงาน','ไม่พบการลงเวลาออกงาน โปรดตรวจสอบหรือแก้ไข'],NO_PUNCH:['ไม่มีการลงเวลา','ไม่พบข้อมูลการลงเวลาของวันนี้'],SINGLE_PUNCH:['ลงเวลาไม่ครบ','วันนี้มีการลงเวลาเพียงครั้งเดียว'],LATE:['มาสาย','โปรดตรวจสอบเวลาเข้างาน'],LATE_OVER_30:['มาสายเกิน 30 นาที','โปรดตรวจสอบสถานะการมาทำงาน'],EARLY_LEAVE:['ออกก่อนเวลา','โปรดตรวจสอบเวลาออกงาน'],PUNCH_ON_REST_DAY:['มีการลงเวลาในวันหยุด','โปรดยืนยันว่าเป็นการมาทำงานชั่วคราวหรือไม่'],PUNCH_ON_NONWORKDAY:['มีการลงเวลาในวันไม่ทำงาน','โปรดยืนยันว่าเป็นการมาทำงานชั่วคราวหรือไม่']};
  const dict=currentLang==='VI'?vi:currentLang==='TH'?th:zh;
  return dict[code]||(currentLang==='VI'?['Bất thường chấm công','Vui lòng mở để kiểm tra chi tiết.']:currentLang==='TH'?['เวลาทำงานผิดปกติ','โปรดเปิดเพื่อตรวจสอบรายละเอียด']:['出勤異常','請開啟查看詳細內容。']);
}
function p5a1Rc2TaskUpdatedText_(v){
  const s=String(v||'').trim();if(!s)return '';
  const d=new Date(s);if(isNaN(d.getTime()))return '';
  try{return new Intl.DateTimeFormat(fhLocale_(),{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}catch(e){return ''}
}
function p5a1Rc2AttendanceTaskCard_(task){
  const taskId=encodeURIComponent(String(task.TaskID||'')),code=p5a1Rc2AttendanceExceptionCode_(task),copy=p5a1Rc2AttendanceExceptionCopy_(code),dateText=p5a1Rc2TaskDateText_(task),updated=p5a1Rc2TaskUpdatedText_(task.UpdatedAt||task.CreatedAt||'');
  const pending=currentLang==='VI'?'Cần xử lý':currentLang==='TH'?'รอดำเนินการ':'待處理';
  const action=currentLang==='VI'?'Xử lý':currentLang==='TH'?'ดำเนินการ':'處理異常';
  const updatedLabel=currentLang==='VI'?'Cập nhật':currentLang==='TH'?'อัปเดต':'更新';
  return `<div class="att-work-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b>${escapeHtml([dateText,copy[0]].filter(Boolean).join('｜'))}</b><span class="pill">${escapeHtml(pending)}</span></div><div class="tiny" style="margin-top:6px">${escapeHtml(copy[1])}</div>${updated?`<div class="tiny muted" style="margin-top:4px">${escapeHtml(updatedLabel)} ${escapeHtml(updated)}</div>`:''}<button type="button" class="secondary small" onclick="p5a1Rc2OpenTask_('${taskId}',this)">${escapeHtml(action)}</button></div>`;
}
function p5a1Rc2RenderTaskInbox_(data){const el=$('inboxList');if(!el)return;const filter=p5a1Rc2TaskFilterNormalize_(data&&data.filter||activeTaskFilter),tasks=Array.isArray(data&&data.tasks)?data.tasks:[];activeTaskFilter=filter;activeTaskInboxData=data||null;const filters=`<div style="display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px">${p5a1Rc2TaskFiltersHtml_(filter)}</div>`;const summary=data&&data.taskSummary?data.taskSummary:null;const pendingLabel=currentLang==='VI'?'việc cần xử lý':currentLang==='TH'?'รายการที่ต้องดำเนินการ':'筆待處理';const summaryHtml=summary?`<div class="tiny muted" style="margin-bottom:12px">${escapeHtml(p5a1Rc2TaskFilterLabel_(filter))}｜${Number(data.count||0)} ${escapeHtml(pendingLabel)}</div>`:'';const cards=tasks.map(task=>{if(String(task.Category||'').toUpperCase()==='ATTENDANCE_EXCEPTION')return p5a1Rc2AttendanceTaskCard_(task);const taskId=encodeURIComponent(String(task.TaskID||'')),category=p5a1Rc2TaskFilterLabel_(task.Category),title=String(task.Title||category),subtitle=String(task.Subtitle||''),updated=p5a1Rc2TaskUpdatedText_(task.UpdatedAt||task.CreatedAt||'');return `<div class="att-work-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b>${escapeHtml(title)}</b><span class="pill">${escapeHtml(category)}</span></div>${subtitle?`<div class="tiny" style="margin-top:6px">${escapeHtml(subtitle)}</div>`:''}${updated?`<div class="tiny muted" style="margin-top:4px">${escapeHtml(updated)}</div>`:''}<button type="button" class="secondary small" onclick="p5a1Rc2OpenTask_('${taskId}',this)">${escapeHtml(p5a1Rc2TaskActionText_(task))}</button></div>`}).join('');el.innerHTML=`${filters}${summaryHtml}${cards||`<div class="muted">${escapeHtml(tr('noInbox'))}</div>`}`}
async function refreshInbox(filter){const navSeq=p5a1CurrentNavSeq_(),f=p5a1Rc2TaskFilterNormalize_(filter);activeTaskFilter=f;hideAppSections();$('inbox').classList.remove('hide');let cached=taskInboxCache&&taskInboxCache[f];if(!cached&&f!=='ALL'){cached=abisPerf2TaskViewFromAll_(f);if(cached)taskInboxCache[f]=cached}if(cached){activeTaskInboxData=cached;p5a1Rc2RenderTaskInbox_(cached);if(abisPerf2Fresh_('taskInbox:'+f,ABIS_PERF2_TTL_.taskInbox)||f!=='ALL'&&abisPerf2Fresh_('taskInbox:ALL',ABIS_PERF2_TTL_.taskInbox))return cached}else $('inboxList').innerHTML=`<div class="muted">${tr('loading')}</div>`;if(cached){abisPerf2LoadTaskInbox_(f).then(function(data){if(!p5a1NavStillCurrent_(navSeq))return;activeTaskInboxData=data;p5a1Rc2RenderTaskInbox_(data)}).catch(function(){});return cached}const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{const data=await abisPerf2LoadTaskInbox_(f);if(!p5a1NavStillCurrent_(navSeq))return data;activeTaskInboxData=data;if(data&&data.taskSummary){taskSummaryCache=data.taskSummary;setInboxCount(Number(taskSummaryCache.total||0))}p5a1Rc2RenderTaskInbox_(data);if(!$('home').classList.contains('hide'))renderHome();finishOperationSuccess_(op,nt('loadDone'),'');return data}catch(e){if(!p5a1NavStillCurrent_(navSeq))return null;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return null}}
async function p5a1Rc2OpenTask_(encodedTaskId,triggerBtn){const taskId=decodeURIComponent(String(encodedTaskId||'')),tasks=activeTaskInboxData&&Array.isArray(activeTaskInboxData.tasks)?activeTaskInboxData.tasks:[],task=tasks.find(x=>String(x.TaskID||'')===taskId);if(!task){message('Task 已更新，請重新整理待辦。','warning');return}const route=String(task.Route||'').toLowerCase(),target=String(task.RouteTargetID||'');if(route==='inbox'){await refreshLegacyInbox_(target);return}if(route==='attendance'){if(/^\d{4}-\d{2}-\d{2}$/.test(target)){await openAttendanceDate_(encodeURIComponent(target),triggerBtn)}else{attendanceCache=null;attendanceViewMode='detail';await refreshMyAttendance(triggerBtn)}return}if(route==='leaves'){myLeavesCache=null;if(target)await openLeaveDetail_(encodeURIComponent(target));else await refreshLeaves();if(String(task.Category||'')==='RETURNED_LEAVE'&&target){const x=returnedLeaveById_(target);if(x&&String(x.status)==='RETURNED')beginReturnedEdit_(target)}return}message('此 Task 尚未設定可開啟的處理頁。','warning')}
async function refreshLegacyInbox_(routeTargetId){const navSeq=p5a1CurrentNavSeq_();hideAppSections();$('inbox').classList.remove('hide');if(inboxCache!==null)renderInbox(inboxCache);else $('inboxList').innerHTML=`<div class="muted">${tr('loading')}</div>`;const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{const result=await Promise.all([call('inbox',{sessionToken}),call('attendanceInbox',{sessionToken})]);inboxCache={leave:result[0]||[],attendance:result[1]||{count:0}};if(!p5a1NavStillCurrent_(navSeq))return;renderInbox(inboxCache);finishOperationSuccess_(op,nt('loadDone'),'')}catch(e){if(!p5a1NavStillCurrent_(navSeq))return;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function renderProxyArrangement(x){
  const label=currentLang==='VI'?'Sắp xếp người thay thế':currentLang==='TH'?'การจัดผู้แทน':'代理安排';
  const direct=currentLang==='VI'?'quản lý trực tiếp kiêm người thay thế':currentLang==='TH'?'ผู้บังคับบัญชาโดยตรงและผู้แทน':'直屬主管兼代理人';
  const accepted=currentLang==='VI'?'đã xác nhận':currentLang==='TH'?'ยืนยันแล้ว':'已接受';
  const pending=currentLang==='VI'?'chưa xác nhận':currentLang==='TH'?'ยังไม่ยืนยัน':'待確認';
  const unassigned=currentLang==='VI'?'chưa chỉ định':currentLang==='TH'?'ยังไม่ได้ระบุ':'尚未指定';
  const notRequired=currentLang==='VI'?'không cần người thay thế':currentLang==='TH'?'ไม่ต้องมีผู้แทน':'無需代理人';
  if(x.proxyRequired===false&&!x.proxyId)return `<div class="tiny muted"><b>${label}：</b>${notRequired}</div>`;
  if(!x.proxyId)return `<div class="proxy-warn"><b>${label}：</b>${unassigned}</div>`;
  const pa=x.proxyAcceptance||{};
  const proxyText=x.proxyName?`${x.proxyName}（${x.proxyId}）`:x.proxyId;
  const relation=x.proxyIsDirectManager?`｜${direct}`:'';
  const status=pa.accepted?accepted:pending;
  const cls=pa.accepted?'proxy-ok':'proxy-warn';
  return `<div class="${cls}"><b>${label}：</b>${escapeHtml(proxyText)}${relation}｜${status}</div>`;
}
function renderLeaveInbox_(list){const build='<div class="build-tag">Build MVP_V2_20260928_P5A2_PHASE2_INTEGRATED_RC1</div>';$('inboxList').innerHTML=build+(list.length?list.map(x=>{const time=`${escapeHtml(x.startDate)} ${escapeHtml(x.startTime||'')} ${x.endTime?'- '+escapeHtml(x.endTime):''}`;let detail=`<div class="meta"><b>${escapeHtml(x.employeeName)}</b> <span class="pill">${escapeHtml(roleLabel(x.role))}</span><br>${escapeHtml(leaveTypeLabel(x))} · ${time} · ${escapeHtml(x.hours)} HR<br><span class="tiny">${tr('handoverShort')}：${escapeHtml(x.handover||'')}</span>`;detail+=renderProxyArrangement(x);if(x.reason!==undefined)detail+=`<br><span class="tiny">${tr('reason')}：${escapeHtml(x.reason||'')}</span>`;if((x.role==='MANAGER'||x.role==='MANAGER_ASSIGN'||x.role==='TOP_MANAGER')&&x.departmentConflicts&&x.departmentConflicts.length)detail+=`<div class="dept-conflict">${renderDepartmentConflictWarning(x.departmentConflicts,true)}</div>`;if(x.role==='TOP_MANAGER'){const g=x.leaveGroup||null;let groupText='';if(g){const types=g.typeHours&&typeof g.typeHours==='object'?Object.entries(g.typeHours).map(([k,v])=>`${escapeHtml(k)} ${Number(v||0).toFixed(1)}HR`).join(' / '):'';groupText=`<br><b>${escapeHtml(g.startDate||'')} ～ ${escapeHtml(g.endDate||'')}</b><br>${currentLang==='ZH'?'等值工作天':currentLang==='VI'?'Ngày công tương đương':'วันทำงานเทียบเท่า'}：${Number(g.equivalentDays||0).toFixed(2)}<br>${currentLang==='ZH'?'群組總時數':currentLang==='VI'?'Tổng giờ nhóm':'ชั่วโมงรวมกลุ่ม'}：${Number(g.hours||0).toFixed(1)} HR${types?`<br><span class="tiny">${types}</span>`:''}`;}detail+=`<div class="notice"><b>${tr('topNotice')}</b><br>${tr('topNoticeBody')}${groupText}</div>`;}detail+='</div>';let controls=`<label>${tr('comment')}</label><textarea id="comment_${escapeHtml(x.leaveId)}"></textarea>`;if(x.role==='MANAGER_ASSIGN'||x.role==='MANAGER'){const opts=(x.proxyCandidates||[]).map(p=>`<option value="${escapeHtml(p.id)}" data-unavailable="${p.available===false?'Y':'N'}">${escapeHtml(p.name)}（${escapeHtml(p.id)}｜${escapeHtml(sourceLabel(p.source))}）</option>`).join('');controls+=`<label>${tr('proxyLabel')}</label><select id="proxy_${escapeHtml(x.leaveId)}" onchange="managerProxyChanged('${escapeHtml(x.leaveId)}')"><option value="">${tr('select')}</option>${opts}</select><div id="proxyWarn_${escapeHtml(x.leaveId)}" class="proxy-warn hide"></div>`}if(x.role==='PROXY')controls+=`<div class="row-actions"><button onclick="approveAction('${escapeHtml(x.leaveId)}','PROXY_ACCEPT',this)">${tr('acceptProxy')}</button><button class="danger" onclick="approveAction('${escapeHtml(x.leaveId)}','REJECT',this)">${tr('reject')}</button></div>`;if(x.role==='MANAGER_ASSIGN')controls+=`<div class="row-actions"><button onclick="approveAction('${escapeHtml(x.leaveId)}','ASSIGN_PROXY',this)">${tr('assignProxy')}</button><button class="danger" onclick="approveAction('${escapeHtml(x.leaveId)}','REJECT',this)">${tr('reject')}</button></div>`;if(x.role==='MANAGER'){const blocked=x.proxyAvailability&&x.proxyAvailability.available===false;controls+=`<div class="row-actions"><button ${blocked?'disabled':''} onclick="approveAction('${escapeHtml(x.leaveId)}','MANAGER_APPROVE',this)">${tr('managerApprove')}</button><button class="danger" onclick="approveAction('${escapeHtml(x.leaveId)}','REJECT',this)">${tr('reject')}</button></div><button class="secondary small" onclick="approveAction('${escapeHtml(x.leaveId)}','ASSIGN_PROXY',this)">${tr('changeProxy')}</button>`}if(x.role==='TOP_MANAGER')controls+=`<div class="row-actions"><button onclick="approveAction('${escapeHtml(x.leaveId)}','TOP_APPROVE',this)">${tr('topApprove')}</button><button class="danger" onclick="approveAction('${escapeHtml(x.leaveId)}','REJECT',this)">${tr('reject')}</button></div>`;return `<div class="approval">${detail}${controls}</div>`}).join(''):tr('noInbox'))}
function managerProxyChanged(leaveId){const s=$(`proxy_${leaveId}`),warn=$(`proxyWarn_${leaveId}`);if(!s||!warn)return true;const opt=s.options[s.selectedIndex];if(opt&&opt.dataset&&opt.dataset.unavailable==='Y'){warn.textContent=currentLang==='VI'?'Người này đã có nghỉ được duyệt trong thời gian đó.':currentLang==='TH'?'บุคคลนี้มีวันลาที่อนุมัติแล้วในช่วงเวลาดังกล่าว':'此代理人該時段已有已核准假單，請選擇其他代理人。';warn.classList.remove('hide');s.value='';return false}warn.innerHTML='';warn.classList.add('hide');return true}
function p5a2rc1SafeId_(s){return String(s||'').replace(/[^A-Za-z0-9]/g,'_')}
function p5a2rc1DtLocal_(v){if(!v)return '';const s=String(v).replace(' ','T');return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)?s.slice(0,16):''}
function p5a2rc1ShiftOptions_(a,selected){const list=(a&&a.shiftOptions)||[];return `<option value="">${escapeHtml(tr('select'))}</option>`+list.map(x=>`<option value="${escapeHtml(x.code)}" ${String(x.code)===String(selected||'')?'selected':''}>${escapeHtml(x.name||x.code)} (${escapeHtml(x.code)})</option>`).join('')}
function p5a2rc1CorrectionCard_(x,kind,a){const id=p5a2rc1SafeId_(x.correctionRequestId),isMgr=kind==='MANAGER',title=isMgr?a2rct('managerCorrection'):a2rct('hrCorrection');const first=x.hrFinalFirstIn||x.managerConfirmedFirstIn||x.requestedFirstIn||'',last=x.hrFinalLastOut||x.managerConfirmedLastOut||x.requestedLastOut||'',shift=x.hrFinalShiftCode||x.managerConfirmedShiftCode||'';return `<div class="att-work-card"><h3>${escapeHtml(title)}</h3><div><b>${escapeHtml(x.employeeName||x.employeeId||'')}（${escapeHtml(x.employeeId||'')}）</b> <span class="pill">${escapeHtml(x.date||'')}</span></div><div class="tiny">${escapeHtml(a2rct('requestType'))}：${escapeHtml(p5a202CorrectionTypeLabel_(x.requestType))}<br>${escapeHtml(c2t('reason'))}：${escapeHtml(x.reason||'')}</div><div class="att-work-grid"><div><label>${escapeHtml(a2rct('confirmedIn'))}</label><input id="a2_in_${id}" type="datetime-local" value="${escapeHtml(p5a2rc1DtLocal_(first))}"></div><div><label>${escapeHtml(a2rct('confirmedOut'))}</label><input id="a2_out_${id}" type="datetime-local" value="${escapeHtml(p5a2rc1DtLocal_(last))}"></div><div><label>${escapeHtml(a2rct('confirmedShift'))}</label><select id="a2_shift_${id}">${p5a2rc1ShiftOptions_(a,shift)}</select></div>${isMgr?`<div><label>${escapeHtml(a2rct('payrollImpact'))}</label><select id="a2_pay_${id}"><option value="">${escapeHtml(tr('select'))}</option><option value="N">${escapeHtml(a2rct('no'))}</option><option value="Y">${escapeHtml(a2rct('yes'))}</option></select></div>`:''}</div><label>${escapeHtml(isMgr?a2rct('managerNote'):a2rct('hrNote'))}</label><textarea id="a2_note_${id}"></textarea><div class="att-work-actions"><button onclick="p5a2rc1CorrectionAction_('${escapeHtml(x.correctionRequestId)}','${kind}','${isMgr?'APPROVE':'CONFIRM'}',this)">${escapeHtml(isMgr?a2rct('approve'):a2rct('confirm'))}</button><button class="danger" onclick="p5a2rc1CorrectionAction_('${escapeHtml(x.correctionRequestId)}','${kind}','REJECT',this)">${escapeHtml(a2rct('reject'))}</button></div></div>`}
async function p5a2rc1CorrectionAction_(correctionRequestId,kind,action,btn){if(mutationBusy){message(nt('busy'),'warning');return}const id=p5a2rc1SafeId_(correctionRequestId),payload={sessionToken,correctionRequestId,action,firstIn:$('a2_in_'+id)?$('a2_in_'+id).value:'',lastOut:$('a2_out_'+id)?$('a2_out_'+id).value:'',shiftCode:$('a2_shift_'+id)?$('a2_shift_'+id).value:'',note:$('a2_note_'+id)?$('a2_note_'+id).value.trim():'',requestId:`A2-${kind}-${action}-${Date.now()}-${p4a13Uuid_()}`};if(kind==='MANAGER')payload.payrollImpact=$('a2_pay_'+id)?$('a2_pay_'+id).value:'';mutationBusy=true;const op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),btn);try{await call(kind==='MANAGER'?'attendanceCorrectionManagerAction':'attendanceCorrectionHrAction',payload);inboxCache=null;attendanceCache=null;finishOperationSuccess_(op,a2rct('done'),'');await refreshInbox()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{mutationBusy=false}}
function p5a2rc1MonthlyCandidateCard_(x){return `<div class="att-work-card"><h3>${escapeHtml(a2rct('monthlyCandidate'))}</h3><b>${escapeHtml(x.employeeName||x.employeeId)}（${escapeHtml(x.employeeId)}）</b><div class="tiny">${escapeHtml(x.month)}｜${Number((x.items||[]).length)} items</div><div class="att-work-actions"><button onclick="p5a2rc1CreateMonthly_('${escapeHtml(x.candidateKey)}',this)">${escapeHtml(a2rct('createMonthly'))}</button></div></div>`}
async function p5a2rc1CreateMonthly_(candidateKey,btn){const op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),btn);try{await call('attendanceCreateMonthlyConfirmation',{sessionToken,candidateKey,requestId:'A2-MON-CREATE-'+Date.now()+'-'+p4a13Uuid_()});inboxCache=null;finishOperationSuccess_(op,a2rct('done'),'');await refreshInbox()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function p5a2rc1MonthlyManagerCard_(x){const id=p5a2rc1SafeId_(x.confirmationId);return `<div class="att-work-card"><h3>${escapeHtml(a2rct('monthlyManager'))}</h3><b>${escapeHtml(x.employeeName||x.employeeId)}（${escapeHtml(x.employeeId)}） · ${escapeHtml(x.month)}</b>${(x.items||[]).map((it,i)=>`<div class="att-item"><b>${escapeHtml(it.date||'')}｜${escapeHtml(it.name||it.code||'')}</b><select id="a2_mon_dec_${id}_${i}"><option value="">${escapeHtml(tr('select'))}</option><option value="CONFIRMED">${escapeHtml(a2rct('systemCorrect'))}</option><option value="FOLLOW_UP">${escapeHtml(a2rct('followUp'))}</option></select><input id="a2_mon_note_${id}_${i}" placeholder="${escapeHtml(tr('comment'))}"></div>`).join('')}<div class="att-work-actions"><button onclick="p5a2rc1SubmitMonthly_('${escapeHtml(x.confirmationId)}',this)">${escapeHtml(a2rct('submitMonthly'))}</button></div></div>`}
async function p5a2rc1SubmitMonthly_(confirmationId,btn){const data=inboxCache&&inboxCache.attendance,card=(data&&data.monthlyManager||[]).find(x=>x.confirmationId===confirmationId);if(!card)return;const id=p5a2rc1SafeId_(confirmationId),decisions=(card.items||[]).map((it,i)=>({exceptionKey:it.exceptionKey,decision:$('a2_mon_dec_'+id+'_'+i).value,note:$('a2_mon_note_'+id+'_'+i).value.trim()}));const op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),btn);try{await call('attendanceMonthlyManagerSubmit',{sessionToken,confirmationId,decisions,requestId:'A2-MON-MGR-'+Date.now()+'-'+p4a13Uuid_()});inboxCache=null;finishOperationSuccess_(op,a2rct('done'),'');await refreshInbox()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function p5a2rc1MonthlyHrCard_(x){const id=p5a2rc1SafeId_(x.confirmationId);return `<div class="att-work-card"><h3>${escapeHtml(a2rct('monthlyHr'))}</h3><b>${escapeHtml(x.employeeName||x.employeeId)}（${escapeHtml(x.employeeId)}） · ${escapeHtml(x.month)}</b><label>${escapeHtml(a2rct('hrNote'))}</label><textarea id="a2_mon_hr_${id}"></textarea><div class="att-work-actions"><button onclick="p5a2rc1CompleteMonthlyHr_('${escapeHtml(x.confirmationId)}',this)">${escapeHtml(a2rct('confirm'))}</button></div></div>`}
async function p5a2rc1CompleteMonthlyHr_(confirmationId,btn){const id=p5a2rc1SafeId_(confirmationId),op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),btn);try{await call('attendanceMonthlyHrComplete',{sessionToken,confirmationId,note:$('a2_mon_hr_'+id).value.trim(),requestId:'A2-MON-HR-'+Date.now()+'-'+p4a13Uuid_()});inboxCache=null;finishOperationSuccess_(op,a2rct('done'),'');await refreshInbox()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function p5a2rc1AppealHrCard_(x,a){const id=p5a2rc1SafeId_(x.appealId);return `<div class="att-work-card"><h3>${escapeHtml(a2rct('hrAppeal'))}</h3><b>${escapeHtml(x.employeeId)} · ${escapeHtml(x.date||'')}</b><div class="tiny">${escapeHtml(x.reason||'')}<br>${escapeHtml(x.deadlineStatus||'')}</div><div class="att-work-grid"><div><label>${escapeHtml(a2rct('confirmedIn'))}</label><input id="a2_ap_in_${id}" type="datetime-local"></div><div><label>${escapeHtml(a2rct('confirmedOut'))}</label><input id="a2_ap_out_${id}" type="datetime-local"></div><div><label>${escapeHtml(a2rct('confirmedShift'))}</label><select id="a2_ap_shift_${id}">${p5a2rc1ShiftOptions_(a,'')}</select></div></div><label>${escapeHtml(a2rct('hrNote'))}</label><textarea id="a2_ap_note_${id}"></textarea><div class="att-work-actions"><button onclick="p5a2rc1AppealHrAction_('${escapeHtml(x.appealId)}','RESOLVE',this)">${escapeHtml(a2rct('resolve'))}</button><button class="secondary" onclick="p5a2rc1AppealHrAction_('${escapeHtml(x.appealId)}','SPECIAL_CORRECTION',this)">${escapeHtml(a2rct('specialCorrection'))}</button></div></div>`}
async function p5a2rc1AppealHrAction_(appealId,action,btn){const id=p5a2rc1SafeId_(appealId),op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),btn);try{await call('attendanceAppealHrAction',{sessionToken,appealId,action,firstIn:$('a2_ap_in_'+id).value,lastOut:$('a2_ap_out_'+id).value,shiftCode:$('a2_ap_shift_'+id).value,note:$('a2_ap_note_'+id).value.trim(),requestId:'A2-AP-HR-'+Date.now()+'-'+p4a13Uuid_()});inboxCache=null;attendanceCache=null;finishOperationSuccess_(op,a2rct('done'),'');await refreshInbox()}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}}
function p5a2rc1AttendanceInboxHtml_(a){if(!a)return '';let h=`<div class="att-work-section"><div class="att-work-title">${escapeHtml(a2rct('attendanceTasks'))}</div><div class="notice tiny">${escapeHtml(a2rct('shadowNotice'))}</div>`;const cards=[];(a.managerCorrections||[]).forEach(x=>cards.push(p5a2rc1CorrectionCard_(x,'MANAGER',a)));(a.hrCorrections||[]).forEach(x=>cards.push(p5a2rc1CorrectionCard_(x,'HR',a)));(a.monthlyCandidates||[]).forEach(x=>cards.push(p5a2rc1MonthlyCandidateCard_(x)));(a.monthlyManager||[]).forEach(x=>cards.push(p5a2rc1MonthlyManagerCard_(x)));(a.monthlyHr||[]).forEach(x=>cards.push(p5a2rc1MonthlyHrCard_(x)));(a.hrAppeals||[]).forEach(x=>cards.push(p5a2rc1AppealHrCard_(x,a)));h+=cards.length?cards.join(''):`<div class="muted">${escapeHtml(a2rct('noAttendanceTasks'))}</div>`;return h+'</div>'}
function renderInbox(data){const leave=Array.isArray(data)?data:(data&&data.leave)||[],att=Array.isArray(data)?null:(data&&data.attendance)||null;renderLeaveInbox_(leave);const el=$('inboxList');if(el&&att){if(!leave.length&&Number(att.count||0)>0)el.innerHTML='<div class="build-tag">Build MVP_V2_20260928_P5A2_PHASE2_INTEGRATED_RC1</div>';el.innerHTML+=p5a2rc1AttendanceInboxHtml_(att)}}
function openAttendanceAppeal_(encodedCorrectionId,encodedAttendanceKey,triggerBtn){const correctionId=decodeURIComponent(String(encodedCorrectionId||'')),attendanceKey=decodeURIComponent(String(encodedAttendanceKey||''));const reason=prompt(a2rct('appealReason'));if(reason===null)return;if(!reason.trim()){message(a2rct('appealReason'),'warning');return}submitAttendanceAppealUi_(correctionId,attendanceKey,reason.trim(),triggerBtn)}
async function submitAttendanceAppealUi_(correctionRequestId,attendanceKey,reason,triggerBtn){const op=beginOperation_(a2rct('processing'),nt('doNotRepeat'),triggerBtn);const requestId='A2-APPEAL-'+Date.now()+'-'+p4a13Uuid_();let ok=false;try{await call('submitAttendanceAppeal',{sessionToken,correctionRequestId,reason,requestId});ok=true}catch(e){if(e&&e.kind==='TRANSPORT'){try{const st=await call('attendanceAppealStatus',{sessionToken,requestId});if(st&&st.found)ok=true}catch(ignore){}}if(!ok){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}}try{const data=await call('myAttendance',{sessionToken,month:p5a2AttendanceMonthValue_()});attendanceCache=data;attendanceViewMode='detail';renderMyAttendance_(data);finishOperationSuccess_(op,a2rct('appealSubmitted'),'');message(a2rct('appealSubmitted'),'success')}catch(e){finishOperationSuccess_(op,a2rct('appealSubmitted'),nt('refreshAfterSuccessFail'))}}

async function approveAction(leaveId,action,triggerBtn){
  if(mutationBusy){message(nt('busy'),'warning');return}
  if(action==='ASSIGN_PROXY'&&!managerProxyChanged(leaveId))return;
  const c=$(`comment_${leaveId}`),p=$(`proxy_${leaveId}`),comment=c?c.value:'',proxyEmployeeId=p?p.value:'';
  if(action==='REJECT'&&!String(comment||'').trim()){message(currentLang==='ZH'?'退回／駁回原因必填':currentLang==='VI'?'Bắt buộc nhập lý do từ chối/trả lại':'กรุณาระบุเหตุผลในการปฏิเสธ/ส่งกลับ');return}
  const mutation={leaveId,action,comment,proxyEmployeeId};
  const requestId=p4a132RequestIdForApproval_(mutation);
  mutationBusy=true;setAreaBusy_('inbox',true,nt('transmitting'));const op=beginOperation_(nt('approvalSending'),nt('doNotRepeat'),triggerBtn);let r=null;
  try{
    r=await call('approvalAction',{sessionToken,leaveId,action,comment:comment,proxyEmployeeId,requestId});
  }catch(e){
    const uncertain=p4a132UncertainError_(e);
    const recovered=await p4a132ConfirmApprovalResult_(requestId,leaveId,op,uncertain);
    if(recovered){await p4a132FinishApprovalSuccess_(recovered,op,requestId);return}
    mutationBusy=false;setAreaBusy_('inbox',false);
    if(uncertain){
      const detail=currentLang==='VI'?'Chưa xác nhận được kết quả. Nếu thao tác lại với cùng nội dung, hệ thống sẽ dùng cùng RequestID và không xử lý lần thứ hai.':currentLang==='TH'?'ยังยืนยันผลไม่ได้ หากทำรายการเดิมอีกครั้ง ระบบจะใช้ RequestID เดิมและจะไม่ประมวลผลซ้ำ':'結果仍未確認。若以相同內容再次操作，系統會沿用同一 RequestID，不會重複簽核。';
      finishOperationUnknown_(op,nt('stillUnknown'),detail,true);message(detail,'warning');return
    }
    finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return
  }
  await p4a132FinishApprovalSuccess_(r,op,requestId)
}

function currentMonthKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}async function refreshDashboard(){hideAppSections();$('dashboard').classList.remove('hide');if(!$('dashboardMonth').value)$('dashboardMonth').value=currentMonthKey();if(dashboardCache&&dashboardCache.month===$('dashboardMonth').value){renderDashboard(dashboardCache);return}await loadDashboard()}async function loadDashboard(){const navSeq=p5a1CurrentNavSeq_();const el=$('dashboardContent');el.innerHTML=`<div class="muted">${tr('loading')}</div>`;const op=beginOperation_(nt('loadingData'),nt('doNotRepeat'));try{dashboardCache=await call('leaveDashboard',{sessionToken,month:$('dashboardMonth').value||currentMonthKey()});if(!p5a1NavStillCurrent_(navSeq))return;renderDashboard(dashboardCache);finishOperationSuccess_(op,nt('loadDone'),'')}catch(e){if(!p5a1NavStillCurrent_(navSeq))return;finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));el.innerHTML=`<div class="status-inline-fail">${escapeHtml(e&&e.message?e.message:String(e))}</div>`}}function renderDashboard(d){if(!d)return;const title=d.scope==='COMPANY'?tr('companyDashboard'):tr('leaveDashboard');$('dashboardTitle').textContent=title;const dist=(d.distribution||[]).map(x=>`<div class="dist-row"><b>${escapeHtml(x.date)}</b><span class="dist-count">${x.count} ${tr('people')}</span><br><span class="tiny">${escapeHtml((x.names||[]).join('、'))}</span></div>`).join('')||`<div class="muted">${tr('noData')}</div>`;const rows=(d.rows||[]).map(x=>`<div class="dash-row"><b>${escapeHtml(x.employeeName)}（${escapeHtml(x.employeeId)}）</b>${d.scope==='COMPANY'?`<span class="pill">${escapeHtml(x.location||x.department||'')}</span>`:''}<br><span class="tiny">${tr('date')}：${escapeHtml(x.startDate)}${x.endDate&&x.endDate!==x.startDate?' ～ '+escapeHtml(x.endDate):''}｜${Number(x.days||0).toFixed(1)} ${tr('days')} / ${Number(x.hours||0).toFixed(1)} HR｜${statusLabel(x.status)}</span><br><span class="tiny">${tr('proxyLabel')}：${escapeHtml(x.proxyName||x.proxyId||tr('proxyNone'))}</span></div>`).join('')||`<div class="muted">${tr('noData')}</div>`;$('dashboardContent').innerHTML=`<div class="tiny">${d.scope==='COMPANY'?tr('company'):tr('directTeam')}｜${escapeHtml(d.startDate)} ～ ${escapeHtml(d.endDate)}</div><div class="dash-summary"><div class="dash-kpi"><b>${Number(d.uniquePeople||0)}</b><span>${tr('leavePeople')}</span></div><div class="dash-kpi"><b>${Number(d.requestCount||0)}</b><span>${tr('requests')}</span></div><div class="dash-kpi"><b>${Number(d.peakCount||0)}</b><span>${tr('peak')}</span></div></div><h3>${tr('dailyDistribution')}</h3>${dist}<h3>${tr('detailList')}</h3>${rows}`}

// -----------------------------------------------------------------------------
// RC2-07 Unified mobile inner-page shell. UI/navigation only.
// Business state and existing domain functions remain authoritative.
// -----------------------------------------------------------------------------
function rc2VisibleInnerSection_(){
  const ids=['account','recentRecords','leaveForm','leaves','attendance','inbox','notifications','dashboard','hrCredentialAdmin'];
  for(const id of ids){const el=$(id);if(el&&!el.classList.contains('hide'))return id}
  return ''
}
function rc2InnerTitleForSection_(id){
  if(id==='account'){
    const p=String(accountPanel_||'');
    const map={personal:'personal',language:'language',changePin:'changePin',line:'line',contact:'contactHr',inquiries:'inquiries',management:'management'};
    return p&&map[p]?acct_(map[p]):acct_('account')
  }
  if(id==='recentRecords')return acct_('recent');
  if(id==='leaveForm')return tr('requestLeave');
  if(id==='leaves')return tr('myLeaves');
  if(id==='attendance')return tr('myAttendance');
  if(id==='inbox')return tr('inbox');
  if(id==='notifications')return fht_('notificationCenter');
  if(id==='dashboard')return dashboardCache&&dashboardCache.scope==='COMPANY'?tr('companyDashboard'):tr('leaveDashboard');
  if(id==='hrCredentialAdmin')return tr('hrCredentialAdmin');
  return 'ABIS'
}
function rc2UpdateInnerBar_(){
  const bar=$('rc2InnerTopbar'),title=$('rc2InnerTitle'),back=$('rc2InnerBackBtn');
  if(!bar||!title)return;
  const id=rc2VisibleInnerSection_(),active=!!id&&document.body.classList.contains('inner-view');
  bar.classList.toggle('hide',!active);
  if(!active)return;
  title.textContent=rc2InnerTitleForSection_(id);
  const backLabel=currentLang==='VI'?'Quay lại':currentLang==='TH'?'ย้อนกลับ':'返回';
  if(back){back.setAttribute('aria-label',backLabel);back.setAttribute('title',backLabel)}
}
function rc2InnerBack_(){
  const id=rc2VisibleInnerSection_();
  if(id==='account'&&accountPanel_){accountPanel_='';renderMyAccount_();rc2UpdateInnerBar_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)};return}
  if(id==='dashboard'||id==='hrCredentialAdmin'){
    accountPanel_='management';showMyAccount_();renderMyAccount_();rc2UpdateInnerBar_();return
  }
  showHome()
}
function p5a1Rc2InstallInnerUiObserver_(){
  const ids=['account','recentRecords','leaveForm','leaves','attendance','inbox','notifications','dashboard','hrCredentialAdmin'];
  const obs=new MutationObserver(function(){rc2UpdateInnerBar_()});
  ids.forEach(function(id){const el=$(id);if(el)obs.observe(el,{attributes:true,attributeFilter:['class']})});
  rc2UpdateInnerBar_()
}

async function logout(){const op=beginOperation_(nt('transmitting'),nt('doNotRepeat'));let remoteOk=true;try{if(p5a108DraftDirty&&!returnedEditLeaveId)await p5a108SaveDraftNow_(true);await call('logout',{sessionToken})}catch(e){remoteOk=false}p5a108ResetDraftState_();clearHrOneTimePin_();hrCredentialSelected=null;hrCredentialResultsCache=[];try{localStorage.removeItem('abis_session')}catch(x){}p5a1ClearLineFast_();sessionToken='';lineBindingStatusCache=null;lineBindingLoading=false;homeData=null;prefetchStarted=false;proxyAssignmentsCache=null;dashboardCache=null;taskSummaryCache=null;taskInboxCache={};activeTaskInboxData=null;notificationCache=null;notificationFilterCache={};activeNotificationData=null;activeNotificationFilter='ALL';notificationLoading=false;attendanceFocusDate_='';accountPanel_='';Object.keys(ABIS_PERF2_STAMP_).forEach(k=>delete ABIS_PERF2_STAMP_[k]);Object.keys(ABIS_PERF2_INFLIGHT_).forEach(k=>delete ABIS_PERF2_INFLIGHT_[k]);Object.keys(ABIS_PERF2_TIMING_).forEach(k=>delete ABIS_PERF2_TIMING_[k]);showLogin();if(remoteOk)finishOperationSuccess_(op,nt('localLogout'),'');else{clearOperationTimers_();p5a114ReleaseOperationButton_(op);renderOperationStatus_('warning',nt('localLogout'),nt('logoutUnknown'))}}


// ============================================================================
// RC2-08A UI SPEC INTEGRATION
// Presentation-only overrides. Existing business data remains authoritative.
// ============================================================================
function rc2AttCalendarLabel_(key){
  const dict={
    ZH:{leave:'請假',late:'遲到',early:'早退',anomaly:'缺卡／異常',rest:'OFF／排休',pending:'補正／申訴中',tap:'點日期查看當日出勤明細'},
    VI:{leave:'Nghỉ phép',late:'Đi muộn',early:'Về sớm',anomaly:'Thiếu chấm công / bất thường',rest:'OFF / nghỉ',pending:'Đang điều chỉnh / khiếu nại',tap:'Chạm ngày để xem chi tiết chấm công'},
    TH:{leave:'ลา',late:'มาสาย',early:'กลับก่อน',anomaly:'ขาดลงเวลา / ผิดปกติ',rest:'OFF / วันหยุด',pending:'กำลังแก้ไข / อุทธรณ์',tap:'แตะวันที่เพื่อดูรายละเอียดการลงเวลา'}
  };
  return (dict[currentLang]&&dict[currentLang][key])||dict.ZH[key]||key
}
function rc2AttCalendarGeneralAnomaly_(d){
  if(!d)return false;
  if(d.missingIn||d.missingOut)return true;
  const code=String(d.anomalyCode||'').toUpperCase();
  if(code){
    if(['LATE','EARLY_LEAVE'].includes(code))return false;
    return true;
  }
  const ex=Array.isArray(d.exceptions)?d.exceptions:[];
  return ex.some(function(x){
    const c=String(x&&x.code||'').toUpperCase();
    return c&&c!=='LATE'&&c!=='EARLY_LEAVE'
  })
}
function rc2AttCalendarSymbols_(d){
  if(!d)return [];
  const out=[];
  const expected=Number(d.expectedHours||0),actual=Number(d.actualHours||0);
  if(Number(d.leaveHours||0)>0)out.push({key:'leave',glyph:'●'});
  if(Number(d.lateMinutes||0)>=16||['LATE','LATE_OVER_30'].includes(String(d.anomalyCode||'').toUpperCase()))out.push({key:'late',glyph:'▲'});
  if(Number(d.earlyMinutes||0)>0||String(d.anomalyCode||'').toUpperCase()==='EARLY_LEAVE')out.push({key:'early',glyph:'▼'});
  if(rc2AttCalendarGeneralAnomaly_(d))out.push({key:'anomaly',glyph:'!'});
  if(d.activeCorrection||d.activeAppeal)out.push({key:'pending',glyph:'◆'});
  if(expected<=0&&actual<=0&&Number(d.leaveHours||0)<=0)out.push({key:'rest',glyph:'○'});
  const seen={};
  return out.filter(function(x){if(seen[x.key])return false;seen[x.key]=true;return true}).slice(0,3)
}
function rc2AttSymbolHtml_(x){
  const label=rc2AttCalendarLabel_(x.key);
  if(x.key==='pending')return `<span class="att-symbol pending" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span>${escapeHtml(x.glyph)}</span></span>`;
  return `<span class="att-symbol ${escapeHtml(x.key)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${escapeHtml(x.glyph)}</span>`
}
function rc2AttCalendarLegendHtml_(){
  const items=[
    {key:'leave',glyph:'●'},
    {key:'late',glyph:'▲'},
    {key:'early',glyph:'▼'},
    {key:'anomaly',glyph:'!'},
    {key:'rest',glyph:'○'},
    {key:'pending',glyph:'◆'}
  ];
  return `<div class="att-calendar-legend">${items.map(function(x){return `<span class="att-legend-item">${rc2AttSymbolHtml_(x)}<span>${escapeHtml(rc2AttCalendarLabel_(x.key))}</span></span>`}).join('')}</div><div class="att-calendar-hint">${escapeHtml(rc2AttCalendarLabel_('tap'))}</div>`
}

function rc2AttCalendarIsRestDate_(d, calendarMeta){
  if(calendarMeta&&calendarMeta.displayRedDate===true)return true;
  if(!d)return false;
  const shift=String(d.shiftCode||d.shiftName||'').toUpperCase();
  const status=String(d.attendanceStatus||d.closingStatus||'').toUpperCase();
  if(/(^|[_\s-])(OFF|REST|HOLIDAY)([_\s-]|$)/.test(shift))return true;
  if(status==='OFF'||status==='REST'||status==='HOLIDAY')return true;
  return false;
}

// Normal attendance intentionally renders only the date number.
// Non-normal states are represented by compact symbols; tapping a date opens
// the existing authoritative day-detail flow.
function p5a2AttendanceCalendarHtml_(data){
  const map={};
  (data.days||[]).forEach(function(d){map[d.date]=d});
  const calendarMap={};
  (data.calendarDays||[]).forEach(function(c){calendarMap[c.date]=c});
  const parts=String(data.month||'').split('-').map(Number),y=parts[0],m=parts[1];
  if(!y||!m)return '';
  const first=new Date(y,m-1,1),last=new Date(y,m,0),start=first.getDay();
  const heads=currentLang==='VI'?['CN','T2','T3','T4','T5','T6','T7']:currentLang==='TH'?['อา','จ','อ','พ','พฤ','ศ','ส']:['日','一','二','三','四','五','六'];
  let cells='';
  for(let i=0;i<start;i++)cells+='<div class="att-day empty" aria-hidden="true"></div>';
  for(let day=1;day<=last.getDate();day++){
    const key=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const d=map[key]||null;
    const calendarMeta=calendarMap[key]||null;
    const st=p5a2AttendanceStatus_(d);
    const symbols=rc2AttCalendarSymbols_(d);
    const symbolHtml=symbols.map(rc2AttSymbolHtml_).join('');
    const labels=symbols.map(function(x){return rc2AttCalendarLabel_(x.key)});
    if(calendarMeta&&calendarMeta.dayType)labels.push(String(calendarMeta.dayType));
    const aria=`${key}${labels.length?' '+labels.join('、'):''}`;
    const restDateClass=rc2AttCalendarIsRestDate_(d,calendarMeta)?' is-rest-date':'';
    const title=calendarMeta&&calendarMeta.dayType?` title="${escapeHtml(String(calendarMeta.dayType))}"`:'';
    cells+=`<div class="att-day ${escapeHtml(st.key)}${restDateClass}" role="button" tabindex="0" aria-label="${escapeHtml(aria)}"${title} onclick="openAttendanceDate_('${encodeURIComponent(key)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openAttendanceDate_('${encodeURIComponent(key)}')}"><div class="att-day-num">${day}</div><div class="att-day-status">${symbolHtml}</div></div>`;
  }
  return `<div class="att-calendar-wrap">${rc2AttCalendarLegendHtml_()}<div class="att-calendar-head">${heads.map(function(x){return `<div>${escapeHtml(x)}</div>`}).join('')}</div><div class="att-calendar">${cells}</div></div>`;
}

// Presentation spec keeps only the four primary Notification Center tabs.
// ANNOUNCEMENT remains a server category and is still shown in ALL.
function p5a1Rc2NotificationTabsHtml_(active){
  return ['ALL','UNREAD','SYSTEM','HR'].map(function(f){
    return `<button type="button" class="${f===active?'':'secondary'} small" onclick="refreshNotifications_('${f}')">${escapeHtml(p5a1Rc2NotificationFilterLabel_(f))}</button>`
  }).join('')
}


// -----------------------------------------------------------------------------
// RC2-08H | Bulk Factory Weekly Rest Management + In-App Confirmation
// - All manageable factory employees are rendered in one list.
// - Left: employee. Right: weekly rest-day options.
// - Unconfigured factory employees display the frozen Sat/Sun default.
// - Only changed rows are sent in one bulk save request.
// - Uses the existing in-app confirmation modal; no native browser hostname dialog.
// -----------------------------------------------------------------------------
let rc208fScheduleData_=null;
let rc208fSelectedEmployeeId_='';

const RC208F_I18N_={
  ZH:{scheduleManagement:'班表管理',factoryWeeklyRest:'廠務固定休息日',officePolicy:'辦公室人員固定週六、週日休息，不在此頁修改。',scopeCompany:'管理範圍：全公司廠務人員',scopeSite:'管理範圍：本廠區廠務人員',employee:'廠務人員',effectiveDate:'統一生效日',fixedRest:'每週固定休息日',save:'一次儲存全部變更',loading:'載入班表設定…',noEmployees:'目前沒有可管理的廠務人員。',currentRule:'目前規則',noRule:'尚未設定固定週休規則',nextRule:'下一個已排定規則',saveConfirm:'確定一次儲存這些廠務人員的固定休息日？',saveTitle:'儲存固定休息日',confirmSave:'確定儲存',saved:'固定休息日已更新',atLeastOne:'每位員工至少要選擇 1 個固定休息日。',source:'資料來源',mon:'週一',tue:'週二',wed:'週三',thu:'週四',fri:'週五',sat:'週六',sun:'週日',defaultWeekend:'未設定者預設週六、週日休息',defaultBadge:'預設六日',changed:'已變更',changes:'變更人數',noChanges:'目前沒有需要儲存的變更',bulkConfirmBody:'將以統一生效日更新 {count} 位廠務人員。未修改的人員不會寫入；未設定者維持預設週六、週日休息。'},
  VI:{scheduleManagement:'Quản lý lịch làm việc',factoryWeeklyRest:'Ngày nghỉ cố định hàng tuần của nhân viên nhà máy',officePolicy:'Nhân viên văn phòng nghỉ cố định Thứ Bảy và Chủ Nhật; không chỉnh tại đây.',scopeCompany:'Phạm vi: toàn bộ nhân viên nhà máy',scopeSite:'Phạm vi: nhân viên nhà máy tại cơ sở này',employee:'Nhân viên nhà máy',effectiveDate:'Ngày hiệu lực chung',fixedRest:'Ngày nghỉ cố định hàng tuần',save:'Lưu tất cả thay đổi',loading:'Đang tải cài đặt lịch…',noEmployees:'Không có nhân viên nhà máy trong phạm vi quản lý.',currentRule:'Quy tắc hiện tại',noRule:'Chưa có quy tắc nghỉ cố định',nextRule:'Quy tắc kế tiếp đã lên lịch',saveConfirm:'Xác nhận lưu hàng loạt ngày nghỉ cố định?',saveTitle:'Lưu ngày nghỉ cố định',confirmSave:'Xác nhận lưu',saved:'Đã cập nhật ngày nghỉ cố định',atLeastOne:'Mỗi nhân viên phải có ít nhất 1 ngày nghỉ cố định.',source:'Nguồn dữ liệu',mon:'T2',tue:'T3',wed:'T4',thu:'T5',fri:'T6',sat:'T7',sun:'CN',defaultWeekend:'Chưa thiết lập sẽ mặc định nghỉ Thứ Bảy và Chủ Nhật',defaultBadge:'Mặc định T7/CN',changed:'Đã đổi',changes:'Số người thay đổi',noChanges:'Không có thay đổi cần lưu',bulkConfirmBody:'Sẽ cập nhật {count} nhân viên theo ngày hiệu lực chung. Nhân viên không thay đổi sẽ không được ghi lại.'},
  TH:{scheduleManagement:'จัดการตารางงาน',factoryWeeklyRest:'วันหยุดประจำสัปดาห์ของพนักงานโรงงาน',officePolicy:'พนักงานสำนักงานหยุดประจำวันเสาร์และวันอาทิตย์ และไม่แก้ไขจากหน้านี้',scopeCompany:'ขอบเขต: พนักงานโรงงานทั้งบริษัท',scopeSite:'ขอบเขต: พนักงานโรงงานในไซต์นี้',employee:'พนักงานโรงงาน',effectiveDate:'วันที่มีผลร่วม',fixedRest:'วันหยุดประจำสัปดาห์',save:'บันทึกการเปลี่ยนแปลงทั้งหมด',loading:'กำลังโหลดการตั้งค่าตาราง…',noEmployees:'ไม่มีพนักงานโรงงานที่จัดการได้ในขอบเขตนี้',currentRule:'กฎปัจจุบัน',noRule:'ยังไม่ได้ตั้งวันหยุดประจำ',nextRule:'กฎถัดไปที่กำหนดไว้',saveConfirm:'ยืนยันบันทึกวันหยุดประจำแบบกลุ่มหรือไม่',saveTitle:'บันทึกวันหยุดประจำ',confirmSave:'ยืนยันบันทึก',saved:'อัปเดตวันหยุดประจำแล้ว',atLeastOne:'พนักงานแต่ละคนต้องมีวันหยุดอย่างน้อย 1 วัน',source:'แหล่งข้อมูล',mon:'จ.',tue:'อ.',wed:'พ.',thu:'พฤ.',fri:'ศ.',sat:'ส.',sun:'อา.',defaultWeekend:'หากยังไม่ได้ตั้งค่า ให้หยุดวันเสาร์และอาทิตย์โดยอัตโนมัติ',defaultBadge:'ค่าเริ่มต้น ส./อา.',changed:'แก้ไขแล้ว',changes:'จำนวนที่เปลี่ยน',noChanges:'ไม่มีการเปลี่ยนแปลงที่ต้องบันทึก',bulkConfirmBody:'จะอัปเดตพนักงาน {count} คนด้วยวันที่มีผลเดียวกัน โดยไม่เขียนทับผู้ที่ไม่ได้แก้ไข'}
};
function rc208ft_(k){const m=RC208F_I18N_[currentLang]||RC208F_I18N_.ZH;return m[k]||RC208F_I18N_.ZH[k]||k}
function rc208fCanManageSchedule_(){
  const e=(homeData&&homeData.employee)||{};
  const permission=String(e.approvalPermission||'').trim().toUpperCase();
  return !!(homeData&&((homeData.scheduleManagement&&homeData.scheduleManagement.canManage)||permission==='HR'||permission==='ADMIN'))
}
let rc208gManagementAccessRefreshBusy_=false;
async function rc208gRefreshManagementAccess_(){
  if(!sessionToken||rc208gManagementAccessRefreshBusy_)return;
  rc208gManagementAccessRefreshBusy_=true;
  try{
    const fresh=await call('home',{sessionToken});
    if(fresh)homeData=fresh;
    if(accountPanel_==='management'){
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
    }
  }catch(e){}finally{rc208gManagementAccessRefreshBusy_=false}
}
function rc208fDayLabel_(t){return rc208ft_(({MON:'mon',TUE:'tue',WED:'wed',THU:'thu',FRI:'fri',SAT:'sat',SUN:'sun'})[t]||t)}
function rc208fRestText_(days){const a=Array.isArray(days)?days:[];return a.length?a.map(rc208fDayLabel_).join('、'):rc208ft_('noRule')}
function rc208fRuleText_(r){if(!r)return rc208ft_('noRule');let s=`${escapeHtml(r.effectiveDate||'')}｜${escapeHtml(rc208fRestText_(r.restWeekdays||[]))}`;if(r.expiryDate)s+=` → ${escapeHtml(r.expiryDate)}`;return s}
function rc208hCanonicalDays_(days){const set={};(Array.isArray(days)?days:[]).forEach(x=>set[String(x||'').toUpperCase()]=true);return ['MON','TUE','WED','THU','FRI','SAT','SUN'].filter(x=>set[x]).join(',')}
function rc208hRowDays_(row){return [...row.querySelectorAll('[data-rc208h-day]:checked')].map(x=>x.getAttribute('data-rc208h-day')).filter(Boolean)}
function rc208hDirtyRows_(){return [...document.querySelectorAll('.rc208h-bulk-row[data-dirty="1"]')]}
function rc208hUpdateDirtyCount_(){
  const n=rc208hDirtyRows_().length,btn=$('rc208hBulkSaveBtn'),count=$('rc208hDirtyCount');
  if(count)count.textContent=String(n);
  if(btn){btn.disabled=n===0;btn.textContent=`${rc208ft_('save')}（${n}）`}
}
function rc208hMarkRowDirty_(input){
  const row=input&&input.closest?input.closest('.rc208h-bulk-row'):null;if(!row)return;
  const current=rc208hCanonicalDays_(rc208hRowDays_(row));
  const original=String(row.getAttribute('data-original-days')||'');
  const dirty=current!==original;
  row.setAttribute('data-dirty',dirty?'1':'0');
  row.classList.toggle('is-dirty',dirty);
  const badge=row.querySelector('.rc208h-change-badge');if(badge)badge.classList.toggle('hide',!dirty);
  rc208hUpdateDirtyCount_();
}

async function openFactoryWeeklyRestManagement_(){
  accountPanel_='scheduleRest';renderMyAccount_();rc2UpdateInnerBar_();
  await rc208fLoadScheduleRest_();
}
async function rc208fLoadScheduleRest_(){
  const box=$('rc208fScheduleRestPanel');if(!box)return;
  box.innerHTML=`<div class="muted">${escapeHtml(rc208ft_('loading'))}</div>`;
  try{
    const data=await call('factoryWeeklyRestManagement',{sessionToken});
    rc208fScheduleData_=data||{};
    rc208fRenderScheduleRest_();
  }catch(e){box.innerHTML=`<div class="notice error">${escapeHtml(e&&e.message?e.message:String(e))}</div>`}
}
function rc208hEmployeeRestDays_(emp){
  const days=Array.isArray(emp&&emp.effectiveRestWeekdays)&&emp.effectiveRestWeekdays.length?emp.effectiveRestWeekdays:(emp&&emp.currentRule&&Array.isArray(emp.currentRule.restWeekdays)&&emp.currentRule.restWeekdays.length?emp.currentRule.restWeekdays:['SAT','SUN']);
  return days;
}
function rc208hBulkRowHtml_(emp){
  const tokens=['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const rest=rc208hEmployeeRestDays_(emp),original=rc208hCanonicalDays_(rest);
  const checks=tokens.map(t=>`<label class="rc208h-day"><input type="checkbox" data-rc208h-day="${t}" ${rest.indexOf(t)>=0?'checked':''} onchange="rc208hMarkRowDirty_(this)"><span>${escapeHtml(rc208fDayLabel_(t))}</span></label>`).join('');
  return `<div class="rc208h-bulk-row" data-employee-id="${escapeHtml(emp.employeeId)}" data-original-days="${escapeHtml(original)}" data-dirty="0"><div class="rc208h-employee-cell"><b>${escapeHtml(emp.name||'')}</b><span>${escapeHtml(emp.employeeId||'')}｜${escapeHtml(emp.location||'')}</span>${emp.usingDefaultRest?`<em>${escapeHtml(rc208ft_('defaultBadge'))}</em>`:''}<span class="rc208h-change-badge hide">${escapeHtml(rc208ft_('changed'))}</span></div><div class="rc208h-rest-cell">${checks}</div></div>`;
}
function rc208fRenderScheduleRest_(){
  const box=$('rc208fScheduleRestPanel');if(!box)return;
  const data=rc208fScheduleData_||{},emps=Array.isArray(data.employees)?data.employees:[],auth=data.authorization||{};
  if(!emps.length){box.innerHTML=`<div class="rc208f-schedule-wrap"><div class="rc208f-schedule-note">${escapeHtml(rc208ft_('officePolicy'))}</div><div class="muted">${escapeHtml(rc208ft_('noEmployees'))}</div></div>`;return}
  const scopeText=auth.scope==='COMPANY'?rc208ft_('scopeCompany'):`${rc208ft_('scopeSite')}：${auth.site||''}`;
  const rows=emps.map(rc208hBulkRowHtml_).join('');
  box.innerHTML=`<div class="rc208f-schedule-wrap"><div class="rc208f-schedule-note"><b>${escapeHtml(rc208ft_('factoryWeeklyRest'))}</b><br>${escapeHtml(scopeText)}<br>${escapeHtml(rc208ft_('defaultWeekend'))}<br>${escapeHtml(rc208ft_('officePolicy'))}</div><div class="rc208h-toolbar"><label><b>${escapeHtml(rc208ft_('effectiveDate'))}</b><input id="rc208hEffectiveDate" type="date" value="${escapeHtml(data.defaultEffectiveDate||'')}"></label><div class="rc208h-change-count">${escapeHtml(rc208ft_('changes'))}：<b id="rc208hDirtyCount">0</b></div></div><div class="rc208h-bulk-list"><div class="rc208h-bulk-head"><span>${escapeHtml(rc208ft_('employee'))}</span><span>${escapeHtml(rc208ft_('fixedRest'))}</span></div>${rows}</div><div class="rc208f-schedule-actions"><button id="rc208hBulkSaveBtn" type="button" disabled onclick="rc208hSaveBulk_()">${escapeHtml(rc208ft_('save'))}（0）</button></div><div class="tiny muted">${escapeHtml(rc208ft_('source'))}：${escapeHtml(data.source||'')}</div></div>`;
  rc208hUpdateDirtyCount_();
}
async function rc208hSaveBulk_(){
  const dirty=rc208hDirtyRows_();
  if(!dirty.length){message(rc208ft_('noChanges'),'warning');return}
  const effectiveDate=($('rc208hEffectiveDate')||{}).value||'';
  const items=[];
  for(const row of dirty){
    const days=rc208hRowDays_(row);
    if(!days.length){message(`${row.getAttribute('data-employee-id')||''}：${rc208ft_('atLeastOne')}`,'warning');return}
    items.push({employeeId:row.getAttribute('data-employee-id')||'',restWeekdays:days});
  }
  const body=rc208ft_('bulkConfirmBody').replace('{count}',String(items.length))+`\n${rc208ft_('effectiveDate')}：${effectiveDate}`;
  const confirmed=await p4a14Confirm_(rc208ft_('saveTitle'),body,rc208ft_('confirmSave'));
  if(!confirmed)return;
  const btn=$('rc208hBulkSaveBtn');if(btn)btn.disabled=true;
  const op=beginOperation_(rc208ft_('saveTitle'),nt('doNotRepeat'),btn);
  try{
    const result=await call('saveFactoryWeeklyRestBulk',{sessionToken,effectiveDate,items,requestId:'RC208H-'+Date.now()});
    finishOperationSuccess_(op,rc208ft_('saved'),`${result.changedCount||0}/${result.requestedCount||items.length}`);
    message(`${rc208ft_('saved')}：${result.changedCount||0}`,'success');
    await rc208fLoadScheduleRest_();
  }catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning')}finally{if(btn)btn.disabled=false;rc208hUpdateDirtyCount_()}
}

// Extend existing Account / Management UI without creating a separate dashboard.
function rc2ManagementToolsHtml_(){
  const tools=[];
  if(rc208fCanManageSchedule_())tools.push(`<button type="button" class="secondary" onclick="openFactoryWeeklyRestManagement_()">${escapeHtml(rc208ft_('scheduleManagement'))}</button>`);
  if(rc2CanViewDashboard_()){const d=homeData.leaveDashboard||{},label=d.isTopApprover?tr('companyDashboard'):tr('leaveDashboard');tools.push(`<button type="button" class="secondary" onclick="refreshDashboard()">${escapeHtml(label)}</button>`)}
  if(canManageCredentials_())tools.push(`<button type="button" class="secondary" onclick="openHrCredentialAdmin()">${escapeHtml(acct_('accountManagement'))}</button>`);
  return tools.length?`<div class="rc2-management-grid">${tools.join('')}</div>`:`<div class="muted">${escapeHtml(acct_('managementNone'))}</div>`
}
function rc2AccountPanelHtml_(panel){
  const e=homeData&&homeData.employee||{};
  if(panel==='scheduleRest')return `<div class="rc2-account-panel"><h3>${escapeHtml(rc208ft_('scheduleManagement'))}</h3><div id="rc208fScheduleRestPanel"><div class="muted">${escapeHtml(rc208ft_('loading'))}</div></div></div>`;
  if(panel==='personal')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('personal'))}</h3><div class="rc2-account-detail"><span>${escapeHtml(acct_('employeeId'))}</span><span>${escapeHtml(e.id||'—')}</span><span>${escapeHtml(acct_('category'))}</span><span>${escapeHtml(e.category||'—')}</span><span>${escapeHtml(acct_('department'))}</span><span>${escapeHtml(e.department||'—')}</span><span>${escapeHtml(acct_('location'))}</span><span>${escapeHtml(e.location||'—')}</span><span>${escapeHtml(acct_('shift'))}</span><span>${escapeHtml(e.shift||'—')}</span><span>${escapeHtml(acct_('permission'))}</span><span>${escapeHtml(e.approvalPermission||'—')}</span></div></div>`;
  if(panel==='language')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('language'))}</h3><div class="rc2-lang-grid"><button type="button" class="${currentLang==='ZH'?'':'secondary'}" onclick="setPreferredLanguageUi_('ZH',this)">繁體中文</button><button type="button" class="${currentLang==='VI'?'':'secondary'}" onclick="setPreferredLanguageUi_('VI',this)">Tiếng Việt</button><button type="button" class="${currentLang==='TH'?'':'secondary'}" onclick="setPreferredLanguageUi_('TH',this)">ไทย</button></div><div class="tiny muted" style="margin-top:10px">${escapeHtml(acct_('localLanguageNote'))}</div></div>`;
  if(panel==='line')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('line'))}</h3><div id="lineBindingBox">${lineBindingCardHtml()}</div></div>`;
  if(panel==='changePin')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('changePin'))}</h3><div class="notice tiny">${escapeHtml(acct_('changePinHint'))}</div><button type="button" class="secondary" onclick="rc2BeginChangePin_()">${escapeHtml(acct_('changePin'))}</button></div>`;
  if(panel==='contact')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('contactHr'))}</h3><div class="notice tiny">${escapeHtml(acct_('contactHrHint'))}</div></div>`;
  if(panel==='inquiries')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('inquiries'))}</h3><div class="muted">${escapeHtml(acct_('inquiriesHint'))}</div></div>`;
  if(panel==='management')return `<div class="rc2-account-panel"><h3>${escapeHtml(acct_('management'))}</h3>${rc2ManagementToolsHtml_()}</div>`;
  return ''
}
function rc2OpenAccountPanel_(panel){
  accountPanel_=String(panel||'');
  renderMyAccount_();
  if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
  if(accountPanel_==='management')setTimeout(function(){rc208gRefreshManagementAccess_()},0);
  if(accountPanel_==='scheduleRest')setTimeout(function(){rc208fLoadScheduleRest_()},0);
  try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
}
function renderMyAccount_(){const box=$('accountContent');if(!box||!homeData)return;const e=homeData.employee||{},name=String(e.name||e.id||'ABIS'),role=rc2AccountRoleText_(e),lang=preferredLanguageLabel_(e.preferredLanguage||uiToPreferredLanguage_(currentLang)),managementVisible=rc2CanViewDashboard_()||canManageCredentials_()||rc208fCanManageSchedule_();if(accountPanel_){box.innerHTML=`<div class="rc2-account-wrap"><div id="accountPanel">${rc2AccountPanelHtml_(accountPanel_)}</div></div>`;if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();return}box.innerHTML=`<div class="rc2-account-wrap"><h2 style="margin:0">${escapeHtml(acct_('account'))}</h2><div class="rc2-account-profile"><div class="rc2-account-avatar">${escapeHtml((name.trim().charAt(0)||'A').toUpperCase())}</div><div><div class="rc2-account-name">${escapeHtml(name)}</div><div class="rc2-account-meta">${escapeHtml(role)}</div></div></div><div class="rc2-account-menu"><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('personal')"><b>${escapeHtml(acct_('personal'))}</b><span class="rc2-value">${escapeHtml(e.id||'')}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('language')"><b>${escapeHtml(acct_('language'))}</b><span class="rc2-value">${escapeHtml(lang)}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('changePin')"><b>${escapeHtml(acct_('changePin'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('line')"><b>${escapeHtml(acct_('line'))}</b><span class="rc2-value">${escapeHtml(rc2AccountLineValue_())}</span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('contact')"><b>${escapeHtml(acct_('contactHr'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button><button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('inquiries')"><b>${escapeHtml(acct_('inquiries'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button>${managementVisible?`<button class="rc2-account-row" type="button" onclick="rc2OpenAccountPanel_('management')"><b>${escapeHtml(acct_('management'))}</b><span class="rc2-value"></span><span class="rc2-account-chevron">›</span></button>`:''}</div><button type="button" class="rc2-account-logout" onclick="logout()">${escapeHtml(acct_('logout'))}</button></div>`;if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function rc2InnerTitleForSection_(id){if(id==='account'){const p=String(accountPanel_||'');if(p==='scheduleRest')return rc208ft_('scheduleManagement');const map={personal:'personal',language:'language',changePin:'changePin',line:'line',contact:'contactHr',inquiries:'inquiries',management:'management'};return p&&map[p]?acct_(map[p]):acct_('account')}if(id==='recentRecords')return acct_('recent');if(id==='leaveForm')return tr('requestLeave');if(id==='leaves')return tr('myLeaves');if(id==='attendance')return tr('myAttendance');if(id==='inbox')return tr('inbox');if(id==='notifications')return fht_('notificationCenter');if(id==='dashboard')return dashboardCache&&dashboardCache.scope==='COMPANY'?tr('companyDashboard'):tr('leaveDashboard');if(id==='hrCredentialAdmin')return tr('hrCredentialAdmin');return 'ABIS'}
function rc2InnerBack_(){const id=rc2VisibleInnerSection_();if(id==='account'&&accountPanel_==='scheduleRest'){accountPanel_='management';renderMyAccount_();rc2UpdateInnerBar_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)};return}if(id==='account'&&accountPanel_){accountPanel_='';renderMyAccount_();rc2UpdateInnerBar_();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)};return}if(id==='dashboard'||id==='hrCredentialAdmin'){accountPanel_='management';showMyAccount_();renderMyAccount_();rc2UpdateInnerBar_();return}showHome()}

function rc208ForceViewport_(){
  try{
    const root=document.documentElement,body=document.body,wrap=document.querySelector('.wrap'),app=document.getElementById('app'),home=document.getElementById('home');
    [root,body].forEach(function(el){
      if(!el)return;
      el.style.setProperty('width','100%','important');
      el.style.setProperty('max-width','none','important');
      el.style.setProperty('margin-left','0','important');
      el.style.setProperty('margin-right','0','important');
      el.style.setProperty('overflow-x','hidden','important');
    });
    [wrap,app,home].forEach(function(el){
      if(!el)return;
      el.style.setProperty('width','100%','important');
      el.style.setProperty('max-width','none','important');
      el.style.setProperty('margin-left','0','important');
      el.style.setProperty('margin-right','0','important');
      el.style.setProperty('box-sizing','border-box','important');
    });
  }catch(ignore){}
}
rc208ForceViewport_();
window.addEventListener('resize',rc208ForceViewport_,{passive:true});
window.addEventListener('orientationchange',rc208ForceViewport_,{passive:true});

if(rememberedEmployeeId){$('loginId').value=rememberedEmployeeId;$('rememberId').checked=true}p5a108InstallDraftListeners_();applyStaticI18n();p5a109RenderDraftAttachments_();try{const am=$('attendanceMonth');if(am&&!am.value)am.value=p5a2AttendanceMonthValue_()}catch(e){}
p5a1InstallActiveNavObserver_();
p5a1Rc2InstallInnerUiObserver_();
p5a1ApplyThemeUi_();

/* ===== MOBILE ===== */
/* ============================================================================

 * ABIS ESS Mobile UI Final - M1

 * Mobile Scheduling Feature Gate

 *

 * Version: ABIS_ESS_MOBILE_M1_FEATURE_GATE_20261004

 *

 * INSTALL:

 *   Paste this block near the END of the current Index.html <script>,

 *   AFTER the existing RC2-08H / schedule functions are defined,

 *   and BEFORE the final boot(); call.

 *

 * PURPOSE:

 *   - Mobile / LIFF (<= 767px): hide scheduling management entry.

 *   - Desktop (>= 768px): preserve the existing scheduling management entry.

 *   - Scheduling-only mobile users: do not show an empty Management Tools entry.

 *   - Direct attempts to open the scheduling panel on mobile are blocked safely.

 *   - Backend / Schedule Hub / Attendance / Leave / Task / LINE / Payroll are untouched.

 *

 * RESTORE LATER:

 *   Change scheduling: false -> true after Mobile scheduling is formally built.

 * ========================================================================== */



const ABIS_ESS_MOBILE_M1_VERSION_ =

  'ABIS_ESS_MOBILE_M1_FEATURE_GATE_20261004';



const ABIS_ESS_MOBILE_BREAKPOINT_ = 767;



const ABIS_ESS_MOBILE_FEATURES_ = Object.freeze({

  scheduling: false,

  payroll: false

});



function abisEssIsMobileUi_() {

  try {

    if (window.matchMedia) {

      return window.matchMedia(

        '(max-width: ' + ABIS_ESS_MOBILE_BREAKPOINT_ + 'px)'

      ).matches;

    }

  } catch (ignore) {}

  return Number(window.innerWidth || 0) <= ABIS_ESS_MOBILE_BREAKPOINT_;

}



function abisEssMobileSchedulingAllowed_() {

  return !abisEssIsMobileUi_() ||

    ABIS_ESS_MOBILE_FEATURES_.scheduling === true;

}



function abisEssMobileSchedulingUnavailableText_() {

  if (currentLang === 'VI') {

    return 'Tính năng này hiện chưa mở trên phiên bản di động.';

  }

  if (currentLang === 'TH') {

    return 'ฟังก์ชันนี้ยังไม่เปิดใช้งานบนมือถือในขณะนี้';

  }

  return '此功能目前尚未開放手機版';

}



/* --------------------------------------------------------------------------

 * 1. Permission/UI gate

 *

 * Existing rc2ManagementToolsHtml_() and renderMyAccount_() already depend on

 * rc208fCanManageSchedule_().  Wrapping this one function therefore removes:

 *   - 班表管理 from Mobile Management Tools

 *   - 管理工具 itself for scheduling-only Mobile users

 * while retaining the original Desktop permission behavior.

 * ------------------------------------------------------------------------ */



const abisEssM1OriginalCanManageSchedule_ =

  rc208fCanManageSchedule_;



rc208fCanManageSchedule_ = function () {

  if (!abisEssMobileSchedulingAllowed_()) {

    return false;

  }

  return abisEssM1OriginalCanManageSchedule_.apply(this, arguments);

};



/* --------------------------------------------------------------------------

 * 2. Direct scheduling-panel protection

 * ------------------------------------------------------------------------ */



const abisEssM1OriginalOpenFactoryWeeklyRestManagement_ =

  openFactoryWeeklyRestManagement_;



openFactoryWeeklyRestManagement_ = async function () {

  if (!abisEssMobileSchedulingAllowed_()) {

    if (typeof message === 'function') {

      message(abisEssMobileSchedulingUnavailableText_(), 'warning');

    }

    return;

  }

  return abisEssM1OriginalOpenFactoryWeeklyRestManagement_

    .apply(this, arguments);

};



const abisEssM1OriginalOpenAccountPanel_ =

  rc2OpenAccountPanel_;



rc2OpenAccountPanel_ = function (panel) {

  if (

    String(panel || '') === 'scheduleRest' &&

    !abisEssMobileSchedulingAllowed_()

  ) {

    accountPanel_ = 'management';



    if (typeof renderMyAccount_ === 'function') {

      renderMyAccount_();

    }



    if (typeof rc2UpdateInnerBar_ === 'function') {

      rc2UpdateInnerBar_();

    }



    if (typeof message === 'function') {

      message(abisEssMobileSchedulingUnavailableText_(), 'warning');

    }



    try {

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (ignore) {

      window.scrollTo(0, 0);

    }

    return;

  }



  return abisEssM1OriginalOpenAccountPanel_.apply(this, arguments);

};



/* --------------------------------------------------------------------------

 * 3. Resize / orientation safety

 *

 * If Desktop is showing scheduleRest and the viewport changes into Mobile,

 * leave the scheduling page immediately.  When the account page is visible,

 * re-render it so Management Tools visibility follows the current breakpoint.

 * ------------------------------------------------------------------------ */



function abisEssM1ApplyFeatureGate_() {

  const accountEl =

    typeof $ === 'function' ? $('account') : null;



  if (

    !abisEssMobileSchedulingAllowed_() &&

    String(accountPanel_ || '') === 'scheduleRest'

  ) {

    accountPanel_ = 'management';



    if (typeof renderMyAccount_ === 'function') {

      renderMyAccount_();

    }



    if (typeof rc2UpdateInnerBar_ === 'function') {

      rc2UpdateInnerBar_();

    }



    if (typeof message === 'function') {

      message(abisEssMobileSchedulingUnavailableText_(), 'warning');

    }

    return;

  }



  if (

    accountEl &&

    !accountEl.classList.contains('hide') &&

    typeof renderMyAccount_ === 'function'

  ) {

    renderMyAccount_();



    if (typeof rc2UpdateInnerBar_ === 'function') {

      rc2UpdateInnerBar_();

    }

  }

}



window.addEventListener(

  'resize',

  abisEssM1ApplyFeatureGate_,

  { passive: true }

);



window.addEventListener(

  'orientationchange',

  abisEssM1ApplyFeatureGate_,

  { passive: true }

);



/* --------------------------------------------------------------------------

 * 4. Startup preflight

 * ------------------------------------------------------------------------ */



function abisEssM1Preflight_() {

  return {

    ok:

      typeof rc208fCanManageSchedule_ === 'function' &&

      typeof openFactoryWeeklyRestManagement_ === 'function' &&

      typeof rc2OpenAccountPanel_ === 'function' &&

      typeof renderMyAccount_ === 'function',

    version: ABIS_ESS_MOBILE_M1_VERSION_,

    breakpoint: ABIS_ESS_MOBILE_BREAKPOINT_,

    mobile: abisEssIsMobileUi_(),

    schedulingEnabledOnMobile:

      ABIS_ESS_MOBILE_FEATURES_.scheduling === true,

    payrollEnabledOnMobile:

      ABIS_ESS_MOBILE_FEATURES_.payroll === true

  };

}



try {

  window.ABIS_ESS_MOBILE_M1 =

    Object.freeze(abisEssM1Preflight_());

} catch (ignore) {}

/* ============================================================================

 * ABIS ESS Mobile UI Final - M2

 * Account Navigation + Management Tools Cleanup

 *

 * Version: ABIS_ESS_MOBILE_M2_ACCOUNT_NAV_20261004

 *

 * INSTALL:

 *   Paste this block in Index.html AFTER the M1 Feature Gate patch

 *   and BEFORE the final boot(); call.

 *

 * PURPOSE:

 *   - Reorganize "我的帳號" into:

 *       個人設定 / 支援 / 管理工具

 *   - Show "管理工具" only when at least one real, currently available tool exists.

 *   - Group actual management tools by role:

 *       HR / 主管 / 生管

 *   - Do NOT create fake links for modules that are not implemented yet.

 *   - Respect M1 Mobile scheduling gate:

 *       Mobile -> scheduling hidden

 *       Desktop -> scheduling retained

 *   - Backend/business logic remains untouched.

 * ========================================================================== */



const ABIS_ESS_MOBILE_M2_VERSION_ =

  'ABIS_ESS_MOBILE_M2_ACCOUNT_NAV_20261004';



const ABIS_ESS_M2_I18N_ = {

  ZH: {

    personalSettings: '個人設定',

    support: '支援',

    managementTools: '管理工具',

    hrTools: 'HR 工具',

    supervisorTools: '主管工具',

    plannerTools: '生管工具',

    leaveOverview: '請假總覽',

    accountManagement: '帳號管理',

    scheduleManagement: '班表管理',

    noManagementTools: '目前沒有可使用的管理工具'

  },

  VI: {

    personalSettings: 'Cài đặt cá nhân',

    support: 'Hỗ trợ',

    managementTools: 'Công cụ quản lý',

    hrTools: 'Công cụ HR',

    supervisorTools: 'Công cụ quản lý',

    plannerTools: 'Công cụ điều độ',

    leaveOverview: 'Tổng quan nghỉ phép',

    accountManagement: 'Quản lý tài khoản',

    scheduleManagement: 'Quản lý lịch làm việc',

    noManagementTools: 'Hiện không có công cụ quản lý khả dụng'

  },

  TH: {

    personalSettings: 'การตั้งค่าส่วนบุคคล',

    support: 'การช่วยเหลือ',

    managementTools: 'เครื่องมือจัดการ',

    hrTools: 'เครื่องมือ HR',

    supervisorTools: 'เครื่องมือหัวหน้างาน',

    plannerTools: 'เครื่องมือวางแผนการผลิต',

    leaveOverview: 'ภาพรวมการลา',

    accountManagement: 'จัดการบัญชี',

    scheduleManagement: 'จัดการตารางงาน',

    noManagementTools: 'ขณะนี้ไม่มีเครื่องมือจัดการที่ใช้งานได้'

  }

};



function abisEssM2t_(key) {

  const lang =

    ABIS_ESS_M2_I18N_[currentLang] ?

      currentLang :

      'ZH';

  return (

    ABIS_ESS_M2_I18N_[lang][key] ||

    ABIS_ESS_M2_I18N_.ZH[key] ||

    key

  );

}



function abisEssM2HasHrTools_() {

  return typeof canManageCredentials_ === 'function' &&

    !!canManageCredentials_();

}



function abisEssM2HasSupervisorTools_() {

  return typeof rc2CanViewDashboard_ === 'function' &&

    !!rc2CanViewDashboard_();

}



function abisEssM2HasPlannerTools_() {

  return typeof rc208fCanManageSchedule_ === 'function' &&

    !!rc208fCanManageSchedule_();

}



function abisEssM2HasManagementTools_() {

  return (

    abisEssM2HasHrTools_() ||

    abisEssM2HasSupervisorTools_() ||

    abisEssM2HasPlannerTools_()

  );

}



function abisEssM2ToolButton_(label, onclick) {

  return (

    '<button type="button" class="abis-m2-tool-row" onclick="' +

    onclick +

    '">' +

      '<span>' + escapeHtml(label) + '</span>' +

      '<span class="abis-m2-chevron">›</span>' +

    '</button>'

  );

}



function abisEssM2ToolGroup_(title, body) {

  if (!body) return '';

  return (

    '<section class="abis-m2-tool-group">' +

      '<div class="abis-m2-group-title">' +

        escapeHtml(title) +

      '</div>' +

      '<div class="abis-m2-tool-list">' +

        body +

      '</div>' +

    '</section>'

  );

}



/* --------------------------------------------------------------------------

 * Management Tools panel

 *

 * Only implemented functions are exposed.

 * Future Employee Management / Leave Management / Reports / Team Management

 * are intentionally NOT rendered until their actual modules exist.

 * ------------------------------------------------------------------------ */



rc2ManagementToolsHtml_ = function () {

  let html = '';



  if (abisEssM2HasHrTools_()) {

    html += abisEssM2ToolGroup_(

      abisEssM2t_('hrTools'),

      abisEssM2ToolButton_(

        abisEssM2t_('accountManagement'),

        'openHrCredentialAdmin()'

      )

    );

  }



  if (abisEssM2HasSupervisorTools_()) {

    const d = homeData && homeData.leaveDashboard ?

      homeData.leaveDashboard :

      {};



    const dashboardLabel =

      d.isTopApprover ?

        tr('companyDashboard') :

        abisEssM2t_('leaveOverview');



    html += abisEssM2ToolGroup_(

      abisEssM2t_('supervisorTools'),

      abisEssM2ToolButton_(

        dashboardLabel,

        'refreshDashboard()'

      )

    );

  }



  if (abisEssM2HasPlannerTools_()) {

    html += abisEssM2ToolGroup_(

      abisEssM2t_('plannerTools'),

      abisEssM2ToolButton_(

        abisEssM2t_('scheduleManagement'),

        'openFactoryWeeklyRestManagement_()'

      )

    );

  }



  return html || (

    '<div class="muted">' +

      escapeHtml(abisEssM2t_('noManagementTools')) +

    '</div>'

  );

};



/* --------------------------------------------------------------------------

 * Account home

 * ------------------------------------------------------------------------ */



function abisEssM2AccountSection_(title, rows) {

  if (!rows) return '';

  return (

    '<section class="abis-m2-account-section">' +

      '<div class="abis-m2-section-title">' +

        escapeHtml(title) +

      '</div>' +

      '<div class="rc2-account-menu">' +

        rows +

      '</div>' +

    '</section>'

  );

}



function abisEssM2AccountRow_(panel, label, value) {

  return (

    '<button class="rc2-account-row" type="button" ' +

      'onclick="rc2OpenAccountPanel_(\'' +

      String(panel || '').replace(/'/g, '') +

      '\')">' +

      '<b>' + escapeHtml(label) + '</b>' +

      '<span class="rc2-value">' +

        escapeHtml(value || '') +

      '</span>' +

      '<span class="rc2-account-chevron">›</span>' +

    '</button>'

  );

}



renderMyAccount_ = function () {

  const box = $('accountContent');

  if (!box || !homeData) return;



  const e = homeData.employee || {};

  const name = String(e.name || e.id || 'ABIS');

  const role = rc2AccountRoleText_(e);

  const lang = preferredLanguageLabel_(

    e.preferredLanguage ||

    uiToPreferredLanguage_(currentLang)

  );



  if (accountPanel_) {

    box.innerHTML =

      '<div class="rc2-account-wrap">' +

        '<div id="accountPanel">' +

          rc2AccountPanelHtml_(accountPanel_) +

        '</div>' +

      '</div>';



    if (typeof rc2UpdateInnerBar_ === 'function') {

      rc2UpdateInnerBar_();

    }

    return;

  }



  let personalRows = '';

  personalRows += abisEssM2AccountRow_(

    'personal',

    acct_('personal'),

    e.id || ''

  );

  personalRows += abisEssM2AccountRow_(

    'language',

    acct_('language'),

    lang

  );

  personalRows += abisEssM2AccountRow_(

    'changePin',

    acct_('changePin'),

    ''

  );

  personalRows += abisEssM2AccountRow_(

    'line',

    acct_('line'),

    rc2AccountLineValue_()

  );



  let supportRows = '';

  supportRows += abisEssM2AccountRow_(

    'contact',

    acct_('contactHr'),

    ''

  );

  supportRows += abisEssM2AccountRow_(

    'inquiries',

    acct_('inquiries'),

    ''

  );



  let managementRows = '';

  if (abisEssM2HasManagementTools_()) {

    managementRows += abisEssM2AccountRow_(

      'management',

      acct_('management'),

      ''

    );

  }



  box.innerHTML =

    '<div class="rc2-account-wrap">' +

      '<h2 style="margin:0">' +

        escapeHtml(acct_('account')) +

      '</h2>' +



      '<div class="rc2-account-profile">' +

        '<div class="rc2-account-avatar">' +

          escapeHtml(

            (name.trim().charAt(0) || 'A').toUpperCase()

          ) +

        '</div>' +

        '<div>' +

          '<div class="rc2-account-name">' +

            escapeHtml(name) +

          '</div>' +

          '<div class="rc2-account-meta">' +

            escapeHtml(role) +

          '</div>' +

        '</div>' +

      '</div>' +



      abisEssM2AccountSection_(

        abisEssM2t_('personalSettings'),

        personalRows

      ) +



      abisEssM2AccountSection_(

        abisEssM2t_('support'),

        supportRows

      ) +



      abisEssM2AccountSection_(

        abisEssM2t_('managementTools'),

        managementRows

      ) +



      '<button type="button" class="rc2-account-logout" ' +

        'onclick="logout()">' +

        escapeHtml(acct_('logout')) +

      '</button>' +

    '</div>';



  if (typeof rc2UpdateInnerBar_ === 'function') {

    rc2UpdateInnerBar_();

  }

};



/* --------------------------------------------------------------------------

 * Styles

 * ------------------------------------------------------------------------ */



function abisEssM2InstallStyles_() {

  if (document.getElementById('abisEssM2Style')) return;



  const style = document.createElement('style');

  style.id = 'abisEssM2Style';



  style.textContent = `

    .abis-m2-account-section{

      margin-top:20px;

    }



    .abis-m2-section-title,

    .abis-m2-group-title{

      margin:0 2px 8px;

      font-size:14px;

      line-height:1.4;

      font-weight:800;

      color:#64748b;

      letter-spacing:.02em;

    }



    .abis-m2-tool-group + .abis-m2-tool-group{

      margin-top:20px;

    }



    .abis-m2-tool-list{

      overflow:hidden;

      border:1px solid #dbe6ef;

      border-radius:14px;

      background:#fff;

    }



    .abis-m2-tool-row{

      width:100%;

      min-height:54px;

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:12px;

      margin:0;

      padding:14px 16px;

      border:0;

      border-bottom:1px solid #e8eef4;

      border-radius:0;

      background:#fff;

      color:#0f2745;

      text-align:left;

      font:inherit;

      font-weight:800;

      cursor:pointer;

    }



    .abis-m2-tool-row:last-child{

      border-bottom:0;

    }



    .abis-m2-tool-row:active{

      transform:scale(.995);

      opacity:.82;

    }



    .abis-m2-chevron{

      flex:0 0 auto;

      font-size:24px;

      line-height:1;

      color:#94a3b8;

      font-weight:400;

    }



    @media (max-width:767px){

      .abis-m2-account-section{

        margin-top:22px;

      }



      .abis-m2-section-title,

      .abis-m2-group-title{

        font-size:16px;

      }



      .abis-m2-tool-row{

        min-height:58px;

        padding:15px 16px;

        font-size:18px;

      }

    }

  `;



  document.head.appendChild(style);

}



abisEssM2InstallStyles_();



try {

  window.ABIS_ESS_MOBILE_M2 = Object.freeze({

    ok: true,

    version: ABIS_ESS_MOBILE_M2_VERSION_,

    mobile:

      typeof abisEssIsMobileUi_ === 'function' ?

        abisEssIsMobileUi_() :

        null,

    managementTools: {

      hr: abisEssM2HasHrTools_(),

      supervisor: abisEssM2HasSupervisorTools_(),

      planner: abisEssM2HasPlannerTools_()

    }

  });

} catch (ignore) {}

/* ============================================================================

 * ABIS ESS Mobile UI Finalization - M3 to M5

 *

 * Version:

 *   ABIS_ESS_MOBILE_M35_FINALIZATION_20261004

 *

 * INSTALL ORDER IN Index.html:

 *   1. Existing Index code

 *   2. M1 Patch

 *   3. M2 Patch

 *   4. THIS M3-M5 Patch

 *   5. final boot();

 *

 * SCOPE:

 *   M3  Light Mode only / remove theme switching

 *   M4  Mobile presentation finalization

 *   M5  Feature visibility + safe unsupported-route cleanup

 *

 * NON-GOALS:

 *   - No Backend change

 *   - No Schema change

 *   - No Attendance / Leave / Task / LINE business-rule change

 *   - No Schedule Hub redesign

 *   - No Payroll implementation

 * ========================================================================== */



const ABIS_ESS_M35_VERSION_ =

  'ABIS_ESS_MOBILE_M35_FINALIZATION_20261004';



const ABIS_ESS_M35_BREAKPOINT_ = 767;



const ABIS_ESS_M35_FEATURES_ = Object.freeze({

  schedulingOnMobile: false,

  payrollEmployeeUi: false,

  inquiries: false,

  contactHrGuidance: true,

  darkMode: false

});



const ABIS_ESS_M35_I18N_ = {

  ZH: {

    payrollUnavailable: '薪資功能目前尚未開放。',

    inquiryUnavailable: '「我的詢問」目前尚未開放。',

    contactHrHint: '請透過 ABIS 官方 LINE 對話視窗聯絡 HR。'

  },

  VI: {

    payrollUnavailable: 'Chức năng lương hiện chưa được mở.',

    inquiryUnavailable: 'Mục “Câu hỏi của tôi” hiện chưa được mở.',

    contactHrHint: 'Vui lòng liên hệ HR qua cửa sổ trò chuyện LINE chính thức của ABIS.'

  },

  TH: {

    payrollUnavailable: 'ขณะนี้ยังไม่เปิดใช้งานฟังก์ชันเงินเดือน',

    inquiryUnavailable: 'ขณะนี้ยังไม่เปิดใช้งาน “คำถามของฉัน”',

    contactHrHint: 'กรุณาติดต่อ HR ผ่านหน้าสนทนา LINE Official ของ ABIS'

  }

};



function abisEssM35t_(key) {

  const lang =

    ABIS_ESS_M35_I18N_[currentLang] ?

      currentLang :

      'ZH';

  return (

    ABIS_ESS_M35_I18N_[lang][key] ||

    ABIS_ESS_M35_I18N_.ZH[key] ||

    key

  );

}



function abisEssM35IsMobile_() {

  try {

    if (typeof abisEssIsMobileUi_ === 'function') {

      return !!abisEssIsMobileUi_();

    }

  } catch (ignore) {}



  try {

    return !!window.matchMedia(

      '(max-width: ' + ABIS_ESS_M35_BREAKPOINT_ + 'px)'

    ).matches;

  } catch (ignore) {

    return window.innerWidth <= ABIS_ESS_M35_BREAKPOINT_;

  }

}



/* ============================================================================

 * M3 - LIGHT MODE ONLY

 * ========================================================================== */



function abisEssM35ApplyLightOnly_() {

  try {

    const root = document.documentElement;

    const body = document.body;



    if (root) {

      root.setAttribute('data-theme', 'light');

      root.style.setProperty('color-scheme', 'light', 'important');

    }



    if (body) {

      body.classList.remove('dark');

      body.removeAttribute('data-theme');

      body.style.setProperty('color-scheme', 'light', 'important');

    }



    try {

      localStorage.removeItem('abis_theme');

    } catch (ignore) {}



    const toggle = document.getElementById('themeToggle');

    if (toggle) {

      toggle.style.setProperty('display', 'none', 'important');

      toggle.setAttribute('aria-hidden', 'true');

      toggle.setAttribute('tabindex', '-1');

    }

  } catch (ignore) {}

}



/* Override legacy theme helpers after all original functions are defined. */

try {

  p5a1StoredTheme_ = function () {

    return 'light';

  };



  p5a1EffectiveTheme_ = function () {

    return 'light';

  };



  p5a1ApplyThemeUi_ = function () {

    abisEssM35ApplyLightOnly_();

  };



  toggleTheme = function () {

    abisEssM35ApplyLightOnly_();

    return false;

  };

} catch (ignore) {}



const ABIS_ESS_M35_THEME_OBSERVER_ =

  new MutationObserver(function () {

    const root = document.documentElement;

    const body = document.body;



    if (

      (root && root.getAttribute('data-theme') !== 'light') ||

      (body && (

        body.classList.contains('dark') ||

        body.getAttribute('data-theme') === 'dark'

      ))

    ) {

      abisEssM35ApplyLightOnly_();

    }

  });



try {

  ABIS_ESS_M35_THEME_OBSERVER_.observe(

    document.documentElement,

    {

      subtree: true,

      attributes: true,

      attributeFilter: ['data-theme', 'class']

    }

  );

} catch (ignore) {}



/* ============================================================================

 * M4 - MOBILE PRESENTATION FINALIZATION

 * ========================================================================== */



function abisEssM35InstallStyles_() {

  if (document.getElementById('abisEssM35Style')) return;



  const style = document.createElement('style');

  style.id = 'abisEssM35Style';



  style.textContent = `

    /* M3: Light Mode is the only visible theme in this release. */

    html{

      color-scheme:light!important;

    }



    #themeToggle{

      display:none!important;

    }



    .build-tag,

    .frozen-build-note{

      display:none!important;

    }



    button,

    a,

    [role="button"]{

      -webkit-tap-highlight-color:transparent;

      touch-action:manipulation;

    }



    button{

      transition:

        transform 120ms ease,

        opacity 120ms ease,

        box-shadow 120ms ease;

    }



    button:disabled{

      opacity:.55!important;

      cursor:not-allowed!important;

    }



    @media (hover:none) and (pointer:coarse){

      button:not(:disabled):active,

      [role="button"]:active{

        transform:scale(.992);

      }

    }



    @media (max-width:${ABIS_ESS_M35_BREAKPOINT_}px){

      html,

      body{

        width:100%!important;

        min-width:0!important;

        max-width:none!important;

        overflow-x:hidden!important;

      }



      body{

        font-size:18px!important;

        line-height:1.55!important;

      }



      .wrap{

        width:100%!important;

        min-width:0!important;

        max-width:none!important;

        box-sizing:border-box!important;



        padding-left:16px!important;

        padding-right:16px!important;

        padding-bottom:24px!important;



        padding-left:max(16px,env(safe-area-inset-left))!important;

        padding-right:max(16px,env(safe-area-inset-right))!important;

        padding-bottom:max(24px,env(safe-area-inset-bottom))!important;

      }



      #app,

      #home,

      #account,

      #recentRecords,

      #leaveForm,

      #leaves,

      #attendance,

      #inbox,

      #notifications,

      #dashboard,

      #hrCredentialAdmin{

        width:100%!important;

        min-width:0!important;

        max-width:none!important;

        box-sizing:border-box!important;

      }



      img,

      svg,

      canvas,

      video{

        max-width:100%;

      }



      input,

      select,

      textarea{

        width:100%;

        max-width:100%;

        box-sizing:border-box;

        min-height:48px;

        font-size:18px!important;

      }



      textarea{

        min-height:108px;

      }



      h1,

      h2{

        font-size:24px!important;

        line-height:1.3!important;

      }



      h3{

        font-size:21px!important;

        line-height:1.35!important;

      }



      label,

      .notice,

      .muted{

        font-size:17px!important;

        line-height:1.55!important;

      }



      .tiny{

        font-size:16px!important;

        line-height:1.5!important;

      }



      .company-banner,

      .frozen-company-banner{

        position:static!important;

      }



      #headerUserName{

        display:block;

        min-width:0;

        max-width:132px;

        overflow:hidden;

        text-overflow:ellipsis;

        white-space:nowrap;

      }



      .frozen-company-banner .company-title{

        font-size:24px!important;

        line-height:1.2!important;

      }



      .frozen-company-banner .company-subtitle{

        font-size:16px!important;

        line-height:1.35!important;

      }



      /* HOME: frozen 2x2 task and 2x2 quick-entry layouts. */

      .fh-task-grid{

        grid-template-columns:repeat(2,minmax(0,1fr))!important;

        gap:10px!important;

      }



      .fh-task{

        min-height:88px!important;

        padding:12px 8px!important;

      }



      .fh-task span,

      .fh-task .fh-task-label{

        font-size:16px!important;

        line-height:1.25!important;

        white-space:normal!important;

        text-align:center!important;

        overflow-wrap:anywhere;

      }



      .fh-task b{

        font-size:25px!important;

        line-height:1.1!important;

      }



      .fh-quick-grid{

        grid-template-columns:repeat(2,minmax(0,1fr))!important;

        gap:10px!important;

      }



      .fh-quick{

        min-height:106px!important;

        padding:13px 11px!important;

        grid-template-columns:40px minmax(0,1fr) 14px!important;

      }



      .fh-quick-copy b{

        font-size:20px!important;

        line-height:1.25!important;

        white-space:normal!important;

        overflow-wrap:anywhere;

      }



      .fh-quick-copy span{

        margin-top:4px!important;

        font-size:15px!important;

        line-height:1.35!important;

      }



      .fh-card-title{

        font-size:20px!important;

        line-height:1.3!important;

      }



      .fh-head-action{

        font-size:15px!important;

        line-height:1.3!important;

      }



      .fh-status-row{

        grid-template-columns:22px 90px minmax(0,1fr)!important;

        font-size:16px!important;

        line-height:1.4!important;

      }



      .fh-status-label{

        font-size:16px!important;

      }



      .fh-status-value,

      .fh-status-pill{

        font-size:17px!important;

      }



      .fh-list-row{

        min-height:54px!important;

        font-size:16px!important;

        line-height:1.4!important;

      }



      .fh-notice-row{

        font-size:16px!important;

        line-height:1.45!important;

      }



      .fh-notice-time{

        font-size:14px!important;

      }



      .fh-empty{

        font-size:16px!important;

      }



      /* Account / inner pages: normalize older oversized 30-32px controls. */

      body.inner-view .rc2-account-row{

        min-height:62px!important;

        padding:14px 15px!important;

      }



      body.inner-view .rc2-account-row b{

        font-size:21px!important;

        line-height:1.3!important;

        white-space:normal!important;

        overflow-wrap:anywhere;

      }



      body.inner-view .rc2-value{

        font-size:16px!important;

        line-height:1.35!important;

      }



      body.inner-view .rc2-lang-grid button,

      body.inner-view .abis-m2-tool-row{

        min-height:56px!important;

        font-size:19px!important;

        line-height:1.35!important;

        padding:13px 15px!important;

      }



      body.inner-view .abis-m2-section-title,

      body.inner-view .abis-m2-group-title{

        font-size:16px!important;

        line-height:1.35!important;

      }



      .rc2-inner-title{

        font-size:20px!important;

        line-height:1.25!important;

      }



      .rc2-inner-back{

        min-width:48px!important;

        min-height:48px!important;

      }



      /* Preserve 2x2 layout even on very narrow phones. */

      @media (max-width:350px){

        .fh-task-grid,

        .fh-quick-grid{

          grid-template-columns:repeat(2,minmax(0,1fr))!important;

        }



        .fh-quick{

          grid-template-columns:34px minmax(0,1fr) 12px!important;

          padding:10px 8px!important;

        }



        .fh-quick-copy b{

          font-size:18px!important;

        }



        .fh-quick-copy span{

          font-size:14px!important;

        }

      }

    }

  `;



  document.head.appendChild(style);

}



/* ============================================================================

 * M5 - FEATURE VISIBILITY / UNSUPPORTED ENTRY CLEANUP

 * ========================================================================== */



/*

 * The current backend explicitly has no "My Inquiries" data source.

 * Hide the unfinished entry instead of presenting a placeholder page.

 */

function abisEssM35HideIncompleteAccountEntries_() {

  try {

    document

      .querySelectorAll('#accountContent button[onclick*="inquiries"]')

      .forEach(function (el) {

        el.remove();

      });

  } catch (ignore) {}

}



/*

 * Keep Contact HR as guidance, but remove implementation/API wording

 * from employee-facing UI.

 */

const ABIS_ESS_M35_BASE_ACCOUNT_PANEL_HTML_ =

  typeof rc2AccountPanelHtml_ === 'function' ?

    rc2AccountPanelHtml_ :

    null;



if (ABIS_ESS_M35_BASE_ACCOUNT_PANEL_HTML_) {

  rc2AccountPanelHtml_ = function (panel) {

    const p = String(panel || '');



    if (p === 'contact') {

      return (

        '<div class="rc2-account-panel">' +

          '<h3>' + escapeHtml(acct_('contactHr')) + '</h3>' +

          '<div class="notice">' +

            escapeHtml(abisEssM35t_('contactHrHint')) +

          '</div>' +

        '</div>'

      );

    }



    if (p === 'inquiries') {

      return '';

    }



    return ABIS_ESS_M35_BASE_ACCOUNT_PANEL_HTML_(panel);

  };

}



/*

 * Apply visibility cleanup after every M2 Account render.

 */

const ABIS_ESS_M35_BASE_RENDER_ACCOUNT_ =

  typeof renderMyAccount_ === 'function' ?

    renderMyAccount_ :

    null;



if (ABIS_ESS_M35_BASE_RENDER_ACCOUNT_) {

  renderMyAccount_ = function () {

    const result =

      ABIS_ESS_M35_BASE_RENDER_ACCOUNT_.apply(this, arguments);



    abisEssM35HideIncompleteAccountEntries_();

    abisEssM35ApplyLightOnly_();



    return result;

  };

}



/*

 * Block old/direct calls to unfinished My Inquiries.

 * M1's mobile scheduling guard remains preserved because this wrapper

 * delegates all other panels to the currently installed rc2OpenAccountPanel_.

 */

const ABIS_ESS_M35_BASE_OPEN_ACCOUNT_PANEL_ =

  typeof rc2OpenAccountPanel_ === 'function' ?

    rc2OpenAccountPanel_ :

    null;



if (ABIS_ESS_M35_BASE_OPEN_ACCOUNT_PANEL_) {

  rc2OpenAccountPanel_ = function (panel) {

    const p = String(panel || '');



    if (p === 'inquiries') {

      accountPanel_ = '';

      renderMyAccount_();



      try {

        message(

          abisEssM35t_('inquiryUnavailable'),

          'warning'

        );

      } catch (ignore) {}



      if (typeof rc2UpdateInnerBar_ === 'function') {

        rc2UpdateInnerBar_();

      }

      return;

    }



    return ABIS_ESS_M35_BASE_OPEN_ACCOUNT_PANEL_.apply(

      this,

      arguments

    );

  };

}



/*

 * Payroll remains hidden. The existing Index already falls back to Home.

 * This wrapper adds a clear employee-facing notice for an old payroll deep link.

 */

const ABIS_ESS_M35_BASE_APPLY_BOOT_ROUTE_ =

  typeof p5rmApplyBootRoute_ === 'function' ?

    p5rmApplyBootRoute_ :

    null;



if (ABIS_ESS_M35_BASE_APPLY_BOOT_ROUTE_) {

  p5rmApplyBootRoute_ = function () {

    let route = 'home';



    try {

      route =

        typeof p5rmBootRoute_ === 'function' ?

          p5rmBootRoute_() :

          'home';

    } catch (ignore) {}



    if (

      route === 'payroll' &&

      typeof p5rmBootRouteApplied_ !== 'undefined' &&

      !p5rmBootRouteApplied_

    ) {

      p5rmBootRouteApplied_ = true;

      showHome();



      setTimeout(function () {

        try {

          message(

            abisEssM35t_('payrollUnavailable'),

            'warning'

          );

        } catch (ignore) {}

      }, 0);



      return;

    }



    return ABIS_ESS_M35_BASE_APPLY_BOOT_ROUTE_.apply(

      this,

      arguments

    );

  };

}



/* ============================================================================

 * LIVE PREFLIGHT

 * ========================================================================== */



function abisEssM35ElementVisible_(el) {

  if (!el) return false;



  try {

    const cs = window.getComputedStyle(el);

    return (

      cs.display !== 'none' &&

      cs.visibility !== 'hidden' &&

      Number(cs.opacity || 1) !== 0

    );

  } catch (ignore) {

    return true;

  }

}



function abisEssM35Preflight_() {

  abisEssM35ApplyLightOnly_();

  abisEssM35HideIncompleteAccountEntries_();



  const root = document.documentElement;

  const toggle = document.getElementById('themeToggle');



  let schedulingVisible = null;

  try {

    schedulingVisible =

      typeof rc208fCanManageSchedule_ === 'function' ?

        !!rc208fCanManageSchedule_() :

        null;

  } catch (ignore) {}



  const inquiriesButton =

    document.querySelector(

      '#accountContent button[onclick*="inquiries"]'

    );



  const width = Number(window.innerWidth || 0);

  const mobile = abisEssM35IsMobile_();

  const scrollWidth =

    Math.max(

      document.documentElement ?

        document.documentElement.scrollWidth :

        0,

      document.body ?

        document.body.scrollWidth :

        0

    );



  const horizontalOverflow =

    width > 0 ?

      scrollWidth > width + 2 :

      null;



  const out = {

    ok: true,

    version: ABIS_ESS_M35_VERSION_,

    breakpoint: ABIS_ESS_M35_BREAKPOINT_,

    mobile: mobile,

    innerWidth: width,



    theme: {

      effective:

        root ?

          root.getAttribute('data-theme') :

          '',

      darkModeEnabled: false,

      themeToggleVisible:

        abisEssM35ElementVisible_(toggle)

    },



    layout: {

      horizontalOverflow: horizontalOverflow,

      taskGrid: '2x2',

      quickGrid: '2x2',

      safeAreaCssInstalled:

        !!document.getElementById('abisEssM35Style')

    },



    features: {

      schedulingOnMobile:

        mobile ?

          schedulingVisible :

          null,

      payrollEmployeeUi: false,

      inquiriesVisible:

        abisEssM35ElementVisible_(inquiriesButton),

      contactHrGuidance: true

    },



    dependencies: {

      m1:

        typeof abisEssIsMobileUi_ === 'function',

      m2:

        typeof abisEssM2HasManagementTools_ === 'function'

    }

  };



  out.ok =

    out.theme.effective === 'light' &&

    out.theme.themeToggleVisible === false &&

    out.layout.safeAreaCssInstalled === true &&

    out.layout.horizontalOverflow !== true &&

    out.features.inquiriesVisible === false &&

    out.dependencies.m1 === true &&

    out.dependencies.m2 === true &&

    (

      !mobile ||

      schedulingVisible === false ||

      schedulingVisible === null

    );



  window.ABIS_ESS_MOBILE_M35 = out;

  return out;

}



function abisEssM35Refresh_() {

  abisEssM35ApplyLightOnly_();

  abisEssM35HideIncompleteAccountEntries_();



  try {

    window.ABIS_ESS_MOBILE_M35 =

      abisEssM35Preflight_();

  } catch (ignore) {}

}



abisEssM35InstallStyles_();

abisEssM35ApplyLightOnly_();

abisEssM35Refresh_();



window.addEventListener(

  'resize',

  abisEssM35Refresh_,

  { passive: true }

);



window.addEventListener(

  'orientationchange',

  abisEssM35Refresh_,

  { passive: true }

);



/*

 * boot() executes immediately after this patch.

 * Refresh the final diagnostic after the first application render.

 */

setTimeout(

  abisEssM35Refresh_,

  1200

);

/* ============================================================================

 * ABIS ESS Mobile UI - M35.1

 * Root Horizontal Overflow Audit Fix

 * Version: ABIS_ESS_MOBILE_M351_ROOT_OVERFLOW_20261005

 *

 * Paste AFTER the existing M3-M5 patch and BEFORE final boot();

 * ========================================================================== */



const ABIS_ESS_M351_VERSION_ =

  'ABIS_ESS_MOBILE_M351_ROOT_OVERFLOW_20261005';



function abisEssM351InstallRootClip_() {

  if (document.getElementById('abisEssM351Style')) return;



  const style = document.createElement('style');

  style.id = 'abisEssM351Style';

  style.textContent = `

    @media (max-width:767px){

      html,

      body{

        overflow-x:clip!important;

        overscroll-behavior-x:none!important;

      }

    }

  `;

  document.head.appendChild(style);

}



function abisEssM351VisibleOverflowAudit_() {

  const html = document.documentElement;

  const body = document.body;

  const vw = Number(html.clientWidth || window.innerWidth || 0);



  const offenders = [];



  if (vw > 0 && body) {

    [...document.querySelectorAll('body *')].forEach(function (el) {

      const cs = getComputedStyle(el);

      const r = el.getBoundingClientRect();



      if (

        cs.display === 'none' ||

        cs.visibility === 'hidden' ||

        (r.width === 0 && r.height === 0)

      ) {

        return;

      }



      const overRight = r.right - vw;

      const overLeft = 0 - r.left;



      if (overRight > 1 || overLeft > 1) {

        offenders.push({

          tag: el.tagName,

          id: el.id || '',

          className:

            typeof el.className === 'string'

              ? el.className

              : '',

          left: Math.round(r.left * 10) / 10,

          right: Math.round(r.right * 10) / 10,

          width: Math.round(r.width * 10) / 10,

          overRight: Math.round(overRight * 10) / 10,

          overLeft: Math.round(overLeft * 10) / 10,

          position: cs.position,

          overflowX: cs.overflowX

        });

      }

    });

  }



  const bodyScrollWidth =

    body ? Number(body.scrollWidth || 0) : 0;



  const htmlScrollWidth =

    Number(html.scrollWidth || 0);



  const bodyOverflow =

    vw > 0 && bodyScrollWidth > vw + 2;



  const visibleOverflow =

    offenders.length > 0;



  return {

    viewport: vw,

    htmlScrollWidth: htmlScrollWidth,

    bodyScrollWidth: bodyScrollWidth,

    visibleOverflow: visibleOverflow,

    bodyOverflow: bodyOverflow,

    horizontalOverflow:

      bodyOverflow || visibleOverflow,

    rootScrollArtifact:

      htmlScrollWidth > vw + 2 &&

      !bodyOverflow &&

      !visibleOverflow,

    offenders: offenders.slice(0, 20)

  };

}



const ABIS_ESS_M351_BASE_PREFLIGHT_ =

  typeof abisEssM35Preflight_ === 'function'

    ? abisEssM35Preflight_

    : null;



if (ABIS_ESS_M351_BASE_PREFLIGHT_) {

  abisEssM35Preflight_ = function () {

    abisEssM351InstallRootClip_();



    try {

      document.documentElement.scrollLeft = 0;

      if (document.body) document.body.scrollLeft = 0;

    } catch (ignore) {}



    const out =

      ABIS_ESS_M351_BASE_PREFLIGHT_.apply(

        this,

        arguments

      );



    const audit =

      abisEssM351VisibleOverflowAudit_();



    out.m351Version =

      ABIS_ESS_M351_VERSION_;



    out.layout =

      out.layout || {};



    out.layout.rawHtmlScrollWidth =

      audit.htmlScrollWidth;



    out.layout.bodyScrollWidth =

      audit.bodyScrollWidth;



    out.layout.rootScrollArtifact =

      audit.rootScrollArtifact;



    out.layout.visibleOverflowOffenders =

      audit.offenders;



    out.layout.horizontalOverflow =

      audit.horizontalOverflow;



    out.ok =

      out.theme &&

      out.theme.effective === 'light' &&

      out.theme.themeToggleVisible === false &&

      out.layout.safeAreaCssInstalled === true &&

      out.layout.horizontalOverflow !== true &&

      out.features &&

      out.features.inquiriesVisible === false &&

      out.dependencies &&

      out.dependencies.m1 === true &&

      out.dependencies.m2 === true &&

      (

        !out.mobile ||

        out.features.schedulingOnMobile === false ||

        out.features.schedulingOnMobile === null

      );



    window.ABIS_ESS_MOBILE_M35 = out;



    window.ABIS_ESS_MOBILE_M351 = {

      ok: out.ok,

      version:

        ABIS_ESS_M351_VERSION_,

      mobile: out.mobile,

      viewport: audit.viewport,

      rawHtmlScrollWidth:

        audit.htmlScrollWidth,

      bodyScrollWidth:

        audit.bodyScrollWidth,

      rootScrollArtifact:

        audit.rootScrollArtifact,

      horizontalOverflow:

        audit.horizontalOverflow,

      offenders:

        audit.offenders

    };



    return out;

  };

}



abisEssM351InstallRootClip_();



setTimeout(function () {

  try {

    abisEssM35Preflight_();

  } catch (ignore) {}

}, 0);


/* ============================================================================
 * ABIS ESS Mobile UI - M35.2
 * Home Decoration Overflow Fix
 * Version: ABIS_ESS_MOBILE_M352_HOME_OVERFLOW_FIX_20261006
 *
 * UI-only patch. Keeps the existing frozen home-header decoration, but restores
 * the header as its positioning/clipping container on Mobile/LIFF. This prevents
 * the decorative ::after layer from escaping into the page and widening the
 * mobile viewport. No backend, route, permission, attendance, leave, task,
 * notification, schedule or payroll behavior is changed.
 * ========================================================================== */

const ABIS_ESS_M352_VERSION_ =
  'ABIS_ESS_MOBILE_M352_HOME_OVERFLOW_FIX_20261006';

function abisEssM352InstallHomeOverflowFix_() {
  if (document.getElementById('abisEssM352Style')) return;

  const style = document.createElement('style');
  style.id = 'abisEssM352Style';
  style.textContent = `
    @media (max-width:767px){
      body.home-view .frozen-company-banner{
        position:relative!important;
        overflow:hidden!important;
        isolation:isolate;
      }

      body.home-view .frozen-company-banner::after{
        pointer-events:none!important;
      }
    }
  `;

  document.head.appendChild(style);
}

function abisEssM352Preflight_() {
  const banner = document.querySelector('body.home-view .frozen-company-banner');
  let position = '';
  let overflowX = '';

  if (banner) {
    try {
      const cs = window.getComputedStyle(banner);
      position = String(cs.position || '');
      overflowX = String(cs.overflowX || '');
    } catch (ignore) {}
  }

  const out = {
    ok: !banner || (
      position === 'relative' &&
      (overflowX === 'hidden' || overflowX === 'clip')
    ),
    version: ABIS_ESS_M352_VERSION_,
    homeBannerFound: !!banner,
    homeBannerPosition: position,
    homeBannerOverflowX: overflowX,
    styleInstalled: !!document.getElementById('abisEssM352Style')
  };

  try {
    window.ABIS_ESS_MOBILE_M352 = out;
  } catch (ignore) {}

  return out;
}

abisEssM352InstallHomeOverflowFix_();

setTimeout(function () {
  try {
    abisEssM352Preflight_();
  } catch (ignore) {}
}, 0);

/* ===== M7 ===== */
/* ==========================================================================
 * ABIS ESS M7 INTEGRATED RC1
 * Version: ABIS_ESS_M7_INTEGRATED_RC1_20261005
 * Hotfix bundle: 2026-10-06 contrast source cleanup + Leave Clear stale-result guard
 *
 * Replaces all standalone M7 patches.
 * Keep M1 / M2 / M3-M5 / M35.1, then paste this file, then boot();
 * ======================================================================= */

/* ============================================================================
 * ABIS ESS M7-1B | Employee Management Mobile/Desktop UI
 * Version: ABIS_ESS_M7_1B_EMPLOYEE_ADMIN_UI_COLORFIX4_CONTRAST_20261005
 *
 * INSTALL:
 *   Paste AFTER M35.1 and BEFORE the final boot(); call.
 *
 * BACKEND REQUIRED:
 *   P5A1_M7_1A_EMPLOYEE_READONLY_20261005
 *
 * SCOPE:
 *   - HR / Admin only
 *   - READ_ONLY Employee Management UI
 *   - Search / filter / employee detail
 *   - Same Account -> Management Tools navigation
 *   - Mobile <= 767: card-first
 *   - Desktop >= 768: denser list/detail layout
 *   - No employee master writes
 *   - No offboarding writes
 *   - No credential / LINE / attendance / leave / schedule / payroll mutation
 * ========================================================================== */

const ABIS_ESS_M7_1B_VERSION_ =
  'ABIS_ESS_M7_1B_EMPLOYEE_ADMIN_UI_COLORFIX4_CONTRAST_20261005';

const ABIS_ESS_M71_I18N_ = {
  ZH: {
    employeeManagement: '員工管理',
    employeeDetail: '員工資料',
    hrTools: 'HR 工具',
    accountManagement: '帳號管理',
    supervisorTools: '主管工具',
    plannerTools: '生管工具',
    leaveOverview: '請假總覽',
    scheduleManagement: '班表管理',
    noManagementTools: '目前沒有可使用的管理工具',

    searchPlaceholder: '搜尋員工編號或姓名',
    search: '搜尋',
    clear: '清除',
    allLocations: '全部工作地點',
    allDepartments: '全部部門',
    allStatuses: '全部在職狀態',
    allCompanies: '全部公司',
    results: '符合人數',
    totalEmployees: '員工總數',
    loading: '正在載入員工資料…',
    empty: '目前沒有符合條件的員工',
    emptyHint: '請調整搜尋文字或篩選條件。',
    loadFailed: '員工資料載入失敗',
    retry: '重新載入',
    stale: '目前顯示上次成功載入的資料。',

    basic: '基本資料',
    employment: '任職資料',
    organization: '組織與權限',
    work: '工作設定',
    system: '系統狀態',
    employeeId: '員工編號',
    name: '姓名',
    mobile: '手機',
    email: 'Email',
    company: '公司',
    hireDate: '到職日',
    terminationDate: '離職日',
    employmentStatus: '在職狀態',
    jobTitle: '職稱',
    department: '部門',
    location: '工作地點',
    personType: '人員類別',
    manager1: '直屬主管',
    manager2: '第二主管',
    isManager: '主管身分',
    approvalPermission: '簽核權限',
    formalShift: '正式班別',
    attendanceType: '出勤管理類型',
    punchExempt: '免打卡',
    leaveExempt: '免請假',
    punchNumber: '打卡號',
    scheduleRole: '排班角色',
    preferredLanguage: '帳號語言',
    systemEnabled: '系統啟用',
    credentialState: '登入帳號狀態',
    lineBound: 'LINE 綁定',
    bound: '已綁定',
    unbound: '未綁定',
    yes: '是',
    no: '否',
    sourceNote: '本頁僅顯示目前員工主檔已有資料；空白欄位不自行推測。',
    readOnly: '唯讀',
    backToList: '返回員工清單'
  },
  VI: {
    employeeManagement: 'Quản lý nhân viên',
    employeeDetail: 'Thông tin nhân viên',
    hrTools: 'Công cụ HR',
    accountManagement: 'Quản lý tài khoản',
    supervisorTools: 'Công cụ quản lý',
    plannerTools: 'Công cụ điều độ',
    leaveOverview: 'Tổng quan nghỉ phép',
    scheduleManagement: 'Quản lý lịch làm việc',
    noManagementTools: 'Hiện không có công cụ quản lý khả dụng',

    searchPlaceholder: 'Tìm mã hoặc tên nhân viên',
    search: 'Tìm kiếm',
    clear: 'Xóa bộ lọc',
    allLocations: 'Tất cả địa điểm',
    allDepartments: 'Tất cả bộ phận',
    allStatuses: 'Tất cả trạng thái',
    allCompanies: 'Tất cả công ty',
    results: 'Số kết quả',
    totalEmployees: 'Tổng nhân viên',
    loading: 'Đang tải dữ liệu nhân viên…',
    empty: 'Không có nhân viên phù hợp',
    emptyHint: 'Hãy thay đổi từ khóa hoặc bộ lọc.',
    loadFailed: 'Không thể tải dữ liệu nhân viên',
    retry: 'Tải lại',
    stale: 'Đang hiển thị dữ liệu từ lần tải thành công gần nhất.',

    basic: 'Thông tin cơ bản',
    employment: 'Thông tin làm việc',
    organization: 'Tổ chức và quyền',
    work: 'Thiết lập công việc',
    system: 'Trạng thái hệ thống',
    employeeId: 'Mã nhân viên',
    name: 'Họ tên',
    mobile: 'Điện thoại',
    email: 'Email',
    company: 'Công ty',
    hireDate: 'Ngày vào làm',
    terminationDate: 'Ngày nghỉ việc',
    employmentStatus: 'Trạng thái làm việc',
    jobTitle: 'Chức danh',
    department: 'Bộ phận',
    location: 'Địa điểm',
    personType: 'Loại nhân viên',
    manager1: 'Quản lý trực tiếp',
    manager2: 'Quản lý thứ hai',
    isManager: 'Vai trò quản lý',
    approvalPermission: 'Quyền phê duyệt',
    formalShift: 'Ca chính thức',
    attendanceType: 'Loại quản lý chấm công',
    punchExempt: 'Miễn chấm công',
    leaveExempt: 'Miễn xin nghỉ',
    punchNumber: 'Mã máy chấm công',
    scheduleRole: 'Vai trò xếp lịch',
    preferredLanguage: 'Ngôn ngữ tài khoản',
    systemEnabled: 'Kích hoạt hệ thống',
    credentialState: 'Trạng thái đăng nhập',
    lineBound: 'Liên kết LINE',
    bound: 'Đã liên kết',
    unbound: 'Chưa liên kết',
    yes: 'Có',
    no: 'Không',
    sourceNote: 'Trang này chỉ hiển thị dữ liệu hiện có trong hồ sơ nhân viên; hệ thống không tự suy đoán trường trống.',
    readOnly: 'Chỉ xem',
    backToList: 'Quay lại danh sách'
  },
  TH: {
    employeeManagement: 'จัดการพนักงาน',
    employeeDetail: 'ข้อมูลพนักงาน',
    hrTools: 'เครื่องมือ HR',
    accountManagement: 'จัดการบัญชี',
    supervisorTools: 'เครื่องมือหัวหน้างาน',
    plannerTools: 'เครื่องมือวางแผนการผลิต',
    leaveOverview: 'ภาพรวมการลา',
    scheduleManagement: 'จัดการตารางงาน',
    noManagementTools: 'ขณะนี้ไม่มีเครื่องมือจัดการที่ใช้งานได้',

    searchPlaceholder: 'ค้นหารหัสหรือชื่อพนักงาน',
    search: 'ค้นหา',
    clear: 'ล้างตัวกรอง',
    allLocations: 'ทุกสถานที่ทำงาน',
    allDepartments: 'ทุกแผนก',
    allStatuses: 'ทุกสถานะการทำงาน',
    allCompanies: 'ทุกบริษัท',
    results: 'จำนวนผลลัพธ์',
    totalEmployees: 'พนักงานทั้งหมด',
    loading: 'กำลังโหลดข้อมูลพนักงาน…',
    empty: 'ไม่พบพนักงานตามเงื่อนไข',
    emptyHint: 'โปรดปรับคำค้นหาหรือตัวกรอง',
    loadFailed: 'โหลดข้อมูลพนักงานไม่สำเร็จ',
    retry: 'โหลดใหม่',
    stale: 'กำลังแสดงข้อมูลจากการโหลดสำเร็จครั้งล่าสุด',

    basic: 'ข้อมูลพื้นฐาน',
    employment: 'ข้อมูลการทำงาน',
    organization: 'องค์กรและสิทธิ์',
    work: 'การตั้งค่างาน',
    system: 'สถานะระบบ',
    employeeId: 'รหัสพนักงาน',
    name: 'ชื่อ',
    mobile: 'โทรศัพท์',
    email: 'Email',
    company: 'บริษัท',
    hireDate: 'วันที่เริ่มงาน',
    terminationDate: 'วันที่พ้นสภาพ',
    employmentStatus: 'สถานะการทำงาน',
    jobTitle: 'ตำแหน่ง',
    department: 'แผนก',
    location: 'สถานที่ทำงาน',
    personType: 'ประเภทพนักงาน',
    manager1: 'หัวหน้าโดยตรง',
    manager2: 'หัวหน้าคนที่สอง',
    isManager: 'สถานะหัวหน้างาน',
    approvalPermission: 'สิทธิ์อนุมัติ',
    formalShift: 'กะอย่างเป็นทางการ',
    attendanceType: 'ประเภทการจัดการเวลา',
    punchExempt: 'ยกเว้นลงเวลา',
    leaveExempt: 'ยกเว้นการลา',
    punchNumber: 'รหัสเครื่องลงเวลา',
    scheduleRole: 'บทบาทการจัดตาราง',
    preferredLanguage: 'ภาษาบัญชี',
    systemEnabled: 'เปิดใช้งานระบบ',
    credentialState: 'สถานะบัญชีเข้าสู่ระบบ',
    lineBound: 'การเชื่อม LINE',
    bound: 'เชื่อมแล้ว',
    unbound: 'ยังไม่เชื่อม',
    yes: 'ใช่',
    no: 'ไม่ใช่',
    sourceNote: 'หน้านี้แสดงเฉพาะข้อมูลที่มีอยู่ในข้อมูลหลักพนักงาน และจะไม่คาดเดาค่าที่ว่าง',
    readOnly: 'ดูอย่างเดียว',
    backToList: 'กลับไปรายชื่อพนักงาน'
  }
};

function abisEssM71t_(key) {
  const lang =
    ABIS_ESS_M71_I18N_[currentLang] ?
      currentLang :
      'ZH';

  return (
    ABIS_ESS_M71_I18N_[lang][key] ||
    ABIS_ESS_M71_I18N_.ZH[key] ||
    key
  );
}

function abisEssM71CanManage_() {
  return (
    typeof canManageCredentials_ === 'function' &&
    !!canManageCredentials_()
  );
}

const ABIS_ESS_M71_STATE_ = {
  view: 'LIST',
  searchData: null,
  detail: null,
  detailEmployeeId: '',
  filters: {
    query: '',
    company: '',
    location: '',
    department: '',
    employmentStatus: ''
  },
  loadingSearch: false,
  loadingDetail: false,
  searchError: '',
  detailError: '',
  searchStale: false,
  detailStale: false
};

function abisEssM71EscapeAttr_(v) {
  return escapeHtml(String(v == null ? '' : v));
}

function abisEssM71StatusText_(v) {
  const s = String(v == null ? '' : v);
  if (!s) return '—';

  const upper = s.toUpperCase();

  if (upper === 'Y') return abisEssM71t_('yes');
  if (upper === 'N') return abisEssM71t_('no');

  return s;
}

function abisEssM71BoolText_(v) {
  if (v === true) return abisEssM71t_('yes');
  if (v === false) return abisEssM71t_('no');
  return abisEssM71StatusText_(v);
}

function abisEssM71ManagementHtml_() {
  let html = '';

  if (typeof abisEssM2HasHrTools_ === 'function' &&
      abisEssM2HasHrTools_()) {
    let hrBody = '';

    hrBody += abisEssM2ToolButton_(
      abisEssM71t_('employeeManagement'),
      "rc2OpenAccountPanel_('employeeManagement')"
    );

    hrBody += abisEssM2ToolButton_(
      abisEssM71t_('accountManagement'),
      'openHrCredentialAdmin()'
    );

    html += abisEssM2ToolGroup_(
      abisEssM71t_('hrTools'),
      hrBody
    );
  }

  if (typeof abisEssM2HasSupervisorTools_ === 'function' &&
      abisEssM2HasSupervisorTools_()) {
    const d =
      homeData && homeData.leaveDashboard ?
        homeData.leaveDashboard :
        {};

    const dashboardLabel =
      d.isTopApprover ?
        tr('companyDashboard') :
        abisEssM71t_('leaveOverview');

    html += abisEssM2ToolGroup_(
      abisEssM71t_('supervisorTools'),
      abisEssM2ToolButton_(
        dashboardLabel,
        'refreshDashboard()'
      )
    );
  }

  if (typeof abisEssM2HasPlannerTools_ === 'function' &&
      abisEssM2HasPlannerTools_()) {
    html += abisEssM2ToolGroup_(
      abisEssM71t_('plannerTools'),
      abisEssM2ToolButton_(
        abisEssM71t_('scheduleManagement'),
        'openFactoryWeeklyRestManagement_()'
      )
    );
  }

  return html || (
    '<div class="muted">' +
      escapeHtml(abisEssM71t_('noManagementTools')) +
    '</div>'
  );
}

/* M2 remains the owner of grouped Management Tools layout.
 * M7-1B only adds the now-real Employee Management module. */
rc2ManagementToolsHtml_ = abisEssM71ManagementHtml_;

function abisEssM71OptionHtml_(value, label, selected) {
  return (
    '<option value="' +
      abisEssM71EscapeAttr_(value) +
      '"' +
      (String(value) === String(selected) ? ' selected' : '') +
    '>' +
      escapeHtml(label) +
    '</option>'
  );
}

function abisEssM71SelectHtml_(
  id,
  values,
  allLabel,
  selected,
  onchange
) {
  values = Array.isArray(values) ? values : [];

  let html =
    '<select id="' + abisEssM71EscapeAttr_(id) + '"' +
      ' onchange="' + abisEssM71EscapeAttr_(onchange) + '">' +
      abisEssM71OptionHtml_('', allLabel, selected);

  values.forEach(function (v) {
    html += abisEssM71OptionHtml_(v, v, selected);
  });

  html += '</select>';
  return html;
}

function abisEssM71SearchControlsHtml_() {
  const data = ABIS_ESS_M71_STATE_.searchData || {};
  const options = data.options || {};
  const f = ABIS_ESS_M71_STATE_.filters;

  let filters = '';

  if (Array.isArray(options.companies) &&
      options.companies.length) {
    filters += abisEssM71SelectHtml_(
      'abisM71Company',
      options.companies,
      abisEssM71t_('allCompanies'),
      f.company,
      'abisEssM71Search_(null)'
    );
  }

  filters += abisEssM71SelectHtml_(
    'abisM71Location',
    options.locations || [],
    abisEssM71t_('allLocations'),
    f.location,
    'abisEssM71Search_(null)'
  );

  filters += abisEssM71SelectHtml_(
    'abisM71Department',
    options.departments || [],
    abisEssM71t_('allDepartments'),
    f.department,
    'abisEssM71Search_(null)'
  );

  filters += abisEssM71SelectHtml_(
    'abisM71EmploymentStatus',
    options.employmentStatuses || [],
    abisEssM71t_('allStatuses'),
    f.employmentStatus,
    'abisEssM71Search_(null)'
  );

  return (
    '<div class="abis-m71-search-card">' +
      '<div class="abis-m71-search-line">' +
        '<input id="abisM71Query" type="search" ' +
          'autocomplete="off" ' +
          'placeholder="' +
            abisEssM71EscapeAttr_(
              abisEssM71t_('searchPlaceholder')
            ) +
          '" ' +
          'value="' +
            abisEssM71EscapeAttr_(f.query) +
          '" ' +
          'onkeydown="' +
            "if(event.key==='Enter'){event.preventDefault();abisEssM71Search_(this)}" +
          '">' +
        '<button type="button" class="abis-m71-primary" ' +
          'onclick="abisEssM71Search_(this)">' +
          escapeHtml(abisEssM71t_('search')) +
        '</button>' +
      '</div>' +
      '<div class="abis-m71-filter-grid">' +
        filters +
      '</div>' +
      '<button type="button" class="abis-m71-clear" ' +
        'onclick="abisEssM71ClearFilters_(this)">' +
        escapeHtml(abisEssM71t_('clear')) +
      '</button>' +
    '</div>'
  );
}

function abisEssM71SkeletonHtml_() {
  let rows = '';

  for (let i = 0; i < 5; i++) {
    rows += (
      '<div class="abis-m71-skeleton-row">' +
        '<div class="abis-m71-skeleton-circle"></div>' +
        '<div class="abis-m71-skeleton-copy">' +
          '<span></span><span></span>' +
        '</div>' +
      '</div>'
    );
  }

  return (
    '<div class="abis-m71-loading-label">' +
      escapeHtml(abisEssM71t_('loading')) +
    '</div>' +
    '<div class="abis-m71-skeleton">' +
      rows +
    '</div>'
  );
}

function abisEssM71ErrorHtml_(text, retryFn, stale) {
  return (
    '<div class="abis-m71-error">' +
      '<b>' +
        escapeHtml(text || abisEssM71t_('loadFailed')) +
      '</b>' +
      (
        stale ?
          '<div class="tiny">' +
            escapeHtml(abisEssM71t_('stale')) +
          '</div>' :
          ''
      ) +
      (
        retryFn ?
          '<button type="button" class="secondary small" ' +
            'onclick="' + abisEssM71EscapeAttr_(retryFn) + '">' +
            escapeHtml(abisEssM71t_('retry')) +
          '</button>' :
          ''
      ) +
    '</div>'
  );
}

function abisEssM71EmployeeRowHtml_(x) {
  const id = String(x && x.employeeId || '');
  const name = String(x && x.name || id || '—');
  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  return (
    '<button type="button" class="abis-m71-employee-row" ' +
      'onclick="abisEssM71OpenDetail_(' +
        "'" + abisEssM71EscapeAttr_(id).replace(/&#39;/g, "\\'") + "',this" +
      ')">' +
      '<span class="abis-m71-avatar">' +
        escapeHtml(initial) +
      '</span>' +
      '<span class="abis-m71-employee-main">' +
        '<b>' + escapeHtml(name) + '</b>' +
        '<span>' +
          escapeHtml(id) +
          (
            x && x.department ?
              ' · ' + escapeHtml(x.department) :
              ''
          ) +
        '</span>' +
      '</span>' +
      '<span class="abis-m71-employee-location">' +
        escapeHtml(x && x.location || '') +
      '</span>' +
      '<span class="abis-m71-status">' +
        escapeHtml(x && x.employmentStatus || '—') +
      '</span>' +
      '<span class="abis-m71-chevron">›</span>' +
    '</button>'
  );
}

function abisEssM71ListHtml_() {
  const state = ABIS_ESS_M71_STATE_;
  const data = state.searchData;

  if (!data && state.loadingSearch) {
    return (
      '<div class="abis-m71-panel">' +
        '<div class="abis-m71-head">' +
          '<div>' +
            '<h3>' +
              escapeHtml(abisEssM71t_('employeeManagement')) +
            '</h3>' +
            '<span class="abis-m71-readonly">' +
              escapeHtml(abisEssM71t_('readOnly')) +
            '</span>' +
          '</div>' +
        '</div>' +
        abisEssM71SkeletonHtml_() +
      '</div>'
    );
  }

  const rows =
    data && Array.isArray(data.rows) ?
      data.rows :
      [];

  let listBody = '';

  if (rows.length) {
    listBody =
      '<div class="abis-m71-employee-list">' +
        rows.map(abisEssM71EmployeeRowHtml_).join('') +
      '</div>';
  } else {
    listBody =
      '<div class="abis-m71-empty">' +
        '<b>' +
          escapeHtml(abisEssM71t_('empty')) +
        '</b>' +
        '<span>' +
          escapeHtml(abisEssM71t_('emptyHint')) +
        '</span>' +
      '</div>';
  }

  const errorBlock =
    state.searchError ?
      abisEssM71ErrorHtml_(
        state.searchError,
        'abisEssM71Search_(null,true)',
        !!data
      ) :
      '';

  return (
    '<div class="abis-m71-panel">' +
      '<div class="abis-m71-head">' +
        '<div>' +
          '<h3>' +
            escapeHtml(abisEssM71t_('employeeManagement')) +
          '</h3>' +
          '<span class="abis-m71-readonly">' +
            escapeHtml(abisEssM71t_('readOnly')) +
          '</span>' +
        '</div>' +
        (
          data ?
            '<div class="abis-m71-count">' +
              '<b>' +
                escapeHtml(
                  String(data.totalMatched == null ?
                    rows.length :
                    data.totalMatched)
                ) +
              '</b>' +
              '<span>' +
                escapeHtml(abisEssM71t_('results')) +
              '</span>' +
            '</div>' :
            ''
        ) +
      '</div>' +
      abisEssM71SearchControlsHtml_() +
      errorBlock +
      (
        state.loadingSearch && data ?
          '<div class="abis-m71-inline-loading">' +
            escapeHtml(abisEssM71t_('loading')) +
          '</div>' :
          ''
      ) +
      listBody +
      (
        data ?
          '<div class="abis-m71-source-note">' +
            escapeHtml(abisEssM71t_('totalEmployees')) +
            '：' +
            escapeHtml(String(data.totalSource || 0)) +
            '<br>' +
            escapeHtml(abisEssM71t_('sourceNote')) +
          '</div>' :
          ''
      ) +
    '</div>'
  );
}

function abisEssM71DetailItem_(label, value, boolMode) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return '';
  }

  const display = boolMode ?
    abisEssM71BoolText_(value) :
    abisEssM71StatusText_(value);

  return (
    '<div class="abis-m71-detail-item">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<b>' + escapeHtml(display) + '</b>' +
    '</div>'
  );
}

function abisEssM71DetailSection_(title, items) {
  const body = items.filter(Boolean).join('');

  if (!body) return '';

  return (
    '<section class="abis-m71-detail-section">' +
      '<h4>' + escapeHtml(title) + '</h4>' +
      '<div class="abis-m71-detail-grid">' +
        body +
      '</div>' +
    '</section>'
  );
}

function abisEssM71DetailHtml_() {
  const state = ABIS_ESS_M71_STATE_;
  const d = state.detail;

  if (!d && state.loadingDetail) {
    return (
      '<div class="abis-m71-panel">' +
        '<div class="abis-m71-head">' +
          '<div><h3>' +
            escapeHtml(abisEssM71t_('employeeDetail')) +
          '</h3></div>' +
        '</div>' +
        abisEssM71SkeletonHtml_() +
      '</div>'
    );
  }

  if (!d) {
    return (
      '<div class="abis-m71-panel">' +
        abisEssM71ErrorHtml_(
          state.detailError || abisEssM71t_('loadFailed'),
          state.detailEmployeeId ?
            "abisEssM71OpenDetail_('" +
              abisEssM71EscapeAttr_(
                state.detailEmployeeId
              ).replace(/&#39;/g, "\\'") +
            "',null,true)" :
            '',
          false
        ) +
      '</div>'
    );
  }

  const e = d.employee || {};
  const basic = e.basic || {};
  const employment = e.employment || {};
  const organization = e.organization || {};
  const work = e.work || {};
  const system = e.system || {};

  const name = String(e.name || e.employeeId || '—');
  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  const detailError =
    state.detailError ?
      abisEssM71ErrorHtml_(
        state.detailError,
        "abisEssM71OpenDetail_('" +
          abisEssM71EscapeAttr_(
            state.detailEmployeeId
          ).replace(/&#39;/g, "\\'") +
        "',null,true)",
        true
      ) :
      '';

  return (
    '<div class="abis-m71-panel">' +
      '<button type="button" class="abis-m71-back-list" ' +
        'onclick="abisEssM71BackToList_()">' +
        '‹ ' +
        escapeHtml(abisEssM71t_('backToList')) +
      '</button>' +

      '<div class="abis-m71-detail-hero">' +
        '<span class="abis-m71-avatar abis-m71-avatar-lg">' +
          escapeHtml(initial) +
        '</span>' +
        '<div>' +
          '<h3>' + escapeHtml(name) + '</h3>' +
          '<span>' +
            escapeHtml(e.employeeId || '') +
            (
              employment.department ?
                ' · ' + escapeHtml(employment.department) :
                ''
            ) +
          '</span>' +
        '</div>' +
        '<span class="abis-m71-readonly">' +
          escapeHtml(abisEssM71t_('readOnly')) +
        '</span>' +
      '</div>' +

      detailError +

      abisEssM71DetailSection_(
        abisEssM71t_('basic'),
        [
          abisEssM71DetailItem_(
            abisEssM71t_('employeeId'),
            e.employeeId
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('name'),
            e.name
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('mobile'),
            basic.mobile
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('email'),
            basic.email
          )
        ]
      ) +

      abisEssM71DetailSection_(
        abisEssM71t_('employment'),
        [
          abisEssM71DetailItem_(
            abisEssM71t_('company'),
            employment.company
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('employmentStatus'),
            employment.employmentStatus
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('hireDate'),
            employment.hireDate
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('terminationDate'),
            employment.terminationDate
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('jobTitle'),
            employment.jobTitle
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('department'),
            employment.department
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('location'),
            employment.location
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('personType'),
            employment.personType
          )
        ]
      ) +

      abisEssM71DetailSection_(
        abisEssM71t_('organization'),
        [
          abisEssM71DetailItem_(
            abisEssM71t_('manager1'),
            organization.manager1
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('manager2'),
            organization.manager2
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('isManager'),
            organization.isManager
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('approvalPermission'),
            organization.approvalPermission
          )
        ]
      ) +

      abisEssM71DetailSection_(
        abisEssM71t_('work'),
        [
          abisEssM71DetailItem_(
            abisEssM71t_('formalShift'),
            work.formalShift
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('attendanceType'),
            work.attendanceType
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('punchExempt'),
            work.punchExempt
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('leaveExempt'),
            work.leaveExempt
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('punchNumber'),
            work.punchNumber
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('scheduleRole'),
            work.scheduleRole
          )
        ]
      ) +

      abisEssM71DetailSection_(
        abisEssM71t_('system'),
        [
          abisEssM71DetailItem_(
            abisEssM71t_('preferredLanguage'),
            system.preferredLanguage
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('systemEnabled'),
            system.systemEnabled
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('credentialState'),
            system.credentialState
          ),
          abisEssM71DetailItem_(
            abisEssM71t_('lineBound'),
            system.lineBound ?
              abisEssM71t_('bound') :
              abisEssM71t_('unbound')
          )
        ]
      ) +

      '<div class="abis-m71-source-note">' +
        escapeHtml(abisEssM71t_('sourceNote')) +
      '</div>' +
    '</div>'
  );
}

function abisEssM71PanelHtml_() {
  if (!abisEssM71CanManage_()) {
    return (
      '<div class="rc2-account-panel">' +
        '<div class="error">' +
          escapeHtml('無權限') +
        '</div>' +
      '</div>'
    );
  }

  return (
    '<div class="rc2-account-panel abis-m71-root">' +
      (
        ABIS_ESS_M71_STATE_.view === 'DETAIL' ?
          abisEssM71DetailHtml_() :
          abisEssM71ListHtml_()
      ) +
    '</div>'
  );
}

const ABIS_ESS_M71_BASE_ACCOUNT_PANEL_HTML_ =
  typeof rc2AccountPanelHtml_ === 'function' ?
    rc2AccountPanelHtml_ :
    null;

if (ABIS_ESS_M71_BASE_ACCOUNT_PANEL_HTML_) {
  rc2AccountPanelHtml_ = function (panel) {
    if (String(panel || '') === 'employeeManagement') {
      return abisEssM71PanelHtml_();
    }

    return ABIS_ESS_M71_BASE_ACCOUNT_PANEL_HTML_.apply(
      this,
      arguments
    );
  };
}

function abisEssM71ReadFiltersFromDom_() {
  const state = ABIS_ESS_M71_STATE_;

  const q = $('abisM71Query');
  const company = $('abisM71Company');
  const location = $('abisM71Location');
  const department = $('abisM71Department');
  const employmentStatus = $('abisM71EmploymentStatus');

  state.filters.query = q ? q.value.trim() : state.filters.query;
  state.filters.company =
    company ? company.value : state.filters.company;
  state.filters.location =
    location ? location.value : state.filters.location;
  state.filters.department =
    department ? department.value : state.filters.department;
  state.filters.employmentStatus =
    employmentStatus ?
      employmentStatus.value :
      state.filters.employmentStatus;
}

async function abisEssM71Search_(triggerBtn, force) {
  if (!abisEssM71CanManage_()) {
    message('無權限');
    return;
  }

  if (ABIS_ESS_M71_STATE_.loadingSearch && !force) return;

  abisEssM71ReadFiltersFromDom_();

  const state = ABIS_ESS_M71_STATE_;
  const hadData = !!state.searchData;

  state.loadingSearch = true;
  state.searchError = '';
  state.searchStale = false;

  if (accountPanel_ === 'employeeManagement') {
    renderMyAccount_();
  }

  if (triggerBtn && triggerBtn.disabled !== undefined) {
    triggerBtn.disabled = true;
  }

  try {
    const data = await call(
      'hrEmployeeSearch',
      {
        sessionToken: sessionToken,
        query: state.filters.query,
        company: state.filters.company,
        location: state.filters.location,
        department: state.filters.department,
        employmentStatus: state.filters.employmentStatus,
        limit: 200,
        offset: 0
      }
    );

    state.searchData = data || {
      rows: [],
      options: {}
    };
    state.searchError = '';
    state.searchStale = false;
  } catch (e) {
    state.searchError =
      e && e.message ?
        e.message :
        abisEssM71t_('loadFailed');

    state.searchStale = hadData;
  } finally {
    state.loadingSearch = false;

    if (triggerBtn && triggerBtn.isConnected) {
      triggerBtn.disabled = false;
    }

    if (accountPanel_ === 'employeeManagement' &&
        state.view === 'LIST') {
      renderMyAccount_();
    }
  }
}

async function abisEssM71LoadInitial_() {
  const state = ABIS_ESS_M71_STATE_;

  if (state.searchData || state.loadingSearch) return;

  await abisEssM71Search_(null, true);
}

function abisEssM71ClearFilters_(triggerBtn) {
  ABIS_ESS_M71_STATE_.filters = {
    query: '',
    company: '',
    location: '',
    department: '',
    employmentStatus: ''
  };

  abisEssM71Search_(triggerBtn, true);
}

async function abisEssM71OpenDetail_(
  employeeId,
  triggerBtn,
  force
) {
  if (!abisEssM71CanManage_()) {
    message('無權限');
    return;
  }

  const id = String(employeeId || '').trim().toUpperCase();
  if (!id) return;

  const state = ABIS_ESS_M71_STATE_;
  const sameExisting =
    state.detail &&
    String(
      state.detail.employee &&
      state.detail.employee.employeeId ||
      ''
    ).toUpperCase() === id;

  if (
    sameExisting &&
    !force
  ) {
    state.view = 'DETAIL';
    state.detailEmployeeId = id;
    state.detailError = '';
    renderMyAccount_();
    return;
  }

  if (state.loadingDetail && !force) return;

  state.view = 'DETAIL';
  state.detailEmployeeId = id;
  state.loadingDetail = true;
  state.detailError = '';
  state.detailStale = false;

  if (!sameExisting) {
    state.detail = null;
  }

  renderMyAccount_();

  if (triggerBtn && triggerBtn.disabled !== undefined) {
    triggerBtn.disabled = true;
  }

  try {
    const data = await call(
      'hrEmployeeDetail',
      {
        sessionToken: sessionToken,
        employeeId: id
      }
    );

    state.detail = data || null;
    state.detailError = '';
    state.detailStale = false;
  } catch (e) {
    state.detailError =
      e && e.message ?
        e.message :
        abisEssM71t_('loadFailed');

    state.detailStale = sameExisting;
  } finally {
    state.loadingDetail = false;

    if (triggerBtn && triggerBtn.isConnected) {
      triggerBtn.disabled = false;
    }

    if (
      accountPanel_ === 'employeeManagement' &&
      state.view === 'DETAIL'
    ) {
      renderMyAccount_();
    }
  }
}

function abisEssM71BackToList_() {
  ABIS_ESS_M71_STATE_.view = 'LIST';
  ABIS_ESS_M71_STATE_.detailError = '';

  if (accountPanel_ === 'employeeManagement') {
    renderMyAccount_();

    if (typeof rc2UpdateInnerBar_ === 'function') {
      rc2UpdateInnerBar_();
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ignore) {
      window.scrollTo(0, 0);
    }
  }
}

const ABIS_ESS_M71_BASE_OPEN_ACCOUNT_PANEL_ =
  typeof rc2OpenAccountPanel_ === 'function' ?
    rc2OpenAccountPanel_ :
    null;

if (ABIS_ESS_M71_BASE_OPEN_ACCOUNT_PANEL_) {
  rc2OpenAccountPanel_ = function (panel) {
    const p = String(panel || '');

    if (p === 'employeeManagement') {
      if (!abisEssM71CanManage_()) {
        message('無權限');
        return;
      }

      ABIS_ESS_M71_STATE_.view = 'LIST';
    }

    const out =
      ABIS_ESS_M71_BASE_OPEN_ACCOUNT_PANEL_.apply(
        this,
        arguments
      );

    if (p === 'employeeManagement') {
      setTimeout(abisEssM71LoadInitial_, 0);
    }

    return out;
  };
}

const ABIS_ESS_M71_BASE_INNER_TITLE_ =
  typeof rc2InnerTitleForSection_ === 'function' ?
    rc2InnerTitleForSection_ :
    null;

if (ABIS_ESS_M71_BASE_INNER_TITLE_) {
  rc2InnerTitleForSection_ = function (id) {
    if (
      id === 'account' &&
      String(accountPanel_ || '') === 'employeeManagement'
    ) {
      return (
        ABIS_ESS_M71_STATE_.view === 'DETAIL' ?
          abisEssM71t_('employeeDetail') :
          abisEssM71t_('employeeManagement')
      );
    }

    return ABIS_ESS_M71_BASE_INNER_TITLE_.apply(
      this,
      arguments
    );
  };
}

const ABIS_ESS_M71_BASE_INNER_BACK_ =
  typeof rc2InnerBack_ === 'function' ?
    rc2InnerBack_ :
    null;

if (ABIS_ESS_M71_BASE_INNER_BACK_) {
  rc2InnerBack_ = function () {
    const id =
      typeof rc2VisibleInnerSection_ === 'function' ?
        rc2VisibleInnerSection_() :
        '';

    if (
      id === 'account' &&
      String(accountPanel_ || '') === 'employeeManagement'
    ) {
      if (ABIS_ESS_M71_STATE_.view === 'DETAIL') {
        abisEssM71BackToList_();
        return;
      }

      accountPanel_ = 'management';
      renderMyAccount_();

      if (typeof rc2UpdateInnerBar_ === 'function') {
        rc2UpdateInnerBar_();
      }

      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (ignore) {
        window.scrollTo(0, 0);
      }

      return;
    }

    return ABIS_ESS_M71_BASE_INNER_BACK_.apply(
      this,
      arguments
    );
  };
}

/* --------------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------------ */

function abisEssM71InstallStyles_() {
  if (document.getElementById('abisEssM71Style')) return;

  const style = document.createElement('style');
  style.id = 'abisEssM71Style';

  style.textContent = `
    .abis-m71-root{
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    .abis-m71-panel{
      display:grid;
      gap:14px;
      min-width:0;
    }

    .abis-m71-head{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
    }

    .abis-m71-head h3{
      margin:0;
      color:#142640;
    }

    .abis-m71-detail-hero h3{
      margin:0;
      color:#142640!important;
      text-shadow:none;
    }

    .abis-m71-readonly{
      display:inline-flex;
      align-items:center;
      min-height:24px;
      margin-top:7px;
      padding:3px 9px;
      border-radius:999px;
      background:#eef4fb;
      color:#50677f;
      font-size:12px;
      font-weight:800;
    }

    .abis-m71-count{
      flex:0 0 auto;
      min-width:72px;
      padding:8px 10px;
      border:1px solid #dce6ef;
      border-radius:12px;
      background:#fff;
      text-align:center;
    }

    .abis-m71-count b{
      display:block;
      color:#145da8;
      font-size:20px;
      line-height:1;
    }

    .abis-m71-count span{
      display:block;
      margin-top:4px;
      color:#53657d;
      font-size:11px;
      font-weight:700;
    }

    .abis-m71-search-card{
      display:grid;
      gap:10px;
      padding:13px;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
      box-shadow:0 3px 14px rgba(31,55,86,.05);
    }

    .abis-m71-search-line{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:8px;
      align-items:center;
    }

    .abis-m71-search-line input,
    .abis-m71-filter-grid select{
      width:100%;
      min-width:0;
      margin:0;
      min-height:46px;
    }

    .abis-m71-primary{
      width:auto!important;
      min-width:88px!important;
      min-height:46px!important;
      margin:0!important;
      padding:10px 16px!important;
      background:#1768e8!important;
      color:#fff!important;
    }

    .abis-m71-filter-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
    }

    .abis-m71-clear{
      width:auto!important;
      min-width:88px!important;
      min-height:46px!important;
      justify-self:start;
      margin:0!important;
      padding:10px 16px!important;
      border-radius:12px!important;
      background:#1768e8!important;
      color:#ffffff!important;
      font-size:16px!important;
      font-weight:800!important;
    }

    .abis-m71-inline-loading,
    .abis-m71-loading-label{
      color:#64748b;
      font-size:13px;
      font-weight:700;
    }

    .abis-m71-employee-list{
      overflow:hidden;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
    }

    .abis-m71-employee-row{
      width:100%!important;
      min-width:0!important;
      min-height:70px!important;
      display:grid!important;
      grid-template-columns:42px minmax(0,1fr) auto 18px;
      align-items:center!important;
      gap:10px!important;
      margin:0!important;
      padding:12px 14px!important;
      border:0!important;
      border-bottom:1px solid #e9eef4!important;
      border-radius:0!important;
      background:#fff!important;
      color:#142640!important;
      text-align:left!important;
      box-shadow:none!important;
    }

    .abis-m71-employee-row:last-child{
      border-bottom:0!important;
    }

    .abis-m71-employee-row:active{
      transform:scale(.995);
      opacity:.92;
    }

    .abis-m71-avatar{
      width:42px;
      height:42px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:linear-gradient(145deg,#dcecff,#cce8e0);
      color:#13406a!important;
      font-weight:950;
      flex:0 0 auto;
    }

    .abis-m71-avatar-lg{
      width:58px;
      height:58px;
      font-size:23px;
    }

    .abis-m71-employee-main{
      min-width:0;
      display:grid;
      gap:3px;
    }

    .abis-m71-employee-main b{
      overflow:hidden;
      color:#142640!important;
      font-size:16px;
      line-height:1.3;
      text-overflow:ellipsis;
      white-space:nowrap;
      text-shadow:none;
    }

    .abis-m71-employee-main span{
      overflow:hidden;
      color:#53657d!important;
      font-size:12px;
      line-height:1.4;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    .abis-m71-employee-location{
      display:none;
      color:#53657d!important;
      font-size:13px;
      font-weight:750;
      line-height:1.35;
    }

    .abis-m71-status{
      padding:4px 8px;
      border-radius:999px;
      background:#ecfdf3!important;
      color:#166534!important;
      border:1px solid #bbdfc8;
      font-size:12px;
      font-weight:850;
      white-space:nowrap;
    }

    .abis-m71-chevron{
      color:#425a73!important;
      font-size:24px;
      line-height:1;
    }

    .abis-m71-empty{
      display:grid;
      gap:5px;
      padding:28px 16px;
      border:1px dashed #ced9e4;
      border-radius:16px;
      background:#fff;
      color:#64748b;
      text-align:center;
    }

    .abis-m71-empty b{
      color:#334155;
    }

    .abis-m71-source-note{
      padding:11px 12px;
      border-radius:12px;
      background:#f8fafc;
      color:#64748b;
      font-size:12px;
      line-height:1.6;
    }

    .abis-m71-error{
      display:grid;
      gap:6px;
      padding:12px;
      border:1px solid #fecaca;
      border-radius:12px;
      background:#fef2f2;
      color:#991b1b;
    }

    .abis-m71-error button{
      justify-self:start;
      width:auto!important;
    }

    .abis-m71-skeleton{
      overflow:hidden;
      border:1px solid #e3eaf1;
      border-radius:16px;
      background:#fff;
    }

    .abis-m71-skeleton-row{
      min-height:70px;
      display:grid;
      grid-template-columns:42px minmax(0,1fr);
      align-items:center;
      gap:10px;
      padding:12px 14px;
      border-bottom:1px solid #edf1f5;
    }

    .abis-m71-skeleton-row:last-child{
      border-bottom:0;
    }

    .abis-m71-skeleton-circle,
    .abis-m71-skeleton-copy span{
      position:relative;
      overflow:hidden;
      background:#edf1f5;
    }

    .abis-m71-skeleton-circle{
      width:42px;
      height:42px;
      border-radius:50%;
    }

    .abis-m71-skeleton-copy{
      display:grid;
      gap:8px;
    }

    .abis-m71-skeleton-copy span{
      display:block;
      width:55%;
      height:12px;
      border-radius:999px;
    }

    .abis-m71-skeleton-copy span + span{
      width:78%;
      height:10px;
    }

    .abis-m71-skeleton-circle:after,
    .abis-m71-skeleton-copy span:after{
      content:"";
      position:absolute;
      inset:0;
      transform:translateX(-100%);
      background:linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.72),
        transparent
      );
      animation:abisM71Shimmer 1.15s infinite;
    }

    @keyframes abisM71Shimmer{
      to{transform:translateX(100%)}
    }

    .abis-m71-back-list{
      width:auto!important;
      min-width:0!important;
      justify-self:start;
      min-height:48px!important;
      margin:0!important;
      padding:11px 18px!important;
      border-radius:14px!important;
      background:#1768e8!important;
      color:#ffffff!important;
      font-size:16px!important;
      font-weight:850!important;
      line-height:1.25!important;
      letter-spacing:.01em;
      white-space:nowrap;
    }

    .abis-m71-detail-hero{
      display:grid;
      grid-template-columns:58px minmax(0,1fr) auto;
      align-items:center;
      gap:12px;
      padding:14px;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
    }

    .abis-m71-detail-hero span:not(.abis-m71-avatar):not(.abis-m71-readonly){
      color:#53657d!important;
      font-size:13px;
    }

    .abis-m71-detail-section{
      overflow:hidden;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
    }

    .abis-m71-detail-section h4{
      margin:0;
      padding:12px 14px;
      border-bottom:1px solid #e9eef4;
      background:#f8fafc;
      color:#334155;
      font-size:14px;
    }

    .abis-m71-detail-grid{
      display:grid;
      grid-template-columns:1fr;
    }

    .abis-m71-detail-item{
      min-width:0;
      display:grid;
      grid-template-columns:minmax(100px,.8fr) minmax(0,1.2fr);
      gap:10px;
      padding:11px 14px;
      border-bottom:1px solid #edf1f5;
    }

    .abis-m71-detail-item:last-child{
      border-bottom:0;
    }

    .abis-m71-detail-item span{
      color:#53657d;
      font-size:13px;
    }

    .abis-m71-detail-item b{
      min-width:0;
      color:#172238;
      font-size:14px;
      overflow-wrap:anywhere;
      text-align:right;
    }


    /* ======================================================================
     * GLOBAL UI COLOR CONTRAST RULE
     * Frozen 2026-10-05
     *
     * All interactive UI must preserve clear text/background contrast.
     * Strong text on light backgrounds should use dark navy or darker.
     * Text placed on ABIS blue / dark backgrounds should use white or near-white.
     * Muted secondary text must still remain readable; avoid low-contrast gray.
     * Status pills, helper text, and subtitles must not trade readability for style.
     * ==================================================================== */

    :root{
      --abis-ui-text-strong:#142640;
      --abis-ui-text-muted:#53677e;
      --abis-ui-text-on-dark:#ffffff;
      --abis-ui-text-subtle-on-dark:rgba(255,255,255,.88);
      --abis-ui-text-disabled:#8192a6;
    }

    /* ======================================================================
     * GLOBAL UI INTERACTION SPACING RULE
     * Frozen 2026-10-05
     *
     * Text buttons must never let the label visually touch the blue frame.
     * Default text-button spacing:
     *   desktop: min-height 44px, 10px vertical / 16px horizontal padding
     *   mobile : min-height 48px, 11px vertical / 16px horizontal padding
     * Compact text buttons still keep at least 8px vertical / 12px horizontal.
     * Icon-only controls are handled by their own square tap-target rules.
     * ==================================================================== */

    :root{
      --abis-ui-action-min-h:44px;
      --abis-ui-action-min-h-mobile:48px;
      --abis-ui-action-pad-y:10px;
      --abis-ui-action-pad-x:16px;
      --abis-ui-action-pad-y-mobile:11px;
      --abis-ui-action-pad-x-mobile:16px;
      --abis-ui-action-gap:8px;
      --abis-ui-action-radius:12px;
      --abis-ui-action-line-height:1.25;
    }

    button,
    [role="button"],
    .btn,
    .button{
      line-height:var(--abis-ui-action-line-height);
    }

    /* Normal text-action controls across the ESS UI. */
    button:not(.fh-task-card):not(.fh-quick-card):not(.fh-today-card):not(.fh-list-row):not(.abis-m71-employee-row):not(.rc2-account-row),
    a.line-auth-link,
    .btn,
    .button{
      min-height:var(--abis-ui-action-min-h);
      padding-top:var(--abis-ui-action-pad-y);
      padding-bottom:var(--abis-ui-action-pad-y);
      padding-left:var(--abis-ui-action-pad-x);
      padding-right:var(--abis-ui-action-pad-x);
      box-sizing:border-box;
    }

    /* Compact buttons may be visually smaller, but never cramped. */
    button.small,
    .btn.small,
    .button.small{
      min-height:40px!important;
      padding:8px 12px!important;
      line-height:1.25!important;
    }

    /* Clickable card/row patterns keep their own layout but require inner air. */
    .fh-task-card,
    .fh-quick-card,
    .fh-today-card,
    .fh-list-row,
    .abis-m71-employee-row,
    .rc2-account-row{
      box-sizing:border-box;
    }

    /* Known icon-only controls remain square rather than receiving text padding. */
    .back,
    .ghost,
    .frozen-theme-toggle,
    #themeToggle{
      padding:0!important;
    }

    @media (max-width:767px){
      button:not(.fh-task-card):not(.fh-quick-card):not(.fh-today-card):not(.fh-list-row):not(.abis-m71-employee-row):not(.rc2-account-row),
      a.line-auth-link,
      .btn,
      .button{
        min-height:var(--abis-ui-action-min-h-mobile);
        padding-top:var(--abis-ui-action-pad-y-mobile);
        padding-bottom:var(--abis-ui-action-pad-y-mobile);
        padding-left:var(--abis-ui-action-pad-x-mobile);
        padding-right:var(--abis-ui-action-pad-x-mobile);
      }

      .abis-m71-head h3,
      .abis-m71-detail-hero h3{
        font-size:22px;
      }

      .abis-m71-search-card{
        padding:12px;
      }

      .abis-m71-search-line{
        grid-template-columns:minmax(0,1fr) 84px;
      }

      .abis-m71-search-line input,
      .abis-m71-filter-grid select,
      .abis-m71-primary,
      .abis-m71-clear{
        min-height:48px!important;
        font-size:16px!important;
      }

      .abis-m71-filter-grid{
        grid-template-columns:1fr;
      }

      .abis-m71-employee-row{
        min-height:76px!important;
        padding:13px 12px!important;
      }

      .abis-m71-employee-main b{
        font-size:18px;
      }

      .abis-m71-employee-main span,
      .abis-m71-status{
        font-size:13px;
      }

      .abis-m71-detail-hero{
        grid-template-columns:58px minmax(0,1fr);
      }

      .abis-m71-detail-hero .abis-m71-readonly{
        grid-column:1 / -1;
        justify-self:start;
        margin-top:0;
      }

      .abis-m71-detail-section h4{
        font-size:17px;
      }

      .abis-m71-detail-item{
        grid-template-columns:1fr;
        gap:4px;
        padding:12px 14px;
      }

      .abis-m71-detail-item span{
        font-size:14px;
      }

      .abis-m71-detail-item b{
        font-size:16px;
        text-align:left;
      }
    }

    @media (min-width:768px){
      .abis-m71-panel{
        gap:16px;
      }

      .abis-m71-filter-grid{
        grid-template-columns:repeat(3,minmax(0,1fr));
      }

      .abis-m71-employee-row{
        grid-template-columns:
          42px minmax(180px,1.5fr)
          minmax(110px,.8fr)
          minmax(90px,.6fr)
          18px;
      }

      .abis-m71-employee-location{
        display:block;
      }

      .abis-m71-detail-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .abis-m71-detail-item{
        border-right:1px solid #edf1f5;
      }

      .abis-m71-detail-item:nth-child(even){
        border-right:0;
      }
    }
  `;

  document.head.appendChild(style);
}

abisEssM71InstallStyles_();

/* --------------------------------------------------------------------------
 * Diagnostics
 * ------------------------------------------------------------------------ */

async function abisEssM71ApiSmoke_() {
  if (!sessionToken) {
    return {
      ok: false,
      version: ABIS_ESS_M7_1B_VERSION_,
      error: 'NO_SESSION'
    };
  }

  if (!abisEssM71CanManage_()) {
    return {
      ok: false,
      version: ABIS_ESS_M7_1B_VERSION_,
      error: 'NO_HR_ADMIN_PERMISSION'
    };
  }

  try {
    const search = await call(
      'hrEmployeeSearch',
      {
        sessionToken: sessionToken,
        query: '',
        limit: 200,
        offset: 0
      }
    );

    const detail = await call(
      'hrEmployeeDetail',
      {
        sessionToken: sessionToken,
        employeeId: 'A09701'
      }
    );

    const result = {
      ok:
        !!search &&
        Number(search.writesPerformed || 0) === 0 &&
        Number(search.totalSource || 0) > 0 &&
        !!detail &&
        Number(detail.writesPerformed || 0) === 0 &&
        !!(
          detail.employee &&
          detail.employee.employeeId === 'A09701'
        ),
      version: ABIS_ESS_M7_1B_VERSION_,
      backendVersion:
        search && search.version || '',
      totalSource:
        search && search.totalSource || 0,
      totalMatched:
        search && search.totalMatched || 0,
      detailEmployeeId:
        detail &&
        detail.employee &&
        detail.employee.employeeId || '',
      writesPerformed:
        Number(search && search.writesPerformed || 0) +
        Number(detail && detail.writesPerformed || 0)
    };

    return result;
  } catch (e) {
    return {
      ok: false,
      version: ABIS_ESS_M7_1B_VERSION_,
      error:
        e && e.message ?
          e.message :
          String(e)
    };
  }
}

function abisEssM71Preflight_() {
  const canManage = abisEssM71CanManage_();
  const managementHtml =
    typeof rc2ManagementToolsHtml_ === 'function' ?
      rc2ManagementToolsHtml_() :
      '';

  const employeeEntryWired =
    String(managementHtml).indexOf(
      "employeeManagement"
    ) >= 0;

  const m35 =
    typeof abisEssM35Preflight_ === 'function' ?
      abisEssM35Preflight_() :
      null;

  const out = {
    ok: true,
    version: ABIS_ESS_M7_1B_VERSION_,
    mobile:
      typeof abisEssIsMobileUi_ === 'function' ?
        !!abisEssIsMobileUi_() :
        null,
    canManage: canManage,
    employeeEntryWired: employeeEntryWired,
    readOnly: true,
    dependencies: {
      m1:
        typeof abisEssIsMobileUi_ === 'function',
      m2:
        typeof abisEssM2HasManagementTools_ === 'function',
      m35:
        typeof abisEssM35Preflight_ === 'function',
      m351:
        typeof abisEssM351VisibleOverflowAudit_ === 'function'
    },
    layout: {
      m35Ok:
        m35 ?
          !!m35.ok :
          null,
      horizontalOverflow:
        m35 &&
        m35.layout ?
          m35.layout.horizontalOverflow :
          null
    },
    functions: {
      search:
        typeof abisEssM71Search_ === 'function',
      detail:
        typeof abisEssM71OpenDetail_ === 'function',
      apiSmoke:
        typeof abisEssM71ApiSmoke_ === 'function'
    }
  };

  out.ok =
    out.readOnly === true &&
    out.dependencies.m1 === true &&
    out.dependencies.m2 === true &&
    out.dependencies.m35 === true &&
    out.dependencies.m351 === true &&
    out.functions.search === true &&
    out.functions.detail === true &&
    out.functions.apiSmoke === true &&
    (
      !canManage ||
      employeeEntryWired
    ) &&
    (
      out.layout.m35Ok === true ||
      out.layout.m35Ok === null
    ) &&
    out.layout.horizontalOverflow !== true;

  window.ABIS_ESS_M7_1B = out;
  return out;
}


window.ABIS_ESS_M7_1B_COLOR_FIX = {
  ok: true,
  integrated: true,
  globalInteractionSpacing: true,
  globalContrastRule: true,
  version: ABIS_ESS_M7_1B_VERSION_
};

try {
  window.ABIS_ESS_M7_1B =
    abisEssM71Preflight_();
} catch (ignore) {}


/* ============================================================================
 * ABIS ESS M7-2A | HR Attendance Management Daily Overview (READ_ONLY)
 * Version: ABIS_ESS_M7_2A_HR_ATTENDANCE_READONLY_UI_20261005
 *
 * INSTALL:
 *   Paste AFTER M7-1B COLORFIX4 and BEFORE final boot();
 *
 * BACKEND:
 *   Reuses existing production APIs:
 *   - attendanceUnifiedSiteDetail
 *   - attendanceUnifiedCorrectionDetail (reserved for next stage)
 *
 * SCOPE:
 *   - HR / Admin only
 *   - Daily exception-first attendance overview
 *   - Active sites: XINDIAN / OFFICE
 *   - CHANGBIN remains held until source connectivity is restored
 *   - READ_ONLY in M7-2A
 *   - No attendance / exception / correction / payroll writes
 *   - No shift inference from punch
 * ========================================================================== */

const ABIS_ESS_M7_2A_VERSION_ =
  'ABIS_ESS_M7_2A_HR_ATTENDANCE_READONLY_UI_20261005';

const ABIS_ESS_M72_SCOPES_ = [
  { code:'XINDIAN', label:{ZH:'新店廠',VI:'Nhà máy Xindian',TH:'โรงงาน Xindian'}, held:false },
  { code:'OFFICE', label:{ZH:'辦公室',VI:'Văn phòng',TH:'สำนักงาน'}, held:false },
  { code:'CHANGBIN', label:{ZH:'彰濱廠',VI:'Nhà máy Changbin',TH:'โรงงาน Changbin'}, held:true }
];

const ABIS_ESS_M72_I18N_ = {
  ZH:{
    attendanceManagement:'出勤管理',
    hrTools:'HR 工具',
    employeeManagement:'員工管理',
    accountManagement:'帳號管理',
    plannerTools:'生管工具',
    supervisorTools:'主管工具',
    scheduleManagement:'班表管理',
    leaveOverview:'請假總覽',
    readOnly:'唯讀',
    dailyOverview:'每日出勤異常總覽',
    date:'日期',
    refresh:'重新整理',
    allSites:'全部',
    held:'暫停納入',
    heldHint:'彰濱廠打卡來源尚未恢復，現階段不納入出勤管理判定。',
    affectedPeople:'異常／請假人數',
    missingCard:'缺卡',
    late:'遲到',
    earlyLeave:'早退',
    leave:'請假',
    correction:'補正案件',
    other:'其他',
    searchPlaceholder:'搜尋姓名或員工編號',
    allTypes:'全部狀態',
    loading:'正在載入出勤資料…',
    empty:'本日沒有符合條件的出勤異常或請假資料',
    emptyHint:'正常出勤人員不列入本頁；此頁採例外優先。',
    loadFailed:'出勤資料載入失敗',
    partialFailed:'部分廠區資料載入失敗',
    retry:'重新載入',
    employee:'員工',
    site:'工作地點',
    shift:'班別',
    expected:'應到／應退',
    actual:'上班／下班',
    status:'狀態',
    pendingEmployee:'待員工補正',
    viewCorrection:'查看補正',
    detail:'出勤詳情',
    backList:'返回出勤清單',
    exceptionCodes:'異常代碼',
    proxy:'代理人',
    leaveHours:'請假時數',
    normal:'正常',
    sourceNote:'本頁直接使用現行 Unified Attendance 資料，不以打卡時間推定正式班別。',
    noPermission:'無出勤管理權限',
    noTools:'目前沒有可使用的管理工具',
    failedSite:'無法讀取'
  },
  VI:{
    attendanceManagement:'Quản lý chấm công',
    hrTools:'Công cụ HR',
    employeeManagement:'Quản lý nhân viên',
    accountManagement:'Quản lý tài khoản',
    plannerTools:'Công cụ điều độ',
    supervisorTools:'Công cụ quản lý',
    scheduleManagement:'Quản lý lịch làm việc',
    leaveOverview:'Tổng quan nghỉ phép',
    readOnly:'Chỉ xem',
    dailyOverview:'Tổng quan bất thường chấm công hằng ngày',
    date:'Ngày',
    refresh:'Làm mới',
    allSites:'Tất cả',
    held:'Tạm ngưng',
    heldHint:'Nguồn chấm công Changbin chưa được khôi phục nên hiện chưa đưa vào đánh giá.',
    affectedPeople:'Người có bất thường/nghỉ',
    missingCard:'Thiếu chấm công',
    late:'Đi trễ',
    earlyLeave:'Về sớm',
    leave:'Nghỉ phép',
    correction:'Yêu cầu điều chỉnh',
    other:'Khác',
    searchPlaceholder:'Tìm tên hoặc mã nhân viên',
    allTypes:'Tất cả trạng thái',
    loading:'Đang tải dữ liệu chấm công…',
    empty:'Không có dữ liệu bất thường hoặc nghỉ phù hợp trong ngày',
    emptyHint:'Người chấm công bình thường không hiển thị; trang này ưu tiên ngoại lệ.',
    loadFailed:'Không thể tải dữ liệu chấm công',
    partialFailed:'Một số địa điểm tải thất bại',
    retry:'Tải lại',
    employee:'Nhân viên',
    site:'Địa điểm',
    shift:'Ca',
    expected:'Giờ dự kiến vào/ra',
    actual:'Giờ vào/ra',
    status:'Trạng thái',
    pendingEmployee:'Chờ nhân viên điều chỉnh',
    viewCorrection:'Xem điều chỉnh',
    detail:'Chi tiết chấm công',
    backList:'Quay lại danh sách',
    exceptionCodes:'Mã bất thường',
    proxy:'Người thay thế',
    leaveHours:'Giờ nghỉ',
    normal:'Bình thường',
    sourceNote:'Trang này dùng trực tiếp dữ liệu Unified Attendance hiện hành và không suy đoán ca chính thức từ giờ chấm công.',
    noPermission:'Không có quyền quản lý chấm công',
    noTools:'Hiện không có công cụ quản lý khả dụng',
    failedSite:'Không thể đọc'
  },
  TH:{
    attendanceManagement:'จัดการเวลาทำงาน',
    hrTools:'เครื่องมือ HR',
    employeeManagement:'จัดการพนักงาน',
    accountManagement:'จัดการบัญชี',
    plannerTools:'เครื่องมือวางแผนการผลิต',
    supervisorTools:'เครื่องมือหัวหน้างาน',
    scheduleManagement:'จัดการตารางงาน',
    leaveOverview:'ภาพรวมการลา',
    readOnly:'ดูอย่างเดียว',
    dailyOverview:'ภาพรวมความผิดปกติการลงเวลารายวัน',
    date:'วันที่',
    refresh:'โหลดใหม่',
    allSites:'ทั้งหมด',
    held:'พักการใช้งาน',
    heldHint:'แหล่งข้อมูลเครื่องลงเวลา Changbin ยังไม่กลับมาใช้งาน จึงยังไม่รวมในการประเมิน',
    affectedPeople:'พนักงานผิดปกติ/ลา',
    missingCard:'ขาดการลงเวลา',
    late:'มาสาย',
    earlyLeave:'กลับก่อน',
    leave:'ลา',
    correction:'คำขอแก้ไข',
    other:'อื่นๆ',
    searchPlaceholder:'ค้นหาชื่อหรือรหัสพนักงาน',
    allTypes:'ทุกสถานะ',
    loading:'กำลังโหลดข้อมูลเวลา…',
    empty:'วันนี้ไม่มีข้อมูลผิดปกติหรือการลาตามเงื่อนไข',
    emptyHint:'พนักงานที่ลงเวลาปกติจะไม่แสดง หน้านี้เน้นรายการผิดปกติ',
    loadFailed:'โหลดข้อมูลเวลาไม่สำเร็จ',
    partialFailed:'บางสถานที่โหลดไม่สำเร็จ',
    retry:'โหลดใหม่',
    employee:'พนักงาน',
    site:'สถานที่',
    shift:'กะ',
    expected:'เวลาเข้า/ออกที่ควรเป็น',
    actual:'เวลาเข้า/ออกจริง',
    status:'สถานะ',
    pendingEmployee:'รอพนักงานแก้ไข',
    viewCorrection:'ดูคำขอแก้ไข',
    detail:'รายละเอียดเวลา',
    backList:'กลับไปรายการ',
    exceptionCodes:'รหัสผิดปกติ',
    proxy:'ผู้ปฏิบัติงานแทน',
    leaveHours:'ชั่วโมงลา',
    normal:'ปกติ',
    sourceNote:'หน้านี้ใช้ข้อมูล Unified Attendance ปัจจุบันโดยตรง และไม่อนุมานกะทางการจากเวลาลงงาน',
    noPermission:'ไม่มีสิทธิ์จัดการเวลาทำงาน',
    noTools:'ขณะนี้ไม่มีเครื่องมือจัดการที่ใช้งานได้',
    failedSite:'อ่านข้อมูลไม่ได้'
  }
};

function abisEssM72t_(k){
  const lang = ABIS_ESS_M72_I18N_[currentLang] ? currentLang : 'ZH';
  return ABIS_ESS_M72_I18N_[lang][k] || ABIS_ESS_M72_I18N_.ZH[k] || k;
}

function abisEssM72ScopeLabel_(scope){
  if(!scope) return '';
  const map = scope.label || {};
  return map[currentLang] || map.ZH || scope.code || '';
}

function abisEssM72CanManage_(){
  return typeof canManageCredentials_ === 'function' && !!canManageCredentials_();
}

function abisEssM72Today_(){
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

const ABIS_ESS_M72_STATE_ = {
  date:abisEssM72Today_(),
  site:'ALL',
  type:'ALL',
  query:'',
  loading:false,
  loaded:false,
  errors:[],
  bySite:{},
  detail:null,
  view:'LIST'
};

function abisEssM72Classify_(row){
  const codes = Array.isArray(row && row.exceptionCodes) ? row.exceptionCodes : [];
  const has = c => codes.indexOf(c) >= 0;
  const missing =
    has('MISSING_IN') ||
    has('MISSING_OUT') ||
    has('NO_PUNCH') ||
    has('SINGLE_PUNCH') ||
    has('PARTIAL_LEAVE_NO_PUNCH');

  const late = has('LATE') || has('LATE_OVER_30');
  const early = has('EARLY_LEAVE');
  const leave = !!(row && row.leave);
  const correction = !!(row && row.correction);

  let other = false;
  if(!missing && !late && !early && !leave && codes.length) other = true;

  return {
    missing:missing,
    late:late,
    early:early,
    leave:leave,
    correction:correction,
    other:other
  };
}

function abisEssM72CombinedRows_(){
  const out=[];
  Object.keys(ABIS_ESS_M72_STATE_.bySite).forEach(function(code){
    const d=ABIS_ESS_M72_STATE_.bySite[code];
    if(!d || !Array.isArray(d.rows)) return;
    d.rows.forEach(function(r){
      out.push(Object.assign({},r,{
        scopeCode:code,
        scopeLabel:d.scopeLabel || code
      }));
    });
  });
  return out;
}

function abisEssM72Summary_(){
  const rows=abisEssM72CombinedRows_();
  const s={people:rows.length,missing:0,late:0,early:0,leave:0,correction:0,other:0};
  rows.forEach(function(r){
    const c=abisEssM72Classify_(r);
    if(c.missing)s.missing++;
    if(c.late)s.late++;
    if(c.early)s.early++;
    if(c.leave)s.leave++;
    if(c.correction)s.correction++;
    if(c.other)s.other++;
  });
  return s;
}

function abisEssM72RowMatchesType_(row,type){
  if(type==='ALL') return true;
  const c=abisEssM72Classify_(row);
  if(type==='MISSING')return c.missing;
  if(type==='LATE')return c.late;
  if(type==='EARLY')return c.early;
  if(type==='LEAVE')return c.leave;
  if(type==='CORRECTION')return c.correction;
  if(type==='OTHER')return c.other;
  return true;
}

function abisEssM72FilteredRows_(){
  const state=ABIS_ESS_M72_STATE_;
  const q=String(state.query||'').trim().toUpperCase();

  return abisEssM72CombinedRows_()
    .filter(function(r){
      if(state.site!=='ALL' && r.scopeCode!==state.site)return false;
      if(!abisEssM72RowMatchesType_(r,state.type))return false;
      if(q){
        const hay=[
          r.employeeId,r.name,r.scopeLabel,r.shiftName,r.shiftCode,
          r.status,(r.exceptionCodes||[]).join('|')
        ].join('|').toUpperCase();
        if(hay.indexOf(q)<0)return false;
      }
      return true;
    })
    .sort(function(a,b){
      const ac=abisEssM72Classify_(a),bc=abisEssM72Classify_(b);
      const as=(ac.correction?0:1)+(ac.missing?0:2);
      const bs=(bc.correction?0:1)+(bc.missing?0:2);
      return as-bs ||
        String(a.scopeLabel||'').localeCompare(String(b.scopeLabel||''),'zh-Hant') ||
        String(a.name||'').localeCompare(String(b.name||''),'zh-Hant');
    });
}

async function abisEssM72Load_(triggerBtn){
  if(!abisEssM72CanManage_()){
    message(abisEssM72t_('noPermission'));
    return;
  }

  const dateEl=$('abisM72Date');
  if(dateEl && /^\d{4}-\d{2}-\d{2}$/.test(dateEl.value)){
    ABIS_ESS_M72_STATE_.date=dateEl.value;
  }

  if(ABIS_ESS_M72_STATE_.loading)return;
  ABIS_ESS_M72_STATE_.loading=true;
  ABIS_ESS_M72_STATE_.errors=[];

  if(triggerBtn && triggerBtn.disabled!==undefined)triggerBtn.disabled=true;
  if(accountPanel_==='attendanceManagement')renderMyAccount_();

  const active=ABIS_ESS_M72_SCOPES_.filter(x=>!x.held);

  const results=await Promise.all(active.map(async function(scope){
    try{
      const data=await call('attendanceUnifiedSiteDetail',{
        sessionToken:sessionToken,
        date:ABIS_ESS_M72_STATE_.date,
        scopeCode:scope.code
      });
      return {ok:true,scope:scope,data:data};
    }catch(e){
      return {
        ok:false,
        scope:scope,
        error:e&&e.message?e.message:String(e)
      };
    }
  }));

  const bySite={};
  const errors=[];

  results.forEach(function(x){
    if(x.ok)bySite[x.scope.code]=x.data;
    else errors.push({
      scopeCode:x.scope.code,
      scopeLabel:abisEssM72ScopeLabel_(x.scope),
      error:x.error
    });
  });

  ABIS_ESS_M72_STATE_.bySite=bySite;
  ABIS_ESS_M72_STATE_.errors=errors;
  ABIS_ESS_M72_STATE_.loaded=true;
  ABIS_ESS_M72_STATE_.loading=false;

  if(triggerBtn && triggerBtn.isConnected)triggerBtn.disabled=false;
  if(accountPanel_==='attendanceManagement')renderMyAccount_();
}

function abisEssM72SetSite_(code){
  ABIS_ESS_M72_STATE_.site=String(code||'ALL');
  if(accountPanel_==='attendanceManagement')renderMyAccount_();
}

function abisEssM72SetType_(type){
  ABIS_ESS_M72_STATE_.type=String(type||'ALL');
  if(accountPanel_==='attendanceManagement')renderMyAccount_();
}

function abisEssM72Search_(){
  const el=$('abisM72Query');
  ABIS_ESS_M72_STATE_.query=el?el.value.trim():'';
  if(accountPanel_==='attendanceManagement')renderMyAccount_();
}

function abisEssM72OpenDetail_(encoded){
  let row=null;
  try{
    row=JSON.parse(decodeURIComponent(String(encoded||'')));
  }catch(e){row=null;}
  if(!row)return;
  ABIS_ESS_M72_STATE_.detail=row;
  ABIS_ESS_M72_STATE_.view='DETAIL';
  if(accountPanel_==='attendanceManagement'){
    renderMyAccount_();
    if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }
}

function abisEssM72BackToList_(){
  ABIS_ESS_M72_STATE_.view='LIST';
  ABIS_ESS_M72_STATE_.detail=null;
  if(accountPanel_==='attendanceManagement'){
    renderMyAccount_();
    if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
  }
}

function abisEssM72Time_(v){
  const s=String(v||'');
  const m=s.match(/(?:^|\s)(\d{1,2}:\d{2})(?::\d{2})?/);
  return m?m[1]:(s||'--');
}

function abisEssM72SummaryCard_(label,value,filter){
  const active=ABIS_ESS_M72_STATE_.type===filter;
  return '<button type="button" class="abis-m72-summary-card '+(active?'is-active':'')+'" '+
    'onclick="abisEssM72SetType_(\''+filter+'\')">'+
    '<b>'+escapeHtml(String(value||0))+'</b>'+
    '<span>'+escapeHtml(label)+'</span>'+
  '</button>';
}

function abisEssM72SiteTabsHtml_(){
  let html='<div class="abis-m72-site-tabs">';
  html+='<button type="button" class="'+(ABIS_ESS_M72_STATE_.site==='ALL'?'is-active':'')+
    '" onclick="abisEssM72SetSite_(\'ALL\')">'+escapeHtml(abisEssM72t_('allSites'))+'</button>';

  ABIS_ESS_M72_SCOPES_.forEach(function(s){
    html+='<button type="button" class="'+
      (ABIS_ESS_M72_STATE_.site===s.code?'is-active ':'')+
      (s.held?'is-held':'')+'" '+
      (s.held?'disabled ':'')+
      'onclick="abisEssM72SetSite_(\''+s.code+'\')">'+
      escapeHtml(abisEssM72ScopeLabel_(s))+
      (s.held?' · '+escapeHtml(abisEssM72t_('held')):'')+
    '</button>';
  });
  html+='</div>';
  return html;
}

function abisEssM72ErrorHtml_(){
  const errors=ABIS_ESS_M72_STATE_.errors||[];
  if(!errors.length)return '';
  return '<div class="abis-m72-error"><b>'+escapeHtml(abisEssM72t_('partialFailed'))+'</b>'+
    errors.map(x=>'<div>'+escapeHtml(x.scopeLabel)+'：'+escapeHtml(x.error||abisEssM72t_('failedSite'))+'</div>').join('')+
  '</div>';
}

function abisEssM72RowHtml_(r){
  const c=abisEssM72Classify_(r);
  const tags=[];
  if(c.missing)tags.push(abisEssM72t_('missingCard'));
  if(c.late)tags.push(abisEssM72t_('late'));
  if(c.early)tags.push(abisEssM72t_('earlyLeave'));
  if(c.leave)tags.push(abisEssM72t_('leave'));
  if(c.correction)tags.push(abisEssM72t_('correction'));
  if(c.other)tags.push(abisEssM72t_('other'));
  if(!tags.length)tags.push(r.status||abisEssM72t_('normal'));

  const payload=encodeURIComponent(JSON.stringify(r));

  return '<button type="button" class="abis-m72-case" onclick="abisEssM72OpenDetail_(\''+
    payload.replace(/'/g,'%27')+'\')">'+
    '<div class="abis-m72-case-head">'+
      '<div class="abis-m72-case-main">'+
        '<b>'+escapeHtml(r.name||r.employeeId||'')+'</b>'+
        '<span>'+escapeHtml(r.employeeId||'')+' · '+escapeHtml(r.scopeLabel||r.location||'')+'</span>'+
      '</div>'+
      '<span class="abis-m72-case-status">'+escapeHtml(tags.join(' / '))+'</span>'+
      '<span class="abis-m72-chevron">›</span>'+
    '</div>'+
    '<div class="abis-m72-case-meta">'+
      '<span><small>'+escapeHtml(abisEssM72t_('shift'))+'</small><b>'+escapeHtml(r.shiftName||r.shiftCode||'—')+'</b></span>'+
      '<span><small>'+escapeHtml(abisEssM72t_('expected'))+'</small><b>'+escapeHtml(r.expectedStart||'--')+' / '+escapeHtml(r.expectedEnd||'--')+'</b></span>'+
      '<span><small>'+escapeHtml(abisEssM72t_('actual'))+'</small><b>'+escapeHtml(abisEssM72Time_(r.firstIn))+' / '+escapeHtml(abisEssM72Time_(r.lastOut))+'</b></span>'+
    '</div>'+
  '</button>';
}

function abisEssM72ListHtml_(){
  const s=abisEssM72Summary_();
  const rows=abisEssM72FilteredRows_();

  const loading=ABIS_ESS_M72_STATE_.loading;
  const loaded=ABIS_ESS_M72_STATE_.loaded;

  let list='';
  if(loading && !loaded){
    list='<div class="abis-m72-loading">'+escapeHtml(abisEssM72t_('loading'))+'</div>';
  }else if(rows.length){
    list='<div class="abis-m72-list">'+rows.map(abisEssM72RowHtml_).join('')+'</div>';
  }else{
    list='<div class="abis-m72-empty"><b>'+escapeHtml(abisEssM72t_('empty'))+'</b>'+
      '<span>'+escapeHtml(abisEssM72t_('emptyHint'))+'</span></div>';
  }

  return '<div class="abis-m72-panel">'+
    '<div class="abis-m72-title-row">'+
      '<div><h3>'+escapeHtml(abisEssM72t_('attendanceManagement'))+'</h3>'+
        '<span class="abis-m72-readonly">'+escapeHtml(abisEssM72t_('readOnly'))+'</span></div>'+
      '<div class="abis-m72-date-wrap"><label>'+escapeHtml(abisEssM72t_('date'))+'</label>'+
        '<input id="abisM72Date" type="date" value="'+escapeHtml(ABIS_ESS_M72_STATE_.date)+'"></div>'+
    '</div>'+

    '<div class="abis-m72-toolbar">'+
      '<button type="button" class="abis-m72-refresh" onclick="abisEssM72Load_(this)">'+escapeHtml(abisEssM72t_('refresh'))+'</button>'+
      '<input id="abisM72Query" type="search" placeholder="'+escapeHtml(abisEssM72t_('searchPlaceholder'))+
        '" value="'+escapeHtml(ABIS_ESS_M72_STATE_.query)+'" '+
        'oninput="abisEssM72Search_()">'+
    '</div>'+

    abisEssM72SiteTabsHtml_()+

    '<div class="abis-m72-held-note">'+escapeHtml(abisEssM72t_('heldHint'))+'</div>'+

    '<div class="abis-m72-summary-grid">'+
      abisEssM72SummaryCard_(abisEssM72t_('affectedPeople'),s.people,'ALL')+
      abisEssM72SummaryCard_(abisEssM72t_('missingCard'),s.missing,'MISSING')+
      abisEssM72SummaryCard_(abisEssM72t_('late'),s.late,'LATE')+
      abisEssM72SummaryCard_(abisEssM72t_('earlyLeave'),s.early,'EARLY')+
      abisEssM72SummaryCard_(abisEssM72t_('leave'),s.leave,'LEAVE')+
      abisEssM72SummaryCard_(abisEssM72t_('correction'),s.correction,'CORRECTION')+
    '</div>'+

    abisEssM72ErrorHtml_()+
    list+
    '<div class="abis-m72-source-note">'+escapeHtml(abisEssM72t_('sourceNote'))+'</div>'+
  '</div>';
}

function abisEssM72DetailHtml_(){
  const r=ABIS_ESS_M72_STATE_.detail;
  if(!r)return abisEssM72ListHtml_();

  const c=abisEssM72Classify_(r);

  let extra='';
  if(r.leave){
    extra+='<section class="abis-m72-detail-card"><h4>'+escapeHtml(abisEssM72t_('leave'))+'</h4>'+
      '<div class="abis-m72-detail-grid">'+
        abisEssM72DetailItem_(abisEssM72t_('status'),r.leave.leaveType||'請假')+
        abisEssM72DetailItem_(abisEssM72t_('leaveHours'),String(r.leave.leaveHours||0)+' HR')+
        abisEssM72DetailItem_(abisEssM72t_('proxy'),r.leave.proxyName||r.leave.proxyId||'—')+
      '</div></section>';
  }

  if(r.correction){
    extra+='<section class="abis-m72-detail-card"><h4>'+escapeHtml(abisEssM72t_('correction'))+'</h4>'+
      '<div class="abis-m72-detail-grid">'+
        abisEssM72DetailItem_('Request ID',r.correction.correctionRequestId||'')+
        abisEssM72DetailItem_(abisEssM72t_('status'),r.correction.status||'')+
        abisEssM72DetailItem_('Request Type',r.correction.requestType||'')+
      '</div>'+
      '<div class="abis-m72-next-note">'+escapeHtml(abisEssM72t_('readOnly'))+' — '+escapeHtml(abisEssM72t_('viewCorrection'))+'</div>'+
    '</section>';
  }else if((r.exceptionCodes||[]).length){
    extra+='<div class="abis-m72-pending-note">'+escapeHtml(abisEssM72t_('pendingEmployee'))+'</div>';
  }

  return '<div class="abis-m72-panel">'+
    '<button type="button" class="abis-m72-back" onclick="abisEssM72BackToList_()">‹ '+escapeHtml(abisEssM72t_('backList'))+'</button>'+
    '<div class="abis-m72-detail-hero">'+
      '<div><h3>'+escapeHtml(r.name||'')+'</h3><span>'+escapeHtml(r.employeeId||'')+' · '+escapeHtml(r.scopeLabel||r.location||'')+'</span></div>'+
      '<span class="abis-m72-case-status">'+escapeHtml(r.status||'—')+'</span>'+
    '</div>'+
    '<section class="abis-m72-detail-card"><h4>'+escapeHtml(abisEssM72t_('detail'))+'</h4>'+
      '<div class="abis-m72-detail-grid">'+
        abisEssM72DetailItem_(abisEssM72t_('date'),r.date||ABIS_ESS_M72_STATE_.date)+
        abisEssM72DetailItem_(abisEssM72t_('site'),r.scopeLabel||r.location||'')+
        abisEssM72DetailItem_(abisEssM72t_('shift'),r.shiftName||r.shiftCode||'—')+
        abisEssM72DetailItem_(abisEssM72t_('expected'),(r.expectedStart||'--')+' / '+(r.expectedEnd||'--'))+
        abisEssM72DetailItem_(abisEssM72t_('actual'),abisEssM72Time_(r.firstIn)+' / '+abisEssM72Time_(r.lastOut))+
        abisEssM72DetailItem_(abisEssM72t_('exceptionCodes'),(r.exceptionCodes||[]).join(' / ')||'—')+
      '</div>'+
    '</section>'+
    extra+
    '<div class="abis-m72-source-note">'+escapeHtml(abisEssM72t_('sourceNote'))+'</div>'+
  '</div>';
}

function abisEssM72DetailItem_(label,value){
  return '<div class="abis-m72-detail-item"><span>'+escapeHtml(label)+'</span><b>'+escapeHtml(value==null?'':String(value))+'</b></div>';
}

function abisEssM72PanelHtml_(){
  if(!abisEssM72CanManage_()){
    return '<div class="abis-m72-error"><b>'+escapeHtml(abisEssM72t_('noPermission'))+'</b></div>';
  }
  return ABIS_ESS_M72_STATE_.view==='DETAIL' ? abisEssM72DetailHtml_() : abisEssM72ListHtml_();
}

/* --------------------------------------------------------------------------
 * Management Tools integration
 * ------------------------------------------------------------------------ */

function abisEssM72ManagementToolsHtml_(){
  let html='';

  if(typeof abisEssM2HasHrTools_==='function' && abisEssM2HasHrTools_()){
    let body='';
    body+=abisEssM2ToolButton_(abisEssM72t_('employeeManagement'),"rc2OpenAccountPanel_('employeeManagement')");
    body+=abisEssM2ToolButton_(abisEssM72t_('accountManagement'),'openHrCredentialAdmin()');
    body+=abisEssM2ToolButton_(abisEssM72t_('attendanceManagement'),"rc2OpenAccountPanel_('attendanceManagement')");
    html+=abisEssM2ToolGroup_(abisEssM72t_('hrTools'),body);
  }

  if(typeof abisEssM2HasSupervisorTools_==='function' && abisEssM2HasSupervisorTools_()){
    const d=homeData&&homeData.leaveDashboard?homeData.leaveDashboard:{};
    const label=d.isTopApprover?tr('companyDashboard'):abisEssM72t_('leaveOverview');
    html+=abisEssM2ToolGroup_(
      abisEssM72t_('supervisorTools'),
      abisEssM2ToolButton_(label,'refreshDashboard()')
    );
  }

  if(typeof abisEssM2HasPlannerTools_==='function' && abisEssM2HasPlannerTools_()){
    html+=abisEssM2ToolGroup_(
      abisEssM72t_('plannerTools'),
      abisEssM2ToolButton_(
        abisEssM72t_('scheduleManagement'),
        'openFactoryWeeklyRestManagement_()'
      )
    );
  }

  return html || '<div class="muted">'+escapeHtml(abisEssM72t_('noTools'))+'</div>';
}

rc2ManagementToolsHtml_=abisEssM72ManagementToolsHtml_;

const ABIS_ESS_M72_BASE_ACCOUNT_PANEL_HTML_=
  typeof rc2AccountPanelHtml_==='function'?rc2AccountPanelHtml_:null;

if(ABIS_ESS_M72_BASE_ACCOUNT_PANEL_HTML_){
  rc2AccountPanelHtml_=function(panel){
    if(String(panel||'')==='attendanceManagement'){
      return '<div class="rc2-account-panel abis-m72-root">'+abisEssM72PanelHtml_()+'</div>';
    }
    return ABIS_ESS_M72_BASE_ACCOUNT_PANEL_HTML_.apply(this,arguments);
  };
}

const ABIS_ESS_M72_BASE_OPEN_ACCOUNT_PANEL_=
  typeof rc2OpenAccountPanel_==='function'?rc2OpenAccountPanel_:null;

if(ABIS_ESS_M72_BASE_OPEN_ACCOUNT_PANEL_){
  rc2OpenAccountPanel_=function(panel){
    const p=String(panel||'');
    if(p==='attendanceManagement'){
      if(!abisEssM72CanManage_()){
        message(abisEssM72t_('noPermission'));
        return;
      }
      ABIS_ESS_M72_STATE_.view='LIST';
    }

    const out=ABIS_ESS_M72_BASE_OPEN_ACCOUNT_PANEL_.apply(this,arguments);

    if(p==='attendanceManagement' && !ABIS_ESS_M72_STATE_.loaded){
      setTimeout(function(){abisEssM72Load_(null)},0);
    }
    return out;
  };
}

const ABIS_ESS_M72_BASE_INNER_TITLE_=
  typeof rc2InnerTitleForSection_==='function'?rc2InnerTitleForSection_:null;

if(ABIS_ESS_M72_BASE_INNER_TITLE_){
  rc2InnerTitleForSection_=function(id){
    if(id==='account' && String(accountPanel_||'')==='attendanceManagement'){
      return ABIS_ESS_M72_STATE_.view==='DETAIL' ?
        abisEssM72t_('detail') :
        abisEssM72t_('attendanceManagement');
    }
    return ABIS_ESS_M72_BASE_INNER_TITLE_.apply(this,arguments);
  };
}

const ABIS_ESS_M72_BASE_INNER_BACK_=
  typeof rc2InnerBack_==='function'?rc2InnerBack_:null;

if(ABIS_ESS_M72_BASE_INNER_BACK_){
  rc2InnerBack_=function(){
    const id=typeof rc2VisibleInnerSection_==='function'?rc2VisibleInnerSection_():'';

    if(id==='account' && String(accountPanel_||'')==='attendanceManagement'){
      if(ABIS_ESS_M72_STATE_.view==='DETAIL'){
        abisEssM72BackToList_();
        return;
      }
      accountPanel_='management';
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
      return;
    }

    return ABIS_ESS_M72_BASE_INNER_BACK_.apply(this,arguments);
  };
}

/* --------------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------------ */

function abisEssM72InstallStyles_(){
  if(document.getElementById('abisEssM72Style'))return;

  const style=document.createElement('style');
  style.id='abisEssM72Style';
  style.textContent=`
    .abis-m72-root{
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    .abis-m72-panel{
      display:grid;
      gap:14px;
      min-width:0;
    }

    .abis-m72-title-row{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:12px;
    }

    .abis-m72-title-row h3,
    .abis-m72-detail-hero h3{
      margin:0;
      color:var(--abis-ui-text-strong,#142640);
    }

    .abis-m72-readonly{
      display:inline-flex;
      margin-top:6px;
      padding:4px 10px;
      border-radius:999px;
      background:#eef4fb;
      color:#455d75;
      font-size:12px;
      font-weight:850;
    }

    .abis-m72-date-wrap{
      min-width:142px;
    }

    .abis-m72-date-wrap label{
      display:block;
      margin:0 0 4px;
      color:#53677e;
      font-size:12px;
      font-weight:800;
    }

    .abis-m72-date-wrap input{
      min-height:44px;
      margin:0;
    }

    .abis-m72-toolbar{
      display:grid;
      grid-template-columns:auto minmax(0,1fr);
      gap:10px;
      align-items:center;
    }

    .abis-m72-toolbar input{
      min-width:0;
      min-height:48px;
      margin:0;
    }

    .abis-m72-refresh,
    .abis-m72-back{
      min-height:48px!important;
      padding:11px 18px!important;
      border-radius:14px!important;
      background:#1768e8!important;
      color:#fff!important;
      font-weight:850!important;
      white-space:nowrap;
    }

    .abis-m72-site-tabs{
      display:flex;
      gap:8px;
      overflow-x:auto;
      padding-bottom:2px;
      scrollbar-width:none;
    }

    .abis-m72-site-tabs::-webkit-scrollbar{display:none}

    .abis-m72-site-tabs button{
      flex:0 0 auto;
      min-height:44px!important;
      padding:9px 15px!important;
      border:1px solid #d4e0eb!important;
      border-radius:999px!important;
      background:#fff!important;
      color:#203750!important;
      font-weight:850!important;
    }

    .abis-m72-site-tabs button.is-active{
      border-color:#1768e8!important;
      background:#1768e8!important;
      color:#fff!important;
    }

    .abis-m72-site-tabs button.is-held{
      opacity:1!important;
      background:#eef2f6!important;
      color:#66788b!important;
      border-color:#d6dee7!important;
    }

    .abis-m72-held-note,
    .abis-m72-source-note{
      padding:11px 13px;
      border-radius:12px;
      background:#f8fafc;
      color:#53677e;
      font-size:13px;
      line-height:1.55;
    }

    .abis-m72-held-note{
      border-left:4px solid #94a3b8;
    }

    .abis-m72-summary-grid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:8px;
    }

    .abis-m72-summary-card{
      min-width:0!important;
      min-height:82px!important;
      display:grid!important;
      align-content:center!important;
      gap:4px!important;
      margin:0!important;
      padding:10px 8px!important;
      border:1px solid #dce6ef!important;
      border-radius:14px!important;
      background:#fff!important;
      color:#142640!important;
      text-align:center!important;
      box-shadow:0 2px 10px rgba(31,55,86,.04)!important;
    }

    .abis-m72-summary-card b{
      color:#1768e8;
      font-size:24px;
      line-height:1;
    }

    .abis-m72-summary-card span{
      color:#425a73;
      font-size:12px;
      font-weight:800;
      line-height:1.25;
    }

    .abis-m72-summary-card.is-active{
      background:#1768e8!important;
      color:#fff!important;
      border-color:#1768e8!important;
    }

    .abis-m72-summary-card.is-active b,
    .abis-m72-summary-card.is-active span{
      color:#fff!important;
    }

    .abis-m72-error{
      display:grid;
      gap:5px;
      padding:12px 14px;
      border:1px solid #fecaca;
      border-radius:12px;
      background:#fef2f2;
      color:#991b1b;
      line-height:1.45;
    }

    .abis-m72-list{
      display:grid;
      gap:10px;
    }

    .abis-m72-case{
      width:100%!important;
      min-width:0!important;
      display:grid!important;
      gap:10px!important;
      margin:0!important;
      padding:14px!important;
      border:1px solid #dce6ef!important;
      border-radius:16px!important;
      background:#fff!important;
      color:#142640!important;
      text-align:left!important;
      box-shadow:0 3px 12px rgba(31,55,86,.05)!important;
    }

    .abis-m72-case-head{
      min-width:0;
      display:grid;
      grid-template-columns:minmax(0,1fr) auto 18px;
      align-items:center;
      gap:10px;
    }

    .abis-m72-case-main{
      min-width:0;
      display:grid;
      gap:3px;
    }

    .abis-m72-case-main b{
      overflow:hidden;
      color:#142640;
      font-size:17px;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    .abis-m72-case-main span{
      overflow:hidden;
      color:#53677e;
      font-size:13px;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    .abis-m72-case-status{
      display:inline-flex;
      align-items:center;
      max-width:180px;
      padding:5px 9px;
      border-radius:999px;
      background:#fff4e5;
      color:#8a4b08;
      font-size:12px;
      font-weight:850;
      line-height:1.3;
      text-align:center;
    }

    .abis-m72-chevron{
      color:#60758b;
      font-size:24px;
    }

    .abis-m72-case-meta{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:8px;
    }

    .abis-m72-case-meta span{
      min-width:0;
      display:grid;
      gap:3px;
      padding:9px 10px;
      border-radius:10px;
      background:#f8fafc;
    }

    .abis-m72-case-meta small{
      color:#60758b;
      font-size:11px;
      font-weight:750;
    }

    .abis-m72-case-meta b{
      min-width:0;
      color:#172238;
      font-size:13px;
      overflow-wrap:anywhere;
    }

    .abis-m72-empty,
    .abis-m72-loading{
      display:grid;
      gap:5px;
      padding:26px 16px;
      border:1px dashed #ccd8e3;
      border-radius:16px;
      background:#fff;
      color:#53677e;
      text-align:center;
    }

    .abis-m72-empty b{
      color:#22384f;
    }

    .abis-m72-detail-hero{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      padding:14px;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
    }

    .abis-m72-detail-hero div{
      min-width:0;
    }

    .abis-m72-detail-hero span:not(.abis-m72-case-status){
      color:#53677e;
      font-size:13px;
    }

    .abis-m72-detail-card{
      overflow:hidden;
      border:1px solid #dce6ef;
      border-radius:16px;
      background:#fff;
    }

    .abis-m72-detail-card h4{
      margin:0;
      padding:12px 14px;
      border-bottom:1px solid #e8eef4;
      background:#f8fafc;
      color:#263e57;
    }

    .abis-m72-detail-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
    }

    .abis-m72-detail-item{
      min-width:0;
      display:grid;
      gap:4px;
      padding:11px 14px;
      border-bottom:1px solid #edf1f5;
      border-right:1px solid #edf1f5;
    }

    .abis-m72-detail-item:nth-child(even){
      border-right:0;
    }

    .abis-m72-detail-item span{
      color:#60758b;
      font-size:12px;
    }

    .abis-m72-detail-item b{
      color:#172238;
      font-size:14px;
      overflow-wrap:anywhere;
    }

    .abis-m72-pending-note,
    .abis-m72-next-note{
      padding:11px 13px;
      border-radius:12px;
      background:#fff8e8;
      color:#7c4a03;
      font-size:13px;
      font-weight:750;
    }

    @media(max-width:767px){
      .abis-m72-title-row{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
      }

      .abis-m72-title-row h3,
      .abis-m72-detail-hero h3{
        font-size:22px;
      }

      .abis-m72-date-wrap{
        min-width:138px;
      }

      .abis-m72-date-wrap input{
        min-height:48px;
        font-size:16px;
      }

      .abis-m72-toolbar{
        grid-template-columns:112px minmax(0,1fr);
      }

      .abis-m72-refresh,
      .abis-m72-back{
        min-height:48px!important;
        padding:11px 16px!important;
        font-size:16px!important;
      }

      .abis-m72-site-tabs button{
        min-height:48px!important;
        padding:10px 16px!important;
        font-size:15px!important;
      }

      .abis-m72-summary-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .abis-m72-summary-card{
        min-height:88px!important;
      }

      .abis-m72-summary-card b{
        font-size:27px;
      }

      .abis-m72-summary-card span{
        font-size:14px;
      }

      .abis-m72-case{
        padding:14px!important;
      }

      .abis-m72-case-head{
        grid-template-columns:minmax(0,1fr) 18px;
      }

      .abis-m72-case-status{
        grid-column:1 / -1;
        justify-self:start;
        max-width:100%;
      }

      .abis-m72-case-main b{
        font-size:19px;
      }

      .abis-m72-case-main span{
        font-size:14px;
      }

      .abis-m72-case-meta{
        grid-template-columns:1fr;
      }

      .abis-m72-case-meta small{
        font-size:13px;
      }

      .abis-m72-case-meta b{
        font-size:15px;
      }

      .abis-m72-detail-hero{
        align-items:flex-start;
      }

      .abis-m72-detail-grid{
        grid-template-columns:1fr;
      }

      .abis-m72-detail-item{
        border-right:0;
      }

      .abis-m72-detail-item span{
        font-size:14px;
      }

      .abis-m72-detail-item b{
        font-size:16px;
      }
    }
  `;
  document.head.appendChild(style);
}

abisEssM72InstallStyles_();

/* --------------------------------------------------------------------------
 * Diagnostics
 * ------------------------------------------------------------------------ */

async function abisEssM72ApiSmoke_(){
  if(!sessionToken)return {ok:false,version:ABIS_ESS_M7_2A_VERSION_,error:'NO_SESSION'};
  if(!abisEssM72CanManage_())return {ok:false,version:ABIS_ESS_M7_2A_VERSION_,error:'NO_HR_ADMIN_PERMISSION'};

  const date=ABIS_ESS_M72_STATE_.date || abisEssM72Today_();
  const sites=[];

  for(const s of ABIS_ESS_M72_SCOPES_.filter(x=>!x.held)){
    try{
      const d=await call('attendanceUnifiedSiteDetail',{
        sessionToken:sessionToken,
        date:date,
        scopeCode:s.code
      });
      sites.push({
        scopeCode:s.code,
        ok:true,
        rowCount:Number(d&&d.rowCount||0),
        date:d&&d.date||''
      });
    }catch(e){
      sites.push({
        scopeCode:s.code,
        ok:false,
        error:e&&e.message?e.message:String(e)
      });
    }
  }

  return {
    ok:sites.every(x=>x.ok),
    version:ABIS_ESS_M7_2A_VERSION_,
    date:date,
    activeSites:['XINDIAN','OFFICE'],
    heldSites:['CHANGBIN'],
    sites:sites,
    writesPerformed:0
  };
}

function abisEssM72Preflight_(){
  const m35=typeof abisEssM35Preflight_==='function'?abisEssM35Preflight_():null;
  const managementHtml=typeof rc2ManagementToolsHtml_==='function'?rc2ManagementToolsHtml_():'';

  const out={
    ok:true,
    version:ABIS_ESS_M7_2A_VERSION_,
    canManage:abisEssM72CanManage_(),
    readOnly:true,
    activeSites:['XINDIAN','OFFICE'],
    heldSites:['CHANGBIN'],
    entryWired:String(managementHtml).indexOf('attendanceManagement')>=0,
    dependencies:{
      m1:typeof abisEssIsMobileUi_==='function',
      m2:typeof abisEssM2HasManagementTools_==='function',
      m71:typeof abisEssM71Preflight_==='function',
      m35:typeof abisEssM35Preflight_==='function',
      m351:typeof abisEssM351VisibleOverflowAudit_==='function'
    },
    layout:{
      m35Ok:m35?!!m35.ok:null,
      horizontalOverflow:m35&&m35.layout?m35.layout.horizontalOverflow:null
    },
    functions:{
      load:typeof abisEssM72Load_==='function',
      apiSmoke:typeof abisEssM72ApiSmoke_==='function'
    }
  };

  out.ok=
    out.readOnly===true &&
    out.dependencies.m1===true &&
    out.dependencies.m2===true &&
    out.dependencies.m71===true &&
    out.dependencies.m35===true &&
    out.dependencies.m351===true &&
    out.functions.load===true &&
    out.functions.apiSmoke===true &&
    (!out.canManage || out.entryWired) &&
    (out.layout.m35Ok===true || out.layout.m35Ok===null) &&
    out.layout.horizontalOverflow!==true;

  window.ABIS_ESS_M7_2A=out;
  return out;
}

try{
  window.ABIS_ESS_M7_2A=abisEssM72Preflight_();
}catch(ignore){}




/* ==========================================================================
 * ABIS ESS M7 INTEGRATED EXTENSIONS
 * Leave Management / Team Management / Management Reports
 * Version: ABIS_ESS_M7_INTEGRATED_RC1_20261005
 * ======================================================================= */

const ABIS_ESS_M7_INTEGRATED_VERSION_ =
  'ABIS_ESS_M7_INTEGRATED_RC1_20261005';

const ABIS_ESS_M7X_I18N_ = {
  ZH:{
    hrTools:'HR 工具',supervisorTools:'主管工具',plannerTools:'生管工具',
    employeeManagement:'員工管理',accountManagement:'帳號管理',attendanceManagement:'出勤管理',leaveManagement:'請假管理',managementReports:'管理報表',
    leaveApproval:'請假簽核',teamManagement:'團隊管理',scheduleManagement:'班表管理',
    noTools:'目前沒有可使用的管理工具',readOnly:'唯讀',month:'月份',refresh:'重新整理',search:'搜尋',clear:'清除',
    searchPerson:'搜尋姓名、員工編號或假單編號',allStatus:'全部狀態',allDepartment:'全部部門',allLocation:'全部工作地點',
    totalRequests:'假單筆數',uniquePeople:'請假人數',pending:'處理中',approved:'已核准',returned:'已退回',hours:'時數',
    noLeave:'目前沒有符合條件的假單',leaveDetail:'假單詳情',backLeave:'返回請假清單',leaveType:'假別',period:'請假期間',status:'狀態',employee:'員工',department:'部門',location:'工作地點',proxy:'代理人',reason:'事由',handover:'代理工作說明',evidence:'證明狀態',approvalHistory:'簽核歷程',
    loading:'資料載入中…',loadFailed:'資料載入失敗',retry:'重新載入',sourceNote:'本頁僅讀取正式資料來源，不在管理頁直接修改業務資料。',
    directTeam:'直屬團隊',directReportCount:'直屬人數',leaveCount:'請假筆數',attendanceException:'出勤異常',missingPunch:'缺卡',formalShift:'正式班別',personType:'人員類別',noTeam:'目前沒有直屬團隊資料',teamDetail:'團隊成員資料',backTeam:'返回團隊清單',
    reportsTitle:'管理報表',reportsRange:'報表期間',attendanceReport:'出勤報表',leaveReport:'請假報表',employeeChangeReport:'員工異動／離職',assetReport:'公司資產',taskReport:'待辦／處理狀況',
    exceptionDays:'異常筆數',missing:'缺卡',late:'遲到',early:'早退',newHire:'新進',termination:'離職',assetTotal:'資產筆數',taskTotal:'待辦筆數',sourceUnavailable:'資料來源未接入',reportDetail:'報表明細',backReports:'返回管理報表',noReportRows:'目前沒有符合期間的明細',
    contactHrBoundary:'聯絡 HR 維持官方 LINE 對話；「我的詢問」尚無正式 Workflow / SSOT，因此本版不建立假資料。'
  },
  VI:{
    hrTools:'Công cụ HR',supervisorTools:'Công cụ quản lý',plannerTools:'Công cụ điều độ',
    employeeManagement:'Quản lý nhân viên',accountManagement:'Quản lý tài khoản',attendanceManagement:'Quản lý chấm công',leaveManagement:'Quản lý nghỉ phép',managementReports:'Báo cáo quản lý',
    leaveApproval:'Phê duyệt nghỉ phép',teamManagement:'Quản lý đội nhóm',scheduleManagement:'Quản lý lịch làm việc',
    noTools:'Hiện không có công cụ quản lý khả dụng',readOnly:'Chỉ xem',month:'Tháng',refresh:'Làm mới',search:'Tìm kiếm',clear:'Xóa',
    searchPerson:'Tìm tên, mã nhân viên hoặc mã đơn',allStatus:'Tất cả trạng thái',allDepartment:'Tất cả bộ phận',allLocation:'Tất cả địa điểm',
    totalRequests:'Số đơn',uniquePeople:'Số người nghỉ',pending:'Đang xử lý',approved:'Đã duyệt',returned:'Trả lại',hours:'Giờ',
    noLeave:'Không có đơn phù hợp',leaveDetail:'Chi tiết đơn nghỉ',backLeave:'Quay lại danh sách nghỉ',leaveType:'Loại nghỉ',period:'Thời gian nghỉ',status:'Trạng thái',employee:'Nhân viên',department:'Bộ phận',location:'Địa điểm',proxy:'Người thay thế',reason:'Lý do',handover:'Bàn giao công việc',evidence:'Trạng thái chứng từ',approvalHistory:'Lịch sử phê duyệt',
    loading:'Đang tải dữ liệu…',loadFailed:'Không thể tải dữ liệu',retry:'Tải lại',sourceNote:'Trang này chỉ đọc nguồn dữ liệu chính thức và không sửa dữ liệu nghiệp vụ trực tiếp.',
    directTeam:'Đội trực tiếp',directReportCount:'Số nhân viên trực tiếp',leaveCount:'Số đơn nghỉ',attendanceException:'Bất thường chấm công',missingPunch:'Thiếu chấm công',formalShift:'Ca chính thức',personType:'Loại nhân viên',noTeam:'Không có dữ liệu đội trực tiếp',teamDetail:'Thông tin thành viên',backTeam:'Quay lại danh sách đội',
    reportsTitle:'Báo cáo quản lý',reportsRange:'Kỳ báo cáo',attendanceReport:'Báo cáo chấm công',leaveReport:'Báo cáo nghỉ phép',employeeChangeReport:'Biến động nhân sự / nghỉ việc',assetReport:'Tài sản công ty',taskReport:'Tình trạng công việc',
    exceptionDays:'Bất thường',missing:'Thiếu chấm công',late:'Đi trễ',early:'Về sớm',newHire:'Nhân viên mới',termination:'Nghỉ việc',assetTotal:'Số tài sản',taskTotal:'Số công việc',sourceUnavailable:'Nguồn dữ liệu chưa kết nối',reportDetail:'Chi tiết báo cáo',backReports:'Quay lại báo cáo',noReportRows:'Không có dữ liệu chi tiết trong kỳ',
    contactHrBoundary:'Liên hệ HR tiếp tục qua LINE chính thức; “Câu hỏi của tôi” chưa có Workflow / SSOT chính thức nên bản này không tạo dữ liệu giả.'
  },
  TH:{
    hrTools:'เครื่องมือ HR',supervisorTools:'เครื่องมือหัวหน้างาน',plannerTools:'เครื่องมือวางแผนการผลิต',
    employeeManagement:'จัดการพนักงาน',accountManagement:'จัดการบัญชี',attendanceManagement:'จัดการเวลาทำงาน',leaveManagement:'จัดการการลา',managementReports:'รายงานการจัดการ',
    leaveApproval:'อนุมัติการลา',teamManagement:'จัดการทีม',scheduleManagement:'จัดการตารางงาน',
    noTools:'ขณะนี้ไม่มีเครื่องมือจัดการ',readOnly:'ดูอย่างเดียว',month:'เดือน',refresh:'โหลดใหม่',search:'ค้นหา',clear:'ล้าง',
    searchPerson:'ค้นหาชื่อ รหัสพนักงาน หรือเลขใบลา',allStatus:'ทุกสถานะ',allDepartment:'ทุกแผนก',allLocation:'ทุกสถานที่',
    totalRequests:'จำนวนใบลา',uniquePeople:'จำนวนผู้ลา',pending:'กำลังดำเนินการ',approved:'อนุมัติแล้ว',returned:'ส่งกลับ',hours:'ชั่วโมง',
    noLeave:'ไม่พบใบลาตามเงื่อนไข',leaveDetail:'รายละเอียดใบลา',backLeave:'กลับไปรายการลา',leaveType:'ประเภทการลา',period:'ช่วงเวลา',status:'สถานะ',employee:'พนักงาน',department:'แผนก',location:'สถานที่',proxy:'ผู้แทน',reason:'เหตุผล',handover:'การส่งมอบงาน',evidence:'สถานะหลักฐาน',approvalHistory:'ประวัติอนุมัติ',
    loading:'กำลังโหลดข้อมูล…',loadFailed:'โหลดข้อมูลไม่สำเร็จ',retry:'โหลดใหม่',sourceNote:'หน้านี้อ่านเฉพาะแหล่งข้อมูลทางการและไม่แก้ไขข้อมูลธุรกิจโดยตรง',
    directTeam:'ทีมโดยตรง',directReportCount:'จำนวนผู้ใต้บังคับบัญชา',leaveCount:'จำนวนใบลา',attendanceException:'ความผิดปกติการลงเวลา',missingPunch:'ขาดการลงเวลา',formalShift:'กะทางการ',personType:'ประเภทพนักงาน',noTeam:'ไม่มีข้อมูลทีมโดยตรง',teamDetail:'ข้อมูลสมาชิกทีม',backTeam:'กลับไปรายการทีม',
    reportsTitle:'รายงานการจัดการ',reportsRange:'ช่วงรายงาน',attendanceReport:'รายงานเวลา',leaveReport:'รายงานการลา',employeeChangeReport:'การเปลี่ยนแปลงพนักงาน/ลาออก',assetReport:'ทรัพย์สินบริษัท',taskReport:'สถานะงาน',
    exceptionDays:'รายการผิดปกติ',missing:'ขาดการลงเวลา',late:'มาสาย',early:'กลับก่อน',newHire:'เข้าใหม่',termination:'ลาออก',assetTotal:'จำนวนทรัพย์สิน',taskTotal:'จำนวนงาน',sourceUnavailable:'ยังไม่ได้เชื่อมแหล่งข้อมูล',reportDetail:'รายละเอียดรายงาน',backReports:'กลับไปรายงาน',noReportRows:'ไม่มีรายละเอียดในช่วงนี้',
    contactHrBoundary:'การติดต่อ HR ยังคงผ่าน LINE ทางการ และ “คำถามของฉัน” ยังไม่มี Workflow / SSOT ทางการ ดังนั้นเวอร์ชันนี้จะไม่สร้างข้อมูลจำลอง'
  }
};

function abisEssM7xt_(k){
  const lang=ABIS_ESS_M7X_I18N_[currentLang]?currentLang:'ZH';
  return ABIS_ESS_M7X_I18N_[lang][k]||ABIS_ESS_M7X_I18N_.ZH[k]||k;
}


/* ==========================================================================
 * M7 Leave Approval History localization
 * Version: ABIS_ESS_M7_APPROVAL_HISTORY_I18N_RC1_20261006
 * Presentation only. Backend audit codes remain authoritative and unchanged.
 * ======================================================================= */
const ABIS_ESS_M7_APPROVAL_HISTORY_VERSION_='ABIS_ESS_M7_APPROVAL_HISTORY_I18N_RC1_20261006';
const ABIS_ESS_M7_APPROVAL_I18N_={
  ZH:{
    historyTitle:'簽核歷程',
    action:{
      SUBMIT:'送出申請',
      RESUBMIT:'重新送出',
      GROUP_RESUBMIT_NO_CHANGE:'重新確認送出',
      ACCEPT:'代理人接受',
      AUTO_ACCEPT:'代理人自動接受',
      ASSIGN_PROXY:'指派代理人',
      APPROVE:'核准',
      PREAPPROVE:'預核',
      GROUP_CONFIRM:'群組確認',
      RETURN:'退回補正',
      REJECT:'駁回',
      WITHDRAW:'撤回',
      CANCEL:'取消'
    },
    role:{
      EMPLOYEE:'申請人',
      PROXY:'代理人',
      MANAGER:'直屬主管',
      TOP_MANAGER:'最高主管',
      HR:'HR',
      ADMIN:'系統管理員',
      SYSTEM:'系統'
    },
    unknownAction:'系統流程',
    unknownRole:'系統角色'
  },
  VI:{
    historyTitle:'Lịch sử phê duyệt',
    action:{
      SUBMIT:'Gửi đơn',
      RESUBMIT:'Gửi lại',
      GROUP_RESUBMIT_NO_CHANGE:'Xác nhận gửi lại',
      ACCEPT:'Người đại diện chấp nhận',
      AUTO_ACCEPT:'Người đại diện được tự động chấp nhận',
      ASSIGN_PROXY:'Chỉ định người đại diện',
      APPROVE:'Phê duyệt',
      PREAPPROVE:'Phê duyệt trước',
      GROUP_CONFIRM:'Xác nhận nhóm',
      RETURN:'Trả lại để bổ sung',
      REJECT:'Từ chối',
      WITHDRAW:'Rút đơn',
      CANCEL:'Hủy'
    },
    role:{
      EMPLOYEE:'Người nộp đơn',
      PROXY:'Người đại diện',
      MANAGER:'Quản lý trực tiếp',
      TOP_MANAGER:'Quản lý cấp cao nhất',
      HR:'HR',
      ADMIN:'Quản trị hệ thống',
      SYSTEM:'Hệ thống'
    },
    unknownAction:'Quy trình hệ thống',
    unknownRole:'Vai trò hệ thống'
  },
  TH:{
    historyTitle:'ประวัติการอนุมัติ',
    action:{
      SUBMIT:'ส่งคำขอ',
      RESUBMIT:'ส่งใหม่',
      GROUP_RESUBMIT_NO_CHANGE:'ยืนยันการส่งใหม่',
      ACCEPT:'ผู้รับมอบหมายยอมรับ',
      AUTO_ACCEPT:'ระบบยอมรับผู้รับมอบหมายอัตโนมัติ',
      ASSIGN_PROXY:'มอบหมายผู้แทน',
      APPROVE:'อนุมัติ',
      PREAPPROVE:'อนุมัติล่วงหน้า',
      GROUP_CONFIRM:'ยืนยันกลุ่ม',
      RETURN:'ส่งกลับเพื่อแก้ไข',
      REJECT:'ปฏิเสธ',
      WITHDRAW:'ถอนคำขอ',
      CANCEL:'ยกเลิก'
    },
    role:{
      EMPLOYEE:'ผู้ยื่นคำขอ',
      PROXY:'ผู้รับมอบหมาย',
      MANAGER:'หัวหน้างานโดยตรง',
      TOP_MANAGER:'ผู้บริหารสูงสุด',
      HR:'HR',
      ADMIN:'ผู้ดูแลระบบ',
      SYSTEM:'ระบบ'
    },
    unknownAction:'ขั้นตอนระบบ',
    unknownRole:'บทบาทระบบ'
  }
};
function abisEssM7BoundUiLang_(){
  let lang='';
  try{
    const preferred=homeData&&homeData.employee&&homeData.employee.preferredLanguage;
    if(preferred&&typeof preferredLanguageToUi_==='function')lang=preferredLanguageToUi_(preferred);
  }catch(ignore){}
  if(!['ZH','VI','TH'].includes(lang))lang=['ZH','VI','TH'].includes(currentLang)?currentLang:'ZH';
  return lang;
}
function abisEssM7ApprovalDict_(){
  const lang=abisEssM7BoundUiLang_();
  return ABIS_ESS_M7_APPROVAL_I18N_[lang]||ABIS_ESS_M7_APPROVAL_I18N_.ZH;
}
function abisEssM7ApprovalActionLabel_(action){
  const dict=abisEssM7ApprovalDict_();
  const code=String(action||'').trim().toUpperCase();
  return dict.action[code]||dict.unknownAction;
}
function abisEssM7ApprovalRoleLabel_(role){
  const dict=abisEssM7ApprovalDict_();
  const code=String(role||'').trim().toUpperCase();
  return dict.role[code]||dict.unknownRole;
}
function abisEssM7ApprovalHistoryHtml_(approvals){
  const rows=Array.isArray(approvals)?approvals:[];
  if(!rows.length)return '';
  const dict=abisEssM7ApprovalDict_();
  const body=rows.map(function(a){
    const action=abisEssM7ApprovalActionLabel_(a.action||a.result||a.stage);
    const role=abisEssM7ApprovalRoleLabel_(a.role);
    const meta=[role,a.actorEmployeeId||'',a.occurredAt||''].filter(Boolean).join(' · ');
    return '<div class="abis-m7x-history-event">'+
      '<span class="abis-m7x-history-dot" aria-hidden="true"></span>'+
      '<div class="abis-m7x-history-content"><b>'+escapeHtml(action)+'</b>'+
      (meta?'<span>'+escapeHtml(meta)+'</span>':'')+'</div></div>';
  }).join('');
  return '<section class="abis-m7x-section"><h4>'+escapeHtml(dict.historyTitle)+'</h4>'+
    '<div class="abis-m7x-history abis-m7x-history-timeline">'+body+'</div></section>';
}

function abisEssM7CurrentMonth_(){
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}

function abisEssM7DetailItem_(label,value){
  if(value===null||value===undefined||String(value).trim()==='')return '';
  return '<div class="abis-m7x-detail-item"><span>'+escapeHtml(label)+'</span><b>'+escapeHtml(String(value))+'</b></div>';
}

function abisEssM7SummaryCard_(label,value,extraClass){
  return '<div class="abis-m7x-summary '+(extraClass||'')+'"><b>'+escapeHtml(String(value==null?0:value))+'</b><span>'+escapeHtml(label)+'</span></div>';
}

/* --------------------------------------------------------------------------
 * HR Leave Management
 * ------------------------------------------------------------------------ */

const ABIS_ESS_M7_LEAVE_STATE_={
  month:abisEssM7CurrentMonth_(),query:'',status:'',department:'',location:'',
  loading:false,data:null,error:'',view:'LIST',detail:null,detailLoading:false,
  requestSeq:0
};

async function abisEssM7LeaveLoad_(btn, options){
  if(!abisEssM72CanManage_()){
    message('無權限');
    return;
  }

  const s=ABIS_ESS_M7_LEAVE_STATE_;
  const opts=options||{};

  /*
   * Normal search reads the live controls into state.
   * Clear resets state first and calls with skipDomRead:true so cleared
   * filters cannot be written back from an older DOM snapshot.
   */
  if(!opts.skipDomRead){
    const month=$('abisM7LeaveMonth');
    const q=$('abisM7LeaveQuery');
    const st=$('abisM7LeaveStatus');
    const dp=$('abisM7LeaveDepartment');
    const loc=$('abisM7LeaveLocation');

    if(month)s.month=month.value||s.month;
    if(q)s.query=q.value.trim();
    if(st)s.status=st.value;
    if(dp)s.department=dp.value;
    if(loc)s.location=loc.value;
  }

  /*
   * Request generation guard: a slower, older search must never overwrite
   * a newer search/clear result.
   */
  const requestSeq=Number(s.requestSeq||0)+1;
  s.requestSeq=requestSeq;

  const payload={
    sessionToken:sessionToken,
    month:s.month,
    query:s.query,
    status:s.status,
    department:s.department,
    location:s.location
  };

  s.loading=true;
  s.error='';
  if(btn)btn.disabled=true;

  if(accountPanel_==='leaveManagement'){
    renderMyAccount_();
  }

  try{
    const data=await call('hrLeaveManagement',payload);

    if(requestSeq!==s.requestSeq)return;
    s.data=data;

  }catch(e){
    if(requestSeq!==s.requestSeq)return;
    s.error=e&&e.message?e.message:String(e);

  }finally{
    if(requestSeq===s.requestSeq){
      s.loading=false;

      if(
        accountPanel_==='leaveManagement' &&
        s.view==='LIST'
      ){
        renderMyAccount_();
      }
    }

    if(btn&&btn.isConnected){
      btn.disabled=false;
    }
  }
}

function abisEssM7LeaveClear_(btn){
  const s=ABIS_ESS_M7_LEAVE_STATE_;

  /* Month intentionally remains unchanged. */
  const q=$('abisM7LeaveQuery');
  const st=$('abisM7LeaveStatus');
  const dp=$('abisM7LeaveDepartment');
  const loc=$('abisM7LeaveLocation');

  if(q)q.value='';
  if(st)st.value='';
  if(dp)dp.value='';
  if(loc)loc.value='';

  s.query='';
  s.status='';
  s.department='';
  s.location='';
  s.error='';

  /*
   * Remove the stale filtered result immediately while the all-results
   * request is running.
   */
  s.data=null;

  return abisEssM7LeaveLoad_(btn,{skipDomRead:true});
}

function abisEssM7Select_(id,values,allLabel,selected){
  let h='<select id="'+id+'"><option value="">'+escapeHtml(allLabel)+'</option>';
  (values||[]).forEach(function(v){h+='<option value="'+escapeHtml(v)+'" '+(String(v)===String(selected)?'selected':'')+'>'+escapeHtml(v)+'</option>'});
  return h+'</select>';
}

function abisEssM7LeaveRow_(x){
  const id=encodeURIComponent(String(x.leaveId||''));
  const period=(x.startDate||'')+(x.endDate&&x.endDate!==x.startDate?' → '+x.endDate:'');
  return '<button type="button" class="abis-m7x-row" onclick="abisEssM7LeaveOpen_(\''+id+'\',this)">'+
    '<div class="abis-m7x-row-main"><b>'+escapeHtml(x.employeeName||x.employeeId||'')+'</b><span>'+escapeHtml(x.employeeId||'')+' · '+escapeHtml(x.department||'')+' · '+escapeHtml(x.location||'')+'</span></div>'+ 
    '<div class="abis-m7x-row-mid"><b>'+escapeHtml(x.leaveType||'')+'</b><span>'+escapeHtml(period)+' · '+escapeHtml(String(x.hours||0))+' HR</span></div>'+ 
    '<span class="abis-m7x-pill">'+escapeHtml(x.status||'—')+'</span><span class="abis-m7x-chevron">›</span></button>';
}

async function abisEssM7LeaveOpen_(encoded,btn){
  const id=decodeURIComponent(String(encoded||''));
  if(!id)return;

  const s=ABIS_ESS_M7_LEAVE_STATE_;
  if(s.detailLoading)return;

  s.detailLoading=true;
  s.error='';
  s.detail=null;

  try{
    /* Keep LIST visible while the backend request runs.
       Global Async Button Controller owns the clicked-card busy state. */
    const detail=await call('hrLeaveDetail',{sessionToken:sessionToken,leaveId:id});
    s.detail=detail;
    s.view='DETAIL';
  }catch(e){
    s.error=e&&e.message?e.message:String(e);
    message(s.error,'warning');
    return;
  }finally{
    s.detailLoading=false;
  }

  if(accountPanel_==='leaveManagement'){
    renderMyAccount_();
    if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(ignore){window.scrollTo(0,0)}
  }
}

function abisEssM7LeaveBack_(){ABIS_ESS_M7_LEAVE_STATE_.view='LIST';ABIS_ESS_M7_LEAVE_STATE_.detail=null;renderMyAccount_();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}

function abisEssM7LeaveListHtml_(){
  const s=ABIS_ESS_M7_LEAVE_STATE_,d=s.data||{},sum=d.summary||{},opt=d.options||{},rows=d.rows||[];
  const summary='<div class="abis-m7x-summary-grid">'+
    abisEssM7SummaryCard_(abisEssM7xt_('totalRequests'),sum.requestCount)+
    abisEssM7SummaryCard_(abisEssM7xt_('uniquePeople'),sum.uniquePeople)+
    abisEssM7SummaryCard_(abisEssM7xt_('pending'),sum.pending)+
    abisEssM7SummaryCard_(abisEssM7xt_('approved'),sum.approved)+
    abisEssM7SummaryCard_(abisEssM7xt_('returned'),sum.returned)+
    abisEssM7SummaryCard_(abisEssM7xt_('hours'),sum.hours)+
  '</div>';
  const controls='<div class="abis-m7x-controls"><input id="abisM7LeaveMonth" type="month" value="'+escapeHtml(s.month)+'"><input id="abisM7LeaveQuery" type="search" placeholder="'+escapeHtml(abisEssM7xt_('searchPerson'))+'" value="'+escapeHtml(s.query)+'">'+
    abisEssM7Select_('abisM7LeaveStatus',opt.statuses||[],abisEssM7xt_('allStatus'),s.status)+
    abisEssM7Select_('abisM7LeaveDepartment',opt.departments||[],abisEssM7xt_('allDepartment'),s.department)+
    abisEssM7Select_('abisM7LeaveLocation',opt.locations||[],abisEssM7xt_('allLocation'),s.location)+
    '<div class="abis-m7x-action-row"><button type="button" onclick="abisEssM7LeaveLoad_(this)">'+escapeHtml(abisEssM7xt_('search'))+'</button><button type="button" class="secondary" onclick="abisEssM7LeaveClear_(this)">'+escapeHtml(abisEssM7xt_('clear'))+'</button></div></div>';
  let body='';
  if(s.loading&&!s.data)body='<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('loading'))+'</div>';
  else if(s.error&&!s.data)body='<div class="abis-m7x-error">'+escapeHtml(s.error)+'</div>';
  else body=rows.length?'<div class="abis-m7x-list">'+rows.map(abisEssM7LeaveRow_).join('')+'</div>':'<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('noLeave'))+'</div>';
  return '<div class="abis-m7x-panel"><div class="abis-m7x-title"><div><h3>'+escapeHtml(abisEssM7xt_('leaveManagement'))+'</h3><span class="abis-m71-readonly">'+escapeHtml(abisEssM7xt_('readOnly'))+'</span></div></div>'+summary+controls+(s.error&&s.data?'<div class="abis-m7x-error">'+escapeHtml(s.error)+'</div>':'')+body+'<div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'</div></div>';
}

function abisEssM7LeaveDetailHtml_(){
  const s=ABIS_ESS_M7_LEAVE_STATE_;
  if(s.detailLoading)return '<div class="abis-m7x-panel"><div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('loading'))+'</div></div>';
  if(!s.detail)return '<div class="abis-m7x-panel"><button class="abis-m7x-back" onclick="abisEssM7LeaveBack_()">‹ '+escapeHtml(abisEssM7xt_('backLeave'))+'</button><div class="abis-m7x-error">'+escapeHtml(s.error||abisEssM7xt_('loadFailed'))+'</div></div>';
  const x=s.detail.leave||{}, approvals=s.detail.approvals||[];
  const hist=abisEssM7ApprovalHistoryHtml_(approvals);
  return '<div class="abis-m7x-panel"><button class="abis-m7x-back" onclick="abisEssM7LeaveBack_()">‹ '+escapeHtml(abisEssM7xt_('backLeave'))+'</button><div class="abis-m7x-hero"><div><h3>'+escapeHtml(x.employeeName||'')+'</h3><span>'+escapeHtml(x.employeeId||'')+' · '+escapeHtml(x.leaveId||'')+'</span></div><span class="abis-m7x-pill">'+escapeHtml(x.status||'—')+'</span></div><section class="abis-m7x-section"><h4>'+escapeHtml(abisEssM7xt_('leaveDetail'))+'</h4><div class="abis-m7x-detail-grid">'+
    abisEssM7DetailItem_(abisEssM7xt_('leaveType'),x.leaveType)+abisEssM7DetailItem_(abisEssM7xt_('period'),(x.startDate||'')+' '+(x.startTime||'')+' → '+(x.endDate||'')+' '+(x.endTime||''))+abisEssM7DetailItem_(abisEssM7xt_('hours'),String(x.hours||0)+' HR')+abisEssM7DetailItem_(abisEssM7xt_('department'),x.department)+abisEssM7DetailItem_(abisEssM7xt_('location'),x.location)+abisEssM7DetailItem_(abisEssM7xt_('proxy'),x.proxyName||x.proxyId)+abisEssM7DetailItem_(abisEssM7xt_('evidence'),x.evidenceStatus)+abisEssM7DetailItem_(abisEssM7xt_('reason'),x.reason)+abisEssM7DetailItem_(abisEssM7xt_('handover'),x.handover)+'</div></section>'+hist+'<div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'</div></div>';
}

function abisEssM7LeavePanelHtml_(){return ABIS_ESS_M7_LEAVE_STATE_.view==='DETAIL'?abisEssM7LeaveDetailHtml_():abisEssM7LeaveListHtml_()}

/* --------------------------------------------------------------------------
 * Supervisor Team Management
 * ------------------------------------------------------------------------ */

const ABIS_ESS_M7_TEAM_STATE_={month:abisEssM7CurrentMonth_(),loading:false,data:null,error:'',view:'LIST',detail:null};

async function abisEssM7TeamLoad_(btn){
  const s=ABIS_ESS_M7_TEAM_STATE_,m=$('abisM7TeamMonth');if(m)s.month=m.value||s.month;if(s.loading)return;s.loading=true;s.error='';if(btn)btn.disabled=true;if(accountPanel_==='teamManagement')renderMyAccount_();
  try{s.data=await call('teamManagement',{sessionToken,month:s.month})}catch(e){s.error=e&&e.message?e.message:String(e)}finally{s.loading=false;if(btn&&btn.isConnected)btn.disabled=false;if(accountPanel_==='teamManagement')renderMyAccount_()}
}
function abisEssM7TeamOpen_(id){const rows=ABIS_ESS_M7_TEAM_STATE_.data&&ABIS_ESS_M7_TEAM_STATE_.data.rows||[];const x=rows.find(r=>String(r.employeeId)===String(id));if(!x)return;ABIS_ESS_M7_TEAM_STATE_.detail=x;ABIS_ESS_M7_TEAM_STATE_.view='DETAIL';renderMyAccount_();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function abisEssM7TeamBack_(){ABIS_ESS_M7_TEAM_STATE_.view='LIST';ABIS_ESS_M7_TEAM_STATE_.detail=null;renderMyAccount_();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function abisEssM7TeamRow_(x){return '<button type="button" class="abis-m7x-row" onclick="abisEssM7TeamOpen_(\''+escapeHtml(x.employeeId||'')+'\')"><div class="abis-m7x-row-main"><b>'+escapeHtml(x.name||x.employeeId||'')+'</b><span>'+escapeHtml(x.employeeId||'')+' · '+escapeHtml(x.department||'')+' · '+escapeHtml(x.location||'')+'</span></div><div class="abis-m7x-row-mid"><b>'+escapeHtml(abisEssM7xt_('attendanceException'))+' '+escapeHtml(String(x.attendanceExceptionCount||0))+'</b><span>'+escapeHtml(abisEssM7xt_('leaveCount'))+' '+escapeHtml(String(x.leaveRequestCount||0))+' · '+escapeHtml(abisEssM7xt_('missingPunch'))+' '+escapeHtml(String(x.missingPunchCount||0))+'</span></div><span class="abis-m7x-chevron">›</span></button>'}
function abisEssM7TeamListHtml_(){const s=ABIS_ESS_M7_TEAM_STATE_,d=s.data||{},rows=d.rows||[];return '<div class="abis-m7x-panel"><div class="abis-m7x-title"><div><h3>'+escapeHtml(abisEssM7xt_('teamManagement'))+'</h3><span class="abis-m71-readonly">'+escapeHtml(abisEssM7xt_('readOnly'))+'</span></div><div><label class="abis-m7x-mini-label">'+escapeHtml(abisEssM7xt_('month'))+'</label><input id="abisM7TeamMonth" type="month" value="'+escapeHtml(s.month)+'"></div></div><div class="abis-m7x-summary-grid">'+abisEssM7SummaryCard_(abisEssM7xt_('directReportCount'),d.directReportCount||0)+abisEssM7SummaryCard_(abisEssM7xt_('attendanceException'),rows.reduce((n,x)=>n+Number(x.attendanceExceptionCount||0),0))+abisEssM7SummaryCard_(abisEssM7xt_('leaveCount'),rows.reduce((n,x)=>n+Number(x.leaveRequestCount||0),0))+'</div><div class="abis-m7x-action-row"><button onclick="abisEssM7TeamLoad_(this)">'+escapeHtml(abisEssM7xt_('refresh'))+'</button><button class="secondary" onclick="refreshInbox(\'APPROVAL\')">'+escapeHtml(abisEssM7xt_('leaveApproval'))+'</button></div>'+(s.error?'<div class="abis-m7x-error">'+escapeHtml(s.error)+'</div>':'')+(s.loading&&!s.data?'<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('loading'))+'</div>':rows.length?'<div class="abis-m7x-list">'+rows.map(abisEssM7TeamRow_).join('')+'</div>':'<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('noTeam'))+'</div>')+'<div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'</div></div>'}
function abisEssM7TeamDetailHtml_(){const x=ABIS_ESS_M7_TEAM_STATE_.detail;if(!x)return abisEssM7TeamListHtml_();return '<div class="abis-m7x-panel"><button class="abis-m7x-back" onclick="abisEssM7TeamBack_()">‹ '+escapeHtml(abisEssM7xt_('backTeam'))+'</button><div class="abis-m7x-hero"><div><h3>'+escapeHtml(x.name||'')+'</h3><span>'+escapeHtml(x.employeeId||'')+' · '+escapeHtml(x.department||'')+'</span></div></div><section class="abis-m7x-section"><h4>'+escapeHtml(abisEssM7xt_('teamDetail'))+'</h4><div class="abis-m7x-detail-grid">'+abisEssM7DetailItem_(abisEssM7xt_('location'),x.location)+abisEssM7DetailItem_(abisEssM7xt_('formalShift'),x.formalShift)+abisEssM7DetailItem_(abisEssM7xt_('personType'),x.personType)+abisEssM7DetailItem_(abisEssM7xt_('attendanceException'),x.attendanceExceptionCount)+abisEssM7DetailItem_(abisEssM7xt_('missingPunch'),x.missingPunchCount)+abisEssM7DetailItem_(abisEssM7xt_('leaveCount'),x.leaveRequestCount)+'</div></section><div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'</div></div>'}
function abisEssM7TeamPanelHtml_(){return ABIS_ESS_M7_TEAM_STATE_.view==='DETAIL'?abisEssM7TeamDetailHtml_():abisEssM7TeamListHtml_()}

/* --------------------------------------------------------------------------
 * HR/Admin Management Reports
 * ------------------------------------------------------------------------ */

const ABIS_ESS_M7_REPORT_STATE_={month:abisEssM7CurrentMonth_(),loading:false,data:null,error:'',view:'HOME',detail:null,detailLoading:false};
async function abisEssM7ReportsLoad_(btn){const s=ABIS_ESS_M7_REPORT_STATE_,m=$('abisM7ReportMonth');if(m)s.month=m.value||s.month;if(s.loading)return;s.loading=true;s.error='';if(btn)btn.disabled=true;if(accountPanel_==='managementReports')renderMyAccount_();try{s.data=await call('managementReports',{sessionToken,month:s.month})}catch(e){s.error=e&&e.message?e.message:String(e)}finally{s.loading=false;if(btn&&btn.isConnected)btn.disabled=false;if(accountPanel_==='managementReports'&&s.view==='HOME')renderMyAccount_()}}
function abisEssM7ReportCard_(type,title,primary,secondary,available){return '<button type="button" class="abis-m7x-report-card '+(!available?'is-disabled':'')+'" '+(available?'onclick="abisEssM7ReportOpen_(\''+type+'\',this)"':'disabled')+'><b>'+escapeHtml(title)+'</b><strong>'+escapeHtml(primary)+'</strong><span>'+escapeHtml(available?secondary:abisEssM7xt_('sourceUnavailable'))+'</span><i>›</i></button>'}
async function abisEssM7ReportOpen_(type,btn){const s=ABIS_ESS_M7_REPORT_STATE_;s.view='DETAIL';s.detailLoading=true;s.detail=null;s.error='';if(btn)btn.disabled=true;renderMyAccount_();try{s.detail=await call('managementReportDetail',{sessionToken,month:s.month,reportType:type})}catch(e){s.error=e&&e.message?e.message:String(e)}finally{s.detailLoading=false;if(btn&&btn.isConnected)btn.disabled=false;if(accountPanel_==='managementReports')renderMyAccount_()}}
function abisEssM7ReportBack_(){ABIS_ESS_M7_REPORT_STATE_.view='HOME';ABIS_ESS_M7_REPORT_STATE_.detail=null;renderMyAccount_();if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_()}
function abisEssM7ReportsHomeHtml_(){const s=ABIS_ESS_M7_REPORT_STATE_,d=s.data||{},c=d.cards||{};return '<div class="abis-m7x-panel"><div class="abis-m7x-title"><div><h3>'+escapeHtml(abisEssM7xt_('reportsTitle'))+'</h3><span class="abis-m71-readonly">'+escapeHtml(abisEssM7xt_('readOnly'))+'</span></div><div><label class="abis-m7x-mini-label">'+escapeHtml(abisEssM7xt_('month'))+'</label><input id="abisM7ReportMonth" type="month" value="'+escapeHtml(s.month)+'"></div></div><div class="abis-m7x-action-row"><button onclick="abisEssM7ReportsLoad_(this)">'+escapeHtml(abisEssM7xt_('refresh'))+'</button></div>'+(s.error?'<div class="abis-m7x-error">'+escapeHtml(s.error)+'</div>':'')+(s.loading&&!s.data?'<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('loading'))+'</div>':'<div class="abis-m7x-report-grid">'+
  abisEssM7ReportCard_('ATTENDANCE',abisEssM7xt_('attendanceReport'),String(c.attendance&&c.attendance.exceptionDays||0),abisEssM7xt_('missing')+' '+String(c.attendance&&c.attendance.missing||0)+' · '+abisEssM7xt_('late')+' '+String(c.attendance&&c.attendance.late||0),!!(c.attendance&&c.attendance.available))+
  abisEssM7ReportCard_('LEAVE',abisEssM7xt_('leaveReport'),String(c.leave&&c.leave.requestCount||0),abisEssM7xt_('uniquePeople')+' '+String(c.leave&&c.leave.uniquePeople||0),!!(c.leave&&c.leave.available))+
  abisEssM7ReportCard_('EMPLOYEE_CHANGE',abisEssM7xt_('employeeChangeReport'),String(c.employeeChange&&c.employeeChange.hireCount||0),abisEssM7xt_('newHire')+' '+String(c.employeeChange&&c.employeeChange.hireCount||0)+' · '+abisEssM7xt_('termination')+' '+String(c.employeeChange&&c.employeeChange.terminationCount||0),!!(c.employeeChange&&c.employeeChange.available))+
  abisEssM7ReportCard_('ASSET',abisEssM7xt_('assetReport'),String(c.assets&&c.assets.total||0),abisEssM7xt_('assetTotal'),!!(c.assets&&c.assets.available))+
  abisEssM7ReportCard_('TASK',abisEssM7xt_('taskReport'),String(c.tasks&&c.tasks.total||0),abisEssM7xt_('taskTotal'),!!(c.tasks&&c.tasks.available))+
  '</div>')+'<div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'<br>'+escapeHtml(abisEssM7xt_('contactHrBoundary'))+'</div></div>'}

function abisEssM7ReportRowsHtml_(type,report){const rows=report&&report.rows||[];if(!rows.length)return '<div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('noReportRows'))+'</div>';return '<div class="abis-m7x-report-rows">'+rows.slice(0,200).map(function(x){if(type==='ATTENDANCE')return '<div><b>'+escapeHtml(x.date||'')+' · '+escapeHtml(x.name||x.employeeId||'')+'</b><span>'+escapeHtml([x.location,x.code,x.nameLabel,x.handlingStatus].filter(Boolean).join(' · '))+'</span></div>';if(type==='LEAVE')return '<div><b>'+escapeHtml((x.startDate||'')+' · '+(x.employeeName||x.employeeId||''))+'</b><span>'+escapeHtml([x.leaveType,x.status,String(x.hours||0)+' HR'].filter(Boolean).join(' · '))+'</span></div>';if(type==='EMPLOYEE_CHANGE')return '<div><b>'+escapeHtml((x.date||'')+' · '+(x.name||x.employeeId||''))+'</b><span>'+escapeHtml((x.type==='HIRE'?abisEssM7xt_('newHire'):abisEssM7xt_('termination'))+' · '+(x.department||'')+' · '+(x.location||''))+'</span></div>';if(type==='TASK')return '<div><b>'+escapeHtml(x.Title||x.title||x.TaskID||'Task')+'</b><span>'+escapeHtml(x.Subtitle||x.subtitle||x.Category||'')+'</span></div>';return '<div><b>'+escapeHtml(JSON.stringify(x).slice(0,100))+'</b></div>'}).join('')+'</div>'}
function abisEssM7ReportDetailHtml_(){const s=ABIS_ESS_M7_REPORT_STATE_;if(s.detailLoading)return '<div class="abis-m7x-panel"><div class="abis-m7x-empty">'+escapeHtml(abisEssM7xt_('loading'))+'</div></div>';if(!s.detail)return '<div class="abis-m7x-panel"><button class="abis-m7x-back" onclick="abisEssM7ReportBack_()">‹ '+escapeHtml(abisEssM7xt_('backReports'))+'</button><div class="abis-m7x-error">'+escapeHtml(s.error||abisEssM7xt_('loadFailed'))+'</div></div>';const type=s.detail.reportType||'',r=s.detail.report||{};let title=type;if(type==='ATTENDANCE')title=abisEssM7xt_('attendanceReport');if(type==='LEAVE')title=abisEssM7xt_('leaveReport');if(type==='EMPLOYEE_CHANGE')title=abisEssM7xt_('employeeChangeReport');if(type==='ASSET')title=abisEssM7xt_('assetReport');if(type==='TASK')title=abisEssM7xt_('taskReport');return '<div class="abis-m7x-panel"><button class="abis-m7x-back" onclick="abisEssM7ReportBack_()">‹ '+escapeHtml(abisEssM7xt_('backReports'))+'</button><div class="abis-m7x-hero"><div><h3>'+escapeHtml(title)+'</h3><span>'+escapeHtml(s.month)+'</span></div><span class="abis-m71-readonly">'+escapeHtml(abisEssM7xt_('readOnly'))+'</span></div>'+(!r.available?'<div class="abis-m7x-error">'+escapeHtml(abisEssM7xt_('sourceUnavailable'))+'</div>':abisEssM7ReportRowsHtml_(type,r))+'<div class="abis-m7x-note">'+escapeHtml(abisEssM7xt_('sourceNote'))+'</div></div>'}
function abisEssM7ReportsPanelHtml_(){return ABIS_ESS_M7_REPORT_STATE_.view==='DETAIL'?abisEssM7ReportDetailHtml_():abisEssM7ReportsHomeHtml_()}

/* --------------------------------------------------------------------------
 * Final integrated Management Tools + navigation owners
 * ------------------------------------------------------------------------ */

function abisEssM7IntegratedManagementToolsHtml_(){
  let html='';
  if(typeof abisEssM2HasHrTools_==='function'&&abisEssM2HasHrTools_()){
    let body='';
    body+=abisEssM2ToolButton_(abisEssM7xt_('employeeManagement'),"rc2OpenAccountPanel_('employeeManagement')");
    body+=abisEssM2ToolButton_(abisEssM7xt_('accountManagement'),'openHrCredentialAdmin()');
    body+=abisEssM2ToolButton_(abisEssM7xt_('attendanceManagement'),"rc2OpenAccountPanel_('attendanceManagement')");
    body+=abisEssM2ToolButton_(abisEssM7xt_('leaveManagement'),"rc2OpenAccountPanel_('leaveManagement')");
    body+=abisEssM2ToolButton_(abisEssM7xt_('managementReports'),"rc2OpenAccountPanel_('managementReports')");
    html+=abisEssM2ToolGroup_(abisEssM7xt_('hrTools'),body);
  }
  if(typeof abisEssM2HasSupervisorTools_==='function'&&abisEssM2HasSupervisorTools_()){
    let body='';
    body+=abisEssM2ToolButton_(abisEssM7xt_('leaveApproval'),"refreshInbox('APPROVAL')");
    const directCount=Number(homeData&&homeData.leaveDashboard&&homeData.leaveDashboard.directReportCount||0);
    if(directCount>0){
      body+=abisEssM2ToolButton_(abisEssM7xt_('teamManagement'),"rc2OpenAccountPanel_('teamManagement')");
    }
    html+=abisEssM2ToolGroup_(abisEssM7xt_('supervisorTools'),body);
  }
  if(typeof abisEssM2HasPlannerTools_==='function'&&abisEssM2HasPlannerTools_()){
    html+=abisEssM2ToolGroup_(abisEssM7xt_('plannerTools'),abisEssM2ToolButton_(abisEssM7xt_('scheduleManagement'),'openFactoryWeeklyRestManagement_()'));
  }
  return html||'<div class="muted">'+escapeHtml(abisEssM7xt_('noTools'))+'</div>';
}
rc2ManagementToolsHtml_=abisEssM7IntegratedManagementToolsHtml_;

const ABIS_ESS_M7X_BASE_ACCOUNT_PANEL_HTML_=typeof rc2AccountPanelHtml_==='function'?rc2AccountPanelHtml_:null;
if(ABIS_ESS_M7X_BASE_ACCOUNT_PANEL_HTML_){rc2AccountPanelHtml_=function(panel){const p=String(panel||'');if(p==='leaveManagement')return '<div class="rc2-account-panel abis-m7x-root">'+abisEssM7LeavePanelHtml_()+'</div>';if(p==='teamManagement')return '<div class="rc2-account-panel abis-m7x-root">'+abisEssM7TeamPanelHtml_()+'</div>';if(p==='managementReports')return '<div class="rc2-account-panel abis-m7x-root">'+abisEssM7ReportsPanelHtml_()+'</div>';return ABIS_ESS_M7X_BASE_ACCOUNT_PANEL_HTML_.apply(this,arguments)}}

const ABIS_ESS_M7X_BASE_OPEN_ACCOUNT_PANEL_=typeof rc2OpenAccountPanel_==='function'?rc2OpenAccountPanel_:null;
if(ABIS_ESS_M7X_BASE_OPEN_ACCOUNT_PANEL_){rc2OpenAccountPanel_=function(panel){const p=String(panel||'');const out=ABIS_ESS_M7X_BASE_OPEN_ACCOUNT_PANEL_.apply(this,arguments);if(p==='leaveManagement'&&!ABIS_ESS_M7_LEAVE_STATE_.data)setTimeout(()=>abisEssM7LeaveLoad_(null),0);if(p==='teamManagement'&&!ABIS_ESS_M7_TEAM_STATE_.data)setTimeout(()=>abisEssM7TeamLoad_(null),0);if(p==='managementReports'&&!ABIS_ESS_M7_REPORT_STATE_.data)setTimeout(()=>abisEssM7ReportsLoad_(null),0);return out}}

const ABIS_ESS_M7X_BASE_INNER_TITLE_=typeof rc2InnerTitleForSection_==='function'?rc2InnerTitleForSection_:null;
if(ABIS_ESS_M7X_BASE_INNER_TITLE_){rc2InnerTitleForSection_=function(id){if(id==='account'){const p=String(accountPanel_||'');if(p==='leaveManagement')return ABIS_ESS_M7_LEAVE_STATE_.view==='DETAIL'?abisEssM7xt_('leaveDetail'):abisEssM7xt_('leaveManagement');if(p==='teamManagement')return ABIS_ESS_M7_TEAM_STATE_.view==='DETAIL'?abisEssM7xt_('teamDetail'):abisEssM7xt_('teamManagement');if(p==='managementReports')return ABIS_ESS_M7_REPORT_STATE_.view==='DETAIL'?abisEssM7xt_('reportDetail'):abisEssM7xt_('managementReports')}return ABIS_ESS_M7X_BASE_INNER_TITLE_.apply(this,arguments)}}

const ABIS_ESS_M7X_BASE_INNER_BACK_=typeof rc2InnerBack_==='function'?rc2InnerBack_:null;
if(ABIS_ESS_M7X_BASE_INNER_BACK_){rc2InnerBack_=function(){const id=typeof rc2VisibleInnerSection_==='function'?rc2VisibleInnerSection_():'';if(id==='account'){const p=String(accountPanel_||'');if(p==='leaveManagement'){if(ABIS_ESS_M7_LEAVE_STATE_.view==='DETAIL'){abisEssM7LeaveBack_();return}accountPanel_='management';renderMyAccount_();return}if(p==='teamManagement'){if(ABIS_ESS_M7_TEAM_STATE_.view==='DETAIL'){abisEssM7TeamBack_();return}accountPanel_='management';renderMyAccount_();return}if(p==='managementReports'){if(ABIS_ESS_M7_REPORT_STATE_.view==='DETAIL'){abisEssM7ReportBack_();return}accountPanel_='management';renderMyAccount_();return}}return ABIS_ESS_M7X_BASE_INNER_BACK_.apply(this,arguments)}}

/* --------------------------------------------------------------------------
 * Shared M7 extension styles; inherit global spacing + contrast rules
 * ------------------------------------------------------------------------ */
function abisEssM7IntegratedInstallStyles_(){
  if(document.getElementById('abisEssM7IntegratedStyle'))return;
  const s=document.createElement('style');s.id='abisEssM7IntegratedStyle';s.textContent=`
    .abis-m7x-root{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
    .abis-m7x-panel{display:grid;gap:14px;min-width:0}
    .abis-m7x-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .abis-m7x-title h3,.abis-m7x-hero h3{margin:0;color:var(--abis-ui-text-strong,#142640)}
    .abis-m7x-mini-label{display:block;margin:0 0 4px;color:#53677e;font-size:12px;font-weight:800}
    .abis-m7x-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:12px;border:1px solid #dce6ef;border-radius:16px;background:#fff}
    .abis-m7x-controls input,.abis-m7x-controls select{width:100%;min-width:0;margin:0;min-height:46px}
    .abis-m7x-controls input[type=search]{grid-column:span 2}
    .abis-m7x-action-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .abis-m7x-action-row button,.abis-m7x-back{width:auto!important;min-height:48px!important;padding:11px 18px!important;border-radius:14px!important}
    .abis-m7x-back{justify-self:start;background:#1768e8!important;color:#fff!important;font-weight:850!important;white-space:nowrap}
    .abis-m7x-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .abis-m7x-summary{min-width:0;display:grid;gap:4px;align-content:center;min-height:76px;padding:10px;border:1px solid #dce6ef;border-radius:14px;background:#fff;text-align:center}
    .abis-m7x-summary b{color:#1768e8;font-size:23px;line-height:1}
    .abis-m7x-summary span{color:#425a73;font-size:12px;font-weight:800}
    .abis-m7x-list{display:grid;gap:9px}
    .abis-m7x-row{width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto 18px;align-items:center!important;gap:10px!important;margin:0!important;padding:13px 14px!important;border:1px solid #dce6ef!important;border-radius:16px!important;background:#fff!important;color:#142640!important;text-align:left!important;box-shadow:0 3px 12px rgba(31,55,86,.05)!important}
    .abis-m7x-row-main,.abis-m7x-row-mid{min-width:0;display:grid;gap:3px}
    .abis-m7x-row-main b,.abis-m7x-row-mid b{overflow:hidden;color:#142640;font-size:16px;text-overflow:ellipsis;white-space:nowrap}
    .abis-m7x-row-main span,.abis-m7x-row-mid span{overflow:hidden;color:#53677e;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
    .abis-m7x-pill{display:inline-flex;align-items:center;max-width:180px;padding:5px 9px;border-radius:999px;background:#eef4fb;color:#244764;font-size:12px;font-weight:850;text-align:center;line-height:1.3}
    .abis-m7x-chevron{color:#60758b;font-size:24px}
    .abis-m7x-empty,.abis-m7x-error{padding:24px 14px;border-radius:16px;text-align:center;line-height:1.55}
    .abis-m7x-empty{border:1px dashed #ccd8e3;background:#fff;color:#53677e}
    .abis-m7x-error{border:1px solid #fecaca;background:#fef2f2;color:#991b1b}
    .abis-m7x-note{padding:11px 13px;border-radius:12px;background:#f8fafc;color:#53677e;font-size:13px;line-height:1.55}
    .abis-m7x-hero{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px;border:1px solid #dce6ef;border-radius:16px;background:#fff}
    .abis-m7x-hero div{min-width:0}.abis-m7x-hero span:not(.abis-m7x-pill){color:#53677e;font-size:13px}
    .abis-m7x-section{overflow:hidden;border:1px solid #dce6ef;border-radius:16px;background:#fff}.abis-m7x-section h4{margin:0;padding:12px 14px;border-bottom:1px solid #e8eef4;background:#f8fafc;color:#263e57}
    .abis-m7x-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.abis-m7x-detail-item{min-width:0;display:grid;gap:4px;padding:11px 14px;border-bottom:1px solid #edf1f5;border-right:1px solid #edf1f5}.abis-m7x-detail-item:nth-child(even){border-right:0}.abis-m7x-detail-item span{color:#60758b;font-size:12px}.abis-m7x-detail-item b{color:#172238;font-size:14px;overflow-wrap:anywhere}
    .abis-m7x-history,.abis-m7x-report-rows{display:grid}.abis-m7x-history>div,.abis-m7x-report-rows>div{display:grid;gap:3px;padding:11px 14px;border-bottom:1px solid #edf1f5}.abis-m7x-history>div:last-child,.abis-m7x-report-rows>div:last-child{border-bottom:0}.abis-m7x-history b,.abis-m7x-report-rows b{color:#172238}.abis-m7x-history span,.abis-m7x-report-rows span{color:#53677e;font-size:13px}
    .abis-m7x-report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.abis-m7x-report-card{position:relative;width:100%!important;min-width:0!important;min-height:118px!important;display:grid!important;gap:5px!important;align-content:center!important;margin:0!important;padding:16px!important;border:1px solid #dce6ef!important;border-radius:16px!important;background:#fff!important;color:#142640!important;text-align:left!important}.abis-m7x-report-card>b{font-size:16px}.abis-m7x-report-card strong{color:#1768e8;font-size:30px;line-height:1}.abis-m7x-report-card span{color:#53677e;font-size:13px}.abis-m7x-report-card i{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#60758b;font-size:24px;font-style:normal}.abis-m7x-report-card.is-disabled{background:#f4f6f8!important;color:#66788b!important;opacity:1!important}.abis-m7x-report-card.is-disabled strong{color:#8192a6}
    @media(max-width:767px){.abis-m7x-title h3,.abis-m7x-hero h3{font-size:22px}.abis-m7x-controls{grid-template-columns:1fr}.abis-m7x-controls input[type=search]{grid-column:auto}.abis-m7x-controls input,.abis-m7x-controls select{min-height:48px;font-size:16px}.abis-m7x-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.abis-m7x-summary{min-height:84px}.abis-m7x-summary b{font-size:26px}.abis-m7x-summary span{font-size:14px}.abis-m7x-row{grid-template-columns:minmax(0,1fr) 18px!important;gap:8px!important;padding:14px!important}.abis-m7x-row-main{grid-column:1}.abis-m7x-row-mid{grid-column:1}.abis-m7x-pill{grid-column:1;justify-self:start;max-width:100%}.abis-m7x-chevron{grid-column:2;grid-row:1 / span 3}.abis-m7x-row-main b,.abis-m7x-row-mid b{font-size:18px}.abis-m7x-row-main span,.abis-m7x-row-mid span{font-size:14px}.abis-m7x-detail-grid{grid-template-columns:1fr}.abis-m7x-detail-item{border-right:0}.abis-m7x-detail-item span{font-size:14px}.abis-m7x-detail-item b{font-size:16px}.abis-m7x-report-grid{grid-template-columns:1fr}.abis-m7x-report-card{min-height:108px!important}}
  `;document.head.appendChild(s)
}
abisEssM7IntegratedInstallStyles_();

/* --------------------------------------------------------------------------
 * Integrated diagnostics / single final gate
 * ------------------------------------------------------------------------ */
async function abisEssM7IntegratedApiSmoke_(){
  const out={ok:true,version:ABIS_ESS_M7_INTEGRATED_VERSION_,results:{},writesPerformed:0,errors:[]};
  try{
    if(typeof abisEssM72CanManage_==='function'&&abisEssM72CanManage_()){
      const emp=await call('hrEmployeeSearch',{sessionToken,query:'A09701',limit:5,offset:0});out.results.employeeManagement=!!emp;out.writesPerformed+=Number(emp&&emp.writesPerformed||0);
      const lv=await call('hrLeaveManagement',{sessionToken,month:abisEssM7CurrentMonth_()});out.results.leaveManagement=!!lv;out.writesPerformed+=Number(lv&&lv.writesPerformed||0);
      const rep=await call('managementReports',{sessionToken,month:abisEssM7CurrentMonth_()});out.results.managementReports=!!rep;out.writesPerformed+=Number(rep&&rep.writesPerformed||0);
      const att=await Promise.all(['XINDIAN','OFFICE'].map(code=>call('attendanceUnifiedSiteDetail',{sessionToken,date:abisEssM72Today_(),scopeCode:code}).then(()=>true).catch(e=>({error:e&&e.message?e.message:String(e)}))));out.results.attendance=att;
    }
    if(typeof abisEssM2HasSupervisorTools_==='function'&&abisEssM2HasSupervisorTools_()){
      try{const team=await call('teamManagement',{sessionToken,month:abisEssM7CurrentMonth_()});out.results.teamManagement=!!team;out.writesPerformed+=Number(team&&team.writesPerformed||0)}catch(e){out.results.teamManagement={skipped:false,error:e&&e.message?e.message:String(e)}}
    }else out.results.teamManagement={skipped:true};
    out.ok=out.writesPerformed===0&&!out.errors.length;
  }catch(e){out.ok=false;out.errors.push(e&&e.message?e.message:String(e))}
  return out;
}

function abisEssM7IntegratedPreflight_(){
  const m35=typeof abisEssM35Preflight_==='function'?abisEssM35Preflight_():null;
  const html=typeof rc2ManagementToolsHtml_==='function'?rc2ManagementToolsHtml_():'';
  const canHr=typeof abisEssM2HasHrTools_==='function'&&abisEssM2HasHrTools_();
  const canSup=typeof abisEssM2HasSupervisorTools_==='function'&&abisEssM2HasSupervisorTools_();
  const hasDirectTeam=Number(homeData&&homeData.leaveDashboard&&homeData.leaveDashboard.directReportCount||0)>0;
  const out={
    ok:true,version:ABIS_ESS_M7_INTEGRATED_VERSION_,
    mobile:typeof abisEssIsMobileUi_==='function'?abisEssIsMobileUi_():null,
    dependencies:{m1:typeof abisEssIsMobileUi_==='function',m2:typeof abisEssM2HasManagementTools_==='function',m35:typeof abisEssM35Preflight_==='function',m351:typeof abisEssM351VisibleOverflowAudit_==='function'},
    modules:{employeeManagement:typeof abisEssM71Search_==='function',attendanceManagement:typeof abisEssM72Load_==='function',leaveManagement:typeof abisEssM7LeaveLoad_==='function',teamManagement:typeof abisEssM7TeamLoad_==='function',managementReports:typeof abisEssM7ReportsLoad_==='function',accountManagement:typeof openHrCredentialAdmin==='function'},
    entries:{employee:!canHr||String(html).indexOf('employeeManagement')>=0,attendance:!canHr||String(html).indexOf('attendanceManagement')>=0,leave:!canHr||String(html).indexOf('leaveManagement')>=0,reports:!canHr||String(html).indexOf('managementReports')>=0,team:!canSup||!hasDirectTeam||String(html).indexOf('teamManagement')>=0},
    frozenBoundaries:{contactHrGuidance:true,inquiriesHidden:m35&&m35.features?m35.features.inquiriesVisible===false:true,payrollEmployeeUiHidden:m35&&m35.features?m35.features.payrollEmployeeUi===false:true,mobileSchedulingHidden:m35&&m35.features?m35.features.schedulingOnMobile===false:true},
    layout:{m35Ok:m35?!!m35.ok:null,horizontalOverflow:m35&&m35.layout?m35.layout.horizontalOverflow:null},
    globalUiRules:{interactionSpacing:!!(window.ABIS_ESS_M7_1B_COLOR_FIX&&window.ABIS_ESS_M7_1B_COLOR_FIX.globalInteractionSpacing),contrast:!!(window.ABIS_ESS_M7_1B_COLOR_FIX&&window.ABIS_ESS_M7_1B_COLOR_FIX.globalContrastRule)}
  };
  out.ok=Object.values(out.dependencies).every(Boolean)&&Object.values(out.modules).every(Boolean)&&Object.values(out.entries).every(Boolean)&&out.frozenBoundaries.inquiriesHidden&&out.frozenBoundaries.payrollEmployeeUiHidden&&out.frozenBoundaries.mobileSchedulingHidden&&out.layout.horizontalOverflow!==true&&(out.layout.m35Ok===true||out.layout.m35Ok===null)&&out.globalUiRules.interactionSpacing&&out.globalUiRules.contrast;
  window.ABIS_ESS_M7_INTEGRATED=out;return out;
}
try{window.ABIS_ESS_M7_INTEGRATED=abisEssM7IntegratedPreflight_()}catch(ignore){}


/* ==========================================================================
 * PERF2 management-panel warmup | presentation/read-only only
 * ======================================================================= */
async function abisEssPerf2ManagementPrefetch_(){
  if(!sessionToken||document.hidden||mutationBusy)return;
  const jobs=[];
  try{
    if(typeof abisEssM72CanManage_==='function'&&abisEssM72CanManage_()){
      if(!ABIS_ESS_M7_LEAVE_STATE_.data&&!ABIS_ESS_M7_LEAVE_STATE_.loading)jobs.push(function(){return abisEssM7LeaveLoad_(null)});
      if(typeof ABIS_ESS_M8_REPORT_STATE_!=='undefined'&&!ABIS_ESS_M8_REPORT_STATE_.data&&!ABIS_ESS_M8_REPORT_STATE_.loading&&typeof abisEssM8ReportsLoad_==='function')jobs.push(function(){return abisEssM8ReportsLoad_(null)});
    }
    const directCount=Number(homeData&&homeData.leaveDashboard&&homeData.leaveDashboard.directReportCount||0);
    if(directCount>0&&!ABIS_ESS_M7_TEAM_STATE_.data&&!ABIS_ESS_M7_TEAM_STATE_.loading)jobs.push(function(){return abisEssM7TeamLoad_(null)});
  }catch(ignore){}
  for(let i=0;i<jobs.length;i++){
    if(document.hidden||mutationBusy)break;
    try{await jobs[i]()}catch(ignore){}
    await new Promise(function(r){setTimeout(r,180)});
  }
}

/* ===== M8 ===== */
/* ==========================================================================
 * ABIS ESS M8 | Management Reports Frozen Completion UI
 * Version: ABIS_ESS_M8_REPORTS_RC1_7_LOADING_UX_20261006
 *
 * Scope:
 * - HR / Admin management reports only
 * - Week / Month / Quarter / Year / Custom period
 * - Company / site / department / employee filters (source-gated)
 * - Mobile summary + compact detail / Desktop full table
 * - PDF / Excel formal export + immutable snapshot history
 * - Deep links to formal source modules when a verified route exists
 *
 * Boundaries:
 * - Report browsing is read-only.
 * - Export writes only report file + append-only snapshot ledger.
 * - No Attendance / Leave / Employee / Asset / Task / LINE / Payroll mutation.
 * ======================================================================= */

const ABIS_ESS_M8_REPORTS_VERSION_ = 'ABIS_ESS_M8_REPORTS_RC1_7_LOADING_UX_20261006';

const ABIS_ESS_M8_I18N_ = {
  ZH:{
    title:'管理報表',readOnly:'唯讀',refresh:'查詢',reset:'重設',snapshots:'報表快照',back:'返回管理報表',backSnapshot:'返回管理報表',
    periodType:'期間類型',week:'週',month:'月',quarter:'季',year:'年',custom:'自訂期間',anchorDate:'參考日期',startDate:'開始日',endDate:'結束日',
    company:'公司別',site:'廠區',department:'部門',employee:'員工',all:'全部',sourceUnavailable:'資料來源未接入',filterUnavailable:'此篩選尚無正式來源',
    attendance:'出勤報表',leave:'請假報表',employeeChange:'員工異動／離職',asset:'公司資產',task:'待辦／處理狀況',
    openView:'開啟查看',loading:'資料載入中…',loadFailed:'載入失敗，請稍後重新嘗試。',empty:'目前沒有符合條件的資料',emptyHint:'請調整篩選條件或選擇其他期間。',
    stale:'重新整理失敗，目前保留上次成功載入的資料。',sourceNote:'報表僅讀取正式資料來源；需要處理資料時，請回到正式來源模組。',
    expected:'應到',actual:'實到',normal:'正常',exception:'異常',attendanceRate:'出勤率',late:'遲到',early:'早退',missing:'缺卡',correctionPending:'補正中',correctionCompleted:'已完成補正',
    requestCount:'請假人次',uniquePeople:'請假人數',hours:'請假時數',approved:'已核准',pending:'處理中',leaveTypeDistribution:'假別分布',departmentDistribution:'部門分布',
    hireCount:'新進',terminationCount:'離職',offboardingInProgress:'離職辦理中',leavingWithin7Days:'7 日內即將離職',postTerminationOpen:'離職後待結案',overdue:'逾期未完成',
    totalAssets:'資產總數',borrowed:'借用中',pendingReturn:'待歸還',assetOverdue:'逾期未還',damagedLost:'損壞／遺失',terminationPendingReturn:'離職待歸還',
    openTasks:'待處理',claimedTasks:'處理中',completedTasks:'已完成',totalActionable:'目前待辦',taskHistoryUnavailable:'目前 Unified Task 正式讀取只提供 OPEN／CLAIMED；COMPLETED 歷史 KPI 尚無正式來源。',
    detail:'報表明細',rows:'明細筆數',showing:'畫面顯示',source:'正式來源',viewSource:'前往來源',noSourceRoute:'目前沒有可安全開啟的正式來源頁',
    exportTitle:'正式匯出',exportPdf:'匯出 PDF',exportExcel:'匯出 Excel',exporting:'正在產生正式報表…',exportDone:'正式報表已產出',snapshotVersion:'快照版本',download:'開啟檔案',
    snapshotTitle:'報表快照',snapshotEmpty:'目前尚無正式報表快照',generatedAt:'產出時間',generatedBy:'產出人',format:'格式',period:'期間',snapshotRows:'資料筆數',
    companyUnavailable:'員工主檔尚無正式公司別欄位，因此公司篩選暫不啟用。',terminationUnavailable:'員工主檔尚無正式離職日欄位，因此離職日期 KPI 不推算。',assetUnavailable:'公司資產 SSOT 尚未接入，因此不建立假資產資料。',
    taskLazy:'待辦報表採開啟後載入，避免首頁因全員 Task 掃描逾時。',taskScopeWarning:'Task 報表目前僅統計正式 Unified Task 可讀取範圍。',
    statusNormal:'正常',statusException:'異常',statusOpen:'待處理',statusClaimed:'處理中',statusCompleted:'已完成',statusSubmitted:'已送出',statusManagerConfirmed:'主管已確認',statusHrPending:'待 HR',statusApplyPending:'待套用',
    categoryReturnedLeave:'假單退回',categoryAttendance:'出勤異常',categoryApproval:'待簽核',categorySupplement:'待補件',hire:'新進',termination:'離職',
    date:'日期',employeeId:'員工編號',name:'姓名',expectedIn:'應上班',expectedOut:'應下班',actualIn:'實際上班',actualOut:'實際下班',status:'狀態',exceptions:'異常',correctionStatus:'補正狀態',
    leaveType:'假別',leavePeriod:'請假期間',assetId:'資產編號',assetName:'資產名稱',borrower:'借用人',dueDate:'應歸還日',taskTitle:'待辦',taskCategory:'類別',assignee:'負責人'
  },
  VI:{
    title:'Báo cáo quản lý',readOnly:'Chỉ xem',refresh:'Tra cứu',reset:'Đặt lại',snapshots:'Bản chụp báo cáo',back:'Quay lại báo cáo',backSnapshot:'Quay lại báo cáo',
    periodType:'Loại kỳ',week:'Tuần',month:'Tháng',quarter:'Quý',year:'Năm',custom:'Tùy chỉnh',anchorDate:'Ngày tham chiếu',startDate:'Ngày bắt đầu',endDate:'Ngày kết thúc',
    company:'Công ty',site:'Cơ sở',department:'Bộ phận',employee:'Nhân viên',all:'Tất cả',sourceUnavailable:'Nguồn dữ liệu chưa kết nối',filterUnavailable:'Bộ lọc này chưa có nguồn chính thức',
    attendance:'Báo cáo chấm công',leave:'Báo cáo nghỉ phép',employeeChange:'Biến động / nghỉ việc',asset:'Tài sản công ty',task:'Tình trạng công việc',
    openView:'Mở xem',loading:'Đang tải dữ liệu…',loadFailed:'Tải thất bại. Vui lòng thử lại sau.',empty:'Không có dữ liệu phù hợp',emptyHint:'Hãy điều chỉnh bộ lọc hoặc chọn kỳ khác.',
    stale:'Làm mới thất bại; đang giữ dữ liệu tải thành công gần nhất.',sourceNote:'Báo cáo chỉ đọc nguồn dữ liệu chính thức. Muốn xử lý dữ liệu, hãy quay về mô-đun nguồn.',
    expected:'Phải đi làm',actual:'Có chấm công',normal:'Bình thường',exception:'Bất thường',attendanceRate:'Tỷ lệ chấm công',late:'Đi trễ',early:'Về sớm',missing:'Thiếu chấm công',correctionPending:'Đang bổ chính',correctionCompleted:'Đã bổ chính',
    requestCount:'Lượt nghỉ',uniquePeople:'Số người nghỉ',hours:'Giờ nghỉ',approved:'Đã duyệt',pending:'Đang xử lý',leaveTypeDistribution:'Phân bố loại nghỉ',departmentDistribution:'Phân bố bộ phận',
    hireCount:'Mới vào',terminationCount:'Nghỉ việc',offboardingInProgress:'Đang làm thủ tục nghỉ',leavingWithin7Days:'Sắp nghỉ trong 7 ngày',postTerminationOpen:'Chưa kết thúc sau nghỉ',overdue:'Quá hạn',
    totalAssets:'Tổng tài sản',borrowed:'Đang mượn',pendingReturn:'Chờ trả',assetOverdue:'Quá hạn chưa trả',damagedLost:'Hỏng / mất',terminationPendingReturn:'Nghỉ việc chưa trả',
    openTasks:'Chờ xử lý',claimedTasks:'Đang xử lý',completedTasks:'Đã hoàn tất',totalActionable:'Việc hiện tại',taskHistoryUnavailable:'Nguồn Unified Task chính thức hiện chỉ cung cấp OPEN/CLAIMED; chưa có nguồn lịch sử COMPLETED chính thức.',
    detail:'Chi tiết báo cáo',rows:'Số dòng',showing:'Đang hiển thị',source:'Nguồn chính thức',viewSource:'Mở nguồn',noSourceRoute:'Hiện chưa có trang nguồn chính thức có thể mở an toàn',
    exportTitle:'Xuất chính thức',exportPdf:'Xuất PDF',exportExcel:'Xuất Excel',exporting:'Đang tạo báo cáo chính thức…',exportDone:'Đã tạo báo cáo chính thức',snapshotVersion:'Phiên bản bản chụp',download:'Mở tệp',
    snapshotTitle:'Bản chụp báo cáo',snapshotEmpty:'Chưa có bản chụp báo cáo chính thức',generatedAt:'Thời gian tạo',generatedBy:'Người tạo',format:'Định dạng',period:'Kỳ',snapshotRows:'Số dòng',
    companyUnavailable:'Hồ sơ nhân viên chưa có trường công ty chính thức nên bộ lọc công ty tạm thời không dùng.',terminationUnavailable:'Hồ sơ nhân viên chưa có ngày nghỉ việc chính thức nên KPI nghỉ việc không được suy đoán.',assetUnavailable:'Chưa kết nối SSOT tài sản công ty nên không tạo dữ liệu tài sản giả.',
    taskLazy:'Báo cáo công việc chỉ tải khi mở để tránh quét toàn bộ nhân viên làm trang chủ quá thời gian.',taskScopeWarning:'Báo cáo công việc chỉ thống kê phạm vi Unified Task chính thức có thể đọc.',
    statusNormal:'Bình thường',statusException:'Bất thường',statusOpen:'Chờ xử lý',statusClaimed:'Đang xử lý',statusCompleted:'Đã hoàn tất',statusSubmitted:'Đã gửi',statusManagerConfirmed:'Quản lý đã xác nhận',statusHrPending:'Chờ HR',statusApplyPending:'Chờ áp dụng',
    categoryReturnedLeave:'Đơn nghỉ bị trả lại',categoryAttendance:'Bất thường chấm công',categoryApproval:'Chờ phê duyệt',categorySupplement:'Chờ bổ sung',hire:'Mới vào',termination:'Nghỉ việc',
    date:'Ngày',employeeId:'Mã NV',name:'Họ tên',expectedIn:'Giờ vào dự kiến',expectedOut:'Giờ ra dự kiến',actualIn:'Giờ vào thực tế',actualOut:'Giờ ra thực tế',status:'Trạng thái',exceptions:'Bất thường',correctionStatus:'Trạng thái bổ chính',
    leaveType:'Loại nghỉ',leavePeriod:'Thời gian nghỉ',assetId:'Mã tài sản',assetName:'Tên tài sản',borrower:'Người mượn',dueDate:'Ngày phải trả',taskTitle:'Công việc',taskCategory:'Loại',assignee:'Người phụ trách'
  },
  TH:{
    title:'รายงานการจัดการ',readOnly:'ดูอย่างเดียว',refresh:'ค้นหา',reset:'รีเซ็ต',snapshots:'สแนปช็อตรายงาน',back:'กลับไปรายงาน',backSnapshot:'กลับไปรายงาน',
    periodType:'ประเภทช่วงเวลา',week:'สัปดาห์',month:'เดือน',quarter:'ไตรมาส',year:'ปี',custom:'กำหนดเอง',anchorDate:'วันที่อ้างอิง',startDate:'วันเริ่มต้น',endDate:'วันสิ้นสุด',
    company:'บริษัท',site:'สถานที่',department:'แผนก',employee:'พนักงาน',all:'ทั้งหมด',sourceUnavailable:'ยังไม่ได้เชื่อมแหล่งข้อมูล',filterUnavailable:'ตัวกรองนี้ยังไม่มีแหล่งข้อมูลทางการ',
    attendance:'รายงานเวลา',leave:'รายงานการลา',employeeChange:'การเปลี่ยนแปลง/ลาออก',asset:'ทรัพย์สินบริษัท',task:'สถานะงาน',
    openView:'เปิดดู',loading:'กำลังโหลดข้อมูล…',loadFailed:'โหลดไม่สำเร็จ โปรดลองใหม่ภายหลัง',empty:'ไม่มีข้อมูลตามเงื่อนไข',emptyHint:'โปรดปรับตัวกรองหรือเลือกช่วงเวลาอื่น',
    stale:'รีเฟรชไม่สำเร็จ ขณะนี้ยังแสดงข้อมูลล่าสุดที่โหลดสำเร็จ',sourceNote:'รายงานอ่านเฉพาะแหล่งข้อมูลทางการ หากต้องแก้ไขข้อมูลให้กลับไปยังโมดูลต้นทาง',
    expected:'ควรมาทำงาน',actual:'มีการลงเวลา',normal:'ปกติ',exception:'ผิดปกติ',attendanceRate:'อัตราการลงเวลา',late:'มาสาย',early:'กลับก่อน',missing:'ขาดการลงเวลา',correctionPending:'กำลังแก้ไข',correctionCompleted:'แก้ไขเสร็จแล้ว',
    requestCount:'จำนวนการลา',uniquePeople:'จำนวนผู้ลา',hours:'ชั่วโมงลา',approved:'อนุมัติแล้ว',pending:'กำลังดำเนินการ',leaveTypeDistribution:'สัดส่วนประเภทการลา',departmentDistribution:'สัดส่วนแผนก',
    hireCount:'เข้าใหม่',terminationCount:'ลาออก',offboardingInProgress:'กำลังดำเนินการลาออก',leavingWithin7Days:'จะลาออกภายใน 7 วัน',postTerminationOpen:'หลังลาออกยังไม่ปิดงาน',overdue:'เกินกำหนด',
    totalAssets:'ทรัพย์สินทั้งหมด',borrowed:'กำลังยืม',pendingReturn:'รอคืน',assetOverdue:'เกินกำหนดยังไม่คืน',damagedLost:'เสียหาย/สูญหาย',terminationPendingReturn:'ลาออกแต่ยังไม่คืน',
    openTasks:'รอดำเนินการ',claimedTasks:'กำลังดำเนินการ',completedTasks:'เสร็จแล้ว',totalActionable:'งานปัจจุบัน',taskHistoryUnavailable:'แหล่ง Unified Task ทางการปัจจุบันมีเฉพาะ OPEN/CLAIMED และยังไม่มีประวัติ COMPLETED ทางการ',
    detail:'รายละเอียดรายงาน',rows:'จำนวนรายการ',showing:'กำลังแสดง',source:'แหล่งข้อมูลทางการ',viewSource:'เปิดแหล่งข้อมูล',noSourceRoute:'ยังไม่มีหน้าต้นทางทางการที่เปิดได้อย่างปลอดภัย',
    exportTitle:'ส่งออกรายงานทางการ',exportPdf:'ส่งออก PDF',exportExcel:'ส่งออก Excel',exporting:'กำลังสร้างรายงานทางการ…',exportDone:'สร้างรายงานทางการแล้ว',snapshotVersion:'เวอร์ชันสแนปช็อต',download:'เปิดไฟล์',
    snapshotTitle:'สแนปช็อตรายงาน',snapshotEmpty:'ยังไม่มีสแนปช็อตรายงานทางการ',generatedAt:'เวลาที่สร้าง',generatedBy:'ผู้สร้าง',format:'รูปแบบ',period:'ช่วงเวลา',snapshotRows:'จำนวนรายการ',
    companyUnavailable:'ข้อมูลพนักงานยังไม่มีช่องบริษัททางการ จึงยังไม่เปิดตัวกรองบริษัท',terminationUnavailable:'ข้อมูลพนักงานยังไม่มีวันลาออกทางการ จึงไม่อนุมาน KPI วันลาออก',assetUnavailable:'ยังไม่ได้เชื่อม SSOT ทรัพย์สินบริษัท จึงไม่สร้างข้อมูลทรัพย์สินจำลอง',
    taskLazy:'รายงานงานจะโหลดเมื่อเปิด เพื่อหลีกเลี่ยงการสแกนพนักงานทั้งหมดจนหน้าแรกหมดเวลา',taskScopeWarning:'รายงานงานสรุปเฉพาะขอบเขต Unified Task ทางการที่อ่านได้',
    statusNormal:'ปกติ',statusException:'ผิดปกติ',statusOpen:'รอดำเนินการ',statusClaimed:'กำลังดำเนินการ',statusCompleted:'เสร็จแล้ว',statusSubmitted:'ส่งแล้ว',statusManagerConfirmed:'หัวหน้ายืนยันแล้ว',statusHrPending:'รอ HR',statusApplyPending:'รอนำไปใช้',
    categoryReturnedLeave:'ใบลาถูกส่งกลับ',categoryAttendance:'เวลาทำงานผิดปกติ',categoryApproval:'รออนุมัติ',categorySupplement:'รอเอกสารเพิ่ม',hire:'เข้าใหม่',termination:'ลาออก',
    date:'วันที่',employeeId:'รหัสพนักงาน',name:'ชื่อ',expectedIn:'เวลาเข้างานที่ควรเป็น',expectedOut:'เวลาออกงานที่ควรเป็น',actualIn:'เวลาเข้างานจริง',actualOut:'เวลาออกงานจริง',status:'สถานะ',exceptions:'ความผิดปกติ',correctionStatus:'สถานะแก้ไข',
    leaveType:'ประเภทการลา',leavePeriod:'ช่วงลา',assetId:'รหัสทรัพย์สิน',assetName:'ชื่อทรัพย์สิน',borrower:'ผู้ยืม',dueDate:'วันครบกำหนดคืน',taskTitle:'งาน',taskCategory:'ประเภท',assignee:'ผู้รับผิดชอบ'
  }
};

function abisEssM8t_(k){
  const lang=ABIS_ESS_M8_I18N_[currentLang]?currentLang:'ZH';
  return ABIS_ESS_M8_I18N_[lang][k]||ABIS_ESS_M8_I18N_.ZH[k]||k;
}
function abisEssM8Esc_(v){return escapeHtml(String(v===null||v===undefined?'':v));}
function abisEssM8Today_(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function abisEssM8Month_(){return abisEssM8Today_().slice(0,7)}

const ABIS_ESS_M8_REPORT_STATE_={
  periodType:'MONTH',month:abisEssM8Month_(),anchorDate:abisEssM8Today_(),year:String(new Date().getFullYear()),startDate:abisEssM8Today_(),endDate:abisEssM8Today_(),
  company:'',site:'',department:'',employeeId:'',
  loading:false,data:null,error:'',view:'HOME',reportType:'',detailLoading:false,detail:null,detailError:'',
  exportLoading:false,exportResult:null,exportError:'',
  snapshotsLoading:false,snapshots:null,snapshotError:'',
  detailCache:Object.create(null),detailInflight:Object.create(null),homeLoadedAt:0
};

function abisEssM8SyncLegacyView_(){
  try{ABIS_ESS_M7_REPORT_STATE_.view=ABIS_ESS_M8_REPORT_STATE_.view==='DETAIL'?'DETAIL':'HOME'}catch(ignore){}
}
function abisEssM8SetView_(view){ABIS_ESS_M8_REPORT_STATE_.view=view;abisEssM8SyncLegacyView_()}

function abisEssM8PeriodTypeChanged_(el){
  const s=ABIS_ESS_M8_REPORT_STATE_;
  abisEssM8ReadControls_();
  s.periodType=String(el&&el.value||'MONTH').toUpperCase();
  if(accountPanel_==='managementReports')renderMyAccount_();
}
function abisEssM8ReadControls_(){
  const s=ABIS_ESS_M8_REPORT_STATE_;
  const get=id=>$(id);
  const pt=get('abisM8PeriodType');if(pt)s.periodType=String(pt.value||'MONTH').toUpperCase();
  const mo=get('abisM8Month');if(mo&&mo.value)s.month=mo.value;
  const ad=get('abisM8AnchorDate');if(ad&&ad.value)s.anchorDate=ad.value;
  const yr=get('abisM8Year');if(yr&&yr.value)s.year=yr.value;
  const sd=get('abisM8StartDate');if(sd&&sd.value)s.startDate=sd.value;
  const ed=get('abisM8EndDate');if(ed&&ed.value)s.endDate=ed.value;
  const co=get('abisM8Company');if(co)s.company=co.value;
  const si=get('abisM8Site');if(si)s.site=si.value;
  const dp=get('abisM8Department');if(dp)s.department=dp.value;
  const em=get('abisM8Employee');if(em)s.employeeId=em.value;
}
function abisEssM8Payload_(extra){
  const s=ABIS_ESS_M8_REPORT_STATE_,p={periodType:s.periodType,company:s.company,site:s.site,department:s.department,employeeId:s.employeeId};
  if(s.periodType==='MONTH')p.month=s.month;
  else if(s.periodType==='YEAR')p.year=s.year;
  else if(s.periodType==='CUSTOM'){p.startDate=s.startDate;p.endDate=s.endDate;}
  else p.anchorDate=s.anchorDate;
  return Object.assign(p,extra||{});
}

function abisEssM8OptionHtml_(value,label,selected){return '<option value="'+abisEssM8Esc_(value)+'" '+(String(value)===String(selected)?'selected':'')+'>'+abisEssM8Esc_(label)+'</option>'}
function abisEssM8Select_(id,values,selected,labelKey,disabled){
  let h='<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_(labelKey))+'</span><select id="'+id+'" '+(disabled?'disabled':'')+'>'+abisEssM8OptionHtml_('',abisEssM8t_('all'),selected);
  (values||[]).forEach(function(v){if(typeof v==='object')h+=abisEssM8OptionHtml_(v.employeeId,(v.name||v.employeeId)+' '+(v.employeeId||''),selected);else h+=abisEssM8OptionHtml_(v,v,selected)});
  return h+'</select></label>';
}
function abisEssM8PeriodControlsHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_;let specific='';
  if(s.periodType==='MONTH')specific='<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('month'))+'</span><input id="abisM8Month" type="month" value="'+abisEssM8Esc_(s.month)+'"></label>';
  else if(s.periodType==='YEAR')specific='<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('year'))+'</span><input id="abisM8Year" type="number" inputmode="numeric" min="2000" max="2200" value="'+abisEssM8Esc_(s.year)+'"></label>';
  else if(s.periodType==='CUSTOM')specific='<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('startDate'))+'</span><input id="abisM8StartDate" type="date" value="'+abisEssM8Esc_(s.startDate)+'"></label><label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('endDate'))+'</span><input id="abisM8EndDate" type="date" value="'+abisEssM8Esc_(s.endDate)+'"></label>';
  else specific='<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('anchorDate'))+'</span><input id="abisM8AnchorDate" type="date" value="'+abisEssM8Esc_(s.anchorDate)+'"></label>';
  return '<label class="abis-m8-filter"><span>'+abisEssM8Esc_(abisEssM8t_('periodType'))+'</span><select id="abisM8PeriodType" onchange="abisEssM8PeriodTypeChanged_(this)">'+
    ['WEEK','MONTH','QUARTER','YEAR','CUSTOM'].map(function(x){const k={WEEK:'week',MONTH:'month',QUARTER:'quarter',YEAR:'year',CUSTOM:'custom'}[x];return abisEssM8OptionHtml_(x,abisEssM8t_(k),s.periodType)}).join('')+'</select></label>'+specific;
}

function abisEssM8FiltersHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_,o=s.data&&s.data.options||{},av=o.availability||{};
  let h='<div class="abis-m8-filter-grid">'+abisEssM8PeriodControlsHtml_();
  h+=abisEssM8Select_('abisM8Company',o.companies||[],s.company,'company',!av.company);
  h+=abisEssM8Select_('abisM8Site',o.sites||[],s.site,'site',false);
  h+=abisEssM8Select_('abisM8Department',o.departments||[],s.department,'department',false);
  h+=abisEssM8Select_('abisM8Employee',o.employees||[],s.employeeId,'employee',false);
  h+='</div>';
  if(s.data&&s.data.sourceAvailability&&!s.data.sourceAvailability.companyDimension)h+='<div class="abis-m8-info">'+abisEssM8Esc_(abisEssM8t_('companyUnavailable'))+'</div>';
  return h;
}

function abisEssM8CacheKey_(type,payload){return String(type||'')+'|'+JSON.stringify(payload||{})}
function abisEssM8DetailFresh_(entry){return !!entry&&Date.now()-Number(entry.at||0)<60000}
async function abisEssM8FetchDetail_(type,payload){const s=ABIS_ESS_M8_REPORT_STATE_,key=abisEssM8CacheKey_(type,payload);const cached=s.detailCache[key];if(abisEssM8DetailFresh_(cached))return cached.data;if(s.detailInflight[key])return s.detailInflight[key];const p=call('managementReportDetailV2',Object.assign({sessionToken,reportType:type},payload)).then(function(d){s.detailCache[key]={at:Date.now(),data:d};return d}).finally(function(){delete s.detailInflight[key]});s.detailInflight[key]=p;return p}
function abisEssM8WarmCommonDetails_(){const s=ABIS_ESS_M8_REPORT_STATE_;if(!s.data||document.hidden)return;const p=abisEssM8Payload_();['ATTENDANCE','LEAVE','EMPLOYEE_CHANGE'].forEach(function(type,i){setTimeout(function(){if(document.hidden||!sessionToken)return;abisEssM8FetchDetail_(type,p).catch(function(){})},700+i*850)})}

async function abisEssM8ReportsLoad_(btn){
  const s=ABIS_ESS_M8_REPORT_STATE_;abisEssM8ReadControls_();if(s.loading)return;
  s.loading=true;s.error='';if(btn)btn.disabled=true;if(accountPanel_==='managementReports')renderMyAccount_();
  try{
    const d=await call('managementReportsV2',Object.assign({sessionToken},abisEssM8Payload_()));
    s.data=d;s.homeLoadedAt=Date.now();s.detail=null;s.detailError='';s.exportResult=null;s.exportError='';setTimeout(abisEssM8WarmCommonDetails_,300);
  }catch(e){s.error=e&&e.message?e.message:String(e)}
  finally{s.loading=false;if(btn&&btn.isConnected)btn.disabled=false;if(accountPanel_==='managementReports'&&s.view==='HOME')renderMyAccount_()}
}
function abisEssM8Reset_(btn){
  const s=ABIS_ESS_M8_REPORT_STATE_;Object.assign(s,{periodType:'MONTH',month:abisEssM8Month_(),anchorDate:abisEssM8Today_(),year:String(new Date().getFullYear()),startDate:abisEssM8Today_(),endDate:abisEssM8Today_(),company:'',site:'',department:'',employeeId:''});
  abisEssM8ReportsLoad_(btn);
}

function abisEssM8FmtNum_(v){const n=Number(v);return Number.isFinite(n)?String(Math.round(n*100)/100):'—'}
function abisEssM8Kpi_(label,value,note){return '<div class="abis-m8-kpi"><b>'+abisEssM8Esc_(value==null?'—':value)+'</b><span>'+abisEssM8Esc_(label)+'</span>'+(note?'<small>'+abisEssM8Esc_(note)+'</small>':'')+'</div>'}
function abisEssM8Card_(type,title,primary,secondary,available,lazy){
  return '<button type="button" class="abis-m8-report-card '+(!available?'is-disabled':'')+'" '+(available?'onclick="abisEssM8ReportOpen_(\''+type+'\',this)"':'disabled')+'><div><b>'+abisEssM8Esc_(title)+'</b><span>'+abisEssM8Esc_(secondary||'')+'</span></div><strong>'+abisEssM8Esc_(primary)+'</strong><i>'+(available?'›':'')+'</i>'+(lazy?'<small>'+abisEssM8Esc_(abisEssM8t_('openView'))+'</small>':'')+'</button>';
}
function abisEssM8HomeCardsHtml_(){
  const d=ABIS_ESS_M8_REPORT_STATE_.data||{},c=d.cards||{},src=d.sourceAvailability||{};
  const a=c.attendance&&c.attendance.summary||{},l=c.leave&&c.leave.summary||{},e=c.employeeChange&&c.employeeChange.summary||{},as=c.assets&&c.assets.summary||{},t=c.tasks||{};
  return '<div class="abis-m8-report-grid">'+
    abisEssM8Card_('ATTENDANCE',abisEssM8t_('attendance'),abisEssM8FmtNum_(a.exception||0),abisEssM8t_('attendanceRate')+' '+abisEssM8FmtNum_(a.attendanceRate||0)+'%',!!(c.attendance&&c.attendance.available),false)+
    abisEssM8Card_('LEAVE',abisEssM8t_('leave'),abisEssM8FmtNum_(l.requestCount||0),abisEssM8t_('hours')+' '+abisEssM8FmtNum_(l.hours||0),!!(c.leave&&c.leave.available),false)+
    abisEssM8Card_('EMPLOYEE_CHANGE',abisEssM8t_('employeeChange'),abisEssM8FmtNum_(e.hireCount||0),abisEssM8t_('terminationCount')+' '+(src.terminationDate?abisEssM8FmtNum_(e.terminationCount||0):'—'),!!(c.employeeChange&&c.employeeChange.available),false)+
    abisEssM8Card_('ASSET',abisEssM8t_('asset'),src.assets?abisEssM8FmtNum_(as.borrowed||0):'—',src.assets?abisEssM8t_('borrowed'):abisEssM8t_('sourceUnavailable'),!!src.assets,false)+
    abisEssM8Card_('TASK',abisEssM8t_('task'),'',abisEssM8t_('taskLazy'),!!src.tasks,true)+
    '</div>';
}

function abisEssM8SourceWarningsHtml_(){
  const d=ABIS_ESS_M8_REPORT_STATE_.data||{},src=d.sourceAvailability||{},bits=[];
  if(src.terminationDate===false)bits.push(abisEssM8t_('terminationUnavailable'));
  if(src.assets===false)bits.push(abisEssM8t_('assetUnavailable'));
  if(src.taskHistory===false)bits.push(abisEssM8t_('taskHistoryUnavailable'));
  return bits.length?'<div class="abis-m8-boundary-list">'+bits.map(x=>'<div>'+abisEssM8Esc_(x)+'</div>').join('')+'</div>':'';
}

function abisEssM8ReportsHomeHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_;
  const d=s.data||{};

  return (
    '<div class="abis-m8-root">'+

      '<div class="abis-m8-head">'+
        '<div>'+
          '<h3>'+abisEssM8Esc_(abisEssM8t_('title'))+'</h3>'+
          '<span class="abis-m71-readonly">'+
            abisEssM8Esc_(abisEssM8t_('readOnly'))+
          '</span>'+
        '</div>'+
        (
          d.period
            ? '<strong>'+abisEssM8Esc_(d.period.label||'')+'</strong>'
            : ''
        )+
      '</div>'+

      abisEssM8FiltersHtml_()+

      '<div class="abis-m8-actions">'+
        /*
         * Keep the original button label while loading.
         * Global Async Button Controller owns compact spinner/busy UI.
         * A short label such as "查詢" therefore renders spinner-only.
         */
        '<button type="button" '+
          'onclick="abisEssM8ReportsLoad_(this)" '+
          (s.loading?'disabled ':'')+
        '>'+abisEssM8Esc_(abisEssM8t_('refresh'))+'</button>'+

        '<button type="button" class="secondary" '+
          'onclick="abisEssM8Reset_(this)" '+
          (s.loading?'disabled ':'')+
        '>'+abisEssM8Esc_(abisEssM8t_('reset'))+'</button>'+

        '<button type="button" class="secondary" '+
          'onclick="abisEssM8OpenSnapshots_(this)">'+
          abisEssM8Esc_(abisEssM8t_('snapshots'))+
        '</button>'+
      '</div>'+

      (
        s.error
          ? '<div class="abis-m8-error">'+
              abisEssM8Esc_(s.data?abisEssM8t_('stale'):s.error)+
            '</div>'
          : ''
      )+

      (
        s.loading&&!s.data
          ? '<div class="abis-m8-skeleton"><i></i><i></i><i></i></div>'
          : (
              s.data
                ? abisEssM8HomeCardsHtml_()
                : '<div class="abis-m8-empty">'+
                    abisEssM8Esc_(abisEssM8t_('loading'))+
                  '</div>'
            )
      )+

      abisEssM8SourceWarningsHtml_()+

      '<div class="abis-m8-note">'+
        abisEssM8Esc_(abisEssM8t_('sourceNote'))+
      '</div>'+

    '</div>'
  );
}

async function abisEssM8ReportOpen_(type,btn){
  const s=ABIS_ESS_M8_REPORT_STATE_;

  abisEssM8ReadControls_();

  const reportType=String(type||'').toUpperCase();
  s.reportType=reportType;

  const payload=abisEssM8Payload_();
  const key=abisEssM8CacheKey_(reportType,payload);
  const cached=s.detailCache[key];

  s.detailError='';
  s.exportResult=null;
  s.exportError='';

  /*
   * PERF2 cache hit: no backend wait, so switch immediately.
   * Do not display a fake loading state.
   */
  if(cached&&abisEssM8DetailFresh_(cached)){
    s.detail=cached.data;
    s.detailLoading=false;
    abisEssM8SetView_('DETAIL');

    if(accountPanel_==='managementReports'){
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
    }

    return s.detail;
  }

  /*
   * Uncached detail: keep HOME visible while the backend request runs.
   * The global structured-card busy controller keeps the clicked report card
   * visible, locks it, hides its chevron, and shows the compact busy badge.
   */
  const requestSeq=Number(s.detailRequestSeq||0)+1;
  s.detailRequestSeq=requestSeq;
  s.detailLoading=true;
  s.detail=null;

  try{
    const detail=await abisEssM8FetchDetail_(reportType,payload);

    /* A newer report click already owns the visible result. */
    if(requestSeq!==s.detailRequestSeq)return null;

    s.detail=detail;
    s.detailLoading=false;

    /* Switch only after detail data is ready. */
    abisEssM8SetView_('DETAIL');

    if(accountPanel_==='managementReports'){
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();

      try{
        window.scrollTo({top:0,behavior:'smooth'});
      }catch(ignore){
        window.scrollTo(0,0);
      }
    }

    return detail;

  }catch(e){
    if(requestSeq!==s.detailRequestSeq)return null;

    s.detailLoading=false;
    s.detail=null;
    s.detailError=e&&e.message?e.message:String(e);

    /* Keep the report HOME visible when detail loading fails. */
    message(s.detailError,'warning');
    return null;
  }
}
function abisEssM8ReportBack_(){const s=ABIS_ESS_M8_REPORT_STATE_;abisEssM8SetView_('HOME');s.detail=null;s.detailError='';s.exportResult=null;s.exportError='';renderMyAccount_()}

function abisEssM8ReportTitle_(type){return {ATTENDANCE:abisEssM8t_('attendance'),LEAVE:abisEssM8t_('leave'),EMPLOYEE_CHANGE:abisEssM8t_('employeeChange'),ASSET:abisEssM8t_('asset'),TASK:abisEssM8t_('task')}[type]||type}
function abisEssM8Status_(v){const x=String(v||'').toUpperCase();return {NORMAL:abisEssM8t_('statusNormal'),EXCEPTION:abisEssM8t_('statusException'),OPEN:abisEssM8t_('statusOpen'),CLAIMED:abisEssM8t_('statusClaimed'),COMPLETED:abisEssM8t_('statusCompleted'),SUBMITTED:abisEssM8t_('statusSubmitted'),MANAGER_CONFIRMED:abisEssM8t_('statusManagerConfirmed'),HR_PENDING:abisEssM8t_('statusHrPending'),APPLY_PENDING:abisEssM8t_('statusApplyPending')}[x]||String(v||'—')}
function abisEssM8Category_(v){const x=String(v||'').toUpperCase();return {RETURNED_LEAVE:abisEssM8t_('categoryReturnedLeave'),ATTENDANCE_EXCEPTION:abisEssM8t_('categoryAttendance'),APPROVAL:abisEssM8t_('categoryApproval'),SUPPLEMENT:abisEssM8t_('categorySupplement')}[x]||String(v||'—')}
function abisEssM8ChangeType_(v){return String(v||'').toUpperCase()==='HIRE'?abisEssM8t_('hire'):abisEssM8t_('termination')}

function abisEssM8SummaryHtml_(type,r){
  const x=r&&r.summary||{};let a=[];
  if(type==='ATTENDANCE')a=[[abisEssM8t_('expected'),x.expected],[abisEssM8t_('actual'),x.actual],[abisEssM8t_('normal'),x.normal],[abisEssM8t_('exception'),x.exception],[abisEssM8t_('attendanceRate'),abisEssM8FmtNum_(x.attendanceRate||0)+'%'],[abisEssM8t_('late'),x.late],[abisEssM8t_('early'),x.early],[abisEssM8t_('missing'),x.missing],[abisEssM8t_('correctionPending'),x.correctionPending],[abisEssM8t_('correctionCompleted'),x.correctionCompleted]];
  else if(type==='LEAVE')a=[[abisEssM8t_('requestCount'),x.requestCount],[abisEssM8t_('uniquePeople'),x.uniquePeople],[abisEssM8t_('hours'),abisEssM8FmtNum_(x.hours)],[abisEssM8t_('approved'),x.approved],[abisEssM8t_('pending'),x.pending]];
  else if(type==='EMPLOYEE_CHANGE')a=[[abisEssM8t_('hireCount'),x.hireCount],[abisEssM8t_('terminationCount'),x.terminationCount],[abisEssM8t_('offboardingInProgress'),x.offboardingInProgress],[abisEssM8t_('leavingWithin7Days'),x.leavingWithin7Days],[abisEssM8t_('postTerminationOpen'),x.postTerminationOpen],[abisEssM8t_('overdue'),x.overdue]];
  else if(type==='ASSET')a=[[abisEssM8t_('totalAssets'),x.total],[abisEssM8t_('borrowed'),x.borrowed],[abisEssM8t_('pendingReturn'),x.pendingReturn],[abisEssM8t_('assetOverdue'),x.overdue],[abisEssM8t_('damagedLost'),x.damagedLost],[abisEssM8t_('terminationPendingReturn'),x.terminationPendingReturn]];
  else if(type==='TASK')a=[[abisEssM8t_('openTasks'),x.open],[abisEssM8t_('claimedTasks'),x.claimed],[abisEssM8t_('totalActionable'),x.totalActionable],[abisEssM8t_('completedTasks'),x.completed]];
  return '<div class="abis-m8-kpi-grid">'+a.map(z=>abisEssM8Kpi_(z[0],z[1])).join('')+'</div>';
}
function abisEssM8DistributionHtml_(title,obj,mapFn){
  const rows=Object.keys(obj||{}).map(k=>[k,Number(obj[k]||0)]).sort((a,b)=>b[1]-a[1]);if(!rows.length)return '';
  const max=Math.max.apply(null,rows.map(r=>r[1]).concat([1]));
  return '<div class="abis-m8-dist"><h4>'+abisEssM8Esc_(title)+'</h4>'+rows.slice(0,12).map(function(r){const label=mapFn?mapFn(r[0]):r[0];return '<div><span>'+abisEssM8Esc_(label)+'</span><i><em style="width:'+Math.max(2,Math.round(r[1]*100/max))+'%"></em></i><b>'+abisEssM8Esc_(r[1])+'</b></div>'}).join('')+'</div>';
}
function abisEssM8AnalysisHtml_(type,r){
  if(type==='LEAVE')return '<div class="abis-m8-analysis">'+abisEssM8DistributionHtml_(abisEssM8t_('leaveTypeDistribution'),r.summary&&r.summary.byType)+abisEssM8DistributionHtml_(abisEssM8t_('departmentDistribution'),r.summary&&r.summary.byDepartment)+'</div>';
  if(type==='TASK')return '<div class="abis-m8-analysis">'+abisEssM8DistributionHtml_(abisEssM8t_('taskCategory'),r.summary&&r.summary.byCategory,abisEssM8Category_)+'</div>';
  return '';
}

function abisEssM8SourceButton_(type,x){
  const src=x&&x.source||{};if(!src.available)return '';
  let args='';if(type==='ATTENDANCE')args="'ATTENDANCE','"+encodeURIComponent(String(x.date||''))+"','"+encodeURIComponent(String(x.site||''))+"'";
  else if(type==='LEAVE')args="'LEAVE','"+encodeURIComponent(String(x.leaveId||''))+"',''";
  else if(type==='EMPLOYEE_CHANGE')args="'EMPLOYEE','"+encodeURIComponent(String(x.employeeId||''))+"',''";
  else return '';
  return '<button type="button" class="abis-m8-source-btn" onclick="abisEssM8OpenSource_('+args+',this)">'+abisEssM8Esc_(abisEssM8t_('viewSource'))+'</button>';
}
function abisEssM8OpenSource_(kind,a,b,btn){
  kind=String(kind||'').toUpperCase();const v=decodeURIComponent(String(a||'')),v2=decodeURIComponent(String(b||''));if(btn)btn.disabled=true;
  try{
    if(kind==='LEAVE'&&v){rc2OpenAccountPanel_('leaveManagement');setTimeout(function(){abisEssM7LeaveOpen_(encodeURIComponent(v),null)},0);return;}
    if(kind==='EMPLOYEE'&&v){rc2OpenAccountPanel_('employeeManagement');setTimeout(function(){abisEssM71OpenDetail_(v,null,true)},0);return;}
    if(kind==='ATTENDANCE'&&v){
      const map={'新店廠':'XINDIAN','辦公室':'OFFICE','彰濱廠':'CHANGBIN','XINDIAN':'XINDIAN','OFFICE':'OFFICE','CHANGBIN':'CHANGBIN'};const scope=map[v2]||'ALL';
      rc2OpenAccountPanel_('attendanceManagement');ABIS_ESS_M72_STATE_.date=v;ABIS_ESS_M72_STATE_.site=scope;setTimeout(function(){abisEssM72Load_(null)},0);return;
    }
    message(abisEssM8t_('noSourceRoute'));
  }finally{if(btn&&btn.isConnected)btn.disabled=false}
}

function abisEssM8MobileRow_(type,x){
  let title='',sub='',meta='';
  if(type==='ATTENDANCE'){title=(x.date||'')+' · '+(x.name||x.employeeId||'');sub=[x.department,x.site,abisEssM8Status_(x.status)].filter(Boolean).join(' · ');meta=(x.exceptionLabels||[]).join('、')||[(x.actualIn||'—'),(x.actualOut||'—')].join(' → ')}
  else if(type==='LEAVE'){title=(x.startDate||'')+' · '+(x.employeeName||x.employeeId||'');sub=[x.leaveType,x.department,x.site].filter(Boolean).join(' · ');meta=[x.status,abisEssM8FmtNum_(x.hours)+' HR'].filter(Boolean).join(' · ')}
  else if(type==='EMPLOYEE_CHANGE'){title=(x.date||'')+' · '+(x.name||x.employeeId||'');sub=[abisEssM8ChangeType_(x.type),x.department,x.site].filter(Boolean).join(' · ');meta=x.status||''}
  else if(type==='ASSET'){title=(x.assetId||'')+' '+(x.assetName||'');sub=[x.borrowerName||x.borrowerEmployeeId,x.site,x.department].filter(Boolean).join(' · ');meta=[x.status,x.loanStatus,x.dueDate].filter(Boolean).join(' · ')}
  else if(type==='TASK'){title=x.title||x.taskId||abisEssM8t_('taskTitle');sub=[abisEssM8Category_(x.category),abisEssM8Status_(x.status),x.department,x.site].filter(Boolean).join(' · ');meta=x.subtitle||''}
  return '<div class="abis-m8-row-card"><div><b>'+abisEssM8Esc_(title)+'</b><span>'+abisEssM8Esc_(sub)+'</span><small>'+abisEssM8Esc_(meta)+'</small></div>'+abisEssM8SourceButton_(type,x)+'</div>';
}
function abisEssM8TableDef_(type){
  if(type==='ATTENDANCE')return [[abisEssM8t_('date'),'date'],[abisEssM8t_('employeeId'),'employeeId'],[abisEssM8t_('name'),'name'],[abisEssM8t_('department'),'department'],[abisEssM8t_('site'),'site'],[abisEssM8t_('expectedIn'),'expectedIn'],[abisEssM8t_('expectedOut'),'expectedOut'],[abisEssM8t_('actualIn'),'actualIn'],[abisEssM8t_('actualOut'),'actualOut'],[abisEssM8t_('status'),'status']];
  if(type==='LEAVE')return [[abisEssM8t_('date'),'startDate'],[abisEssM8t_('employeeId'),'employeeId'],[abisEssM8t_('name'),'employeeName'],[abisEssM8t_('leaveType'),'leaveType'],[abisEssM8t_('hours'),'hours'],[abisEssM8t_('status'),'status'],[abisEssM8t_('department'),'department'],[abisEssM8t_('site'),'site']];
  if(type==='EMPLOYEE_CHANGE')return [[abisEssM8t_('date'),'date'],[abisEssM8t_('status'),'type'],[abisEssM8t_('employeeId'),'employeeId'],[abisEssM8t_('name'),'name'],[abisEssM8t_('department'),'department'],[abisEssM8t_('site'),'site']];
  if(type==='ASSET')return [[abisEssM8t_('assetId'),'assetId'],[abisEssM8t_('assetName'),'assetName'],[abisEssM8t_('borrower'),'borrowerName'],[abisEssM8t_('status'),'status'],[abisEssM8t_('dueDate'),'dueDate'],[abisEssM8t_('site'),'site']];
  if(type==='TASK')return [[abisEssM8t_('date'),'date'],[abisEssM8t_('taskTitle'),'title'],[abisEssM8t_('taskCategory'),'category'],[abisEssM8t_('status'),'status'],[abisEssM8t_('employeeId'),'employeeId'],[abisEssM8t_('assignee'),'assigneeId']];
  return [];
}
function abisEssM8TableValue_(type,key,v){if(key==='status')return abisEssM8Status_(v);if(type==='EMPLOYEE_CHANGE'&&key==='type')return abisEssM8ChangeType_(v);if(type==='TASK'&&key==='category')return abisEssM8Category_(v);return v==null?'':v}
function abisEssM8RowsHtml_(type,r){
  const rows=r&&r.rows||[],total=Number(r&&r.totalDetailRows||rows.length);if(!rows.length)return '<div class="abis-m8-empty"><b>'+abisEssM8Esc_(abisEssM8t_('empty'))+'</b><span>'+abisEssM8Esc_(abisEssM8t_('emptyHint'))+'</span></div>';
  const shown=Math.min(rows.length,500),slice=rows.slice(0,shown),cols=abisEssM8TableDef_(type);
  return '<div class="abis-m8-row-count">'+abisEssM8Esc_(abisEssM8t_('rows'))+' '+abisEssM8Esc_(total)+' · '+abisEssM8Esc_(abisEssM8t_('showing'))+' '+abisEssM8Esc_(shown)+'</div><div class="abis-m8-mobile-rows">'+slice.map(x=>abisEssM8MobileRow_(type,x)).join('')+'</div><div class="abis-m8-desktop-table"><table><thead><tr>'+cols.map(c=>'<th>'+abisEssM8Esc_(c[0])+'</th>').join('')+'<th></th></tr></thead><tbody>'+slice.map(function(x){return '<tr>'+cols.map(c=>'<td>'+abisEssM8Esc_(abisEssM8TableValue_(type,c[1],x[c[1]]))+'</td>').join('')+'<td>'+abisEssM8SourceButton_(type,x)+'</td></tr>'}).join('')+'</tbody></table></div>';
}

async function abisEssM8Export_(format,btn){
  const s=ABIS_ESS_M8_REPORT_STATE_;if(s.exportLoading)return;s.exportLoading=true;s.exportError='';s.exportResult=null;if(btn)btn.disabled=true;renderMyAccount_();
  try{
    s.exportResult=await call('managementReportExport',Object.assign({sessionToken,reportType:s.reportType,format:format},abisEssM8Payload_()));
    /* A successful export appends a new immutable snapshot. Invalidate the
       in-memory snapshot list so the next Snapshot open fetches the new Vn. */
    s.snapshots=null;
    s.snapshotError='';
  }
  catch(e){s.exportError=e&&e.message?e.message:String(e)}
  finally{s.exportLoading=false;if(btn&&btn.isConnected)btn.disabled=false;if(accountPanel_==='managementReports'&&s.view==='DETAIL')renderMyAccount_()}
}
function abisEssM8SafeDriveUrl_(url){url=String(url||'');return /^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(url)?url:''}
function abisEssM8ExportHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_;let result='';
  if(s.exportError)result='<div class="abis-m8-error">'+abisEssM8Esc_(s.exportError)+'</div>';
  if(s.exportResult){const r=s.exportResult,url=abisEssM8SafeDriveUrl_(r.fileUrl||r.downloadUrl);result='<div class="abis-m8-success"><b>'+abisEssM8Esc_(abisEssM8t_('exportDone'))+'</b><span>'+abisEssM8Esc_(abisEssM8t_('snapshotVersion'))+' V'+abisEssM8Esc_(r.snapshotVersion)+' · '+abisEssM8Esc_(r.fileName||'')+'</span>'+(url?'<a href="'+abisEssM8Esc_(url)+'" target="_blank" rel="noopener">'+abisEssM8Esc_(abisEssM8t_('download'))+'</a>':'')+'</div>'}
  return '<div class="abis-m8-export"><b>'+abisEssM8Esc_(abisEssM8t_('exportTitle'))+'</b><div><button type="button" onclick="abisEssM8Export_(\'PDF\',this)" '+(s.exportLoading?'disabled':'')+'>'+abisEssM8Esc_(s.exportLoading?abisEssM8t_('exporting'):abisEssM8t_('exportPdf'))+'</button><button type="button" class="secondary" onclick="abisEssM8Export_(\'XLSX\',this)" '+(s.exportLoading?'disabled':'')+'>'+abisEssM8Esc_(abisEssM8t_('exportExcel'))+'</button></div>'+result+'</div>';
}

function abisEssM8DetailBoundaryHtml_(type,r){const bits=[];if(type==='EMPLOYEE_CHANGE'&&r.terminationSourceAvailable===false)bits.push(abisEssM8t_('terminationUnavailable'));if(type==='ASSET'&&!r.sourceAvailable)bits.push(abisEssM8t_('assetUnavailable'));if(type==='TASK'){if(r.historyAvailable===false)bits.push(abisEssM8t_('taskHistoryUnavailable'));if(!r.managementScopeAvailable)bits.push(abisEssM8t_('taskScopeWarning'))}return bits.length?'<div class="abis-m8-boundary-list">'+bits.map(x=>'<div>'+abisEssM8Esc_(x)+'</div>').join('')+'</div>':''}
function abisEssM8ReportDetailHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_;if(s.detailLoading&&!s.detail)return '<div class="abis-m8-root"><button class="abis-m8-back" onclick="abisEssM8ReportBack_()">‹ '+abisEssM8Esc_(abisEssM8t_('back'))+'</button><div class="abis-m8-skeleton"><i></i><i></i><i></i></div></div>';
  if(!s.detail)return '<div class="abis-m8-root"><button class="abis-m8-back" onclick="abisEssM8ReportBack_()">‹ '+abisEssM8Esc_(abisEssM8t_('back'))+'</button><div class="abis-m8-error">'+abisEssM8Esc_(s.detailError||abisEssM8t_('loadFailed'))+'</div></div>';
  const d=s.detail,r=d.report||{},type=d.reportType||s.reportType;
  return '<div class="abis-m8-root"><button class="abis-m8-back" onclick="abisEssM8ReportBack_()">‹ '+abisEssM8Esc_(abisEssM8t_('back'))+'</button><div class="abis-m8-head"><div><h3>'+abisEssM8Esc_(abisEssM8ReportTitle_(type))+'</h3><span class="abis-m71-readonly">'+abisEssM8Esc_(abisEssM8t_('readOnly'))+'</span></div><strong>'+abisEssM8Esc_(d.period&&d.period.label||'')+'</strong></div>'+ 
    (s.detailError?'<div class="abis-m8-error">'+abisEssM8Esc_(abisEssM8t_('stale'))+'</div>':'')+
    (!r.available?'<div class="abis-m8-error">'+abisEssM8Esc_(r.error||abisEssM8t_('sourceUnavailable'))+'</div>':abisEssM8SummaryHtml_(type,r)+abisEssM8AnalysisHtml_(type,r)+abisEssM8DetailBoundaryHtml_(type,r)+abisEssM8ExportHtml_()+abisEssM8RowsHtml_(type,r))+
    '<div class="abis-m8-note">'+abisEssM8Esc_(abisEssM8t_('sourceNote'))+'</div></div>';
}

async function abisEssM8OpenSnapshots_(btn){
  const s=ABIS_ESS_M8_REPORT_STATE_;

  /* Prevent duplicate requests. */
  if(s.snapshotsLoading)return;

  s.snapshotError='';

  /*
   * If snapshot data is already available in memory, switch immediately.
   * No backend call means no fake loading state.
   */
  if(s.snapshots&&Array.isArray(s.snapshots.rows)){
    abisEssM8SetView_('SNAPSHOTS');
    if(accountPanel_==='managementReports'){
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
    }
    return s.snapshots;
  }

  /*
   * Keep the HOME view visible while the backend request is running.
   * The Global Async Button Controller owns the clicked button busy state:
   * "報表快照" is shorter than 6 characters, so it shows Spinner only.
   */
  s.snapshotsLoading=true;

  try{
    const data=await call('managementReportSnapshots',{
      sessionToken:sessionToken,
      limit:100
    });

    s.snapshots=data;
    s.snapshotsLoading=false;

    /* Switch page only after snapshot data is ready. */
    abisEssM8SetView_('SNAPSHOTS');

    if(accountPanel_==='managementReports'){
      renderMyAccount_();
      if(typeof rc2UpdateInnerBar_==='function')rc2UpdateInnerBar_();
      try{
        window.scrollTo({top:0,behavior:'smooth'});
      }catch(ignore){
        window.scrollTo(0,0);
      }
    }

    return data;

  }catch(e){
    s.snapshotsLoading=false;
    s.snapshotError=e&&e.message?e.message:String(e);

    /* Stay on report HOME when snapshot loading fails. */
    message(s.snapshotError,'warning');
    return null;
  }
}
function abisEssM8SnapshotBack_(){abisEssM8SetView_('HOME');renderMyAccount_()}
function abisEssM8SnapshotHtml_(){
  const s=ABIS_ESS_M8_REPORT_STATE_,rows=s.snapshots&&s.snapshots.rows||[];
  if(s.snapshotsLoading&&!s.snapshots)return '<div class="abis-m8-root"><button class="abis-m8-back" onclick="abisEssM8SnapshotBack_()">‹ '+abisEssM8Esc_(abisEssM8t_('backSnapshot'))+'</button><div class="abis-m8-skeleton"><i></i><i></i></div></div>';
  return '<div class="abis-m8-root"><button class="abis-m8-back" onclick="abisEssM8SnapshotBack_()">‹ '+abisEssM8Esc_(abisEssM8t_('backSnapshot'))+'</button><div class="abis-m8-head"><div><h3>'+abisEssM8Esc_(abisEssM8t_('snapshotTitle'))+'</h3><span class="abis-m71-readonly">'+abisEssM8Esc_(abisEssM8t_('readOnly'))+'</span></div></div>'+(s.snapshotError?'<div class="abis-m8-error">'+abisEssM8Esc_(s.snapshotError)+'</div>':'')+(rows.length?'<div class="abis-m8-snapshot-list">'+rows.map(function(r){const url=abisEssM8SafeDriveUrl_(r.fileUrl||r.downloadUrl);return '<div class="abis-m8-snapshot"><div><b>'+abisEssM8Esc_(abisEssM8ReportTitle_(r.reportType))+' · V'+abisEssM8Esc_(r.snapshotVersion)+'</b><span>'+abisEssM8Esc_((r.startDate||'')+' ~ '+(r.endDate||''))+'</span><small>'+abisEssM8Esc_(abisEssM8t_('generatedAt'))+' '+abisEssM8Esc_(r.generatedAt||'')+' · '+abisEssM8Esc_(abisEssM8t_('generatedBy'))+' '+abisEssM8Esc_(r.generatedBy||'')+' · '+abisEssM8Esc_(r.format||'')+' · '+abisEssM8Esc_(r.rowCount||0)+'</small></div>'+(url?'<a href="'+abisEssM8Esc_(url)+'" target="_blank" rel="noopener">'+abisEssM8Esc_(abisEssM8t_('download'))+'</a>':'')+'</div>'}).join('')+'</div>':'<div class="abis-m8-empty"><b>'+abisEssM8Esc_(abisEssM8t_('snapshotEmpty'))+'</b></div>')+'</div>';
}

function abisEssM8ReportsPanelHtml_(){const v=ABIS_ESS_M8_REPORT_STATE_.view;if(v==='DETAIL')return abisEssM8ReportDetailHtml_();if(v==='SNAPSHOTS')return abisEssM8SnapshotHtml_();return abisEssM8ReportsHomeHtml_()}

/* Replace only M7 report presentation/read endpoints; M7 navigation owner remains intact. */
abisEssM7ReportsLoad_=abisEssM8ReportsLoad_;
abisEssM7ReportOpen_=abisEssM8ReportOpen_;
abisEssM7ReportBack_=abisEssM8ReportBack_;
abisEssM7ReportsHomeHtml_=abisEssM8ReportsHomeHtml_;
abisEssM7ReportDetailHtml_=abisEssM8ReportDetailHtml_;
abisEssM7ReportsPanelHtml_=abisEssM8ReportsPanelHtml_;

/* M7's back owner knows HOME/DETAIL. Add snapshot history as one additional view. */
const ABIS_ESS_M8_BASE_INNER_BACK_=typeof rc2InnerBack_==='function'?rc2InnerBack_:null;
if(ABIS_ESS_M8_BASE_INNER_BACK_){
  rc2InnerBack_=function(){
    const id=typeof rc2VisibleInnerSection_==='function'?rc2VisibleInnerSection_():'';
    if(id==='account'&&String(accountPanel_||'')==='managementReports'&&ABIS_ESS_M8_REPORT_STATE_.view==='SNAPSHOTS'){abisEssM8SnapshotBack_();return}
    return ABIS_ESS_M8_BASE_INNER_BACK_.apply(this,arguments);
  };
}

function abisEssM8ReportsPreflight_(){
  const m35=typeof abisEssM35Preflight_==='function'?abisEssM35Preflight_():null;
  const out={
    ok:true,version:ABIS_ESS_M8_REPORTS_VERSION_,mobile:typeof abisEssIsMobileUi_==='function'?abisEssIsMobileUi_():null,
    dependencies:{m7:typeof abisEssM7IntegratedPreflight_==='function',m35:typeof abisEssM35Preflight_==='function',m8Style:!!document.getElementById('abisEssM8ReportsStyle')},
    periodSupport:{week:true,month:true,quarter:true,year:true,custom:true},
    filters:{company:true,site:true,department:true,employee:true,companySourceGated:true},
    reports:{attendance:true,leave:true,employeeChange:true,asset:true,task:true},
    export:{pdf:true,xlsx:true,snapshotHistory:true},
    functions:{load:typeof abisEssM8ReportsLoad_==='function',detail:typeof abisEssM8ReportOpen_==='function',export:typeof abisEssM8Export_==='function',snapshots:typeof abisEssM8OpenSnapshots_==='function'},
    frozenBoundaries:{payrollEmployeeUiHidden:m35&&m35.features?m35.features.payrollEmployeeUi===false:true,mobileSchedulingHidden:m35&&m35.features?m35.features.schedulingOnMobile===false:true,readOnlyBrowse:true,noTaskSecondStore:true},
    layout:{horizontalOverflow:m35&&m35.layout?m35.layout.horizontalOverflow:null}
  };
  out.ok=Object.values(out.dependencies).every(Boolean)&&Object.values(out.functions).every(Boolean)&&out.frozenBoundaries.payrollEmployeeUiHidden&&out.frozenBoundaries.mobileSchedulingHidden&&out.layout.horizontalOverflow!==true;
  window.ABIS_ESS_M8_REPORTS=out;return out;
}
try{window.ABIS_ESS_M8_REPORTS=abisEssM8ReportsPreflight_()}catch(ignore){}


/* ============================================================================
 * ABIS ESS Leave Submit Hotfix RC1
 * Version: ABIS_LEAVE_SUBMIT_HOTFIX_RC1_20261007
 *
 * Scope:
 * - Client-side leave submit transport only.
 * - No leave business rule, approval, permission, attendance or payroll changes.
 * - Bound every submit-stage RPC so the UI cannot remain busy indefinitely.
 * - Preserve RequestID replay safety and submitLeaveStatus reconciliation.
 * - Keep all leave-form actions disabled during submit, but only the submit
 *   button changes to the busy label.
 * ========================================================================== */
const ABIS_LEAVE_SUBMIT_HOTFIX_VERSION_ =
  'ABIS_LEAVE_SUBMIT_HOTFIX_RC1_20261007';

const ABIS_LEAVE_SUBMIT_TIMEOUTS_ = Object.freeze({
  draftFlushMs: 15000,
  readCheckMs: 12000,
  submitMs: 25000,
  statusMs: 6000
});

function p5a1LeaveSubmitTimeoutError_(stage, timeoutMs) {
  const label = String(stage || 'request');
  const ms = Number(timeoutMs || 0);
  const text =
    currentLang === 'VI'
      ? 'Kết nối xử lý đơn nghỉ quá thời gian. Hệ thống đã mở lại nút thao tác; vui lòng kiểm tra trạng thái trước khi gửi lại.'
      : currentLang === 'TH'
        ? 'การเชื่อมต่อส่งใบลาหมดเวลา ระบบได้ปลดล็อกปุ่มแล้ว โปรดตรวจสอบสถานะก่อนส่งอีกครั้ง'
        : '請假資料傳輸逾時。系統已解除操作鎖定，請先確認假單狀態後再重新送出。';
  const e = new Error(text);
  e.kind = 'TRANSPORT';
  e.code = 'LEAVE_SUBMIT_TIMEOUT';
  e.stage = label;
  e.timeoutMs = ms;
  return e;
}

function p5a1LeaveSubmitWithTimeout_(promise, timeoutMs, stage) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const ms = Math.max(1000, Number(timeoutMs || 0));
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(p5a1LeaveSubmitTimeoutError_(stage, ms));
    }, ms);

    Promise.resolve(promise).then(
      value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function p5a1LeaveSubmitCall_(action, payload, timeoutMs) {
  return p5a1LeaveSubmitWithTimeout_(
    call(action, payload),
    timeoutMs,
    action
  );
}

function p5a1LeaveSubmitReleaseUi_(op) {
  mutationBusy = false;
  setAreaBusy_('leaveForm', false);
  clearOperationTimers_();
  p5a114ReleaseOperationButton_(op);
}

function p5a1LeaveProxyUnavailableText_() {
  return currentLang === 'VI'
    ? 'Người thay thế không khả dụng trong thời gian này.'
    : currentLang === 'TH'
      ? 'ผู้แทนไม่พร้อมในช่วงเวลานี้'
      : '代理人該時段不可用';
}

function p5a1LeaveUnknownSubmitText_() {
  return currentLang === 'VI'
    ? 'Chưa xác nhận được kết quả gửi đơn. Hệ thống đã mở lại nút thao tác. Hãy vào “Đơn của tôi” kiểm tra trước; nếu chưa có đơn, gửi lại với nội dung không đổi sẽ dùng cùng RequestID và không tạo đơn trùng.'
    : currentLang === 'TH'
      ? 'ยังยืนยันผลการส่งใบลาไม่ได้ ระบบได้ปลดล็อกปุ่มแล้ว โปรดตรวจสอบ “ใบลาของฉัน” ก่อน หากยังไม่มีใบลา การส่งซ้ำโดยไม่เปลี่ยนข้อมูลจะใช้ RequestID เดิมและไม่สร้างใบลาซ้ำ'
      : '目前仍無法確認假單是否送出，系統已解除操作鎖定。請先到「我的假單」確認；若尚未建立，內容不變再次送出會沿用同一 RequestID，不會建立重複假單。';
}

/* Replace the unbounded status reconciliation with bounded probes. */
async function p4a13ConfirmSubmitResult_(requestId, op) {
  const delays = [0, 700, 1600, 3000];

  for (const delay of delays) {
    if (delay) await p4a13Sleep_(delay);

    updateOperation_(
      op,
      nt('checkingResult'),
      nt('doNotRepeat'),
      'warning'
    );

    try {
      const s = await p5a1LeaveSubmitCall_(
        'submitLeaveStatus',
        { sessionToken, requestId },
        ABIS_LEAVE_SUBMIT_TIMEOUTS_.statusMs
      );
      if (s && s.found && s.result) return s.result;
    } catch (ignore) {}
  }

  return null;
}

/* Override only the employee leave-submit transport path. */
async function submitLeave() {
  if (returnedEditLeaveId) {
    await saveAndResubmitReturned_();
    return;
  }

  if (mutationBusy) {
    message(nt('busy'), 'warning');
    return;
  }

  mutationBusy = true;

  /*
   * Disable the form actions without replacing every button label.
   * Only the real submit button receives the busy text via beginOperation_.
   */
  setAreaBusy_('leaveForm', true);

  const submitBtn = $('submitLeaveBtn');
  const op = beginOperation_(
    nt('transmitting'),
    nt('doNotRepeat'),
    submitBtn
  );

  let leave = currentLeaveDraft();
  let r = null;
  let requestId = '';

  try {
    const draftReady = await p5a1LeaveSubmitWithTimeout_(
      p5a108FlushDraft_(),
      ABIS_LEAVE_SUBMIT_TIMEOUTS_.draftFlushMs,
      'draftFlush'
    );

    if (!draftReady) {
      p5a1LeaveSubmitReleaseUi_(op);
      finishOperationFailure_(
        op,
        new Error(p5a108DraftText_('conflict'))
      );
      return;
    }

    leave = currentLeaveDraft();

    if (leave.proxyEmployeeId && !leave.emergency) {
      updateOperation_(
        op,
        nt('checkingProxy'),
        nt('doNotRepeat')
      );

      const pr = await p5a1LeaveSubmitCall_(
        'proxyAvailability',
        {
          sessionToken,
          leave,
          proxyEmployeeId: leave.proxyEmployeeId
        },
        ABIS_LEAVE_SUBMIT_TIMEOUTS_.readCheckMs
      );

      if (pr && pr.available === false) {
        const s = $('proxyId');
        const pn =
          (s &&
            s.options &&
            s.options[s.selectedIndex] &&
            s.options[s.selectedIndex].textContent) ||
          leave.proxyEmployeeId;
        const el = $('proxyAvailabilityWarning');

        if (el) {
          el.innerHTML = renderProxyAvailabilityWarning(pr, pn);
          el.classList.remove('hide');
        }
        if (s) s.value = '';

        p5a1LeaveSubmitReleaseUi_(op);
        renderOperationStatus_(
          'warning',
          nt('operationFailed'),
          p5a1LeaveProxyUnavailableText_()
        );
        return;
      }
    }

    updateOperation_(
      op,
      nt('checkingConflict'),
      nt('doNotRepeat')
    );

    const conflicts = await p5a1LeaveSubmitCall_(
      'departmentLeaveConflicts',
      { sessionToken, leave },
      ABIS_LEAVE_SUBMIT_TIMEOUTS_.readCheckMs
    );

    currentDepartmentConflicts =
      Array.isArray(conflicts) ? conflicts : [];

    if (currentDepartmentConflicts.length) {
      const names = currentDepartmentConflicts
        .map(x => x.employeeName || x.employeeId)
        .filter(Boolean)
        .join('、');

      const confirmText =
        currentLang === 'VI'
          ? 'Cùng thời gian đã có ' + names + ' xin nghỉ.\nBạn vẫn muốn gửi đơn này?'
          : currentLang === 'TH'
            ? 'ช่วงเวลาเดียวกันมี ' + names + ' ลางานอยู่\nยังต้องการส่งคำขอนี้หรือไม่?'
            : '同部門同時段已有 ' + names + ' 請假。\n建議錯開日期或時段，避免同時缺員。\n\n仍要送出此假單嗎？';

      if (!confirm(confirmText)) {
        const el = $('departmentConflictWarning');
        if (el) {
          el.innerHTML = renderDepartmentConflictWarning(
            currentDepartmentConflicts,
            false
          );
          el.classList.remove('hide');
        }

        p5a1LeaveSubmitReleaseUi_(op);
        renderOperationStatus_(
          'warning',
          nt('cancelled'),
          ''
        );
        return;
      }
    }

    requestId = p4a13RequestIdForLeave_(leave);

    updateOperation_(
      op,
      nt('submittingLeave'),
      nt('doNotRepeat')
    );

    r = await p5a1LeaveSubmitCall_(
      'submitLeave',
      {
        sessionToken,
        leave,
        requestId,
        draftId: p5a108DraftId,
        draftVersion: p5a108DraftVersion
      },
      ABIS_LEAVE_SUBMIT_TIMEOUTS_.submitMs
    );
  } catch (e) {
    if (requestId) {
      updateOperation_(
        op,
        nt('checkingResult'),
        nt('unknownDetail'),
        'warning'
      );

      const recovered =
        await p4a13ConfirmSubmitResult_(requestId, op);

      if (recovered) {
        await p4a13FinishSubmitSuccess_(
          recovered,
          op,
          requestId,
          true
        );
        return;
      }

      const uncertain =
        (e && e.kind === 'TRANSPORT') ||
        (e && e.code === 'LEAVE_SUBMIT_TIMEOUT') ||
        String((e && e.message) || '')
          .includes('系統未回傳成功狀態');

      if (uncertain) {
        mutationBusy = false;
        setAreaBusy_('leaveForm', false);

        const detail = p5a1LeaveUnknownSubmitText_();

        finishOperationUnknown_(
          op,
          nt('stillUnknown'),
          detail,
          true
        );
        message(detail, 'warning');
        return;
      }
    }

    mutationBusy = false;
    setAreaBusy_('leaveForm', false);
    finishOperationFailure_(op, e);
    message(
      e && e.message ? e.message : String(e),
      'warning'
    );
    return;
  }

  await p4a13FinishSubmitSuccess_(
    r,
    op,
    requestId,
    false
  );
}

function abisLeaveSubmitHotfixStatus_() {
  return {
    ok: true,
    version: ABIS_LEAVE_SUBMIT_HOTFIX_VERSION_,
    clientOnly: true,
    businessRulesChanged: false,
    requestIdReplaySafetyPreserved: true,
    boundedTransport: true,
    timeouts: Object.assign({}, ABIS_LEAVE_SUBMIT_TIMEOUTS_)
  };
}

try {
  window.ABIS_LEAVE_SUBMIT_HOTFIX =
    Object.freeze(abisLeaveSubmitHotfixStatus_());
} catch (ignore) {}
