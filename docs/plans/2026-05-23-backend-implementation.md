# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng toàn bộ REST API + WebSocket cho hệ thống chấm công nhận diện khuôn mặt.

**Architecture:** Express.js + MongoDB (Mongoose). Auth dùng JWT (access token 15m + refresh token). WebSocket dùng Socket.io. Mỗi route nhóm theo domain: auth, employees, shifts, attendance, face, leave, reports, config, dashboard.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, bcryptjs, jsonwebtoken, socket.io, express-validator

---

## File Structure

```
backend/src/
├── app.js                          (MODIFY: register new routers, socket.io)
├── server.js                       (MODIFY: attach socket.io to http server)
├── config/
│   ├── db.js                       (EXISTS)
│   └── env.js                      (EXISTS)
├── constants/
│   └── accountRoleEnums.js         (EXISTS: ADMIN, EMPLOYEE)
├── middleware/
│   ├── authenticate.js             (CREATE: verify JWT, attach req.user)
│   └── authorize.js                (CREATE: check role)
├── models/
│   ├── User.js                     (MODIFY: add department, phone, email, dateOfBirth)
│   ├── Attendance.js               (MODIFY: add isOutOfZone to subEventSchema)
│   ├── FaceData.js                 (MODIFY: add imageUrl field)
│   ├── Shift.js                    (CREATE: name, startTime, endTime, isActive)
│   ├── LeaveRequest.js             (CREATE: employeeId, startDate, endDate, reason, status)
│   ├── GeoConfig.js                (CREATE: centerLat, centerLon, radiusMeters — singleton)
│   ├── ProcessedEvent.js           (EXISTS)
│   ├── CheckIn.js                  (EXISTS — keep for reference, not used in main flow)
│   └── CheckOut.js                 (EXISTS — keep for reference)
├── controllers/
│   ├── authController.js           (CREATE: login, refresh, logout)
│   ├── employeeController.js       (CREATE: CRUD employees)
│   ├── shiftController.js          (CREATE: CRUD shifts + activate)
│   ├── attendanceController.js     (MODIFY: add manual, query, geofence validation)
│   ├── faceController.js           (CREATE: update, sync, list, delete)
│   ├── leaveController.js          (CREATE: create, list, approve, reject)
│   ├── reportController.js         (CREATE: monthly, individual)
│   ├── configController.js         (CREATE: get/set geofence)
│   └── dashboardController.js      (CREATE: present employees)
├── routes/
│   ├── index.js                    (MODIFY: register all routers)
│   ├── auth.js                     (CREATE)
│   ├── employees.js                (CREATE)
│   ├── shifts.js                   (CREATE)
│   ├── attendance.js               (MODIFY: add manual + query routes)
│   ├── face.js                     (CREATE)
│   ├── leave.js                    (CREATE)
│   ├── reports.js                  (CREATE)
│   ├── config.js                   (CREATE)
│   └── dashboard.js                (CREATE)
├── utils/
│   ├── generateToken.js            (EXISTS)
│   ├── geoUtils.js                 (CREATE: haversine distance calc)
│   └── seedAdmin.js                (CREATE: seed default admin on startup)
└── validators/
    ├── authValidator.js            (CREATE)
    ├── employeeValidator.js        (CREATE)
    ├── attendanceValidator.js      (CREATE)
    └── leaveValidator.js           (CREATE)
```

---

## Task 1: Auth Middleware & Seed Admin

**Files:**
- Create: `backend/src/middleware/authenticate.js`
- Create: `backend/src/middleware/authorize.js`
- Create: `backend/src/utils/seedAdmin.js`
- Modify: `backend/src/models/User.js` — add `department`, `phone`, `email`, `dateOfBirth` fields
- Modify: `backend/src/server.js` — call seedAdmin on startup

**Why first:** Every subsequent route depends on auth middleware.

- [ ] Thêm fields vào `User.js`: `department` (String), `phone` (String), `email` (String), `dateOfBirth` (Date)

