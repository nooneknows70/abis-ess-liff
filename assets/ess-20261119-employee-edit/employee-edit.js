/**
 * HR / Admin employee add and edit (V1).
 *
 * Presentation only. This file is a new immutable asset. It is not registered
 * as a release and does not claim one.
 *
 * Self-installs only when hrEmployeeValidate is not FEATURE_OFF and the
 * signed-in person is HR or ADMIN. OFF, a missing action, or an unknown
 * result leaves the existing employee page untouched.
 *
 * DRAFT_NATIVE_REVIEW: Vietnamese and Thai strings that are not copied from
 * ABIS_ESS_M71_I18N_ are drafts and need a native speaker. English is
 * prepared and is not shown.
 *
 * Backend assumptions are listed on ABIS_EMPLOYEE_EDIT.contract.
 */
(function (global) {
  'use strict';

  var CONTRACT = {
    gate: 'A hrEmployeeValidate call that returns code FEATURE_OFF means the feature is off. Validation errors mean it is on. There is no separate options action.',
    search: 'hrEmployeeSearch rows include employeeId, name, company, location, department, employmentStatus, and personType. A filter chip is shown only when its field is actually on those rows.',
    detail: 'Read uses existing hrEmployeeDetail only. rowVersion, diff, confirmToken, and the field catalog come from hrEmployeeValidate.',
    validate: 'hrEmployeeValidate {sessionToken,mode,employeeId,expectedRowVersion,changes,reason,hrConfirmedPunch,hrConfirmedImpact} returns {ok,writesPerformed:0,mode,diff,requires,warnings,punch,rowVersion,confirmToken,fields}.',
    create: 'hrEmployeeCreate sends the same body plus requestId and confirmToken. credential.tempPin exists only on the first LIVE success. SHADOW returns mode SHADOW, writesPerformed 0, and no PIN.',
    update: 'hrEmployeeUpdate sends {sessionToken,requestId,employeeId,expectedRowVersion,changes,reason,hrConfirmedPunch,hrConfirmedImpact,confirmToken}. PreferredLanguage is one of the changes in that same write.',
    audit: 'hrEmployeeAuditList returns {ok:true, rows:[{time,actorId,role,action,field,before,after,reason}]}. Action codes are mapped to words.',
    ack: 'hrAcknowledgeTemporaryPinDelivery accepts {sessionToken,employeeId,tempPinEventId}. Failure still clears the PIN.',
    envelope: 'google.script.run.api returns the full object. A {ok:true,data:{...}} envelope is merged up.',
    createDefaults: 'The client does not send 在職狀態 or HR確認. The backend stores 在職 and HR確認=待確認. There is no separate arrival-status column.'
  };

  var ROWS = [
    ['employeeManagement', '員工管理', 'Quản lý nhân viên', 'จัดการพนักงาน', 'Employee management', false],
    ['employeeDetail', '員工資料', 'Thông tin nhân viên', 'ข้อมูลพนักงาน', 'Employee detail', false],
    ['searchPlaceholder', '搜尋員工編號或姓名', 'Tìm mã hoặc tên nhân viên', 'ค้นหารหัสหรือชื่อพนักงาน', 'Search by employee number or name', false],
    ['search', '搜尋', 'Tìm kiếm', 'ค้นหา', 'Search', false],
    ['empty', '目前沒有符合條件的員工', 'Không có nhân viên phù hợp', 'ไม่พบพนักงานตามเงื่อนไข', 'No matching employees', false],
    ['emptyHint', '請調整搜尋文字或篩選條件。', 'Hãy thay đổi từ khóa hoặc bộ lọc.', 'โปรดปรับคำค้นหาหรือตัวกรอง', 'Try a different search or filter.', false],
    ['loadFailed', '員工資料載入失敗', 'Không thể tải dữ liệu nhân viên', 'โหลดข้อมูลพนักงานไม่สำเร็จ', 'Could not load employees', false],
    ['retry', '重新載入', 'Tải lại', 'โหลดใหม่', 'Reload', false],
    ['stale', '目前顯示上次成功載入的資料。', 'Đang hiển thị dữ liệu từ lần tải thành công gần nhất.', 'กำลังแสดงข้อมูลจากการโหลดสำเร็จครั้งล่าสุด', 'Showing the last successful load.', false],
    ['loading', '正在載入員工資料…', 'Đang tải dữ liệu nhân viên…', 'กำลังโหลดข้อมูลพนักงาน…', 'Loading employees…', false],
    ['basic', '基本資料', 'Thông tin cơ bản', 'ข้อมูลพื้นฐาน', 'Basic', false],
    ['employment', '任職資料', 'Thông tin làm việc', 'ข้อมูลการทำงาน', 'Employment', false],
    ['organization', '組織與權限', 'Tổ chức và quyền', 'องค์กรและสิทธิ์', 'Organization', false],
    ['work', '工作設定', 'Thiết lập công việc', 'การตั้งค่างาน', 'Work settings', false],
    ['system', '系統狀態', 'Trạng thái hệ thống', 'สถานะระบบ', 'System', false],
    ['employeeId', '員工編號', 'Mã nhân viên', 'รหัสพนักงาน', 'Employee ID', false],
    ['name', '姓名', 'Họ tên', 'ชื่อ', 'Name', false],
    ['mobile', '手機', 'Điện thoại', 'โทรศัพท์', 'Mobile', false],
    ['hireDate', '到職日', 'Ngày vào làm', 'วันที่เริ่มงาน', 'Hire date', false],
    ['terminationDate', '離職日', 'Ngày nghỉ việc', 'วันที่พ้นสภาพ', 'Last day', false],
    ['employmentStatus', '在職狀態', 'Trạng thái làm việc', 'สถานะการทำงาน', 'Employment status', false],
    ['personType', '人員類別', 'Loại nhân viên', 'ประเภทพนักงาน', 'Person type', false],
    ['department', '部門', 'Bộ phận', 'แผนก', 'Department', false],
    ['location', '工作地點', 'Địa điểm', 'สถานที่ทำงาน', 'Work location', false],
    ['manager1', '直屬主管', 'Quản lý trực tiếp', 'หัวหน้าโดยตรง', 'Direct manager', false],
    ['manager2', '第二主管', 'Quản lý thứ hai', 'หัวหน้าคนที่สอง', 'Second manager', false],
    ['isManager', '主管身分', 'Vai trò quản lý', 'สถานะหัวหน้างาน', 'Manager role', false],
    ['approvalPermission', '簽核權限', 'Quyền phê duyệt', 'สิทธิ์อนุมัติ', 'Approval permission', false],
    ['formalShift', '正式班別', 'Ca chính thức', 'กะอย่างเป็นทางการ', 'Formal shift', false],
    ['attendanceType', '出勤管理類型', 'Loại quản lý chấm công', 'ประเภทการจัดการเวลา', 'Attendance type', false],
    ['punchExempt', '免打卡', 'Miễn chấm công', 'ยกเว้นลงเวลา', 'Punch exempt', false],
    ['leaveExempt', '免請假', 'Miễn xin nghỉ', 'ยกเว้นการลา', 'Leave exempt', false],
    ['punchNumber', '打卡號', 'Mã máy chấm công', 'รหัสเครื่องลงเวลา', 'Punch number', false],
    ['preferredLanguage', '帳號語言', 'Ngôn ngữ tài khoản', 'ภาษาบัญชี', 'Account language', false],
    ['systemEnabled', '系統啟用', 'Kích hoạt hệ thống', 'เปิดใช้งานระบบ', 'System enabled', false],
    ['credentialState', '登入帳號狀態', 'Trạng thái đăng nhập', 'สถานะบัญชีเข้าสู่ระบบ', 'Sign-in status', false],
    ['lineBound', 'LINE 綁定', 'Liên kết LINE', 'การเชื่อม LINE', 'LINE link', false],
    ['bound', '已綁定', 'Đã liên kết', 'เชื่อมแล้ว', 'Linked', false],
    ['unbound', '未綁定', 'Chưa liên kết', 'ยังไม่เชื่อม', 'Not linked', false],
    ['yes', '是', 'Có', 'ใช่', 'Yes', false],
    ['no', '否', 'Không', 'ไม่ใช่', 'No', false],
    ['readOnly', '唯讀', 'Chỉ xem', 'ดูอย่างเดียว', 'Read-only', false],
    ['backToList', '返回員工清單', 'Quay lại danh sách', 'กลับไปรายชื่อพนักงาน', 'Back to the list', false],
    ['accountManagement', '帳號管理', 'Quản lý tài khoản', 'จัดการบัญชี', 'Account management', false],
    ['clear', '清除', 'Xóa bộ lọc', 'ล้างตัวกรอง', 'Clear', false],
    ['addEmployee', '新增員工', 'Thêm nhân viên', 'เพิ่มพนักงาน', 'Add employee', true],
    ['editEmployee', '編輯員工資料', 'Sửa thông tin nhân viên', 'แก้ไขข้อมูลพนักงาน', 'Edit employee', true],
    ['reviewChanges', '檢視變更', 'Xem lại thay đổi', 'ตรวจสอบการเปลี่ยนแปลง', 'Review changes', true],
    ['confirmSave', '確認儲存', 'Xác nhận lưu', 'ยืนยันการบันทึก', 'Confirm and save', true],
    ['confirmAdd', '確認新增', 'Xác nhận thêm', 'ยืนยันการเพิ่ม', 'Confirm add', true],
    ['before', '變更前', 'Trước', 'ก่อน', 'Before', true],
    ['after', '變更後', 'Sau', 'หลัง', 'After', true],
    ['changeReason', '變更原因', 'Lý do thay đổi', 'เหตุผลการเปลี่ยนแปลง', 'Reason for change', true],
    ['fieldLocked', '此欄位不可修改', 'Không thể sửa mục này', 'ไม่สามารถแก้ไขช่องนี้ได้', 'This field cannot be edited', true],
    ['reasonRequired', '需要填寫原因', 'Cần nhập lý do', 'ต้องระบุเหตุผล', 'Reason required', true],
    ['punchTaken', '此打卡號已被使用', 'Mã chấm công đã được sử dụng', 'รหัสลงเวลานี้ถูกใช้แล้ว', 'Punch number already in use', true],
    ['punchSuggested', '建議打卡號', 'Mã chấm công đề xuất', 'รหัสลงเวลาที่แนะนำ', 'Suggested punch number', true],
    ['rowChanged', '資料已被他人更新，請重新載入', 'Dữ liệu đã được người khác cập nhật, vui lòng tải lại', 'ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณาโหลดใหม่', 'Data was updated by someone else. Please reload.', true],
    ['systemBusy', '系統忙碌，請稍後再試', 'Hệ thống đang bận, vui lòng thử lại sau', 'ระบบไม่ว่าง กรุณาลองใหม่ภายหลัง', 'System busy, please try again', true],
    ['saved', '已儲存', 'Đã lưu', 'บันทึกแล้ว', 'Saved', true],
    ['cancel', '取消', 'Hủy', 'ยกเลิก', 'Cancel', true],
    ['tempPinOnce', '臨時 PIN（只顯示一次）', 'PIN tạm (chỉ hiển thị một lần)', 'PIN ชั่วคราว (แสดงครั้งเดียว)', 'Temporary PIN (shown once)', true],
    ['tempPinCopied', '已抄寫', 'Đã ghi lại', 'จดบันทึกแล้ว', 'Written down', true],
    ['tempPinCloseWarn', 'PIN 關閉後無法再查看，確定已抄寫嗎？', 'Sau khi đóng sẽ không xem lại được PIN. Bạn đã ghi lại chưa?', 'หลังปิดจะดู PIN อีกไม่ได้ คุณจดไว้แล้วหรือยัง', 'The PIN cannot be viewed again after closing. Have you written it down?', true],
    ['tempPinFirstLogin', '新人第一次登入須輸入此 PIN，並立即設定自己的 PIN。', 'Nhân viên mới nhập PIN này khi đăng nhập lần đầu rồi đặt PIN riêng.', 'พนักงานใหม่ใช้ PIN นี้เข้าสู่ระบบครั้งแรก แล้วตั้ง PIN ของตนเองทันที', 'The new hire enters this PIN at first login, then sets their own PIN.', true],
    ['tempPinExpires', '有效至', 'Có hiệu lực đến', 'ใช้ได้ถึง', 'Valid until', true],
    ['firstDayNote', '到職日當天不計遲到、缺卡', 'Ngày vào làm không tính đi trễ/thiếu chấm công', 'วันเริ่มงานไม่นับมาสาย/ขาดการลงเวลา', 'No late or missing punch on the start date', true],
    ['backToCopy', '回去抄寫', 'Quay lại để ghi', 'กลับไปจด', 'Go back and write it down', true],
    ['writtenClose', '我已抄寫，關閉', 'Tôi đã ghi, đóng lại', 'จดแล้ว ปิดได้', 'I wrote it down, close', true],
    ['createPinNote', '新增後會產生一組臨時 PIN，只顯示一次，請抄寫後轉交新人；新人第一次登入須自行設定個人 PIN', 'Sau khi thêm sẽ có một PIN tạm, chỉ hiện một lần. Hãy ghi lại và đưa cho người mới. Lần đăng nhập đầu họ phải tự đặt PIN.', 'หลังเพิ่มจะมี PIN ชั่วคราว แสดงครั้งเดียว จดแล้วส่งต่อให้พนักงานใหม่ พนักงานใหม่ต้องตั้ง PIN ของตนเองเมื่อเข้าครั้งแรก', 'Adding an employee creates a temporary PIN shown once. Write it down and hand it over. The new hire sets their own PIN at first login.', true],
    ['shadowNote', '預演：不會建立帳號、不會產生 PIN', 'Diễn tập: không tạo tài khoản và không tạo PIN', 'ซ้อม: ไม่สร้างบัญชีและไม่สร้าง PIN', 'Rehearsal: no account is created and no PIN is generated', true],
    ['shadowDone', '預演完成：未寫入任何資料', 'Diễn tập xong: chưa ghi dữ liệu', 'ซ้อมเสร็จ: ยังไม่บันทึกข้อมูล', 'Rehearsal finished: nothing was written', true],
    ['selfPermissionLocked', '不能修改自己的簽核權限', 'Không thể sửa quyền phê duyệt của chính mình', 'ไม่สามารถแก้สิทธิ์อนุมัติของตนเอง', 'You cannot change your own approval permission', true],
    ['ackFailed', '已關閉。這筆記錄沒有更新，請到帳號管理確認，或稍後再試。', 'Đã đóng. Bản ghi chưa được cập nhật. Hãy kiểm tra ở quản lý tài khoản hoặc thử lại sau.', 'ปิดแล้ว รายการนี้ยังไม่อัปเดต โปรดตรวจที่จัดการบัญชี หรือลองใหม่ภายหลัง', 'Closed. The record was not updated. Check Account management, or try again later.', true],
    ['credentialExists', '此員工編號已有登入帳號，無法新增，請聯絡管理者', 'Mã này đã có tài khoản đăng nhập, không thể thêm. Hãy liên hệ quản trị.', 'รหัสนี้มีบัญชีอยู่แล้ว เพิ่มไม่ได้ โปรดติดต่อผู้ดูแล', 'This employee number already has a sign-in account and cannot be added. Contact an administrator.', true],
    ['credentialInsert', '員工已建立，但帳號尚未建立，請再按一次。', 'Đã tạo nhân viên nhưng chưa tạo tài khoản. Hãy bấm lại một lần.', 'สร้างพนักงานแล้ว แต่บัญชียังไม่ถูกสร้าง กรุณากดอีกครั้ง', 'The employee was created, but the account was not. Press the button again.', true],
    ['unknownResult', '結果不明，請到員工列表確認；若已建立但沒看到 PIN，請到帳號管理重新產生。', 'Chưa rõ kết quả. Hãy kiểm tra danh sách. Nếu đã tạo mà không thấy PIN, hãy tạo lại ở quản lý tài khoản.', 'ยังไม่ทราบผล โปรดตรวจรายชื่อ หากสร้างแล้วแต่ไม่เห็น PIN ให้สร้างใหม่ที่จัดการบัญชี', 'The result is unknown. Check the employee list. If the person exists but you did not see a PIN, issue a new one in Account management.', true],
    ['pinGone', 'PIN 已無法再查看。若還沒抄寫，請到帳號管理重新產生。', 'Không thể xem lại PIN. Nếu chưa ghi, hãy tạo lại ở quản lý tài khoản.', 'ดู PIN อีกครั้งไม่ได้ หากยังไม่ได้จด ให้สร้างใหม่ที่จัดการบัญชี', 'The PIN can no longer be viewed. If you did not write it down, issue a new one in Account management.', true],
    ['goAccount', '前往帳號管理', 'Đến quản lý tài khoản', 'ไปที่จัดการบัญชี', 'Go to account management', true],
    ['goList', '回到員工列表', 'Về danh sách nhân viên', 'กลับไปรายชื่อพนักงาน', 'Back to the employee list', true],
    ['goNewHires', '前往新進人員', 'Đến nhân viên mới', 'ไปที่พนักงานใหม่', 'Go to new hires', true],
    ['namePunchHint', '改名後需另行確認打卡對應', 'Sau khi đổi tên cần kiểm tra lại dữ liệu máy chấm công', 'หลังเปลี่ยนชื่อต้องตรวจการจับคู่เวลาอีกครั้ง', 'After a name change, confirm the punch match separately', true],
    ['attendanceSyncNote', '出勤同步會在下一次排程後生效', 'Đồng bộ chấm công có hiệu lực ở lần chạy kế tiếp', 'การซิงก์เวลาจะมีผลในรอบถัดไป', 'Attendance sync applies on the next scheduled run', true],
    ['pinBeforeHire', '臨時 PIN 將在到職日之前到期，到職前請到帳號管理重新產生', 'PIN tạm sẽ hết hạn trước ngày vào làm. Hãy tạo lại ở quản lý tài khoản trước ngày đó.', 'PIN ชั่วคราวจะหมดอายุก่อนวันเริ่มงาน โปรดสร้างใหม่ที่จัดการบัญชีก่อนวันนั้น', 'The temporary PIN expires before the hire date. Issue a new one in Account management before then.', true],
    ['hireDatePast', '到職日早於今天，請填寫原因', 'Ngày vào làm sớm hơn hôm nay, hãy nhập lý do', 'วันเริ่มงานก่อนวันนี้ โปรดระบุเหตุผล', 'The hire date is before today. Enter a reason.', true],
    ['idLetter', '編號字母', 'Chữ cái mã số', 'ตัวอักษรรหัส', 'ID letter', true],
    ['letterOffice', '辦公室', 'Văn phòng', 'สำนักงาน', 'Office', true],
    ['letterFactory', '廠務', 'Xưởng', 'ฝ่ายโรงงาน', 'Factory', true],
    ['letterCorp', '創新法人', 'Pháp nhân đổi mới', 'นิติบุคคลนวัตกรรม', 'Innovation entity', true],
    ['annualSystem', '特休制度', 'Chế độ phép năm', 'ระบบลาพักร้อน', 'Annual leave plan', true],
    ['shiftConfirm', '班別確認', 'Xác nhận ca', 'ยืนยันกะ', 'Shift confirmation', true],
    ['anomalyCheck', '啟用出勤異常檢查', 'Bật kiểm tra bất thường', 'เปิดตรวจเวลาผิดปกติ', 'Attendance exception check', true],
    ['finalProxy', '最終需代理人', 'Bắt buộc người đại diện', 'ต้องมีผู้แทน', 'Proxy required', true],
    ['proxyMode', '代理人指定方式', 'Cách chỉ định người đại diện', 'วิธีกำหนดผู้แทน', 'Proxy assignment', true],
    ['proxyPriority', '代理候選優先規則', 'Thứ tự ưu tiên người đại diện', 'ลำดับผู้แทน', 'Proxy priority', true],
    ['managerAssignProxy', '主管指派代理', 'Quản lý chỉ định người đại diện', 'หัวหน้ากำหนดผู้แทน', 'Manager assigns proxy', true],
    ['routeGroup', '簽核路由群組', 'Nhóm đường phê duyệt', 'กลุ่มเส้นทางอนุมัติ', 'Approval route group', true],
    ['filterAll', '全部', 'Tất cả', 'ทั้งหมด', 'All', true],
    ['filterNew', '新進人員', 'Nhân viên mới', 'พนักงานใหม่', 'New hires', true],
    ['filterManager', '主管', 'Quản lý', 'หัวหน้า', 'Managers', true],
    ['loadMore', '載入更多', 'Tải thêm', 'โหลดเพิ่ม', 'Load more', true],
    ['auditTitle', '變更紀錄', 'Lịch sử thay đổi', 'ประวัติการเปลี่ยนแปลง', 'Change history', true],
    ['auditEmpty', '目前沒有變更紀錄', 'Chưa có lịch sử thay đổi', 'ยังไม่มีประวัติการเปลี่ยนแปลง', 'No changes yet', true],
    ['lockedSystem', '由系統維護', 'Do hệ thống quản lý', 'ระบบดูแล', 'Maintained by the system', true],
    ['lockedImmutable', '建立後不可變更', 'Không thể đổi sau khi tạo', 'สร้างแล้วเปลี่ยนไม่ได้', 'Cannot be changed after creation', true],
    ['lockedPunch', '已登記的打卡號不可變更', 'Mã chấm công đã đăng ký không thể đổi', 'รหัสลงเวลาที่ลงทะเบียนแล้วเปลี่ยนไม่ได้', 'A registered punch number cannot be changed', true],
    ['useSuggestion', '採用建議打卡號', 'Dùng mã chấm công đề xuất', 'ใช้รหัสลงเวลาที่แนะนำ', 'Use the suggested punch number', true],
    ['reasonCorrection', '更正登錄錯誤', 'Sửa lỗi nhập liệu', 'แก้ข้อมูลที่บันทึกผิด', 'Correct a data entry error', true],
    ['reasonReorg', '組織調整', 'Điều chỉnh tổ chức', 'ปรับผังองค์กร', 'Organization change', true],
    ['reasonHire', '到職日更正', 'Sửa ngày vào làm', 'แก้วันเริ่มงาน', 'Hire date correction', true],
    ['reasonPermission', '權限調整', 'Điều chỉnh quyền', 'ปรับสิทธิ์', 'Permission change', true],
    ['reasonOther', '其他', 'Khác', 'อื่นๆ', 'Other', true],
    ['reasonNote', '說明', 'Diễn giải', 'คำอธิบาย', 'Note', true],
    ['noChanges', '尚未修改任何欄位', 'Chưa sửa mục nào', 'ยังไม่ได้แก้ช่องใด', 'No fields have been changed', true],
    ['retryAck', '再試一次', 'Thử lại', 'ลองอีกครั้ง', 'Try again', true],
    ['createdTitle', '已新增', 'Đã thêm', 'เพิ่มแล้ว', 'Added', true],
    ['punchRegistered', '已登記', 'Đã đăng ký', 'ลงทะเบียนแล้ว', 'Registered', true],
    ['genericFail', '沒有完成，請稍後再試', 'Chưa hoàn tất, vui lòng thử lại sau', 'ยังไม่สำเร็จ โปรดลองใหม่ภายหลัง', 'Not completed. Please try again later.', true],
    ['required', '這是必填欄位', 'Mục này là bắt buộc', 'ช่องนี้จำเป็น', 'This field is required', true],
    ['idInvalid', '請確認員工編號（A、B 或 C 開頭，後面五個數字）', 'Hãy kiểm tra mã nhân viên (A, B hoặc C và năm chữ số)', 'โปรดตรวจรหัสพนักงาน (ขึ้นต้น A, B หรือ C แล้วตามด้วยตัวเลขห้าหลัก)', 'Check the employee number (A, B, or C plus five digits)', true],
    ['idTaken', '此員工編號已有人使用', 'Mã nhân viên này đã được dùng', 'รหัสพนักงานนี้ถูกใช้แล้ว', 'This employee number is already in use', true],
    ['dateInvalid', '請選擇到職日', 'Hãy chọn ngày vào làm', 'โปรดเลือกวันเริ่มงาน', 'Choose a hire date', true],
    ['nameInvalid', '請填寫姓名（最多 30 字）', 'Hãy nhập họ tên (tối đa 30 ký tự)', 'โปรดกรอกชื่อ (ไม่เกิน 30 ตัวอักษร)', 'Enter a name (up to 30 characters)', true],
    ['newDeptHint', '這是新的部門名稱，請再確認一次', 'Đây là tên bộ phận mới, hãy xác nhận lại', 'นี่คือชื่อแผนกใหม่ โปรดยืนยันอีกครั้ง', 'This is a new department name. Please confirm it.', true],
    ['downstreamNote', '已送出的假單與已結案的出勤不會被改。之後的出勤、特休與簽核會用新的資料。LINE 選單會等每日對帳。', 'Đơn nghỉ đã gửi và ngày công đã chốt không đổi. Dữ liệu mới dùng cho lần sau. Menu LINE chờ đối soát hằng ngày.', 'ใบลาที่ส่งแล้วและวันทำงานที่ปิดแล้วไม่เปลี่ยน ข้อมูลใหม่ใช้กับรอบถัดไป เมนู LINE รอการตรวจประจำวัน', 'Submitted leave and closed attendance stay as they are. Later attendance, annual leave, and approval use the new data. The LINE menu waits for the daily reconcile.', true],
    ['hireRecalcNote', '已經算過的出勤不會自動重算', 'Ngày công đã tính sẽ không tự tính lại', 'เวลาที่คำนวณแล้วจะไม่คำนวณใหม่อัตโนมัติ', 'Attendance that was already calculated is not recalculated automatically', true],
    ['processing', '處理中…', 'Đang xử lý…', 'กำลังดำเนินการ…', 'Working…', true],
    ['sectionIdentity', '身分與任用', 'Định danh và tuyển dụng', 'ตัวตนและการจ้าง', 'Identity and hire', true],
    ['sectionOrg', '組織', 'Tổ chức', 'องค์กร', 'Organization', true],
    ['sectionAttendance', '出勤', 'Chấm công', 'การลงเวลา', 'Attendance', true],
    ['sectionProxy', '代理', 'Người đại diện', 'ผู้แทน', 'Proxy', true],
    ['sectionContact', '聯絡與語言', 'Liên hệ và ngôn ngữ', 'การติดต่อและภาษา', 'Contact and language', true],
    ['personOffice', '辦公室', 'Văn phòng', 'สำนักงาน', 'Office', true],
    ['personFactory', '廠務', 'Xưởng', 'ฝ่ายโรงงาน', 'Factory', true],
    ['personExternal', '外部顧問', 'Cố vấn bên ngoài', 'ที่ปรึกษาภายนอก', 'External advisor', true],
    ['locOffice', '辦公室', 'Văn phòng', 'สำนักงาน', 'Office', true],
    ['locXindian', '新店廠', 'Nhà máy Xindian', 'โรงงานซินเตี้ยน', 'Xindian plant', true],
    ['locChangbin', '彰濱廠', 'Nhà máy Changbin', 'โรงงานจางปิน', 'Changbin plant', true],
    ['annualYes', '週年制', 'Theo năm làm việc', 'ตามรอบปี', 'Anniversary plan', true],
    ['annualNo', '不適用', 'Không áp dụng', 'ไม่ใช้', 'Not applicable', true],
    ['confirmed', '已確認', 'Đã xác nhận', 'ยืนยันแล้ว', 'Confirmed', true],
    ['pendingConfirm', '待確認', 'Chờ xác nhận', 'รอการยืนยัน', 'Pending confirmation', true],
    ['notApplicable', '不適用', 'Không áp dụng', 'ไม่ใช้', 'Not applicable', true],
    ['attNormal', '一般出勤', 'Chấm công thông thường', 'ลงเวลาปกติ', 'Regular attendance', true],
    ['attExempt', '免出勤管理', 'Miễn quản lý chấm công', 'ไม่ต้องจัดการเวลา', 'Attendance exempt', true],
    ['attExternal', '外部人員', 'Nhân sự bên ngoài', 'บุคคลภายนอก', 'External', true],
    ['permNone', '無簽核權限', 'Không có quyền phê duyệt', 'ไม่มีสิทธิ์อนุมัติ', 'No approval permission', true],
    ['permApprover', '可簽核', 'Được phê duyệt', 'อนุมัติได้', 'Approver', true],
    ['permHr', '人資', 'Nhân sự', 'ฝ่ายบุคคล', 'HR', true],
    ['permAdmin', '管理者', 'Quản trị', 'ผู้ดูแล', 'Administrator', true],
    ['statusEmployed', '在職', 'Đang làm việc', 'ยังทำงานอยู่', 'Active employment', true],
    ['statusLeft', '離職', 'Đã nghỉ việc', 'พ้นสภาพ', 'Left', true],
    ['statusActive', '已可登入', 'Đã đăng nhập được', 'เข้าสู่ระบบได้แล้ว', 'Can sign in', true],
    ['statusTemp', '尚未完成首次登入', 'Chưa hoàn tất đăng nhập lần đầu', 'ยังเข้าสู่ระบบครั้งแรกไม่เสร็จ', 'First sign-in is not finished', true],
    ['statusDisabled', '未開放登入', 'Chưa mở đăng nhập', 'ยังไม่เปิดให้เข้าสู่ระบบ', 'Sign-in is not open', true],
    ['statusUnknown', '尚未建立登入', 'Chưa tạo đăng nhập', 'ยังไม่ได้สร้างบัญชี', 'Sign-in is not set up', true],
    ['configured', '已設定', 'Đã thiết lập', 'ตั้งค่าแล้ว', 'Set', true],
    ['langZh', '繁體中文', 'Tiếng Trung phồn thể', 'จีนตัวเต็ม', 'Traditional Chinese', true],
    ['langVi', '越南文', 'Tiếng Việt', 'ภาษาเวียดนาม', 'Vietnamese', true],
    ['langTh', '泰文', 'Tiếng Thái', 'ภาษาไทย', 'Thai', true],
    ['daysSince', '到職 {n} 天', 'Đã vào làm {n} ngày', 'เริ่มงานมา {n} วัน', 'Hired {n} days ago', true],
    ['todayHire', '今天到職', 'Vào làm hôm nay', 'เริ่มงานวันนี้', 'Starts today', true],
    ['flagMismatch', '免打卡與出勤管理類型不一致', 'Miễn chấm công không khớp loại quản lý', 'การยกเว้นลงเวลาไม่สอดคล้องกับประเภทการจัดการ', 'Punch exemption does not match the attendance type', true],
    ['selectPlaceholder', '請選擇', 'Hãy chọn', 'โปรดเลือก', 'Choose', true],
    ['suggestId', '建議編號', 'Mã đề xuất', 'รหัสที่แนะนำ', 'Suggested number', true],
    ['phoneChanged', '已變更', 'Đã thay đổi', 'มีการเปลี่ยนแปลง', 'Changed', true],
    ['edit', '編輯', 'Sửa', 'แก้ไข', 'Edit', true],
    ['closeWarnTitle', '還沒關閉', 'Chưa đóng', 'ยังไม่ปิด', 'Not closed yet', true],
    ['requiredMark', '必填', 'Bắt buộc', 'จำเป็น', 'Required', true],
    ['newHireStatus', '新增後為在職，身分確認為待確認。', 'Sau khi thêm: đang làm việc, xác nhận danh tính là chờ xác nhận.', 'หลังเพิ่ม: ยังทำงานอยู่ และการยืนยันตัวตนคือรอการยืนยัน', 'After adding: employed, and identity confirmation is pending.', true],
    ['orgConfirm', '組織設定確認', 'Xác nhận thiết lập tổ chức', 'ยืนยันการตั้งค่าองค์กร', 'Organization confirmation', true],
    ['reasonNewHire', '新增員工', 'Thêm nhân viên', 'เพิ่มพนักงาน', 'New employee', true],
    ['routeDefault', '預設路線', 'Tuyến mặc định', 'เส้นทางเริ่มต้น', 'Default route', true],
    ['routeOffice', '辦公室路線', 'Tuyến văn phòng', 'เส้นทางสำนักงาน', 'Office route', true],
    ['routeFactory', '廠務路線', 'Tuyến xưởng', 'เส้นทางโรงงาน', 'Factory route', true],
    ['proxyEmployee', '員工自選', 'Nhân viên tự chọn', 'พนักงานเลือกเอง', 'Employee selects', true],
    ['proxyFallback', '員工自選，不足時補位', 'Nhân viên tự chọn, hệ thống bổ sung nếu thiếu', 'พนักงานเลือกเอง และระบบเติมหากไม่พอ', 'Employee selects, with a fallback', true],
    ['proxySameDept', '同部門優先', 'Ưu tiên cùng bộ phận', 'แผนกเดียวกันก่อน', 'Same department first', true],
    ['proxyManagerFirst', '主管優先', 'Ưu tiên quản lý', 'หัวหน้าก่อน', 'Manager first', true],
    ['confirmExpired', '差異確認已過期，請重新檢視變更', 'Xác nhận khác biệt đã hết hạn. Hãy xem lại thay đổi.', 'การยืนยันส่วนต่างหมดอายุแล้ว โปรดตรวจสอบการเปลี่ยนแปลงอีกครั้ง', 'The change confirmation expired. Review the changes again.', true],
    ['confirmFirst', '請先確認差異內容', 'Hãy xác nhận nội dung thay đổi trước', 'โปรดยืนยันรายการที่เปลี่ยนก่อน', 'Review the changes before saving.', true],
    ['hrConfirmImpact', '此員工已有出勤、特休或薪資資料，請再確認到職日', 'Nhân viên này đã có công, phép năm hoặc lương. Hãy xác nhận lại ngày vào làm.', 'พนักงานนี้มีข้อมูลเวลา ลาพักร้อน หรือเงินเดือนแล้ว โปรดยืนยันวันเริ่มงานอีกครั้ง', 'This employee already has attendance, annual leave, or payroll. Confirm the hire date again.', true],
    ['impactCheck', '我已確認到職日的影響', 'Tôi đã xác nhận ảnh hưởng của ngày vào làm', 'ฉันยืนยันผลของวันเริ่มงานแล้ว', 'I confirmed the hire-date effect', true],
    ['featureOff', '此功能尚未開放', 'Chức năng này chưa mở', 'ฟังก์ชันนี้ยังไม่เปิดใช้', 'This feature is not open yet', true],
    ['forbiddenRole', '只有人資或管理者可以編輯員工', 'Chỉ nhân sự hoặc quản trị mới sửa được nhân viên', 'มีเพียงฝ่ายบุคคลหรือผู้ดูแลที่แก้ไขพนักงานได้', 'Only HR or an administrator can edit employees', true],
    ['sessionExpired', '登入已失效，請重新登入', 'Phiên đăng nhập đã hết. Hãy đăng nhập lại.', 'การเข้าสู่ระบบหมดอายุ โปรดเข้าใหม่', 'The sign-in expired. Please sign in again.', true],
    ['punchManual', '請手動輸入尚未使用的打卡號', 'Hãy nhập mã chấm công chưa được dùng', 'โปรดกรอกรหัสลงเวลาที่ยังไม่ถูกใช้', 'Enter a punch number that is not already used', true],
    ['auditCreate', '新增員工', 'Thêm nhân viên', 'เพิ่มพนักงาน', 'Employee added', true],
    ['auditChange', '變更欄位', 'Đổi mục', 'เปลี่ยนช่อง', 'Field change', true],
    ['auditPrivilege', '權限變更', 'Đổi quyền', 'เปลี่ยนสิทธิ์', 'Permission change', true],
    ['auditShadow', '預演', 'Diễn tập', 'ซ้อม', 'Rehearsal', true],
    ['auditFailed', '沒有完成', 'Chưa hoàn tất', 'ยังไม่สำเร็จ', 'Not completed', true],
    ['auditPin', '已建立首次登入', 'Đã tạo đăng nhập lần đầu', 'สร้างการเข้าครั้งแรกแล้ว', 'First sign-in was created', true],
    ['managerNotFound', '找不到這位主管，或主管目前不是在職', 'Không tìm thấy quản lý, hoặc quản lý không còn làm việc', 'ไม่พบหัวหน้า หรือหัวหน้าไม่ได้ทำงานอยู่', 'That manager was not found, or is not currently employed', true],
    ['managerSelf', '主管不可為本人', 'Quản lý không thể là chính mình', 'หัวหน้าต้องไม่ใช่ตัวเอง', 'The manager cannot be the same person', true],
    ['managerCycle', '主管設定會互相循環，請改選別人', 'Cách đặt quản lý bị vòng lặp, hãy chọn người khác', 'การตั้งหัวหน้าวนกัน โปรดเลือกคนอื่น', 'The manager setup loops. Choose someone else.', true],
    ['shiftInvalid', '正式班別須為有效且已確認的班別', 'Ca chính thức phải là ca hợp lệ và đã xác nhận', 'กะอย่างเป็นทางการต้องเป็นกะที่ใช้ได้และยืนยันแล้ว', 'The shift must be an active, confirmed shift', true],
    ['valueNotAllowed', '這個選項不在允許清單', 'Giá trị này không nằm trong danh sách cho phép', 'ตัวเลือกนี้ไม่อยู่ในรายการที่อนุญาต', 'This value is not allowed', true],
    ['punchChanged', '建議打卡號已變更。請確認畫面上的新建議號碼，再按一次。', 'Mã chấm công đề xuất đã đổi. Hãy kiểm tra số mới trên màn hình rồi bấm lại.', 'รหัสลงเวลาที่แนะนำเปลี่ยนแล้ว โปรดตรวจเลขใหม่บนหน้าจอ แล้วกดอีกครั้ง', 'The suggested punch number changed. Check the new number on screen, then press again.', true],
    ['unknownResultEdit', '結果不明。請重新載入這位員工後再試。沒有看到「已儲存」前，不要假設已經儲存。', 'Chưa rõ kết quả. Hãy tải lại nhân viên này rồi thử lại. Chưa thấy "Đã lưu" thì đừng coi là đã lưu.', 'ยังไม่ทราบผล โปรดโหลดพนักงานคนนี้ใหม่แล้วลองอีกครั้ง หากยังไม่เห็น "บันทึกแล้ว" อย่าคิดว่าบันทึกแล้ว', 'The result is unknown. Reload this employee and try again. Until you see Saved, do not assume it was saved.', true],
    ['hrConfirmLabel', 'HR確認', 'Xác nhận nhân sự', 'การยืนยันฝ่ายบุคคล', 'HR confirmation', true],
    ['basicShort', '基本', 'Cơ bản', 'พื้นฐาน', 'Basic', true],
    ['advanced', '進階', 'Nâng cao', 'ขั้นสูง', 'Advanced', true],
    ['advancedHint', '其餘欄位使用預設值，需要時再打開。', 'Các mục còn lại dùng giá trị mặc định. Mở ra khi cần.', 'ช่องที่เหลือใช้ค่าเริ่มต้น เปิดเมื่อต้องการ', 'The other fields use defaults. Open them when you need to change them.', true],
    ['missingFields', '還差', 'Còn thiếu', 'ยังขาด', 'Still needed', true],
    ['systemDefaults', '系統預設', 'Giá trị hệ thống', 'ค่าเริ่มต้นของระบบ', 'System defaults', true],
    ['auditCredentialFailed', '帳號建立未完成', 'Chưa tạo được tài khoản', 'ยังสร้างบัญชีไม่สำเร็จ', 'The account was not created', true],
    ['auditNewEmployee', '新增員工', 'Thêm nhân viên', 'เพิ่มพนักงาน', 'New employee', true]
  ];

  var packs = { ZH: {}, VI: {}, TH: {}, EN: {} };
  var draftKeys = [];
  var reusedKeys = [];
  ROWS.forEach(function (row) {
    packs.ZH[row[0]] = row[1];
    packs.VI[row[0]] = row[2];
    packs.TH[row[0]] = row[3];
    packs.EN[row[0]] = row[4];
    if (row[5]) draftKeys.push(row[0]);
    else reusedKeys.push(row[0]);
  });

  var FIELD_LABEL = {
    'V2員工ID': 'employeeId',
    '姓名': 'name',
    '人員類別': 'personType',
    '到職日': 'hireDate',
    '特休制度': 'annualSystem',
    '部門': 'department',
    '工作地點': 'location',
    '直屬主管ID': 'manager1',
    '第二主管ID': 'manager2',
    '簽核路由群組': 'routeGroup',
    '是否主管': 'isManager',
    '簽核權限': 'approvalPermission',
    '正式班別': 'formalShift',
    '班別確認': 'shiftConfirm',
    '出勤管理類型': 'attendanceType',
    '打卡號': 'punchNumber',
    '免打卡': 'punchExempt',
    '免請假': 'leaveExempt',
    '啟用出勤異常檢查': 'anomalyCheck',
    '最終需代理人': 'finalProxy',
    '代理人指定方式': 'proxyMode',
    '代理候選優先規則': 'proxyPriority',
    '主管指派代理': 'managerAssignProxy',
    '手機': 'mobile',
    'PreferredLanguage': 'preferredLanguage',
    '在職狀態': 'employmentStatus',
    '離職日': 'terminationDate',
    'LINE綁定狀態': 'lineBound',
    '系統啟用': 'systemEnabled',
    '登入帳號狀態': 'credentialState',
    'HR確認': 'hrConfirmLabel',
    '組織設定確認': 'orgConfirm'
  };

  var FIELDS = [
    { key: 'V2員工ID', section: 'identity', create: 'required', edit: 'immutable' },
    { key: '姓名', section: 'identity', create: 'required', edit: 'edit', reason: true },
    { key: '人員類別', section: 'identity', create: 'required', edit: 'edit', reason: true },
    { key: '到職日', section: 'identity', create: 'required', edit: 'edit', reason: true, type: 'date' },
    { key: '特休制度', section: 'identity', create: 'required', edit: 'edit', reason: true },
    { key: '部門', section: 'org', create: 'required', edit: 'edit' },
    { key: '工作地點', section: 'org', create: 'required', edit: 'edit' },
    { key: '直屬主管ID', section: 'org', create: 'required', edit: 'edit' },
    { key: '第二主管ID', section: 'org', create: 'optional', edit: 'edit' },
    { key: '簽核路由群組', section: 'org', create: 'required', edit: 'edit' },
    { key: '是否主管', section: 'org', create: 'required', edit: 'edit' },
    { key: '簽核權限', section: 'org', create: 'required', edit: 'edit', reason: true, selfLock: true },
    { key: '組織設定確認', section: 'org', create: 'required', edit: 'edit' },
    { key: '正式班別', section: 'attendance', create: 'required', edit: 'edit' },
    { key: '班別確認', section: 'attendance', create: 'required', edit: 'edit' },
    { key: '出勤管理類型', section: 'attendance', create: 'required', edit: 'edit', reason: true },
    { key: '打卡號', section: 'attendance', create: 'required', edit: 'once' },
    { key: '免打卡', section: 'attendance', create: 'required', edit: 'edit', reason: true },
    { key: '免請假', section: 'attendance', create: 'required', edit: 'edit', reason: true },
    { key: '啟用出勤異常檢查', section: 'attendance', create: 'required', edit: 'edit' },
    { key: '最終需代理人', section: 'proxy', create: 'required', edit: 'edit' },
    { key: '代理人指定方式', section: 'proxy', create: 'required', edit: 'edit' },
    { key: '代理候選優先規則', section: 'proxy', create: 'required', edit: 'edit' },
    { key: '主管指派代理', section: 'proxy', create: 'optional', edit: 'edit' },
    { key: '手機', section: 'contact', create: 'optional', edit: 'edit' },
    { key: 'PreferredLanguage', section: 'contact', create: 'required', edit: 'edit' }
  ];

  var SECTIONS = [
    ['identity', 'sectionIdentity'],
    ['org', 'sectionOrg'],
    ['attendance', 'sectionAttendance'],
    ['proxy', 'sectionProxy'],
    ['contact', 'sectionContact']
  ];

  var VALUE_KEYS = {
    Y: 'yes',
    N: 'no',
    '在職': 'statusEmployed',
    '離職': 'statusLeft',
    NORMAL: 'attNormal',
    EXEMPT: 'attExempt',
    EXTERNAL: 'attExternal',
    NONE: 'permNone',
    APPROVER: 'permApprover',
    HR: 'permHr',
    ADMIN: 'permAdmin',
    TEMP_PIN_REQUIRED: 'statusTemp',
    ACTIVE: 'statusActive',
    DISABLED: 'statusDisabled',
    '已確認': 'confirmed',
    '待確認': 'pendingConfirm',
    '不適用': 'notApplicable',
    '週年制': 'annualYes',
    'zh-TW': 'langZh',
    'vi-VN': 'langVi',
    'th-TH': 'langTh',
    '辦公室': 'personOffice',
    '廠務': 'personFactory',
    '外部顧問': 'personExternal',
    '新店廠': 'locXindian',
    '彰濱廠': 'locChangbin',
    FACTORY: 'routeFactory',
    OFFICE: 'routeOffice',
    DEFAULT: 'routeDefault',
    SUPERVISOR_ASSIGN: 'managerAssignProxy',
    EMPLOYEE_SELECT: 'proxyEmployee',
    EMPLOYEE_SELECT_FALLBACK: 'proxyFallback',
    SAME_DEPARTMENT: 'proxySameDept',
    MANAGER_FIRST: 'proxyManagerFirst',
    'N/A': 'notApplicable'
  };

  var CHOICES = {
    '人員類別': [['辦公室', 'personOffice'], ['廠務', 'personFactory'], ['外部顧問', 'personExternal']],
    '工作地點': [['辦公室', 'locOffice'], ['新店廠', 'locXindian'], ['彰濱廠', 'locChangbin']],
    '特休制度': [['週年制', 'annualYes'], ['不適用', 'annualNo']],
    '是否主管': [['Y', 'yes'], ['N', 'no']],
    '簽核權限': [['NONE', 'permNone'], ['APPROVER', 'permApprover'], ['HR', 'permHr'], ['ADMIN', 'permAdmin']],
    '班別確認': [['已確認', 'confirmed'], ['待確認', 'pendingConfirm'], ['不適用', 'notApplicable']],
    '出勤管理類型': [['NORMAL', 'attNormal'], ['EXEMPT', 'attExempt'], ['EXTERNAL', 'attExternal']],
    '免打卡': [['Y', 'yes'], ['N', 'no']],
    '免請假': [['Y', 'yes'], ['N', 'no']],
    '啟用出勤異常檢查': [['Y', 'yes'], ['N', 'no']],
    '最終需代理人': [['Y', 'yes'], ['N', 'no']],
    '主管指派代理': [['', 'selectPlaceholder'], ['Y', 'yes'], ['N', 'no']],
    'PreferredLanguage': [['zh-TW', 'langZh'], ['vi-VN', 'langVi'], ['th-TH', 'langTh']],
    '組織設定確認': [['已確認', 'confirmed'], ['待確認', 'pendingConfirm']],
    '代理人指定方式': [['SUPERVISOR_ASSIGN', 'managerAssignProxy'], ['EMPLOYEE_SELECT', 'proxyEmployee'], ['EMPLOYEE_SELECT_FALLBACK', 'proxyFallback']],
    '代理候選優先規則': [['N/A', 'notApplicable'], ['SAME_DEPARTMENT', 'proxySameDept'], ['MANAGER_FIRST', 'proxyManagerFirst']],
    '簽核路由群組': [['DEFAULT', 'routeDefault'], ['OFFICE', 'routeOffice'], ['FACTORY', 'routeFactory']]
  };

  var REASONS = [
    ['CORRECTION', 'reasonCorrection'],
    ['REORG', 'reasonReorg'],
    ['HIRE_DATE_CORRECTION', 'reasonHire'],
    ['PERMISSION_CHANGE', 'reasonPermission'],
    ['NEW_HIRE', 'reasonNewHire'],
    ['OTHER', 'reasonOther']
  ];

  var ERROR_KEYS = {
    SYSTEM_BUSY: 'systemBusy',
    ROW_VERSION_MISMATCH: 'rowChanged',
    FEATURE_OFF: 'featureOff',
    FORBIDDEN: 'forbiddenRole',
    AUTH: 'sessionExpired',
    INTERNAL: 'genericFail',
    CONFIRM_TOKEN_REQUIRED: 'confirmFirst',
    CONFIRM_TOKEN_MISMATCH: 'confirmExpired',
    HR_CONFIRM_REQUIRED: 'hrConfirmImpact',
    PUNCH_SUGGESTION_CHANGED: 'punchChanged',
    AUDIT_WRITE_FAILED: 'genericFail',
    CREDENTIAL_ALREADY_EXISTS: 'credentialExists',
    CREDENTIAL_INSERT_FAILED: 'credentialInsert',
    CREDENTIAL_SCHEMA_NOT_READY: 'genericFail',
    CREDENTIAL_READBACK_MISMATCH: 'credentialInsert',
    AUTH_PEPPER_MISSING: 'genericFail',
    REASON_REQUIRED: 'reasonRequired',
    SELF_PERMISSION_CHANGE: 'selfPermissionLocked',
    PUNCH_TAKEN_RECOMPUTE_NEWCOMER: 'punchTaken',
    PUNCH_IMMUTABLE: 'lockedPunch',
    PUNCH_NOT_NUMERIC: 'punchTaken',
    PUNCH_CONFIRMATION_REQUIRED: 'useSuggestion',
    FIRST_DIGIT_EXHAUSTED: 'punchManual',
    ID_DUPLICATE: 'idTaken',
    ID_FORMAT: 'idInvalid',
    ID_IMMUTABLE: 'lockedImmutable',
    SERIAL_RANGE: 'idInvalid',
    FIELD_REQUIRED: 'required',
    FIELD_READONLY: 'fieldLocked',
    FIELD_FORBIDDEN: 'fieldLocked',
    FIELD_UNKNOWN: 'genericFail',
    DATE_FORMAT: 'dateInvalid',
    DATE_ORDER: 'dateInvalid',
    VALUE_NOT_ALLOWED: 'valueNotAllowed',
    SHIFT_INVALID: 'shiftInvalid',
    DEPT_UNKNOWN: 'newDeptHint',
    HIRE_DATE_LOCKED_PERIOD: 'hireRecalcNote',
    ATTENDANCE_FLAGS_INCONSISTENT: 'flagMismatch',
    MANAGER_NOT_FOUND: 'managerNotFound',
    MANAGER_SELF: 'managerSelf',
    MANAGER_CYCLE: 'managerCycle',
    READBACK_MISMATCH: 'genericFail',
    REQUEST_ID_REQUIRED: 'genericFail'
  };

  var FORBIDDEN = {
    PINHash: 1,
    TemporaryPINHash: 1,
    tempPin: 1,
    CredentialState: 1,
    'PIN狀態': 1,
    '系統啟用': 1,
    '例外備註': 1,
    'LINE綁定狀態': 1,
    'Session版本': 1,
    CredentialID: 1,
    '啟用碼Hash': 1
  };

  /* The one-time PIN lives only in this binding. It is never copied onto the
     exported state object, the address bar, or browser storage. */
  var pinMemory = '';
  var pinEmployeeId = '';
  var pinEventId = '';
  var pinHistory = false;
  var pendingLeave = null;
  var loginInstall = null;
  var systemFilled = {};
  var eeTouched = false;
  var pinWasHeld = false;
  var lastScreen = '';
  var installed = false;
  var state = blankState();

  function blankState() {
    return {
      active: false,
      mode: 'OFF',
      screen: 'list',
      permission: '',
      actorId: '',
      query: '',
      chip: 'all',
      rows: [],
      limit: 20,
      loading: false,
      listError: '',
      stale: false,
      detail: null,
      employeeId: '',
      form: {},
      baseline: {},
      rowVersion: '',
      diff: [],
      warnings: [],
      reason: { code: '', note: '' },
      fieldErrors: {},
      errorKey: '',
      notice: '',
      busy: false,
      requestId: '',
      keepRequest: false,
      audit: [],
      leaveGuard: false,
      ackFailed: false,
      created: {},
      expiresAt: '',
      punchSuggestion: '',
      punchConfirmed: false,
      idTouched: false,
      catalog: {},
      conflict: false,
      tempPinDays: 7,
      acking: false,
      operation: '',
      confirmToken: '',
      requires: {},
      impactConfirmed: false,
      fieldCatalog: [],
      advancedOpen: false
    };
  }

  function readLang() {
    var lang = '';
    if (typeof currentLang !== 'undefined' && currentLang != null) lang = String(currentLang);
    else if (global && typeof global.currentLang === 'string') lang = global.currentLang;
    lang = String(lang || 'ZH').toUpperCase();
    if (lang === 'VI' || lang === 'TH') return lang;
    return 'ZH';
  }

  function t(key) {
    var pack = packs[readLang()] || packs.ZH;
    if (pack[key]) return pack[key];
    return packs.ZH[key] || '';
  }

  function fill(key, map) {
    var text = t(key);
    Object.keys(map || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(map[name] == null ? '' : String(map[name]));
    });
    return text;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sameId(a, b) {
    return String(a || '').trim().toUpperCase() !== '' &&
      String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
  }

  function isHrAdmin(permission) {
    var value = String(permission || '').trim().toUpperCase();
    return value === 'HR' || value === 'ADMIN';
  }

  function normalizeMode(mode) {
    var value = String(mode || '').trim().toUpperCase();
    if (value === 'LIVE' || value === 'SHADOW') return value;
    return 'OFF';
  }

  function readHome() {
    if (typeof homeData !== 'undefined') return homeData || null;
    if (global && global.homeData) return global.homeData;
    return null;
  }

  function readAccountPanel() {
    if (typeof accountPanel_ !== 'undefined') return String(accountPanel_ || '');
    if (global && typeof global.accountPanel_ === 'string') return global.accountPanel_;
    return '';
  }

  function hostFn(name) {
    if (global && typeof global[name] === 'function') return global[name];
    try {
      if (name === 'renderMyAccount_' && typeof renderMyAccount_ === 'function') return renderMyAccount_;
      if (name === 'enterApp' && typeof enterApp === 'function') return enterApp;
      if (name === 'logout' && typeof logout === 'function') return logout;
      if (name === 'showHome' && typeof showHome === 'function') return showHome;
      if (name === 'showPage' && typeof showPage === 'function') return showPage;
      if (name === 'showMyAccount_' && typeof showMyAccount_ === 'function') return showMyAccount_;
      if (name === 'rc2OpenAccountPanel_' && typeof rc2OpenAccountPanel_ === 'function') return rc2OpenAccountPanel_;
      if (name === 'rc2InnerBack_' && typeof rc2InnerBack_ === 'function') return rc2InnerBack_;
      if (name === 'openHrCredentialAdmin' && typeof openHrCredentialAdmin === 'function') return openHrCredentialAdmin;
      if (name === 'rc2AccountPanelHtml_' && typeof rc2AccountPanelHtml_ === 'function') return rc2AccountPanelHtml_;
    } catch (ignore) {}
    return null;
  }

  function readPermission() {
    var home = readHome();
    if (home && home.employee && home.employee.approvalPermission) {
      return String(home.employee.approvalPermission);
    }
    var can = hostFn('canManageCredentials_');
    if (typeof canManageCredentials_ === 'function') can = canManageCredentials_;
    if (can) {
      try {
        if (can()) return 'HR';
      } catch (ignore) {}
    }
    return '';
  }

  function readActor() {
    var home = readHome();
    if (home && home.employee && home.employee.id) return String(home.employee.id);
    return state.actorId || '';
  }

  function readSession(deps) {
    if (deps && typeof deps.sessionToken === 'string') return deps.sessionToken;
    if (typeof sessionToken !== 'undefined' && typeof sessionToken === 'string') return sessionToken;
    if (global && typeof global.sessionToken === 'string') return global.sessionToken;
    return '';
  }

  function loggedIn() {
    var home = readHome();
    return !!(readSession({}) && home && home.employee);
  }

  function canInstall(opts) {
    opts = opts || {};
    var permission = opts.permission == null ? readPermission() : opts.permission;
    return isHrAdmin(permission) && normalizeMode(opts.mode) !== 'OFF';
  }

  function fieldByKey(key) {
    for (var i = 0; i < FIELDS.length; i += 1) {
      if (FIELDS[i].key === key) return FIELDS[i];
    }
    return null;
  }

  function label(key) {
    var name = FIELD_LABEL[key];
    return name ? t(name) : t('configured');
  }

  function human(value) {
    if (value === true) return t('yes');
    if (value === false) return t('no');
    if (value == null) return '';
    var raw = String(value).trim();
    if (!raw) return '';
    var lower = raw.toLowerCase();
    if (lower === 'true') return t('yes');
    if (lower === 'false') return t('no');
    if (/^line\s+false$/i.test(raw)) return t('no');
    if (/^line\s+true$/i.test(raw)) return t('yes');
    if (VALUE_KEYS[raw]) return t(VALUE_KEYS[raw]);
    if (VALUE_KEYS[raw.toUpperCase()] && raw.toUpperCase() === raw) return t(VALUE_KEYS[raw.toUpperCase()]);
    if (/^[ABC]\d{5}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw) || /^\d+$/.test(raw)) return raw;
    if (/^[A-Z][A-Z0-9_]{2,}$/.test(raw)) return t('configured');
    return raw;
  }

  function choices(field, catalog) {
    var fromServer = catalog && catalog[field.key];
    if (fromServer && fromServer.length) return fromServer;
    var list = CHOICES[field.key];
    if (!list) return null;
    return list.map(function (item) {
      return { value: item[0], label: t(item[1]) };
    });
  }

  function isSelf(ctx) {
    return sameId(ctx && ctx.actorId, ctx && ctx.employeeId);
  }

  function lockedReason(field, ctx, baseline) {
    if (!field) return '';
    if (field.selfLock && isSelf(ctx)) return 'selfPermissionLocked';
    if (field.edit === 'immutable' && ctx && ctx.mode === 'UPDATE') return 'lockedImmutable';
    if (field.edit === 'once' && ctx && ctx.mode === 'UPDATE' && String((baseline || {})[field.key] || '').trim()) {
      return 'lockedPunch';
    }
    if (field.edit === 'readonly') return 'lockedSystem';
    return '';
  }

  function buildChanges(baseline, values, ctx) {
    var out = {};
    baseline = baseline || {};
    values = values || {};
    FIELDS.forEach(function (field) {
      if (FORBIDDEN[field.key]) return;
      if (field.edit === 'immutable') return;
      if (lockedReason(field, ctx, baseline)) return;
      var before = baseline[field.key] == null ? '' : String(baseline[field.key]).trim();
      var after = values[field.key] == null ? '' : String(values[field.key]).trim();
      if (before !== after) out[field.key] = values[field.key] == null ? '' : values[field.key];
    });
    return out;
  }

  function createChanges(values) {
    var out = {};
    values = values || {};
    FIELDS.forEach(function (field) {
      if (FORBIDDEN[field.key]) return;
      var value = values[field.key];
      if (value == null || String(value).trim() === '') return;
      out[field.key] = field.key === 'V2員工ID' ? String(value).trim().toUpperCase() : value;
    });
    return out;
  }

  function validateClient(values, mode, ctx) {
    var errors = [];
    var data = values || {};
    function miss(key, msg) { errors.push({ field: key, key: msg }); }
    if (mode === 'CREATE') {
      if (!/^[ABC]\d{5}$/.test(String(data['V2員工ID'] || '').trim().toUpperCase())) miss('V2員工ID', 'idInvalid');
      var name = String(data['姓名'] || '').trim();
      if (!name || Array.from(name).length > 30) miss('姓名', 'nameInvalid');
      ['人員類別', '特休制度', '工作地點', '簽核路由群組', '是否主管', '簽核權限', '組織設定確認', '正式班別', '班別確認', '出勤管理類型', '免打卡', '免請假', '啟用出勤異常檢查', '最終需代理人', '代理人指定方式', '代理候選優先規則', 'PreferredLanguage'].forEach(function (key) {
        if (!String(data[key] || '').trim()) miss(key, 'required');
      });
      if (data['人員類別'] !== '外部顧問' && !String(data['部門'] || '').trim()) miss('部門', 'required');
      if (data['人員類別'] !== '外部顧問' && !String(data['直屬主管ID'] || '').trim()) miss('直屬主管ID', 'required');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data['到職日'] || ''))) miss('到職日', 'dateInvalid');
      var punchOptional = data['免打卡'] === 'Y' || data['出勤管理類型'] === 'EXTERNAL';
      if (!punchOptional && !String(data['打卡號'] || '').trim()) miss('打卡號', 'required');
      if (String(data['打卡號'] || '').trim() && !/^\d+$/.test(String(data['打卡號']).trim())) miss('打卡號', 'punchTaken');
      if (data['免打卡'] === 'Y' && data['出勤管理類型'] === 'NORMAL') miss('免打卡', 'flagMismatch');
    }
    if (mode === 'UPDATE') {
      var base = (ctx && ctx.baseline) || {};
      if (String(base['打卡號'] || '').trim() && String(data['打卡號'] || '').trim() !== String(base['打卡號']).trim()) {
        miss('打卡號', 'lockedPunch');
      }
      if (isSelf(ctx) && String(data['簽核權限'] || '') !== String(base['簽核權限'] || '')) {
        miss('簽核權限', 'selfPermissionLocked');
      }
    }
    return errors;
  }

  function reasonOk(reason, required) {
    if (!required) return true;
    if (!reason || !reason.code) return false;
    if (reason.code === 'OTHER' && !String(reason.note || '').trim()) return false;
    return true;
  }

  function todayTaipei(now) {
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return fmt.format(now || new Date());
    } catch (ignore) {
      return '';
    }
  }

  function addDays(iso, days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
    var parts = iso.split('-');
    var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function pinExpiresBeforeHire(hireDate, days, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hireDate || '')) return false;
    var limit = addDays(today || todayTaipei(), days || 7);
    return !!(limit && hireDate > limit);
  }

  function createNeedsReason(values, today) {
    var hire = values && values['到職日'];
    return !!(hire && today && hire < today);
  }

  function formatTaipei(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    try {
      var fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      });
      var bag = {};
      fmt.formatToParts(date).forEach(function (part) { bag[part.type] = part.value; });
      return bag.year + '-' + bag.month + '-' + bag.day + ' ' + bag.hour + ':' + bag.minute;
    } catch (ignore) {
      return '';
    }
  }

  function spacedPin(pin) {
    if (!/^\d{6}$/.test(pin || '')) return '';
    return String(pin).split('').join(' ');
  }

  function shiftList() {
    var rules = null;
    if (typeof SHIFT_RULES !== 'undefined') rules = SHIFT_RULES;
    else if (global && global.SHIFT_RULES) rules = global.SHIFT_RULES;
    if ((!rules || !rules.length) && state.catalog && state.catalog['正式班別']) rules = state.catalog['正式班別'];
    if (!rules || !rules.length) return [];
    var out = [];
    for (var i = 0; i < rules.length; i += 1) {
      var item = rules[i];
      if (item && typeof item === 'object') {
        if (item['有效'] === 'N' || item.valid === 'N' || item.valid === false) continue;
        if (item['班別確認'] && item['班別確認'] !== '已確認') continue;
        var name = item.value || item.name || item['班別名稱'] || item['班別代碼'] || '';
        if (name) out.push(String(name));
      } else if (item) out.push(String(item));
    }
    return out;
  }

  function suggestDefaults(values, options) {
    var next = Object.assign({}, values || {});
    var refresh = !!(options && options.refreshSystem);
    function put(key, value) {
      if (value == null || String(value).trim() === '') return;
      var empty = next[key] == null || String(next[key]).trim() === '';
      if (!empty && !(refresh && systemFilled[key])) return;
      next[key] = value;
      systemFilled[key] = true;
    }
    put('簽核權限', 'NONE');
    put('PreferredLanguage', 'zh-TW');
    put('組織設定確認', '待確認');
    put('代理候選優先規則', 'N/A');
    put('最終需代理人', 'Y');
    put('免請假', 'N');
    put('啟用出勤異常檢查', 'Y');
    put('是否主管', 'N');
    put('班別確認', '待確認');
    put('特休制度', '週年制');
    var person = next['人員類別'];
    var shift = shiftList()[0] || '';
    if (person === '外部顧問') {
      put('出勤管理類型', 'EXTERNAL');
      put('免打卡', 'Y');
      put('簽核路由群組', 'DEFAULT');
      put('代理人指定方式', 'SUPERVISOR_ASSIGN');
    } else if (person === '廠務') {
      put('出勤管理類型', 'NORMAL');
      put('簽核路由群組', 'FACTORY');
      put('代理人指定方式', 'SUPERVISOR_ASSIGN');
      put('工作地點', '新店廠');
      put('免打卡', 'N');
      put('正式班別', shift);
    } else if (person === '辦公室' || next['工作地點'] === '辦公室') {
      put('出勤管理類型', 'NORMAL');
      put('簽核路由群組', person === '廠務' ? 'FACTORY' : 'OFFICE');
      put('代理人指定方式', 'SUPERVISOR_ASSIGN');
      if (person === '辦公室') put('工作地點', '辦公室');
      put('免打卡', 'N');
      put('正式班別', shift);
    } else {
      put('免打卡', 'N');
    }
    return next;
  }

  function errorKey(res, operation) {
    var code = '';
    if (res && res.code) code = res.code;
    else if (res && res.errors && res.errors[0]) code = res.errors[0].code || '';
    var key = ERROR_KEYS[code] || 'genericFail';
    if (operation === 'UPDATE' && (key === 'unknownResult' || key === 'credentialInsert' || key === 'credentialExists' || key === 'pinGone')) {
      return 'unknownResultEdit';
    }
    return key;
  }

  function mapFieldErrors(res) {
    var out = {};
    var list = res && res.errors || [];
    list.forEach(function (item) {
      if (!item || !item.field) return;
      out[item.field] = ERROR_KEYS[item.code] || 'genericFail';
    });
    return out;
  }

  function publicError(res) {
    return t(errorKey(res));
  }

  function mapWarnings(list, changes) {
    var keys = {
      NEW_DEPARTMENT: 'newDeptHint',
      HIRE_DATE_BEFORE_TODAY: 'hireDatePast',
      HIRE_DATE_AFFECTS_ATTENDANCE: 'firstDayNote',
      NAME_PUNCH_REMAP: 'namePunchHint',
      TEMP_PIN_EXPIRES_BEFORE_HIRE: 'pinBeforeHire'
    };
    var hireChanged = !changes || Object.prototype.hasOwnProperty.call(changes, '到職日');
    var out = [];
    (list || []).forEach(function (item) {
      var code = item && (item.code || item);
      if (!hireChanged && String(code || '').indexOf('HIRE_DATE') === 0) return;
      var key = keys[code];
      if (!key) return;
      var text = t(key);
      if (out.indexOf(text) < 0) out.push(text);
      if (code === 'HIRE_DATE_AFFECTS_ATTENDANCE' && out.indexOf(t('hireRecalcNote')) < 0) out.push(t('hireRecalcNote'));
    });
    return out;
  }

  function featureMode(res) {
    if (!res || res.code === 'FEATURE_OFF' || res.code === 'FORBIDDEN' || res.code === 'AUTH') return '';
    if (res.ok === true) {
      var mode = normalizeMode(res.mode);
      return mode === 'OFF' ? '' : mode;
    }
    if (res.errors && res.errors.length) return 'LIVE';
    return '';
  }

  function catalogEntry(fieldKey, catalog) {
    var list = catalog || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].field === fieldKey) return list[i];
    }
    return null;
  }

  function reasonKeyFromText(text) {
    if (text === '不能修改自己的簽核權限') return 'selfPermissionLocked';
    if (text === '建立後不可變更') return 'lockedImmutable';
    return '';
  }

  function actionLabel(action) {
    var key = {
      EMPLOYEE_CREATE: 'auditCreate',
      EMPLOYEE_FIELD_CHANGE: 'auditChange',
      EMPLOYEE_UPDATE_SUMMARY: 'auditChange',
      EMPLOYEE_PRIVILEGE_CHANGE: 'auditPrivilege',
      EMPLOYEE_VALIDATE_ONLY: 'auditShadow',
      EMPLOYEE_WRITE_FAILED: 'auditFailed',
      HR_TEMP_PIN_ISSUED: 'auditPin'
    }[action];
    return key ? t(key) : '';
  }

  function diffLabel(row) {
    var field = row && row.field;
    if (field && FIELD_LABEL[field]) return label(field);
    if (row && row.label && typeof row.label === 'object') {
      var lang = readLang();
      return row.label[lang] || row.label.ZH || label(field);
    }
    if (row && typeof row.label === 'string' && row.label) return row.label;
    return label(field);
  }

  function localWarnings(changes) {
    var out = [];
    if (Object.prototype.hasOwnProperty.call(changes, '到職日')) {
      out.push(t('firstDayNote'));
      out.push(t('hireRecalcNote'));
    }
    if (Object.prototype.hasOwnProperty.call(changes, '姓名')) out.push(t('namePunchHint'));
    if (changes['簽核權限'] || changes['直屬主管ID'] || changes['第二主管ID'] || changes['是否主管'] || changes['正式班別'] || changes['工作地點'] || changes['出勤管理類型']) {
      out.push(t('downstreamNote'));
    }
    return out;
  }

  function maskPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length >= 7) return t('phoneChanged') + '…' + digits.slice(-3);
    return String(value || '');
  }

  function secretAudit(name) {
    return /pin|hash|token|pepper|secret|密碼/i.test(String(name || ''));
  }

  function reasonText(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    var mapped = {
      NEW_EMPLOYEE: 'auditNewEmployee',
      NEW_HIRE: 'reasonNewHire',
      CREDENTIAL_INSERT_FAILED: 'auditCredentialFailed',
      REORG: 'reasonReorg',
      CORRECTION: 'reasonCorrection',
      HIRE_DATE_CORRECTION: 'reasonHire',
      PERMISSION_CHANGE: 'reasonPermission',
      OTHER: 'reasonOther'
    }[raw] || {
      NEW_EMPLOYEE: 'auditNewEmployee',
      NEW_HIRE: 'reasonNewHire',
      CREDENTIAL_INSERT_FAILED: 'auditCredentialFailed',
      REORG: 'reasonReorg'
    }[raw.toUpperCase()];
    if (mapped) return t(mapped);
    return human(raw);
  }

  function auditRow(row) {
    row = row || {};
    var field = row.field || row['欄位'] || '';
    if (secretAudit(field)) return null;
    var before = row.before == null ? (row['修改前'] || '') : row.before;
    var after = row.after == null ? (row['修改後'] || '') : row.after;
    if (field === '手機') {
      before = maskPhone(before);
      after = maskPhone(after);
    }
    if (field === '例外備註') {
      before = before ? t('phoneChanged') : '';
      after = after ? t('phoneChanged') : '';
    }
    return {
      at: row.time || row.at || row.OccurredAt || row['時間'] || '',
      actor: row.actorName || row.actor || row.actorId || row['操作者ID'] || row.ActorEmployeeID || '',
      action: row.action || '',
      field: field,
      before: human(before) || String(before == null ? '' : before),
      after: human(after) || String(after == null ? '' : after),
      reason: reasonText(row.reason || row.ReasonCode || row['原因'] || '')
    };
  }

  function columnPresent(rows, keys) {
    return (rows || []).some(function (row) {
      if (!row) return false;
      return keys.some(function (key) {
        if (!Object.prototype.hasOwnProperty.call(row, key)) return false;
        var value = row[key];
        return value != null && String(value).trim() !== '';
      });
    });
  }

  function isNewHireRow(row) {
    if (!row) return false;
    if (row.newHire === true || row.isNewHire === true || row['新進人員'] === true || row['新進人員'] === 'Y' || row['新進人員'] === '是') return true;
    if (row.newHire === false || row.isNewHire === false) return false;
    var hire = String(row.hireDate || row['到職日'] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hire)) return false;
    var status = String(row.employmentStatus || row['在職狀態'] || '').trim();
    if (status && status !== '在職') return false;
    var person = String(row.personType || row['人員類別'] || '');
    if (person === '外部顧問') return false;
    var today = todayTaipei();
    if (!today || hire >= today) return true;
    var start = new Date(hire + 'T00:00:00Z');
    var end = new Date(today + 'T00:00:00Z');
    var days = Math.round((end - start) / 86400000);
    return days >= 0 && days <= 30;
  }

  function isManagerRow(row) {
    var manager = row && (row.isManager != null ? row.isManager : row['是否主管']);
    return manager === true || manager === 'Y' || manager === '是' || String(manager).toLowerCase() === 'true';
  }

  function filterRows(rows, query, chip) {
    var list = rows || [];
    var text = String(query || '').trim().toLowerCase();
    var useNew = chip === 'new' && columnPresent(list, ['newHire', 'isNewHire', '新進人員', 'hireDate', '到職日']);
    var useManager = chip === 'manager' && columnPresent(list, ['isManager', '是否主管']);
    return list.filter(function (row) {
      if (useNew && !isNewHireRow(row)) return false;
      if (useManager && !isManagerRow(row)) return false;
      if (!text) return true;
      var name = String(row && (row.name || row['姓名']) || '').toLowerCase();
      var id = String(row && (row.employeeId || row['V2員工ID']) || '').toLowerCase();
      return name.indexOf(text) >= 0 || id.indexOf(text) >= 0;
    });
  }

  function styles() {
    return [
      '.ee{--ee-primary:#1565C0;--ee-primary-press:#0D47A1;--ee-blue:#1565C0;--ee-ink:#0D47A1;--ee-orange:#E65100;--ee-orange-bg:#FFF3E0;--ee-red:#C62828;--ee-page:#E8EEF4;--ee-border:#D4DEE8;--ee-text:#1A2433;--ee-muted:#5C6B7A;--ee-disabled:#A8B2BD;--ee-card:#FFFFFF;box-sizing:border-box;width:100%;max-width:100%;min-width:0;min-height:100dvh;padding:12px 16px calc(96px + env(safe-area-inset-bottom));background:var(--ee-page);color:var(--ee-text);font-family:system-ui,-apple-system,"Noto Sans TC","Noto Sans Thai",sans-serif}',
      '.ee *,.ee *::before,.ee *::after{box-sizing:border-box}',
      '.ee button,.ee input,.ee select,.ee textarea{font:inherit;touch-action:manipulation}',
      '.ee button{min-height:48px !important;min-width:48px;white-space:normal;line-height:1.25}',
      '.ee-chip{white-space:normal;max-width:100%;overflow-wrap:anywhere}',
      '.ee h1,.ee h2{margin:0;font-size:22px;line-height:1.3;font-weight:800}',
      '.ee-top{display:flex;align-items:center;gap:8px;margin-bottom:12px}',
      '.ee-back{width:48px;background:transparent;color:var(--ee-ink);border:0;font-size:28px}',
      '.ee-search input,.ee input,.ee select,.ee textarea{width:100%;max-width:100%;min-width:0;min-height:48px;padding:12px 14px;border:1px solid var(--ee-border);border-radius:12px;background:#fff;color:var(--ee-text);font-size:16px}',
      '.ee textarea{min-height:48px;resize:none;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.ee textarea.ee-note{min-height:96px}',
      '.ee-chips,.ee-letters{display:flex;flex-wrap:wrap;gap:8px;overflow:visible;max-width:100%;min-width:0;position:sticky;top:0;z-index:2;padding:8px 0;background:var(--ee-page)}',
      '.ee-letters{position:static}',
      '.ee-chip{width:auto !important;flex:1 1 auto;min-height:48px;padding:8px 14px;border-radius:999px;border:1px solid var(--ee-border);background:#fff;color:var(--ee-text)}',
      '.ee-chip.is-on{background:var(--ee-blue);color:#fff;border-color:var(--ee-blue)}',
      '.ee-list{display:flex;flex-direction:column;gap:12px}',
      '.ee-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;width:100%;min-height:64px;padding:16px;text-align:left;background:var(--ee-card);border:1px solid var(--ee-border);border-radius:16px;color:var(--ee-text)}',
      '.ee-name{grid-column:1;font-size:18px;font-weight:800;white-space:normal;overflow:visible;text-overflow:clip;word-break:break-word}',
      '.ee-id{grid-column:1;color:var(--ee-muted);font-size:15px}',
      '.ee-meta{grid-column:1;color:var(--ee-muted);white-space:normal;word-break:break-word}',
      '.ee-chevron{grid-column:2;grid-row:1 / span 3;align-self:center;color:var(--ee-muted);font-size:22px}',
      '.ee-card{background:var(--ee-card);border:1px solid var(--ee-border);border-radius:16px;padding:16px;margin:0 0 12px}',
      '.ee-section{margin:20px 0 8px;font-size:16px;font-weight:800}',
      '.ee-field{margin:0 0 14px}',
      '.ee-field label{display:block;margin-bottom:6px;font-weight:700}',
      '.ee-req{color:var(--ee-red);margin-left:4px}',
      '.ee-hint,.ee-error{margin:6px 0 0;font-size:14px;line-height:1.5}',
      '.ee-hint{color:var(--ee-muted)}',
      '.ee-error{color:var(--ee-red)}',
      '.ee-lock{color:var(--ee-disabled)}',
      '.ee-warn{background:var(--ee-orange-bg);color:var(--ee-orange);border-radius:12px;padding:12px;margin:0 0 12px;line-height:1.5}',
      '.ee-warn-strong{font-size:18px;font-weight:800;border:2px solid var(--ee-orange)}',
      '.ee-warn-strong strong{font-weight:800}',
      '.ee-bar{position:sticky;bottom:0;z-index:3;margin:16px -16px 0;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:var(--ee-page)}',
      '.ee-pair{display:flex;flex-direction:column;gap:2px;margin:0 0 12px;min-width:0}',
      '.ee-label{color:var(--ee-muted);font-size:13px;font-weight:700}',
      '.ee-value{font-size:16px;font-weight:800;overflow-wrap:anywhere}',
      '.ee-status{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline;background:#E3F2FD;color:var(--ee-ink);border-radius:12px;padding:12px;margin:0 0 12px}',
      '.ee-status-warn{background:var(--ee-orange-bg);color:var(--ee-orange);font-weight:800;border:2px solid var(--ee-orange)}',
      '.ee-success{background:#E8F5E9;color:#1B5E20;border-radius:12px;padding:12px;margin:0 0 12px;font-weight:800}',
      '.ee-primary{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;border:0;border-radius:12px;background:#1565C0;color:#fff;font-weight:800}',
      '.ee-primary:active{background:var(--ee-primary-press)}',
      '.ee-primary:disabled{background:var(--ee-disabled);color:#fff}',
      '.ee-secondary{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:8px;border:0;background:transparent;color:var(--ee-ink);font-weight:700}',
      '.ee-modal{position:fixed;inset:0;z-index:40;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:rgba(26,36,51,.48);min-width:0;max-width:100%}',
      '.ee-dialog{width:100%;max-width:min(420px,100%);min-width:0;background:#fff;border-radius:16px;padding:16px}',
      '.ee-modal button{font-size:28px;min-height:48px}',
      '.ee-diff-after{color:var(--ee-ink);font-weight:800}',
      '.ee-pin{margin:12px 0;max-width:100%;min-width:0;font-family:ui-monospace,monospace;font-size:28px;font-weight:800;letter-spacing:.28em;text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.ee-skel{height:64px;border-radius:16px;margin:0 0 12px;background:#d4dee8}',
      '.ee-spin{width:18px;height:18px;margin-right:8px;border:2px solid #fff;border-right-color:transparent;border-radius:50%;display:inline-block;animation:ee-spin .8s linear infinite}',
      '@keyframes ee-spin{to{transform:rotate(360deg)}}',
      '.ee [hidden]{display:none !important}',
      '@media (max-width:767px){.ee{width:100%;max-width:100%;min-width:0}.ee-fields{display:block}.ee-side{display:none}.ee[data-ee-screen="list"] .ee-side{display:block}.ee-main{width:100%;min-width:0;max-width:100%}}',
      '@media (max-width:360px){.ee-pin{font-size:clamp(16px,4.8vw,22px);letter-spacing:.08em}.ee-modal{padding:8px}.ee-dialog,.ee-card,.ee-main{max-width:100%;min-width:0}}',
      '@media (min-width:768px){.ee[data-ee-screen="detail"],.ee[data-ee-screen="edit"],.ee[data-ee-screen="add"]{display:grid;grid-template-columns:minmax(280px,380px) minmax(0,1fr);column-gap:16px;align-items:start}.ee-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}.ee-wide{grid-column:1 / -1}.ee-modal{align-items:center}}',
      '@media (prefers-reduced-motion:reduce){.ee-spin{animation:none}}'
    ].join('');
  }

  function button(className, action, text, extra) {
    var disabled = extra && extra.disabled ? ' disabled' : '';
    var busy = extra && extra.busy ? ' aria-busy="true"' : '';
    var id = extra && extra.id ? ' data-ee-id="' + esc(extra.id) + '"' : '';
    var value = extra && extra.value != null ? ' data-ee-value="' + esc(extra.value) + '"' : '';
    var pressed = extra && extra.pressed != null ? ' aria-pressed="' + (extra.pressed ? 'true' : 'false') + '"' : '';
    var labelText = extra && extra.busy ? '<span class="ee-spin" aria-hidden="true"></span>' + esc(t('processing')) : esc(text);
    return '<button type="button" class="' + className + '" data-ee-action="' + esc(action) + '"' + id + value + pressed + disabled + busy + '>' + labelText + '</button>';
  }

  function banner(view) {
    var html = '';
    if (view.notice) html += '<p class="ee-success" role="status">' + esc(view.notice) + '</p>';
    if (view.error) html += '<p class="ee-error" role="alert">' + esc(view.error) + '</p>';
    if (view.stale) html += '<p class="ee-hint">' + esc(t('stale')) + '</p>';
    return html;
  }

  function chipChoices(rows) {
    var items = [['all', 'filterAll']];
    if (columnPresent(rows, ['newHire', 'isNewHire', '新進人員', 'hireDate', '到職日'])) items.push(['new', 'filterNew']);
    if (columnPresent(rows, ['isManager', '是否主管'])) items.push(['manager', 'filterManager']);
    return items;
  }

  function renderList(view) {
    var query = view.query || '';
    var chip = view.chip || 'all';
    var filtered = filterRows(view.rows, query, chip);
    var shown = filtered.slice(0, view.limit || 20);
    var choices = chipChoices(view.rows);
    var allowed = {};
    choices.forEach(function (item) { allowed[item[0]] = true; });
    if (!allowed[chip]) chip = 'all';
    var chips = choices.length > 1 ? choices.map(function (item) {
      return button('ee-chip' + (chip === item[0] ? ' is-on' : ''), 'chip', t(item[1]), { value: item[0], pressed: chip === item[0] });
    }).join('') : '';
    var body = '';
    if (view.loading && !shown.length) {
      body = '<div class="ee-skel"></div><div class="ee-skel"></div><div class="ee-skel"></div><p class="ee-hint">' + esc(t('loading')) + '</p>';
    } else if (!shown.length) {
      body = '<div class="ee-card"><b>' + esc(t('empty')) + '</b><p class="ee-hint">' + esc(t('emptyHint')) + '</p></div>';
    } else {
      body = '<div class="ee-list">' + shown.map(function (row) {
        var name = row.name || row['姓名'] || '';
        var id = row.employeeId || row['V2員工ID'] || '';
        var meta = [row.department || row['部門'] || '', row.location || row['工作地點'] || '', human(row.employmentStatus || row['在職狀態'] || '')].filter(Boolean).join('｜');
        return '<button type="button" class="ee-row" data-ee-action="open" data-ee-id="' + esc(id) + '"><span class="ee-name">' + esc(name) + '</span><span class="ee-id">' + esc(id) + '</span><span class="ee-meta">' + esc(meta) + '</span><span class="ee-chevron" aria-hidden="true">›</span></button>';
      }).join('') + '</div>';
      if (filtered.length > shown.length) body += button('ee-secondary', 'more', t('loadMore'));
    }
    var bar = view.embedded ? '' : '<div class="ee-bar">' + button('ee-primary', 'add', '＋ ' + t('addEmployee'), { busy: view.busy && view.screen === 'list' }) + '</div>';
    return '<header class="ee-top"><h1>' + esc(t('employeeManagement')) + '</h1></header>' +
      '<div class="ee-search"><input data-ee-query type="search" autocomplete="off" placeholder="' + esc(t('searchPlaceholder')) + '" value="' + esc(query) + '" aria-label="' + esc(t('search')) + '"></div>' +
      (chips ? '<div class="ee-chips" role="tablist">' + chips + '</div>' : '') +
      banner(view) + body + bar;
  }

  function detailPairs(view) {
    var fields = view.fields || {};
    var groups = [
      ['basic', ['V2員工ID', '姓名', '手機', 'PreferredLanguage']],
      ['employment', ['人員類別', '到職日', '在職狀態', '離職日', '特休制度']],
      ['organization', ['部門', '工作地點', '直屬主管ID', '第二主管ID', '是否主管', '簽核權限', '簽核路由群組', '組織設定確認']],
      ['work', ['正式班別', '班別確認', '出勤管理類型', '打卡號', '免打卡', '免請假', '啟用出勤異常檢查']],
      ['system', ['系統啟用', '登入帳號狀態', 'LINE綁定狀態', 'HR確認']]
    ];
    return groups.map(function (group) {
      var rows = group[1].map(function (key) {
        var value = fields[key];
        if (value == null || String(value).trim() === '') return '';
        var shown = key === '手機' ? maskPhone(value) : human(value);
        return '<div class="ee-pair"><span class="ee-label">' + esc(label(key)) + '</span><b class="ee-value">' + esc(shown) + '</b></div>';
      }).join('');
      if (!rows) return '';
      return '<section class="ee-card"><h2>' + esc(t(group[0])) + '</h2>' + rows + '</section>';
    }).join('');
  }

  function renderAudit(rows) {
    var items = [];
    (rows || []).forEach(function (row) {
      var item = auditRow(row);
      if (item) items.push(item);
    });
    if (!items.length) {
      return '<section class="ee-card"><h2>' + esc(t('auditTitle')) + '</h2><p class="ee-hint">' + esc(t('auditEmpty')) + '</p></section>';
    }
    return '<section class="ee-card"><h2>' + esc(t('auditTitle')) + '</h2>' + items.map(function (item) {
      var when = item.at ? formatTaipei(item.at) || String(item.at) : '';
      var verb = actionLabel(item.action);
      return '<article class="ee-field"><b>' + esc(label(item.field) || human(item.field)) + '</b>' + (verb ? '<div class="ee-hint">' + esc(verb) + '</div>' : '') + '<div class="ee-hint">' + esc(when) + ' ' + esc(item.actor) + '</div><div>' + esc(t('before')) + ' ' + esc(item.before) + '</div><div class="ee-diff-after">' + esc(t('after')) + ' ' + esc(item.after) + '</div><div class="ee-hint">' + esc(item.reason) + '</div></article>';
    }).join('') + '</section>';
  }

  function renderDetail(view) {
    var fields = view.fields || {};
    var name = fields['姓名'] || view.name || '';
    var id = fields['V2員工ID'] || view.employeeId || '';
    var hire = fields['到職日'] || '';
    var today = view.today || todayTaipei();
    var hireNote = '';
    if (hire && today) {
      if (hire === today) hireNote = t('todayHire');
      else if (hire < today) {
        var start = new Date(hire + 'T00:00:00Z');
        var end = new Date(today + 'T00:00:00Z');
        var days = Math.round((end - start) / 86400000);
        if (days > 0) hireNote = fill('daysSince', { n: String(days) });
      }
    }
    var hr = fields['HR確認'];
    var hrText = hr != null && String(hr).trim() !== '' ? human(hr) : '';
    if (!hrText && String(fields['組織設定確認'] || '') === '待確認') hrText = t('pendingConfirm');
    var status = '';
    var statusClass = 'ee-status' + (hrText && hrText === t('pendingConfirm') ? ' ee-status-warn' : '');
    if (hrText || fields['在職狀態']) {
      status = '<p class="' + statusClass + '" role="status"><span class="ee-label">' + esc(t('employmentStatus')) + '</span><b>' + esc(human(fields['在職狀態'] || '')) + '</b>' +
        (hrText ? '<span class="ee-label">' + esc(t('hrConfirmLabel')) + '</span><b>' + esc(hrText) + '</b>' : '') + '</p>';
    }
    return '<header class="ee-top">' + button('ee-back', 'back', '‹') + '<h1>' + esc(t('employeeDetail')) + '</h1></header>' +
      '<section class="ee-card"><h2 class="ee-name">' + esc(name) + '</h2><p class="ee-id">' + esc(id) + '</p>' + status + '<p class="ee-pair"><span class="ee-label">' + esc(t('hireDate')) + '</span><b class="ee-value">' + esc(hire) + (hireNote ? '｜' + esc(hireNote) : '') + '</b></p><p class="ee-pair"><span class="ee-label">' + esc(t('credentialState')) + '</span><b class="ee-value">' + esc(human(fields['登入帳號狀態'] || '') || t('statusUnknown')) + '</b></p><p class="ee-pair"><span class="ee-label">' + esc(t('lineBound')) + '</span><b class="ee-value">' + esc(human(fields['LINE綁定狀態'] || '') || t('unbound')) + '</b></p><p class="ee-hint">' + esc(t('attendanceSyncNote')) + '</p></section>' +
      banner(view) +
      detailPairs(view) +
      renderAudit(view.audit) +
      '<div class="ee-bar">' + button('ee-primary', 'edit', t('edit')) + button('ee-secondary', 'account', t('goAccount')) + '</div>';
  }

  function fieldControl(field, view) {
    var ctx = { actorId: view.actorId, employeeId: view.employeeId, mode: view.formMode };
    var reason = lockedReason(field, ctx, view.baseline);
    var entry = catalogEntry(field.key, view.fieldCatalog);
    if (entry && entry.editable === false) reason = reasonKeyFromText(entry.readOnlyReason) || reason || 'fieldLocked';
    var value = (view.form || {})[field.key];
    if (value == null) value = '';
    var described = 'ee-note-' + field.key;
    var error = view.fieldErrors && view.fieldErrors[field.key];
    var required = view.formMode === 'CREATE' && field.create === 'required';
    var html = '<div class="ee-field' + (field.key === '姓名' || field.type === 'date' ? ' ee-wide' : '') + '"><label for="ee-' + esc(field.key) + '">' + esc(label(field.key));
    if (required) html += '<span class="ee-req" aria-label="' + esc(t('requiredMark')) + '">*</span>';
    html += '</label>';
    if (reason) {
      var lockedList = choices(field, view.catalog);
      if (lockedList) {
        html += '<select id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" disabled aria-disabled="true" aria-describedby="' + described + '">' +
          lockedList.map(function (item) {
            var selected = String(item.value) === String(value) ? ' selected' : '';
            return '<option value="' + esc(item.value) + '"' + selected + '>' + esc(item.label || human(item.value)) + '</option>';
          }).join('') + '</select>';
      } else if (field.key === '姓名' || field.key === '部門') {
        html += '<textarea class="ee-grow" id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" rows="1" disabled aria-disabled="true" aria-describedby="' + described + '">' + esc(human(value)) + '</textarea>';
      } else {
        html += '<input id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" disabled aria-disabled="true" value="' + esc(human(value)) + '" aria-describedby="' + described + '">';
      }
      html += '<p class="ee-hint" id="' + described + '">' + esc(t('fieldLocked')) + ' ' + esc(t(reason)) + '</p>';
    } else if (field.key === 'V2員工ID' && view.formMode === 'CREATE') {
      var chosenLetter = view.form && view.form.idLetter || '';
      html += '<div class="ee-letters">' + ['A', 'B', 'C'].map(function (letter) {
        var name = letter === 'A' ? 'letterOffice' : letter === 'B' ? 'letterFactory' : 'letterCorp';
        return button('ee-chip' + (chosenLetter === letter ? ' is-on' : ''), 'letter', letter + ' ' + t(name), { value: letter, pressed: chosenLetter === letter });
      }).join('') + '</div>';
      html += '<input id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" autocomplete="off" value="' + esc(value) + '" aria-describedby="' + described + '">';
      if (view.suggestion) html += '<p class="ee-hint">' + esc(t('suggestId')) + ' ' + esc(view.suggestion) + '</p>';
    } else {
      var list = choices(field, view.catalog);
      var disabled = '';
      if (list && field.key !== '部門') {
        html += '<select id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '"' + disabled + ' aria-describedby="' + described + '"><option value="">' + esc(t('selectPlaceholder')) + '</option>' +
          list.map(function (item) {
            var selected = String(item.value) === String(value) ? ' selected' : '';
            return '<option value="' + esc(item.value) + '"' + selected + '>' + esc(item.label || human(item.value)) + '</option>';
          }).join('') + '</select>';
      } else {
        var type = field.type === 'date' ? 'date' : 'text';
        if (field.key === '姓名' || field.key === '部門') {
          html += '<textarea class="ee-grow" id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" rows="1" autocomplete="off" aria-describedby="' + described + '">' + esc(value) + '</textarea>';
        } else {
          html += '<input id="ee-' + esc(field.key) + '" data-ee-field="' + esc(field.key) + '" type="' + type + '" autocomplete="off" value="' + esc(value) + '" aria-describedby="' + described + '">';
        }
      }
      if (error) html += '<p class="ee-error" id="' + described + '">' + esc(t(error)) + '</p>';
      else html += '<p class="ee-hint" id="' + described + '">';
      if (!error && field.key === '到職日') html += esc(t('firstDayNote'));
      if (!error && field.key === '打卡號' && view.punchSuggestion) html += esc(t('punchSuggested')) + ' ' + esc(view.punchSuggestion);
      if (!error && field.key === '部門' && view.newDept) html += esc(t('newDeptHint'));
      if (!error) html += '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderForm(view) {
    var mode = view.formMode || 'CREATE';
    var title = mode === 'CREATE' ? t('addEmployee') : t('editEmployee');
    var primary = t('reviewChanges');
    var action = 'review';
    var errors = validateClient(view.form, mode, { actorId: view.actorId, employeeId: view.employeeId, baseline: view.baseline });
    var changes = mode === 'UPDATE' ? buildChanges(view.baseline, view.form, { actorId: view.actorId, employeeId: view.employeeId, mode: 'UPDATE' }) : {};
    var disabled = view.busy || errors.length > 0 || (mode === 'UPDATE' && !Object.keys(changes).length);
    var notes = '';
    if (mode === 'CREATE') {
      if (!view.error) notes += '<p class="ee-warn">' + esc(view.mode === 'SHADOW' ? t('shadowNote') : t('createPinNote')) + '</p>';
      notes += '<p class="ee-hint">' + esc(t('newHireStatus')) + '</p>';
      if (pinExpiresBeforeHire(view.form && view.form['到職日'], view.tempPinDays || 7, view.today || todayTaipei())) {
        notes += '<p class="ee-hint">' + esc(t('pinBeforeHire')) + '</p>';
      }
      if (createNeedsReason(view.form, view.today || todayTaipei())) notes += '<p class="ee-hint">' + esc(t('hireDatePast')) + '</p>';
    }
    var basicCreate = { 'V2員工ID': 1, '姓名': 1, '人員類別': 1, '到職日': 1, '部門': 1, '直屬主管ID': 1, '打卡號': 1, '工作地點': 1, '簽核路由群組': 1, '正式班別': 1, '出勤管理類型': 1, '代理人指定方式': 1 };
    var fields = '';
    if (mode === 'CREATE') {
      var basic = '';
      var advanced = '';
      var showPunchExempt = (view.form && (view.form['人員類別'] === '外部顧問' || view.form['出勤管理類型'] === 'EXTERNAL' || view.form['出勤管理類型'] === 'EXEMPT'));
      FIELDS.forEach(function (field) {
        var html = fieldControl(field, view);
        if (basicCreate[field.key] || (field.key === '免打卡' && showPunchExempt)) basic += html;
        else advanced += html;
      });
      fields = '<h2 class="ee-section ee-wide">' + esc(t('basicShort')) + '</h2>' + basic +
        '<div class="ee-wide">' + button('ee-secondary', 'advanced', t('advanced'), { pressed: !!view.advancedOpen }) +
        '<p class="ee-hint">' + esc(t('advancedHint')) + '</p></div>' +
        (view.advancedOpen ? '<div class="ee-advanced">' + advanced + '</div>' : '');
    } else {
      fields = SECTIONS.map(function (section) {
        var inner = FIELDS.filter(function (field) { return field.section === section[0]; }).map(function (field) {
          return fieldControl(field, view);
        }).join('');
        return '<h2 class="ee-section ee-wide">' + esc(t(section[1])) + '</h2>' + inner;
      }).join('');
    }
    var missing = '';
    if (disabled && errors.length) {
      var seen = {};
      var names = [];
      errors.forEach(function (item) {
        if (!item.field || seen[item.field]) return;
        seen[item.field] = 1;
        names.push(label(item.field));
      });
      if (names.length) missing = '<p class="ee-error" data-ee-missing>' + esc(t('missingFields')) + '：' + esc(names.join('、')) + '</p>';
    }
    return '<header class="ee-top">' + button('ee-back', 'back', '‹') + '<h1>' + esc(title) + '</h1></header>' +
      banner(view) + notes + '<div class="ee-fields">' + fields + '</div>' +
      '<div class="ee-bar">' + missing + button('ee-primary', action, primary, { disabled: disabled, busy: view.busy }) + button('ee-secondary', 'cancel', t('cancel')) + '</div>';
  }

  function renderDiff(view) {
    var changes = view.changes || {};
    var creating = view.operation === 'CREATE';
    var rows = view.diff && view.diff.length ? view.diff : Object.keys(changes).map(function (key) {
      return { field: key, before: (view.baseline || {})[key] || '', after: changes[key] };
    });
    if (creating) {
      rows = rows.filter(function (row) {
        return String(row.after == null ? '' : row.after).trim() !== '';
      });
    }
    var required = Object.keys(changes).length > 0 || rows.length > 0 || creating;
    var needsImpact = !!(view.requires && view.requires.hrConfirmStep);
    var ready = reasonOk(view.reason, required) && !view.busy;
    var repeated = {};
    repeated[t('firstDayNote')] = 1;
    repeated[t('hireRecalcNote')] = 1;
    repeated[t('hrConfirmImpact')] = 1;
    var primaryRows = [];
    var defaults = [];
    rows.forEach(function (row) {
      var extra = '';
      var changed = String(row.before == null ? '' : row.before) !== String(row.after == null ? '' : row.after);
      if (row.field === '到職日' && (creating || changed)) {
        extra = '<p class="ee-warn"><strong>⚠ ' + esc(t('firstDayNote')) + '</strong></p>';
        if (!creating) extra += '<p class="ee-warn"><strong>⚠ ' + esc(t('hireRecalcNote')) + '</strong></p>';
      }
      var card = creating
        ? '<article class="ee-card"><h2>' + esc(diffLabel(row)) + '</h2><div class="ee-diff-after">' + esc(human(row.after)) + '</div>' + extra + '</article>'
        : '<article class="ee-card"><h2>' + esc(diffLabel(row)) + '</h2><div>' + esc(t('before')) + ' ' + esc(human(row.before)) + '</div><div class="ee-diff-after">' + esc(t('after')) + ' ' + esc(human(row.after)) + '</div>' + extra + '</article>';
      if (creating && view.systemFilled && view.systemFilled[row.field]) defaults.push(card);
      else primaryRows.push(card);
    });
    var body = primaryRows.join('');
    if (defaults.length) {
      body += '<details class="ee-card"><summary>' + esc(t('systemDefaults')) + '</summary>' + defaults.join('') + '</details>';
    }
    var warns = (view.warnings || []).filter(function (item) {
      var text = typeof item === 'string' ? item : '';
      return text && !repeated[text];
    }).map(function (item) {
      return '<p class="ee-warn">' + esc(item) + '</p>';
    }).join('');
    var reason = view.reason || {};
    var options = '<option value="">' + esc(t('selectPlaceholder')) + '</option>' + REASONS.map(function (item) {
      return '<option value="' + item[0] + '"' + (reason.code === item[0] ? ' selected' : '') + '>' + esc(t(item[1])) + '</option>';
    }).join('');
    var who = '';
    if (view.name || view.employeeId) {
      who = '<p class="ee-name">' + esc(view.name || '') + (view.employeeId ? '（' + esc(view.employeeId) + '）' : '') + '</p>';
    }
    var impact = needsImpact ? '<p class="ee-warn ee-warn-strong" role="alert"><strong>⚠ ' + esc(t('hrConfirmImpact')) + '</strong></p>' : '';
    return '<header class="ee-top">' + button('ee-back', 'back', '‹') + '<h1>' + esc(t('reviewChanges')) + '</h1></header>' +
      who + impact +
      body + warns +
      '<div class="ee-field"><label for="ee-reason">' + esc(t('changeReason')) + '<span class="ee-req">*</span></label><select id="ee-reason" data-ee-reason="code">' + options + '</select>' +
      (reason.code === 'OTHER' ? '<textarea class="ee-note" data-ee-reason="note" aria-label="' + esc(t('reasonNote')) + '">' + esc(reason.note || '') + '</textarea>' : '') +
      (ready ? '' : '<p class="ee-error">' + esc(t('reasonRequired')) + '</p>') + '</div>' +
      banner(view) +
      '<div class="ee-bar">' + button('ee-secondary', 'cancel', t('cancel')) + button('ee-primary', 'save', creating ? t('confirmAdd') : t('confirmSave'), { disabled: !ready, busy: view.busy }) + '</div>';
  }

  function renderPin(view) {
    var pin = spacedPin(view.pin || '');
    if (!pin || view.leaveGuard) {
      var modal = view.leaveGuard ? renderLeaveModal() : '';
      if (!pin && !view.leaveGuard) {
        return '<section class="ee-card"><h1>' + esc(t('pinGone')) + '</h1>' + button('ee-secondary', 'account', t('goAccount')) + button('ee-secondary', 'list', t('goList')) + '</section>';
      }
      var visible = pin ? '<section class="ee-card"><h1>' + esc(t('createdTitle')) + ' <span class="ee-name">' + esc(view.name || '') + '</span>（' + esc(view.employeeId || '') + '）</h1><p>' + esc(t('hireDate')) + ' ' + esc(view.hireDate || '') + '</p>' + (view.punch ? '<p>' + esc(t('punchNumber')) + ' ' + esc(view.punch) + '（' + esc(t('punchRegistered')) + '）</p>' : '') + '<h2>' + esc(t('tempPinOnce')) + '</h2><div class="ee-pin" translate="no">' + esc(pin) + '</div><p>' + esc(t('tempPinExpires')) + ' ' + esc(formatTaipei(view.expiresAt)) + '</p><p class="ee-warn">' + esc(t('tempPinCloseWarn')) + '</p><p>' + esc(t('tempPinFirstLogin')) + '</p></section>' : '';
      return visible + modal;
    }
    return '<section class="ee-card"><h1>' + esc(t('createdTitle')) + ' <span class="ee-name">' + esc(view.name || '') + '</span>（' + esc(view.employeeId || '') + '）</h1>' +
      '<p>' + esc(t('hireDate')) + ' ' + esc(view.hireDate || '') + '</p>' +
      (view.punch ? '<p>' + esc(t('punchNumber')) + ' ' + esc(view.punch) + '（' + esc(t('punchRegistered')) + '）</p>' : '') +
      '<h2>' + esc(t('tempPinOnce')) + '</h2><div class="ee-pin" translate="no">' + esc(pin) + '</div>' +
      '<p>' + esc(t('tempPinExpires')) + ' ' + esc(formatTaipei(view.expiresAt)) + '</p>' +
      '<p class="ee-hint">' + esc(t('newHireStatus')) + '</p>' +
      '<p class="ee-warn">' + esc(t('tempPinCloseWarn')) + '</p><p>' + esc(t('tempPinFirstLogin')) + '</p></section>' +
      '<div class="ee-bar">' + button('ee-primary', 'written', t('tempPinCopied'), { busy: view.busy }) + '</div>';
  }

  function renderLeaveModal() {
    return '<div class="ee-modal" role="dialog" aria-modal="true" aria-labelledby="ee-pin-title"><div class="ee-dialog"><h2 id="ee-pin-title">' + esc(t('closeWarnTitle')) + '</h2><p>' + esc(t('tempPinCloseWarn')) + '</p>' +
      button('ee-primary', 'stay', t('backToCopy')) + button('ee-secondary', 'written-close', t('writtenClose')) + '</div></div>';
  }

  function renderAck(view) {
    return '<section class="ee-card"><h1>' + esc(t('createdTitle')) + '</h1><p class="ee-warn" role="status">' + esc(t('ackFailed')) + '</p>' +
      button('ee-secondary', 'retry-ack', t('retryAck')) + button('ee-secondary', 'account', t('goAccount')) + button('ee-secondary', 'list', t('goList')) + '</section>';
  }

  function renderShadow() {
    return '<section class="ee-card"><h1>' + esc(t('shadowDone')) + '</h1><p>' + esc(t('shadowNote')) + '</p>' + button('ee-secondary', 'list', t('goList')) + '</section>';
  }

  function shell(screen, main, side) {
    return '<div class="ee" data-ee-screen="' + esc(screen) + '"><div class="ee-side">' + (side || '') + '</div><div class="ee-main">' + main + '</div></div>';
  }

  function renderModel(screen, view) {
    view = view || {};
    var main = '';
    if (screen === 'list') main = renderList(view);
    else if (screen === 'detail') main = renderDetail(view);
    else if (screen === 'add' || screen === 'edit') {
      view.formMode = screen === 'add' ? 'CREATE' : 'UPDATE';
      main = renderForm(view);
    } else if (screen === 'diff') main = renderDiff(view);
    else if (screen === 'audit') main = renderAudit(view.audit || view.rows);
    else if (screen === 'pin') main = renderPin(view);
    else if (screen === 'ack-hint') main = renderAck(view);
    else if (screen === 'shadow-done') main = renderShadow();
    else if (screen === 'pin-gone') main = renderPin({ leaveGuard: false, pin: '' });
    else main = renderList(view);
    var side = screen === 'list' || screen === 'pin' || screen === 'pin-gone' || screen === 'ack-hint' || screen === 'shadow-done'
      ? ''
      : renderList(Object.assign({}, view, { busy: false, embedded: true }));
    return shell(screen, main, side);
  }

  function viewFromState() {
    var actorId = state.actorId || readActor();
    var changes = state.operation === 'CREATE'
      ? createChanges(state.form)
      : buildChanges(state.baseline, state.form, { actorId: actorId, employeeId: state.employeeId, mode: 'UPDATE' });
    return {
      screen: state.screen,
      mode: state.mode,
      query: state.query,
      chip: state.chip,
      rows: state.rows,
      limit: state.limit,
      loading: state.loading,
      listError: state.listError,
      stale: state.stale,
      fields: state.detail || {},
      form: state.form,
      baseline: state.baseline,
      actorId: actorId,
      employeeId: state.employeeId || (state.form && state.form['V2員工ID']) || '',
      diff: state.diff,
      changes: changes,
      reason: state.reason,
      warnings: state.warnings.length ? state.warnings : localWarnings(changes),
      error: state.errorKey ? t(state.errorKey) : (state.listError ? t(state.listError) : ''),
      notice: state.notice ? t(state.notice) : '',
      fieldErrors: state.fieldErrors,
      busy: state.busy || state.acking,
      audit: state.audit,
      leaveGuard: state.leaveGuard,
      name: (state.created && state.created.name) || (state.form && state.form['姓名']) || (state.detail && state.detail['姓名']) || '',
      hireDate: state.created && state.created.hireDate || '',
      punch: state.created && state.created.punch || '',
      expiresAt: state.expiresAt,
      pin: state.screen === 'pin' ? pinMemory : '',
      punchSuggestion: state.punchSuggestion,
      punchConfirmed: state.punchConfirmed,
      suggestion: state.form.suggestedId || '',
      catalog: state.catalog,
      fieldCatalog: state.fieldCatalog,
      requires: state.requires,
      impactConfirmed: state.impactConfirmed,
      operation: state.operation,
      tempPinDays: state.tempPinDays,
      today: todayTaipei(),
      newDept: false,
      advancedOpen: state.advancedOpen,
      systemFilled: systemFilled
    };
  }

  function renderCurrent() {
    return renderModel(state.screen, viewFromState());
  }

  function normalize(response) {
    if (!response || typeof response !== 'object') return { ok: false };
    if (response.ok === true && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      var merged = { ok: true };
      Object.keys(response.data).forEach(function (key) { merged[key] = response.data[key]; });
      Object.keys(response).forEach(function (key) {
        if (key !== 'data') merged[key] = response[key];
      });
      return merged;
    }
    return response;
  }

  function hostRpc(action, payload) {
    return new Promise(function (resolve, reject) {
      if (!global.google || !global.google.script || !global.google.script.run || typeof global.google.script.run.withSuccessHandler !== 'function') {
        reject(new Error('RPC unavailable'));
        return;
      }
      var scriptRun = global.google.script.run;
      scriptRun
        .withSuccessHandler(function (response) { resolve(normalize(response)); })
        .withFailureHandler(function (err) { reject(err || new Error('RPC failed')); })
        .api(action, payload || {});
    });
  }

  function rpc(action, payload, deps) {
    if (deps && typeof deps.call === 'function') {
      return Promise.resolve(deps.call(action, payload)).then(normalize);
    }
    return hostRpc(action, payload);
  }

  function newRequestId() {
    var uuid = '';
    try {
      if (global.crypto && global.crypto.randomUUID) uuid = global.crypto.randomUUID();
    } catch (ignore) {}
    if (!uuid) uuid = String(Date.now()) + '-' + Math.random().toString(16).slice(2);
    return 'EE-' + uuid;
  }

  function ensureRequest() {
    if (!state.requestId || !state.keepRequest) state.requestId = state.requestId || newRequestId();
    if (!state.requestId) state.requestId = newRequestId();
    return state.requestId;
  }

  function flatDetail(res) {
    if (!res) return { fields: {}, rowVersion: '' };
    if (res.fields && typeof res.fields === 'object' && !res.employee && !res.work && !res.workflow) {
      return { fields: Object.assign({}, res.fields), rowVersion: res.rowVersion || '' };
    }
    var employee = res.employee || res;
    function group(name) {
      var outer = res[name] && typeof res[name] === 'object' ? res[name] : {};
      var inner = employee[name] && typeof employee[name] === 'object' ? employee[name] : {};
      return Object.assign({}, outer, inner);
    }
    var basic = group('basic');
    var employment = group('employment');
    var organization = group('organization');
    var work = group('work');
    var workflow = group('workflow');
    var system = group('system');
    var fields = {};
    function put(key, value) {
      if (value == null || String(value).trim() === '') return;
      if (!Object.prototype.hasOwnProperty.call(fields, key)) fields[key] = value;
    }
    put('V2員工ID', employee.employeeId || employee['V2員工ID']);
    put('姓名', employee.name || employee['姓名'] || basic.name);
    put('手機', basic.mobile || basic['手機']);
    put('到職日', work.hireDate || employment.hireDate || workflow.hireDate);
    put('離職日', employment.terminationDate || work.terminationDate);
    put('在職狀態', employment.employmentStatus || workflow.employmentStatus || work.employmentStatus);
    put('人員類別', work.personType || employment.personType || workflow.personType);
    put('部門', work.department || employment.department || organization.department);
    put('工作地點', work.location || employment.location || organization.location);
    put('直屬主管ID', organization.manager1 || work.manager1 || workflow.manager1);
    put('第二主管ID', organization.manager2 || work.manager2 || workflow.manager2);
    put('是否主管', organization.isManager != null ? organization.isManager : (work.isManager != null ? work.isManager : workflow.isManager));
    put('簽核權限', organization.approvalPermission || workflow.approvalPermission);
    put('正式班別', work.formalShift || work.shift);
    put('班別確認', work.shiftConfirmed || work.shiftConfirm || workflow.shiftConfirmed);
    put('出勤管理類型', work.attendanceType || workflow.attendanceType);
    put('打卡號', work.punchNumber);
    put('免打卡', work.punchExempt);
    put('免請假', work.leaveExempt);
    put('啟用出勤異常檢查', work.attendanceExceptionEnabled != null ? work.attendanceExceptionEnabled : work.anomalyCheck);
    put('PreferredLanguage', system.preferredLanguage || workflow.preferredLanguage || employment.preferredLanguage);
    put('系統啟用', system.systemEnabled);
    put('登入帳號狀態', system.credentialState || workflow.credentialState);
    put('LINE綁定狀態', system.lineBound != null ? system.lineBound : workflow.lineBound);
    put('HR確認', workflow.hrConfirm || workflow.HR確認 || workflow['HR確認'] || workflow.identityConfirm || organization.hrConfirm || organization.HR確認 || organization['HR確認'] || system.hrConfirm || employment.hrConfirm || employee['HR確認']);
    put('組織設定確認', organization.organizationConfirmed || organization.orgConfirmed || workflow.organizationConfirmed || workflow.orgConfirmed);
    put('特休制度', employment.annualPolicy || work.annualPolicy || employment['特休制度']);
    put('簽核路由群組', organization.routeGroup || workflow.routeGroup || work.routeGroup);
    put('最終需代理人', organization.needsProxy != null ? organization.needsProxy : workflow.needsProxy);
    put('代理候選優先規則', organization.proxyPriority || workflow.proxyPriority);
    put('代理人指定方式', organization.proxyMode || workflow.proxyMode);
    put('主管指派代理', organization.managerAssignProxy || workflow.managerAssignProxy);
    return { fields: fields, rowVersion: res.rowVersion || employee.rowVersion || '' };
  }

  async function refreshList(deps) {
    var previous = state.rows.slice();
    state.loading = true;
    state.listError = '';
    try {
      var res = await rpc('hrEmployeeSearch', {
        sessionToken: readSession(deps),
        query: state.query,
        limit: 200,
        offset: 0
      }, deps);
      if (!res || res.ok === false) throw new Error('search');
      state.rows = res.rows || [];
      state.stale = false;
    } catch (ignore) {
      state.listError = 'loadFailed';
      state.errorKey = previous.length ? '' : 'loadFailed';
      state.stale = previous.length > 0;
      state.rows = previous;
    } finally {
      state.loading = false;
    }
  }

  async function loadEditMeta(deps) {
    var first;
    try {
      first = await rpc('hrEmployeeValidate', {
        sessionToken: readSession(deps),
        mode: 'UPDATE',
        employeeId: state.employeeId,
        expectedRowVersion: state.rowVersion || '',
        changes: {},
        reason: { code: '', note: '' },
        hrConfirmedPunch: false,
        hrConfirmedImpact: false
      }, deps);
    } catch (ignore) {
      return;
    }
    if (!first || first.code === 'FEATURE_OFF') return;
    if (first.rowVersion) state.rowVersion = first.rowVersion;
    if (first.ok === true) {
      state.fieldCatalog = first.fields || [];
      if (first.mode === 'SHADOW' || first.mode === 'LIVE') state.mode = first.mode;
      return;
    }
    if (!state.rowVersion) return;
    try {
      var second = await rpc('hrEmployeeValidate', {
        sessionToken: readSession(deps),
        mode: 'UPDATE',
        employeeId: state.employeeId,
        expectedRowVersion: state.rowVersion,
        changes: {},
        reason: { code: '', note: '' },
        hrConfirmedPunch: false,
        hrConfirmedImpact: false
      }, deps);
      if (second && second.ok === true) {
        state.fieldCatalog = second.fields || [];
        if (second.rowVersion) state.rowVersion = second.rowVersion;
        if (second.mode === 'SHADOW' || second.mode === 'LIVE') state.mode = second.mode;
      }
    } catch (ignore) {}
  }

  async function openDetail(id, deps) {
    state.employeeId = id;
    state.screen = 'detail';
    state.loading = true;
    state.errorKey = '';
    var res = null;
    try {
      res = await rpc('hrEmployeeDetail', { sessionToken: readSession(deps), employeeId: id }, deps);
    } catch (ignore) {
      res = null;
    }
    if (!res || res.ok === false) {
      state.errorKey = 'loadFailed';
      state.loading = false;
      return { ok: false };
    }
    var flat = flatDetail(res);
    state.detail = flat.fields;
    state.rowVersion = flat.rowVersion || '';
    state.baseline = Object.assign({}, flat.fields);
    state.form = Object.assign({}, flat.fields);
    try {
      var audit = await rpc('hrEmployeeAuditList', { sessionToken: readSession(deps), employeeId: id, limit: 20 }, deps);
      state.audit = audit && (audit.rows || audit.items) || [];
    } catch (ignore) {
      state.audit = [];
    }
    await loadEditMeta(deps);
    state.loading = false;
    return { ok: true };
  }

  function changesFor(operation) {
    if (operation === 'CREATE') return createChanges(state.form);
    return buildChanges(state.baseline, state.form, {
      actorId: state.actorId || readActor(),
      employeeId: state.employeeId,
      mode: 'UPDATE',
      baseline: state.baseline
    });
  }

  function validateBody(operation, changes, deps, expected) {
    return {
      sessionToken: readSession(deps),
      mode: operation,
      employeeId: operation === 'CREATE' ? String(state.form['V2員工ID'] || '').toUpperCase() : state.employeeId,
      expectedRowVersion: operation === 'UPDATE' ? expected : '',
      changes: changes,
      reason: state.reason || { code: '', note: '' },
      hrConfirmedPunch: !!state.punchConfirmed,
      hrConfirmedImpact: !!state.impactConfirmed
    };
  }

  async function submitCreate(deps) {
    if (state.busy) return { ok: false, pending: true };
    var errors = validateClient(state.form, 'CREATE', {});
    if (errors.length) {
      state.fieldErrors = {};
      errors.forEach(function (item) { state.fieldErrors[item.field] = item.key; });
      state.errorKey = errors[0].key;
      return { ok: false };
    }
    if (!(state.reason && state.reason.code)) state.reason = { code: 'NEW_HIRE', note: '' };
    if (!reasonOk(state.reason, true)) {
      state.errorKey = 'reasonRequired';
      return { ok: false };
    }
    state.busy = true;
    state.impactConfirmed = true;
    if (String((state.form && state.form['打卡號']) || '').trim()) state.punchConfirmed = true;
    state.operation = 'CREATE';
    rerender();
    var changes = createChanges(state.form);
    var expected = '';
    try {
      var validated = await rpc('hrEmployeeValidate', validateBody('CREATE', changes, deps, expected), deps);
      state.diff = validated && validated.diff || [];
      state.warnings = mapWarnings(validated && validated.warnings);
      state.requires = validated && validated.requires || {};
      if (validated && (validated.mode === 'SHADOW' || validated.mode === 'LIVE')) state.mode = validated.mode;
      if (!validated || validated.ok === false) {
        pinMemory = '';
        state.errorKey = errorKey(validated, 'CREATE');
        state.fieldErrors = mapFieldErrors(validated);
        state.screen = 'add';
        return { ok: false };
      }
      var requestId = ensureRequest();
      var res = await rpc('hrEmployeeCreate', {
        sessionToken: readSession(deps),
        requestId: requestId,
        employeeId: String(state.form['V2員工ID'] || '').toUpperCase(),
        changes: changes,
        reason: state.reason,
        hrConfirmedPunch: !!state.punchConfirmed,
        hrConfirmedImpact: !!state.impactConfirmed,
        confirmToken: validated.confirmToken || ''
      }, deps);
      if (!res || res.ok === false) {
        pinMemory = '';
        state.errorKey = errorKey(res, 'CREATE');
        state.fieldErrors = mapFieldErrors(res);
        state.screen = 'add';
        state.keepRequest = !!(res && (res.code === 'SYSTEM_BUSY' || res.code === 'CREDENTIAL_INSERT_FAILED'));
        if (!state.keepRequest) state.requestId = '';
        return { ok: false };
      }
      state.created = {
        name: state.form['姓名'] || '',
        employeeId: res.employeeId || String(state.form['V2員工ID'] || '').toUpperCase(),
        hireDate: state.form['到職日'] || '',
        punch: state.form['打卡號'] || ''
      };
      state.employeeId = state.created.employeeId;
      if (res.mode === 'SHADOW' || state.mode === 'SHADOW') {
        pinMemory = '';
        pinEventId = '';
        state.screen = 'shadow-done';
        state.requestId = '';
        return { ok: true, shadow: true };
      }
      var cred = res.credential || {};
      var pin = typeof cred.tempPin === 'string' ? cred.tempPin : '';
      var show = /^\d{6}$/.test(pin) && cred.displayOnce !== false && !res.replayed;
      if (!show) {
        pinMemory = '';
        state.screen = 'pin-gone';
        state.requestId = '';
        return { ok: true, replayed: !!res.replayed };
      }
      pinMemory = pin;
      pinEmployeeId = state.created.employeeId;
      pinEventId = cred.tempPinEventId || '';
      state.expiresAt = cred.expiresAt || '';
      state.screen = 'pin';
      state.leaveGuard = false;
      markPinHistory();
      hookNavigation();
      state.requestId = '';
      if (cred) cred.tempPin = '';
      return { ok: true };
    } catch (ignore) {
      pinMemory = '';
      state.errorKey = 'unknownResult';
      state.screen = 'add';
      state.keepRequest = true;
      return { ok: false, unknown: true };
    } finally {
      state.busy = false;
    }
  }

  async function openDiff(deps) {
    var operation = state.screen === 'add' || state.operation === 'CREATE' ? 'CREATE' : 'UPDATE';
    state.operation = operation;
    if (operation === 'CREATE' && !(state.reason && state.reason.code)) state.reason = { code: 'NEW_HIRE', note: '' };
    var ctx = { actorId: state.actorId || readActor(), employeeId: state.employeeId, mode: operation, baseline: state.baseline };
    var clientErrors = validateClient(state.form, operation, ctx);
    if (clientErrors.length) {
      state.fieldErrors = {};
      clientErrors.forEach(function (item) { state.fieldErrors[item.field] = item.key; });
      state.errorKey = clientErrors[0].key;
      return { ok: false };
    }
    var changes = changesFor(operation);
    if (operation === 'UPDATE' && !Object.keys(changes).length) {
      state.errorKey = 'noChanges';
      return { ok: false };
    }
    if (String((state.form && state.form['打卡號']) || '').trim()) state.punchConfirmed = true;
    state.busy = true;
    rerender();
    try {
      var res = await rpc('hrEmployeeValidate', validateBody(operation, changes, deps, state.rowVersion || ''), deps);
      state.diff = res && res.diff || [];
      state.warnings = mapWarnings(res && res.warnings, changes);
      state.requires = res && res.requires || {};
      if (res && (res.newSuggestion || (res.punch && res.punch.suggestion))) {
        state.punchSuggestion = res.newSuggestion || res.punch.suggestion;
      }
      if (res && res.punch && res.punch.suggestion) state.punchSuggestion = res.punch.suggestion;
      if (state.operation === 'CREATE' && state.punchSuggestion && (!state.form['打卡號'] || systemFilled['打卡號'])) {
        state.form['打卡號'] = state.punchSuggestion;
        systemFilled['打卡號'] = true;
      }
      if (res && (res.mode === 'SHADOW' || res.mode === 'LIVE')) state.mode = res.mode;
      if (res && res.fields) state.fieldCatalog = res.fields;
      if (!res || res.code === 'FEATURE_OFF') {
        state.errorKey = 'featureOff';
        return { ok: false };
      }
      var blocking = (res.errors || []).filter(function (item) {
        return item && item.code !== 'REASON_REQUIRED' && item.code !== 'HR_CONFIRM_REQUIRED';
      });
      var softOnly = res.ok !== true && (res.errors || []).length > 0 && !blocking.length;
      if (res.ok !== true && !softOnly) {
        state.errorKey = errorKey(blocking.length ? { code: blocking[0].code } : res, operation);
        state.fieldErrors = mapFieldErrors(res);
        return { ok: false };
      }
      state.confirmToken = res.ok ? (res.confirmToken || '') : '';
      state.screen = 'diff';
      state.errorKey = '';
      state.fieldErrors = {};
      return { ok: true };
    } catch (ignore) {
      state.errorKey = 'genericFail';
      return { ok: false };
    } finally {
      state.busy = false;
    }
  }

  async function submitUpdate(deps) {
    if (state.busy) return { ok: false, pending: true };
    var ctx = { actorId: state.actorId || readActor(), employeeId: state.employeeId, mode: 'UPDATE', baseline: state.baseline };
    var changes = buildChanges(state.baseline, state.form, ctx);
    if (!Object.keys(changes).length) {
      state.errorKey = 'noChanges';
      return { ok: false, empty: true };
    }
    if (!reasonOk(state.reason, true)) {
      state.errorKey = 'reasonRequired';
      return { ok: false };
    }
    state.busy = true;
    state.impactConfirmed = true;
    if (String((state.form && state.form['打卡號']) || '').trim()) state.punchConfirmed = true;
    state.operation = 'UPDATE';
    rerender();
    var expected = state.rowVersion || '';
    try {
      var validated = await rpc('hrEmployeeValidate', validateBody('UPDATE', changes, deps, expected), deps);
      state.diff = validated && validated.diff || state.diff;
      state.warnings = mapWarnings(validated && validated.warnings, changes);
      state.requires = validated && validated.requires || state.requires;
      if (!validated || validated.ok === false) {
        state.errorKey = errorKey(validated, 'UPDATE');
        state.fieldErrors = mapFieldErrors(validated);
        state.conflict = !!(validated && (validated.code === 'ROW_VERSION_MISMATCH' || (validated.errors && validated.errors[0] && validated.errors[0].code === 'ROW_VERSION_MISMATCH')));
        return { ok: false };
      }
      var requestId = ensureRequest();
      var res = await rpc('hrEmployeeUpdate', {
        sessionToken: readSession(deps),
        requestId: requestId,
        employeeId: state.employeeId,
        expectedRowVersion: expected,
        changes: changes,
        reason: state.reason,
        hrConfirmedPunch: !!state.punchConfirmed,
        hrConfirmedImpact: !!state.impactConfirmed,
        confirmToken: validated.confirmToken || ''
      }, deps);
      if (!res || res.ok === false) {
        state.errorKey = errorKey(res, 'UPDATE');
        state.conflict = !!(res && res.code === 'ROW_VERSION_MISMATCH');
        state.keepRequest = !!(res && (res.code === 'SYSTEM_BUSY' || res.code === 'CREDENTIAL_INSERT_FAILED'));
        if (!state.keepRequest) state.requestId = '';
        return { ok: false };
      }
      if (res.rowVersion) state.rowVersion = res.rowVersion;
      state.baseline = Object.assign({}, state.baseline, changes);
      state.detail = Object.assign({}, state.detail || {}, changes);
      state.notice = 'saved';
      state.errorKey = '';
      state.screen = 'detail';
      state.requestId = '';
      state.keepRequest = false;
      state.confirmToken = '';
      return { ok: true };
    } catch (ignore) {
      state.errorKey = 'unknownResultEdit';
      state.keepRequest = true;
      return { ok: false, unknown: true };
    } finally {
      state.busy = false;
    }
  }

  async function confirmWritten(deps) {
    if (state.acking) return { ok: false, pending: true };
    var employeeId = pinEmployeeId || state.employeeId || '';
    var eventId = pinEventId || '';
    state.acking = true;
    var failed = false;
    try {
      var res = await rpc('hrAcknowledgeTemporaryPinDelivery', {
        sessionToken: readSession(deps),
        employeeId: employeeId,
        tempPinEventId: eventId
      }, deps);
      if (!res || res.ok === false) failed = true;
    } catch (ignore) {
      failed = true;
    } finally {
      if (pinMemory) pinWasHeld = true;
      pinMemory = '';
      wipePinDom();
      state.acking = false;
      state.leaveGuard = false;
      state.ackFailed = failed;
      state.screen = failed ? 'ack-hint' : 'list';
      state.notice = failed ? '' : 'saved';
      var run = pendingLeave;
      pendingLeave = null;
      if (typeof run === 'function') {
        try { run(); } catch (ignoreRun) {}
      }
    }
    return { ok: !failed, cleared: pinMemory === '' };
  }

  function requestClosePin() {
    if (pinMemory) {
      state.leaveGuard = true;
      state.screen = 'pin';
      return { blocked: true };
    }
    state.leaveGuard = false;
    state.screen = 'list';
    return { blocked: false };
  }

  function wipePinDom() {
    var doc = global.document;
    if (!doc || !doc.querySelectorAll) return;
    var pins = doc.querySelectorAll('.ee-pin');
    for (var i = 0; i < pins.length; i += 1) pins[i].textContent = '';
    var modals = doc.querySelectorAll('.ee-modal');
    for (var j = 0; j < modals.length; j += 1) {
      if (modals[j].parentNode) modals[j].parentNode.removeChild(modals[j]);
    }
  }

  function scrubAccount() {
    wipePinDom();
    if (!eeTouched && !pinWasHeld) return;
    var doc = global.document;
    if (!doc || !doc.getElementById) return;
    var content = doc.getElementById('accountContent');
    if (content) content.innerHTML = '';
    eeTouched = false;
    pinWasHeld = false;
  }

  function clearPin() {
    if (pinMemory) pinWasHeld = true;
    pinMemory = '';
    pinEventId = '';
    pinHistory = false;
    state.leaveGuard = false;
    if (pinWasHeld || eeTouched) scrubAccount();
  }

  function dropSession() {
    clearPin();
    pendingLeave = null;
    state = blankState();
    state.active = false;
  }

  function markPinHistory() {
    if (!pinMemory || pinHistory) return;
    if (!global.history || typeof global.history.pushState !== 'function') return;
    try {
      global.history.pushState({ eePinGuard: 1 }, '');
      pinHistory = true;
    } catch (ignore) {}
  }

  function holdPin(pin, meta) {
    pinMemory = /^\d{6}$/.test(pin || '') ? String(pin) : '';
    if (pinMemory) pinWasHeld = true;
    pinEmployeeId = meta && meta.employeeId || pinEmployeeId;
    pinEventId = meta && meta.tempPinEventId || pinEventId;
    if (pinMemory) {
      state.screen = 'pin';
      markPinHistory();
      hookNavigation();
    }
  }

  async function handleAction(action, dataset, deps) {
    dataset = dataset || {};
    deps = deps || {};
    if (action === 'written' || action === 'written-close' || action === 'retry-ack') return confirmWritten(deps);
    if (action === 'stay') {
      state.leaveGuard = false;
      pendingLeave = null;
      return { ok: true };
    }
    if (action === 'close-pin' || (action === 'back' && state.screen === 'pin')) return requestClosePin();
    if (action === 'add') {
      state.screen = 'add';
      state.operation = 'CREATE';
      state.employeeId = '';
      state.detail = null;
      systemFilled = {};
      state.form = suggestDefaults({ idLetter: '' });
      state.baseline = {};
      state.fieldCatalog = [];
      state.catalog = {};
      state.fieldErrors = {};
      state.errorKey = '';
      state.notice = '';
      state.diff = [];
      state.warnings = [];
      state.rowVersion = '';
      state.confirmToken = '';
      state.requestId = '';
      state.keepRequest = false;
      state.reason = { code: 'NEW_HIRE', note: '' };
      state.punchConfirmed = false;
      state.punchSuggestion = '';
      state.impactConfirmed = false;
      state.idTouched = false;
      state.requires = {};
      state.advancedOpen = false;
      state.audit = [];
      return { ok: true };
    }
    if (action === 'advanced') {
      state.advancedOpen = !state.advancedOpen;
      return { ok: true };
    }
    if (action === 'edit') {
      state.screen = 'edit';
      state.operation = 'UPDATE';
      state.form = Object.assign({}, state.baseline);
      state.reason = { code: '', note: '' };
      state.errorKey = '';
      return { ok: true };
    }
    if (action === 'open' && dataset.id) return openDetail(dataset.id, deps);
    if (action === 'chip') {
      state.chip = dataset.value || 'all';
      return { ok: true };
    }
    if (action === 'more') {
      state.limit += 20;
      return { ok: true };
    }
    if (action === 'letter') {
      state.form.idLetter = dataset.value || '';
      if (!state.idTouched) {
        try {
          var suggested = await rpc('onboardingSuggestEmployeeId', {
            sessionToken: readSession(deps),
            letter: state.form.idLetter,
            hireDate: state.form['到職日'] || ''
          }, deps);
          var nextId = suggested && (suggested.employeeId || suggested.suggestedEmployeeId);
          if (nextId && !state.idTouched) state.form['V2員工ID'] = nextId;
          state.punchSuggestion = suggested && (suggested.punch || suggested.punchNumber || (suggested.punch && suggested.punch.suggestion)) || state.punchSuggestion;
          if (suggested && suggested.punch && suggested.punch.suggestion) state.punchSuggestion = suggested.punch.suggestion;
          if (state.punchSuggestion && (!state.form['打卡號'] || systemFilled['打卡號'])) {
            state.form['打卡號'] = state.punchSuggestion;
            systemFilled['打卡號'] = true;
          }
        } catch (ignore) {}
      }
      return { ok: true };
    }
    if (action === 'review') return openDiff(deps);
    if (action === 'create') return submitCreate(deps);
    if (action === 'save') return state.operation === 'CREATE' ? submitCreate(deps) : submitUpdate(deps);
    if (action === 'cancel' || action === 'list' || action === 'back') {
      if (state.screen === 'pin') return requestClosePin();
      if (state.screen === 'diff') state.screen = state.operation === 'CREATE' ? 'add' : 'edit';
      else if (state.screen === 'edit' || state.screen === 'add') state.screen = state.employeeId && state.screen === 'edit' ? 'detail' : 'list';
      else state.screen = 'list';
      state.leaveGuard = false;
      return { ok: true };
    }
    if (action === 'account') {
      var openAccount = hostFn('openHrCredentialAdmin');
      if (openAccount) {
        try { openAccount(); } catch (ignore) {}
      }
      return { ok: true };
    }
    if (action === 'reload') return refreshList(deps);
    if (action === 'newhires') {
      state.screen = 'list';
      state.chip = 'new';
      return refreshList(deps);
    }
    return { ok: false };
  }

  function onClick(event) {
    var node = event.target && event.target.closest ? event.target.closest('[data-ee-action]') : null;
    if (!node || !state.active) return;
    event.preventDefault();
    handleAction(node.getAttribute('data-ee-action'), {
      id: node.getAttribute('data-ee-id') || '',
      value: node.getAttribute('data-ee-value') || ''
    }, {}).then(function () { rerender(); });
  }

  function growField(node) {
    if (!node || node.tagName !== 'TEXTAREA' || !node.style) return;
    node.style.height = 'auto';
    var next = node.scrollHeight || 48;
    if (next < 48) next = 48;
    node.style.height = next + 'px';
  }

  function growAll() {
    var doc = global.document;
    if (!doc || !doc.querySelectorAll) return;
    var nodes = doc.querySelectorAll('.ee-grow');
    for (var i = 0; i < nodes.length; i += 1) growField(nodes[i]);
  }

  function captureFocus() {
    var doc = global.document;
    var active = doc && doc.activeElement;
    if (!active || !active.getAttribute) return null;
    if (active.closest && !active.closest('.ee')) return null;
    return {
      field: active.getAttribute('data-ee-field') || '',
      query: active.getAttribute('data-ee-query') != null,
      reason: active.getAttribute('data-ee-reason') || '',
      start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null
    };
  }

  function restoreFocus(saved) {
    if (!saved || !global.document || !global.document.querySelector) return;
    var sel = '';
    if (saved.field) sel = '[data-ee-field="' + saved.field + '"]';
    else if (saved.query) sel = '[data-ee-query]';
    else if (saved.reason) sel = '[data-ee-reason="' + saved.reason + '"]';
    if (!sel) return;
    var node = global.document.querySelector(sel);
    if (!node || !node.focus) return;
    try { node.focus(); } catch (ignore) {}
    if (saved.start != null && node.setSelectionRange) {
      try { node.setSelectionRange(saved.start, saved.end); } catch (ignore) {}
    }
    growField(node);
  }

  function syncPrimary() {
    var doc = global.document;
    if (!doc || !doc.querySelector) return;
    var node = doc.querySelector('.ee-main [data-ee-action="review"], .ee-main [data-ee-action="save"]');
    if (!node) node = doc.querySelector('[data-ee-action="review"], [data-ee-action="save"]');
    if (!node) return;
    var view = viewFromState();
    var disabled = false;
    if (state.screen === 'add' || state.screen === 'edit') {
      var mode = state.screen === 'add' ? 'CREATE' : 'UPDATE';
      var errors = validateClient(state.form, mode, { actorId: view.actorId, employeeId: state.employeeId, baseline: state.baseline });
      var changes = mode === 'UPDATE' ? buildChanges(state.baseline, state.form, { actorId: view.actorId, employeeId: state.employeeId, mode: 'UPDATE' }) : {};
      disabled = !!(state.busy || state.acking || errors.length || (mode === 'UPDATE' && !Object.keys(changes).length));
    } else if (state.screen === 'diff') {
      var diffChanges = state.operation === 'CREATE' ? createChanges(state.form) : buildChanges(state.baseline, state.form, { actorId: view.actorId, employeeId: state.employeeId, mode: 'UPDATE' });
      var required = Object.keys(diffChanges).length > 0 || (state.diff && state.diff.length) || state.operation === 'CREATE';
      disabled = !(reasonOk(state.reason, required) && !state.busy && !state.acking);
    }
    node.disabled = disabled;
    if (disabled) node.setAttribute('disabled', 'disabled');
    else node.removeAttribute('disabled');
    var hintText = '';
    if (state.screen === 'add' && disabled && errors && errors.length) {
      var names = [];
      var seen = {};
      errors.forEach(function (item) {
        if (!item || !item.field || seen[item.field]) return;
        seen[item.field] = 1;
        names.push(label(item.field));
      });
      if (names.length) hintText = t('missingFields') + '：' + names.join('、');
    }
    var hint = doc.querySelector ? doc.querySelector('[data-ee-missing]') : null;
    if (hintText) {
      if (!hint && doc.createElement && node.parentNode && node.parentNode.insertBefore) {
        hint = doc.createElement('p');
        hint.className = 'ee-error';
        if (hint.setAttribute) hint.setAttribute('data-ee-missing', '');
        node.parentNode.insertBefore(hint, node);
      }
      if (hint) hint.textContent = hintText;
    } else if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
  }

  function onInput(event) {
    var node = event.target;
    if (!node || !node.getAttribute || !state.active) return;
    var field = node.getAttribute('data-ee-field');
    if (field) {
      if (field === '簽核權限' && isSelf({ actorId: state.actorId || readActor(), employeeId: state.employeeId }) && state.screen === 'edit') return;
      if (FORBIDDEN[field]) return;
      state.form[field] = node.value;
      if (field === 'V2員工ID') state.idTouched = true;
      if (field !== '人員類別') systemFilled[field] = false;
    }
    if (node.getAttribute('data-ee-query') != null) state.query = node.value;
    if (node.getAttribute('data-ee-reason') === 'code') state.reason.code = node.value;
    if (node.getAttribute('data-ee-reason') === 'note') state.reason.note = node.value;
    if (field === '人員類別') state.form = suggestDefaults(state.form, { refreshSystem: true });
    else if (field === '工作地點') state.form = suggestDefaults(state.form);
    if (node.getAttribute('data-ee-reason') === 'code' || node.getAttribute('data-ee-query') != null || field === '人員類別' || field === '工作地點') {
      rerender(true);
      return;
    }
    if (field) growField(node);
    syncPrimary();
  }

  function onBeforeUnload(event) {
    if (!pinMemory) return;
    event.preventDefault();
    event.returnValue = '';
  }

  function onKey(event) {
    if (!state.active || !global.document) return;
    if (event.key === 'Escape' && state.leaveGuard) {
      state.leaveGuard = false;
      rerender();
      return;
    }
    if (event.key !== 'Tab') return;
    var dialog = global.document.querySelector('.ee-modal');
    if (!dialog) return;
    var items = dialog.querySelectorAll('button,input,select,textarea');
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && global.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && global.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bind() {
    var doc = global.document;
    if (!doc || doc.__eeBound) return;
    if (global.addEventListener && !global.__eeResize) {
      global.addEventListener('resize', function () { growAll(); });
      global.__eeResize = true;
    }
    doc.addEventListener('click', onClick);
    doc.addEventListener('input', onInput);
    doc.addEventListener('change', onInput);
    doc.addEventListener('keydown', onKey);
    global.addEventListener ? global.addEventListener('beforeunload', onBeforeUnload) : null;
    doc.__eeBound = true;
  }

  function ensureStyles() {
    var doc = global.document;
    if (!doc || !doc.getElementById || doc.getElementById('ee-styles')) return;
    var node = doc.createElement('style');
    node.id = 'ee-styles';
    node.textContent = styles();
    (doc.head || doc.documentElement).appendChild(node);
  }

  function scrollTopIfScreenChanged() {
    if (!lastScreen || lastScreen === state.screen) {
      lastScreen = state.screen;
      return;
    }
    lastScreen = state.screen;
    try {
      if (typeof global.scrollTo === 'function') global.scrollTo(0, 0);
    } catch (ignore) {}
  }

  function scheduleGrow() {
    var run = function () { try { growAll(); } catch (ignore) {} };
    if (typeof global.requestAnimationFrame === 'function') {
      try { global.requestAnimationFrame(run); return; } catch (ignore) {}
    }
    if (typeof global.setTimeout === 'function') global.setTimeout(run, 0);
    else run();
  }

  function rerender(keepFocus) {
    if (!state.active) return;
    scrollTopIfScreenChanged();
    var saved = keepFocus ? captureFocus() : null;
    ensureStyles();
    var painted = false;
    var hostRender = hostFn('renderMyAccount_');
    if (hostRender && readAccountPanel() === 'employeeManagement') {
      try { hostRender(); painted = true; } catch (ignore) {}
    }
    var root = global.document && global.document.querySelector && global.document.querySelector('[data-ee-root]');
    if (root) {
      root.innerHTML = renderCurrent();
      painted = true;
    }
    if (!painted) syncPrimary();
    growAll();
    if (saved) restoreFocus(saved);
    else {
      var dialog = global.document && global.document.querySelector && global.document.querySelector('.ee-modal button');
      if (dialog && dialog.focus) {
        try { dialog.focus(); } catch (ignore) {}
      }
    }
  }

  function revealPinGuard() {
    requestClosePin();
    try {
      if (typeof accountPanel_ !== 'undefined') accountPanel_ = 'employeeManagement';
    } catch (ignore) {}
    rerender();
    ensureModal();
  }

  function ensureModal() {
    var doc = global.document;
    if (!doc || !pinMemory || !state.leaveGuard || !doc.createElement) return;
    if (doc.querySelector && doc.querySelector('.ee-modal')) return;
    if (!doc.body || !doc.body.appendChild) return;
    ensureStyles();
    var holder = doc.createElement('div');
    holder.innerHTML = renderLeaveModal();
    if (holder.firstChild) doc.body.appendChild(holder.firstChild);
  }

  function activate(mode) {
    hookNavigation();
    var host = hostFn('rc2AccountPanelHtml_');
    if (typeof host !== 'function' || host.__ee) {
      if (host && host.__ee) {
        state.active = true;
        state.mode = normalizeMode(mode);
        hookNavigation();
        return true;
      }
      return false;
    }
    function wrapped(panel) {
      if (String(panel || '') === 'employeeManagement' && state.active) {
        eeTouched = true;
        var html = renderCurrent();
        scheduleGrow();
        return html;
      }
      return host.apply(this, arguments);
    }
    wrapped.__ee = true;
    global.rc2AccountPanelHtml_ = wrapped;
    if (typeof global.rc2OpenAccountPanel_ === 'function' && !global.rc2OpenAccountPanel_.__ee) {
      var openHost = global.rc2OpenAccountPanel_;
      function openWrapped(panel) {
        if (pinMemory && String(panel || '') !== 'employeeManagement') {
          pendingLeave = function () { return openHost(panel); };
          revealPinGuard();
          return { blocked: true };
        }
        if (pinMemory) requestClosePin();
        var out = openHost.apply(this, arguments);
        if (String(panel || '') === 'employeeManagement' && state.active && !pinMemory) refreshList({}).then(rerender);
        if (pinMemory && state.leaveGuard) {
          rerender();
          ensureModal();
        }
        return out;
      }
      openWrapped.__ee = true;
      openWrapped.__eeHost = openHost;
      global.rc2OpenAccountPanel_ = openWrapped;
    }
    state.active = true;
    state.mode = normalizeMode(mode);
    state.actorId = readActor();
    state.permission = readPermission();
    bind();
    ensureStyles();
    hookNavigation();
    return true;
  }

  async function install(opts) {
    opts = opts || {};
    var permission = opts.permission == null ? readPermission() : opts.permission;
    if (!isHrAdmin(permission)) return false;
    var mode = opts.mode;
    if (mode == null) {
      try {
        var res = await rpc('hrEmployeeValidate', {
          sessionToken: readSession(opts),
          mode: 'CREATE',
          changes: {},
          reason: { code: '', note: '' }
        }, opts);
        mode = featureMode(res);
        if (res && (res.mode === 'SHADOW' || res.mode === 'LIVE')) mode = res.mode;
      } catch (ignore) {
        return false;
      }
    }
    if (!canInstall({ permission: permission, mode: mode })) return false;
    state.permission = permission;
    if (opts.actorId) state.actorId = opts.actorId;
    return activate(mode);
  }

  function reset(partial) {
    pinMemory = '';
    pinEmployeeId = '';
    pinEventId = '';
    pinHistory = false;
    pendingLeave = null;
    systemFilled = {};
    eeTouched = false;
    pinWasHeld = false;
    lastScreen = '';
    var active = state.active;
    var mode = state.mode;
    state = blankState();
    state.active = active;
    state.mode = mode;
    Object.keys(partial || {}).forEach(function (key) { state[key] = partial[key]; });
  }

  function snapshot() {
    return {
      active: state.active,
      mode: state.mode,
      screen: state.screen,
      ackFailed: state.ackFailed,
      leaveGuard: state.leaveGuard,
      pinHeld: pinMemory !== '',
      requestId: state.requestId,
      employeeId: state.employeeId,
      errorKey: state.errorKey,
      notice: state.notice
    };
  }

  function wrapHost(name, decorate) {
    var current = global && typeof global[name] === 'function' ? global[name] : null;
    if (!current || current.__eeGuard) return;
    function wrapped() {
      return decorate(current, this, arguments);
    }
    wrapped.__eeGuard = true;
    global[name] = wrapped;
  }

  function hooksAlive() {
    var html = hostFn('rc2AccountPanelHtml_');
    return !!(html && html.__ee);
  }

  function hookNavigation() {
    ['showPage', 'showHome', 'showMyAccount_', 'rc2InnerBack_', 'openHrCredentialAdmin'].forEach(function (name) {
      wrapHost(name, function (host, self, args) {
        if (!pinMemory) return host.apply(self, args);
        pendingLeave = function () { return host.apply(self, args); };
        revealPinGuard();
        return { blocked: true };
      });
    });
    wrapHost('logout', function (host, self, args) {
      if (pinMemory) {
        pendingLeave = function () {
          dropSession();
          return host.apply(self, args);
        };
        revealPinGuard();
        return { blocked: true };
      }
      dropSession();
      return host.apply(self, args);
    });
    if (global.history && typeof global.history.back === 'function' && !global.history.back.__eeGuard) {
      var back = global.history.back;
      function guardedBack() {
        if (pinMemory) {
          pendingLeave = function () { return back.apply(global.history, []); };
          revealPinGuard();
          return { blocked: true };
        }
        return back.apply(global.history, arguments);
      }
      guardedBack.__eeGuard = true;
      try { global.history.back = guardedBack; } catch (ignore) {}
    }
    if (global.addEventListener && !global.__eePop) {
      global.addEventListener('popstate', function () {
        if (!pinMemory) return;
        if (!pendingLeave) {
          pendingLeave = function () {
            try { if (global.history && global.history.back) global.history.back(); } catch (ignore) {}
          };
        }
        revealPinGuard();
      });
      global.__eePop = true;
    }
  }

  function afterLogin() {
    hookNavigation();
    if (!loggedIn()) return loginInstall;
    if (state.active && hooksAlive()) return loginInstall;
    if (loginInstall) return loginInstall;
    loginInstall = Promise.resolve().then(function () {
      return install({});
    }).then(function (ok) {
      loginInstall = null;
      hookNavigation();
      if (ok && readAccountPanel() === 'employeeManagement') rerender();
      return ok;
    }, function () {
      loginInstall = null;
      return false;
    });
    return loginInstall;
  }

  function hookSessionStart() {
    wrapHost('enterApp', function (host, self, args) {
      var out = host.apply(self, args);
      afterLogin();
      return out;
    });
  }

  function boot() {
    if (global.addEventListener && !global.__eeResize) {
      global.addEventListener('resize', function () { growAll(); });
      global.__eeResize = true;
    }
    hookNavigation();
    hookSessionStart();
    var start = function () {
      hookNavigation();
      hookSessionStart();
      if (loggedIn()) afterLogin();
    };
    if (!global.document) {
      if (loggedIn()) afterLogin();
      return;
    }
    if (global.document.readyState === 'loading' && global.document.addEventListener) {
      global.document.addEventListener('DOMContentLoaded', start);
    } else start();
  }

  global.ABIS_EMPLOYEE_EDIT = {
    contract: CONTRACT,
    texts: packs,
    draftNativeReview: {
      langs: ['VI', 'TH'],
      note: 'DRAFT_NATIVE_REVIEW: new Vietnamese and Thai strings need a native speaker. English is prepared and not shown.',
      keys: draftKeys,
      reusedFromM7: reusedKeys
    },
    exposedLangs: ['ZH', 'VI', 'TH'],
    styles: styles,
    t: t,
    human: human,
    isHrAdmin: isHrAdmin,
    normalizeMode: normalizeMode,
    canInstall: canInstall,
    install: install,
    renderScreen: renderModel,
    renderCurrent: renderCurrent,
    rerender: function (keepFocus) { rerender(keepFocus); },
    renderLeaveModal: renderLeaveModal,
    buildChanges: buildChanges,
    createChanges: createChanges,
    validateClient: validateClient,
    suggestDefaults: suggestDefaults,
    pinExpiresBeforeHire: pinExpiresBeforeHire,
    publicError: publicError,
    auditRow: auditRow,
    maskPhone: maskPhone,
    spacedPin: spacedPin,
    formatTaipei: formatTaipei,
    handleAction: handleAction,
    onInput: onInput,
    submitCreate: submitCreate,
    submitUpdate: submitUpdate,
    confirmWritten: confirmWritten,
    requestClosePin: requestClosePin,
    holdPin: holdPin,
    pinValue: function () { return pinMemory; },
    clearPin: clearPin,
    reset: reset,
    snapshot: snapshot,
    setForm: function (form) { state.form = Object.assign({}, state.form, form || {}); },
    reasonOk: reasonOk,
    localWarnings: localWarnings
  };

  boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