- [ ] Tạo `middleware/authenticate.js`:
```js
// Đọc Authorization: Bearer <token>
// Verify JWT, gán req.user = { id, role }
// Trả 401 nếu token invalid/expired
```

- [ ] Tạo `middleware/authorize.js`:
```js
// authorize('admin') → kiểm tra req.user.role === 'admin', trả 403 nếu không đủ quyền
// Dùng sau authenticate
```

- [ ] Tạo `utils/seedAdmin.js`:
```js
// Kiểm tra DB có user nào role='admin' chưa
// Nếu chưa: tạo user { employeeCode: 'ADMIN', name: 'Administrator', role: 'admin', password: bcrypt('ADMIN') }
// Gọi hàm này trong server.js sau khi kết nối DB thành công
```

- [ ] Gọi `seedAdmin()` trong `server.js` sau `connectDB()`

---

## Task 2: Auth Routes (Login / Refresh / Logout)

**Files:**
- Create: `backend/src/controllers/authController.js`
- Create: `backend/src/routes/auth.js`
- Modify: `backend/src/routes/index.js`
- Create: `backend/src/validators/authValidator.js`

**Depends on:** Task 1

- [ ] Tạo `validators/authValidator.js`:
```js
// loginValidator: body('employeeCode').notEmpty(), body('password').notEmpty()
```

- [ ] Tạo `controllers/authController.js`:

  **`login`**:
  1. Tìm User theo `employeeCode`
  2. So sánh password với `bcrypt.compare`
  3. Tạo accessToken (15m) + refreshToken
  4. Lưu refreshToken hash vào User (thêm field `refreshTokenHash` vào User model nếu chưa có)
  5. Trả `{ accessToken, refreshToken, user: { id, employeeCode, name, role } }`

  **`refresh`**:
  1. Nhận `refreshToken` từ body
  2. Hash lại, tìm User có `refreshTokenHash` khớp
  3. Tạo accessToken mới, trả về

  **`logout`**:
  1. Clear `refreshTokenHash` của user trong DB
  2. Trả 200

- [ ] Thêm field `refreshTokenHash` (String, nullable) vào `User.js`

- [ ] Tạo `routes/auth.js`:
```js
POST /login  → authController.login
POST /refresh → authController.refresh
POST /logout → authenticate, authController.logout
```

- [ ] Register trong `routes/index.js`: `router.use('/auth', authRouter)`

- [ ] Test thủ công: POST `/api/v1/auth/login` với `{ employeeCode: 'ADMIN', password: 'ADMIN' }` → nhận được JWT.

---

## Task 3: Employee CRUD

**Files:**
- Create: `backend/src/controllers/employeeController.js`
- Create: `backend/src/routes/employees.js`
- Create: `backend/src/validators/employeeValidator.js`

**Depends on:** Task 1, Task 2

- [ ] Tạo `validators/employeeValidator.js`:
```js
// createEmployeeValidator: name (required), email (optional, isEmail), phone (optional)
```

- [ ] Tạo `controllers/employeeController.js`:

  **`create`** (admin):
  1. Validate input
  2. Tạo User mới (employeeCode auto-gen)
  3. Hash password = employeeCode (dùng bcrypt)
  4. Trả 201 + user object (không trả passwordHash)

  **`list`** (admin):
  1. Query với optional filters: `department`, `search` (tìm theo name hoặc employeeCode)
  2. Pagination: `?page=1&limit=20`
  3. Trả danh sách (không trả passwordHash)

  **`getOne`** (admin):
  1. Tìm theo `_id`
  2. Trả 404 nếu không tìm thấy

  **`update`** (admin):
  1. Chỉ cho phép update: name, department, jobTitle, phone, email, dateOfBirth
  2. Không cho phép update: employeeCode, passwordHash, accountRole qua endpoint này

- [ ] Tạo `routes/employees.js` + register trong `index.js`

- [ ] Test: Tạo 1 nhân viên → lấy danh sách → cập nhật tên → kiểm tra response.

---

## Task 4: Shift Management

**Files:**
- Create: `backend/src/models/Shift.js`
- Create: `backend/src/controllers/shiftController.js`
- Create: `backend/src/routes/shifts.js`

**Depends on:** Task 1

- [ ] Tạo `models/Shift.js`:
```js
{
  name:      { type: String, required: true },
  startTime: { type: String, required: true },  // "HH:mm"
  endTime:   { type: String, required: true },  // "HH:mm"
  isActive:  { type: Boolean, default: false },
}
```

- [ ] Tạo `controllers/shiftController.js`:

  **`create`**: Tạo ca mới (isActive = false mặc định)

  **`list`**: Lấy tất cả ca

  **`update`**: Cập nhật name/startTime/endTime (không update isActive trực tiếp)

  **`activate`**: 
  1. Set tất cả ca về `isActive = false`
  2. Set ca được chọn `isActive = true`
  3. *(Atomic: dùng 2 updateMany operations trong transaction hoặc sequential)*

  **`remove`**: Xóa ca (không cho phép xóa ca đang active)

- [ ] Tạo `routes/shifts.js` + register trong `index.js`

- [ ] Test: Tạo 2 ca → activate ca 1 → kiểm tra chỉ 1 ca `isActive=true`.

---

## Task 5: Geofencing Config & Util

**Files:**
- Create: `backend/src/models/GeoConfig.js`
- Create: `backend/src/utils/geoUtils.js`
- Create: `backend/src/controllers/configController.js`
- Create: `backend/src/routes/config.js`

**Depends on:** Task 1

- [ ] Tạo `models/GeoConfig.js`:
```js
{
  centerLat:    { type: Number, required: true },
  centerLon:    { type: Number, required: true },
  radiusMeters: { type: Number, required: true },
}
// Singleton: chỉ 1 document. Dùng findOneAndUpdate({}, data, { upsert: true })
```

- [ ] Tạo `utils/geoUtils.js`:
```js
// haversineDistance(lat1, lon1, lat2, lon2) → khoảng cách tính bằng mét
// isWithinZone(lat, lon, geoConfig) → Boolean
```

- [ ] Tạo `controllers/configController.js`:
  - `getGeofence`: Lấy GeoConfig (trả 404 nếu chưa cấu hình)
  - `setGeofence`: Upsert GeoConfig

- [ ] Tạo `routes/config.js` + register trong `index.js`

- [ ] Test: Set geofence → kiểm tra haversineDistance với tọa độ trong/ngoài vùng.

---

## Task 6: Attendance — CheckIn/CheckOut & Sync

**Files:**
- Modify: `backend/src/models/Attendance.js` — thêm `isOutOfZone` vào subEventSchema
- Modify: `backend/src/controllers/attendanceController.js` — tích hợp geofence + shiftId
- Create: `backend/src/validators/attendanceValidator.js`
- Modify: `backend/src/routes/attendance.js`

**Depends on:** Task 4, Task 5

- [ ] Thêm `isOutOfZone: { type: Boolean, default: false }` vào `subEventSchema` trong `Attendance.js`

- [ ] Cập nhật `handleEvent` trong `attendanceController.js`:
  1. Load `GeoConfig` (nếu tồn tại) → gọi `isWithinZone` → set `isOutOfZone`
  2. Load ca active (`Shift.findOne({ isActive: true })`) → gán `shiftId` vào Attendance

- [ ] Tạo `validators/attendanceValidator.js`:
```js
// checkInOutValidator: empId (notEmpty), time (isISO8601), lat (isFloat), lon (isFloat)
```

- [ ] Đảm bảo routes:
```
POST /attendance/checkIn   → authenticate, checkInOutValidator, handleCheckIn
POST /attendance/checkOut  → authenticate, checkInOutValidator, handleCheckOut
POST /attendance/sync/checkIn   → authenticate, handleSyncCheckIn
POST /attendance/sync/checkOut  → authenticate, handleSyncCheckOut
```

- [ ] Test: CheckIn với tọa độ ngoài zone → `isOutOfZone=true` trong DB. CheckIn 2 lần cùng `localId` → idempotent.

---

## Task 7: Attendance — Manual CRUD & Query (Admin)

**Files:**
- Modify: `backend/src/controllers/attendanceController.js` — thêm manualCreate, update, remove, list
- Modify: `backend/src/routes/attendance.js`

**Depends on:** Task 6

- [ ] Thêm `manualCreate` (admin):
  1. Input: `{ empId, checkInTime, checkOutTime, workDate }`
  2. Upsert Attendance cho (empId, workDate)
  3. Set checkIn/checkOut với `method: 'manual'`

- [ ] Thêm `updateRecord` (admin):
  - Cho phép update: `checkIn.time`, `checkIn.latitude/longitude`, `checkOut.time`, `checkOut.latitude/longitude`

- [ ] Thêm `deleteRecord` (admin): Xóa bản ghi Attendance theo `_id`

- [ ] Thêm `listAttendance` (admin):
  - Query params: `date`, `startDate`, `endDate`, `empId`, `late` (bool), `earlyLeave` (bool), `page`, `limit`
  - `late`: checkIn.time > shift.startTime
  - `earlyLeave`: checkOut.time < shift.endTime
  - Populate employeeId (name, employeeCode)
  - Pagination + total count

- [ ] Thêm routes:
```
GET    /attendance          → authenticate, authorize('admin'), listAttendance
POST   /attendance/manual   → authenticate, authorize('admin'), manualCreate
PUT    /attendance/:id      → authenticate, authorize('admin'), updateRecord
DELETE /attendance/:id      → authenticate, authorize('admin'), deleteRecord
```

- [ ] Test: Tạo manual record → query với `?late=true` → chỉ trả về record có checkIn muộn.

---

## Task 8: Face Data

**Files:**
- Modify: `backend/src/models/FaceData.js` — thêm `imageUrl`
- Create: `backend/src/controllers/faceController.js`
- Create: `backend/src/routes/face.js`

**Depends on:** Task 1

- [ ] Thêm `imageUrl: { type: String, default: null }` vào `FaceData.js`

- [ ] Tạo `controllers/faceController.js`:

  **`updateFace`**:
  1. Input: `{ listFaceEmbedding, imageUrl }`
  2. Upsert FaceData cho `:empId`
  3. Set `updatedTime = now`

  **`syncFaceData`**:
  1. Input: `[{ employeeId, listFaceEmbedding, imageUrl, updatedTime }]`
  2. Với mỗi item: nếu `item.updatedTime` mới hơn DB → cập nhật
  3. Nếu role là admin: trả về danh sách face data "mới":
     - employeeId **không có** trong input list → trả về
     - employeeId **có** trong input list nhưng `DB.updatedTime > item.updatedTime` → trả về

  **`listFaceData`** (admin): Lấy tất cả FaceData, populate employeeId (name, employeeCode), trả kèm `imageUrl`

  **`deleteFaceData`** (admin): Xóa FaceData theo `empId`

- [ ] Tạo `routes/face.js` + register trong `index.js`

- [ ] Test: Upload face data → sync từ mobile với updatedTime cũ → DB không bị ghi đè. Admin sync → nhận lại face data mới từ DB.

---

## Task 9: Leave Request

**Files:**
- Create: `backend/src/models/LeaveRequest.js`
- Create: `backend/src/controllers/leaveController.js`
- Create: `backend/src/routes/leave.js`
- Create: `backend/src/validators/leaveValidator.js`

**Depends on:** Task 1

- [ ] Tạo `models/LeaveRequest.js`:
```js
{
  employeeId:  { type: ObjectId, ref: 'User', required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  reason:      { type: String, trim: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:  { type: ObjectId, ref: 'User', default: null },
  reviewedAt:  { type: Date, default: null },
}
```

- [ ] Tạo `validators/leaveValidator.js`:
```js
// createLeaveValidator: startDate (isISO8601), endDate (isISO8601), endDate >= startDate
```

- [ ] Tạo `controllers/leaveController.js`:

  **`create`** (any authenticated user, từ mobile):
  1. Validate startDate <= endDate
  2. Tạo LeaveRequest với `employeeId = req.user.id`, `status = 'pending'`

  **`list`** (admin):
  - Filter: `?status=&empId=&page=`
  - Populate employeeId (name, employeeCode)

  **`approve`** (admin):
  1. Tìm LeaveRequest, kiểm tra `status === 'pending'`
  2. Set `status = 'approved'`, `reviewedBy = req.user.id`, `reviewedAt = now`

  **`reject`** (admin):
  1. Tìm LeaveRequest, kiểm tra `status === 'pending'`
  2. Set `status = 'rejected'`, `reviewedBy = req.user.id`, `reviewedAt = now`

- [ ] Tạo `routes/leave.js` + register trong `index.js`

- [ ] Test: Tạo đơn → approve → kiểm tra status. Approve đơn đã approved → trả 400.

---

## Task 10: Reports

**Files:**
- Create: `backend/src/controllers/reportController.js`
- Create: `backend/src/routes/reports.js`

**Depends on:** Task 4, Task 6, Task 9

- [ ] Tạo `controllers/reportController.js`:

  **`monthlyReport`** (admin):
  - Input: `?month=2026-05&empId=` (empId optional)
  - Aggregation pipeline trên Attendance:
    1. Match theo `workDate` trong tháng + optional `employeeId`
    2. `$group` theo employeeId:
       - `totalWorkDays`: count records có checkIn
       - `totalWorkHours`: sum `(checkOut.time - checkIn.time)` tính bằng giờ
       - `lateCount`: count checkIn.time > shift.startTime (join với active shift hoặc lấy shift từ shiftId)
       - `earlyLeaveCount`: count checkOut.time < shift.endTime
       - `outOfZoneCount`: count checkIn.isOutOfZone = true
    3. Lookup LeaveRequest được approved trong tháng → `leaveDays`
  - Nếu có `empId`: trả data cho 1 người. Nếu không: trả tất cả.

  > **Note về late/earlyLeave:** Lấy ca active tại thời điểm query (hoặc ca lưu trong Attendance.shiftId) để so sánh.

  **`employeeReport`** (admin):
  - Alias của `monthlyReport` nhưng bắt buộc có `empId` từ path param

- [ ] Tạo `routes/reports.js` + register

- [ ] Test: Tạo dữ liệu mẫu 1 tháng → query report → kiểm tra `totalWorkDays`, `lateCount`.

---

## Task 11: Realtime Dashboard (Socket.io)

**Files:**
- Modify: `backend/src/server.js` — attach Socket.io
- Modify: `backend/src/app.js` — export `httpServer` hoặc truyền io instance
- Create: `backend/src/controllers/dashboardController.js`
- Create: `backend/src/routes/dashboard.js`

**Depends on:** Task 6

- [ ] Cài đặt `socket.io`:
```bash
cd backend && npm install socket.io
```

- [ ] Modify `server.js`:
```js
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: env.CLIENT_URL, credentials: true } });

// Basic auth cho socket (validate JWT từ handshake)
io.use((socket, next) => { /* verify token */ next(); });

io.on('connection', (socket) => { /* join room 'admin' nếu role=admin */ });

// Export io để dùng trong controllers
module.exports = { httpServer, io };
```

- [ ] Truyền `io` vào attendanceController (hoặc dùng module singleton):
```js
// Sau mỗi checkIn/checkOut thành công:
io.to('admin').emit('attendance:update', { type: 'checkIn'|'checkOut', employeeId, time, name });
```

- [ ] Tạo `controllers/dashboardController.js`:
  **`getPresentEmployees`**: 
  - Query Attendance ngày hôm nay có checkIn, chưa có checkOut (hoặc `status !== 'partial'`)
  - Populate employeeId (name, employeeCode, department)
  - Trả về danh sách

- [ ] Tạo `routes/dashboard.js` + register trong `index.js`

- [ ] Test: CheckIn 2 nhân viên → GET `/dashboard/present` → cả 2 xuất hiện. CheckOut 1 người → chỉ còn 1.

---

## Task 12: Integration & Hardening

**Files:** Rải rác

**Depends on:** All tasks above

- [ ] Thêm global error handler vào `app.js`:
```js
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message });
});
```

- [ ] Thêm `express-validator` error handling helper (dùng lại trong tất cả controllers):
```js
// utils/validationResult.js: check validationResult(req), nếu có lỗi trả 422
```

- [ ] Review tất cả routes: đảm bảo `authenticate` + `authorize` được áp đúng.

- [ ] Test end-to-end flow:
  1. Login → nhận JWT
  2. Tạo nhân viên → tạo ca → activate ca
  3. Set geofence
  4. CheckIn (mobile) → kiểm tra `isOutOfZone`, `shiftId`
  5. CheckOut → dashboard trả về 0 người
  6. Employee xin nghỉ → Admin duyệt → report tháng có `leaveDays = 1`

- [ ] Commit toàn bộ với message: `feat: complete backend API implementation`

---

## Dependency Graph

```
Task 1 (Auth Middleware + Seed)
  └── Task 2 (Auth Routes)
        └── Task 3 (Employee CRUD)
Task 1
  └── Task 4 (Shift Management)
Task 1
  └── Task 5 (Geofencing)
Task 4 + Task 5
  └── Task 6 (CheckIn/CheckOut + Sync)
        └── Task 7 (Manual Attendance + Query)
              └── Task 11 (WebSocket Dashboard)
Task 1
  └── Task 8 (Face Data)
Task 1
  └── Task 9 (Leave Request)
Task 4 + Task 6 + Task 9
  └── Task 10 (Reports)
All
  └── Task 12 (Integration)
```

---

## API Routes Summary

| Method | Path | Auth | Task |
|--------|------|------|------|
| POST | `/api/v1/auth/login` | — | 2 |
| POST | `/api/v1/auth/refresh` | — | 2 |
| POST | `/api/v1/auth/logout` | JWT | 2 |
| POST | `/api/v1/employees` | admin | 3 |
| GET | `/api/v1/employees` | admin | 3 |
| GET | `/api/v1/employees/:id` | admin | 3 |
| PUT | `/api/v1/employees/:id` | admin | 3 |
| POST | `/api/v1/shifts` | admin | 4 |
| GET | `/api/v1/shifts` | admin | 4 |
| PUT | `/api/v1/shifts/:id` | admin | 4 |
| PUT | `/api/v1/shifts/:id/activate` | admin | 4 |
| DELETE | `/api/v1/shifts/:id` | admin | 4 |
| GET | `/api/v1/config/geofence` | admin | 5 |
| PUT | `/api/v1/config/geofence` | admin | 5 |
| POST | `/api/v1/attendance/checkIn` | JWT | 6 |
| POST | `/api/v1/attendance/checkOut` | JWT | 6 |
| POST | `/api/v1/attendance/sync/checkIn` | JWT | 6 |
| POST | `/api/v1/attendance/sync/checkOut` | JWT | 6 |
| GET | `/api/v1/attendance` | admin | 7 |
| POST | `/api/v1/attendance/manual` | admin | 7 |
| PUT | `/api/v1/attendance/:id` | admin | 7 |
| DELETE | `/api/v1/attendance/:id` | admin | 7 |
| PUT | `/api/v1/face/employee/:empId` | JWT | 8 |
| POST | `/api/v1/face/sync` | JWT | 8 |
| GET | `/api/v1/face` | admin | 8 |
| DELETE | `/api/v1/face/:empId` | admin | 8 |
| POST | `/api/v1/leave` | JWT | 9 |
| GET | `/api/v1/leave` | admin | 9 |
| PUT | `/api/v1/leave/:id/approve` | admin | 9 |
| PUT | `/api/v1/leave/:id/reject` | admin | 9 |
| GET | `/api/v1/reports/monthly` | admin | 10 |
| GET | `/api/v1/reports/employee/:id` | admin | 10 |
| GET | `/api/v1/dashboard/present` | admin | 11 |
| WS | Socket.io `attendance:update` | JWT | 11 |
