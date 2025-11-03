# WorkOrbit API - Postman Collection

## 📚 Overview

This directory contains the complete Postman collection for the WorkOrbit Enterprise API with **70+ endpoints** covering all features including real-time notifications, analytics, caching, and advanced search.

---

## 📁 Files

1. **WorkOrbit_API.postman_collection.json** - Complete API collection
2. **WorkOrbit.postman_environment.json** - Environment variables
3. **README.md** - This documentation

---

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `WorkOrbit_API.postman_collection.json`
4. Click **Import**

### 2. Import Environment

1. Click **Environments** (gear icon)
2. Click **Import**
3. Select `WorkOrbit.postman_environment.json`
4. Click **Import**
5. Select "WorkOrbit Environment" from dropdown

### 3. Setup

1. Ensure your server is running:
   ```bash
   npm run dev
   ```

2. The baseUrl is pre-configured to: `http://localhost:5000/api/v1`

3. Start with **Authentication → Login** to get access token

---

## 📂 Collection Structure

### 🔐 Authentication (6 endpoints)
- Register User
- Login (auto-saves accessToken)
- Forgot Password
- Reset Password
- Refresh Token
- Logout

### 👥 Employees (3 endpoints)
- **Get All Employees (Advanced Search)** - Supports:
  - Full-text search: `?search=john`
  - Filters: `?filter[department]=IT&filter[status]=active`
  - Operators: `?filter[salary][$gte]=50000`
  - Sorting: `?sort=-createdAt` (- for descending)
  - Pagination: `?page=1&limit=20`
  - Field selection: `?fields=id,name,email`
- Get Employee by ID
- Update Employee

### 📊 Analytics & Dashboard (3 endpoints)
- **Get Dashboard Stats** (Cached 5 min)
  - Returns: employees, attendance, leave, projects, tasks stats
- **Get Attendance Trends** (Cached 10 min)
  - Periods: daily, weekly, monthly
- **Get Employee Performance**
  - Task completion, attendance, leave metrics

### 🔔 Notifications (4 endpoints)
- Get Notification Preferences
- Update Notification Preferences
  - Email, Push, SMS, In-app settings
  - Do Not Disturb mode
  - Daily/Weekly digest
- Register FCM Token (Push notifications)
- Send Test Notification (WebSocket)

### 📅 Attendance (3 endpoints)
- Check In (with geolocation)
- Check Out (with geolocation)
- Get My Attendance

### 🏖️ Leave Management (4 endpoints)
- Apply Leave
- Get My Leaves
- Get Leave Balance
- Approve Leave (HR/Manager only)

### 📁 Projects & Tasks (6 endpoints)
- Create Project
- Get All Projects
- Create Task
- Get My Tasks
- Update Task Progress
- **Bulk Update Tasks** - Update multiple tasks at once

### 🎯 Milestones (2 endpoints)
- Create Milestone
- Complete Milestone

### 💰 Payroll (2 endpoints)
- Generate Payroll (Admin/HR only)
- Get My Payslips

### 📍 Geofences (2 endpoints)
- Create Geofence
- Get All Geofences

### 🏥 Health & Monitoring (4 endpoints)
- Health Check (Complete status)
- Liveness Probe (Kubernetes)
- Readiness Probe (Kubernetes)
- Prometheus Metrics

---

## 🔑 Authentication Flow

### Auto-Token Management

The collection includes **automatic token management**:

1. **Login Request** automatically:
   - Saves `accessToken` to collection variable
   - Saves `userId` to collection variable
   - Saves `organizationId` to collection variable

2. **All authenticated requests** automatically use `{{accessToken}}`

### Manual Token Setup

If needed, manually set tokens:
1. Go to Collection Variables
2. Set `accessToken` value
3. Set `userId` value (optional)

---

## 🔍 Advanced Search Examples

### Basic Search
```
GET /employees?search=john
```

### Filters
```
GET /employees?filter[department]=IT&filter[status]=active
```

### Operators
```
# Greater than or equal
GET /employees?filter[salary][$gte]=50000

# Less than
GET /employees?filter[salary][$lt]=100000

# In array
GET /employees?filter[status][$in][]=active&filter[status][$in][]=pending

# Between
GET /employees?filter[salary][$between][]=50000&filter[salary][$between][]=100000
```

### Sorting
```
# Ascending
GET /employees?sort=name

# Descending
GET /employees?sort=-createdAt

# Multiple fields
GET /employees?sort=-createdAt,name
```

### Pagination
```
GET /employees?page=1&limit=20
```

### Field Selection
```
GET /employees?fields=id,name,email,department
```

### Combined Example
```
GET /employees?search=john&filter[department]=IT&filter[salary][$gte]=50000&sort=-createdAt&page=1&limit=20&fields=id,name,email,salary
```

---

## 📊 Dashboard Analytics

### Get Dashboard Stats
```
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
```

**Response includes:**
- Employee statistics (total, by role, by department)
- Attendance analytics (daily trends, rates)
- Leave statistics (by type, by status)
- Project metrics (completion rates)
- Task analytics (overdue, by priority)

### Attendance Trends
```
GET /analytics/attendance-trends?period=weekly
```

Options: `daily`, `weekly`, `monthly`

### Employee Performance
```
GET /analytics/employee-performance/{userId}?startDate=2024-01-01
```

Returns:
- Task completion rate
- Attendance rate
- Leave history

---

## 🔔 Notification System

### Update Preferences
```json
PUT /notifications/preferences

{
  "emailEnabled": true,
  "emailAttendance": true,
  "pushEnabled": true,
  "doNotDisturb": true,
  "dndStartTime": "22:00:00",
  "dndEndTime": "08:00:00",
  "dailyDigest": true,
  "digestTime": "09:00:00"
}
```

### Test WebSocket Notification
```
POST /notifications/test
```

This sends a real-time notification via WebSocket to the authenticated user.

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:5000/api/v1` |
| `accessToken` | JWT access token | Auto-set on login |
| `userId` | Current user ID | Auto-set on login |
| `organizationId` | User's organization | Auto-set on login |
| `projectId` | Current project ID | Set manually |
| `taskId` | Current task ID | Set manually |
| `leaveId` | Current leave ID | Set manually |

---

## 🧪 Testing Workflow

### 1. Authentication
```
1. Register User (creates account)
2. Login (auto-saves token)
3. Token is now used for all requests
```

### 2. Employee Management
```
1. Get All Employees (with filters)
2. Get Employee by ID
3. Update Employee
```

### 3. Attendance Tracking
```
1. Check In (morning)
2. Get My Attendance (view history)
3. Check Out (evening)
```

### 4. Leave Management
```
1. Get Leave Balance
2. Apply Leave
3. Get My Leaves
4. (HR) Approve Leave
```

### 5. Project & Task Management
```
1. Create Project
2. Create Task
3. Get My Tasks
4. Update Task Progress
5. Bulk Update Tasks
```

### 6. Analytics
```
1. Get Dashboard Stats (org-wide)
2. Get Attendance Trends (weekly)
3. Get Employee Performance (individual)
```

---

## 🔥 Advanced Features

### 1. Caching
Analytics endpoints are cached:
- Dashboard: 5 minutes
- Attendance Trends: 10 minutes

Response headers show cache status:
```
X-Cache: HIT   (from cache)
X-Cache: MISS  (fresh data)
```

### 2. Rate Limiting
Per-user rate limits (via Redis):
- Admin: 1000 req/min
- HR: 500 req/min
- Manager: 300 req/min
- Employee: 100 req/min

Response headers show limits:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1704096000000
```

### 3. Bulk Operations
```json
POST /tasks/bulk-update

{
  "taskIds": ["uuid-1", "uuid-2", "uuid-3"],
  "updates": {
    "status": "completed",
    "priority": "low"
  }
}
```

---

## 📝 Request Examples

### Employee Search with All Features
```
GET /employees
  ?search=john                          # Search name/email
  &filter[department]=IT                # Department filter
  &filter[status]=active                # Status filter
  &filter[salary][$gte]=50000          # Salary >= 50k
  &filter[dateOfJoining][$gte]=2024-01-01  # Joined after Jan 2024
  &sort=-salary,name                    # Sort by salary desc, then name asc
  &page=1                               # Page 1
  &limit=20                             # 20 results
  &fields=id,name,email,salary,department  # Specific fields only
```

### Dashboard with Date Range
```
GET /analytics/dashboard
  ?startDate=2024-01-01
  &endDate=2024-12-31
```

### Create Leave Application
```json
POST /leave/apply

{
  "leaveType": "casual",
  "startDate": "2024-06-01",
  "endDate": "2024-06-03",
  "numberOfDays": 3,
  "reason": "Personal work",
  "isHalfDay": false
}
```

---

## 🏥 Health Monitoring

### Health Check
```
GET /health
```

Returns:
- Overall status
- Database connectivity
- Memory usage
- Uptime

### Kubernetes Probes
```
GET /health/live     # Liveness probe
GET /health/ready    # Readiness probe
```

### Prometheus Metrics
```
GET /metrics
```

Returns Prometheus-format metrics for:
- HTTP request duration
- Request count
- Active connections
- Memory usage
- Custom business metrics

---

## 🚨 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Server Error

---

## 📦 Export & Import

### Export Collection
1. Right-click collection
2. Click **Export**
3. Choose Collection v2.1
4. Save file

### Share with Team
1. Export collection & environment
2. Share JSON files
3. Team imports both files
4. Ready to use!

---

## 🔗 Related Documentation

- **API Docs**: http://localhost:5000/docs (Swagger)
- **Quick Reference**: [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- **Features Guide**: [../ADDITIONAL_FEATURES.md](../ADDITIONAL_FEATURES.md)
- **Enterprise Guide**: [../README_ENTERPRISE.md](../README_ENTERPRISE.md)

---

## 💡 Tips & Tricks

### 1. Environment Switching
Create multiple environments for:
- Local Development (`localhost:5000`)
- Staging (`staging.api.workorbit.com`)
- Production (`api.workorbit.com`)

### 2. Pre-request Scripts
Add to collection for:
- Auto-refresh expired tokens
- Request logging
- Custom headers

### 3. Test Scripts
Add assertions:
```javascript
pm.test("Status is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response has data", () => {
  pm.expect(pm.response.json()).to.have.property('data');
});
```

### 4. Variables
Use collection variables for:
- Dynamic data (userId, projectId)
- Auto-populated from responses
- Reusable across requests

---

## 🎯 Complete Endpoint List

### Authentication (6)
- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/refresh-token
- POST /auth/logout

### Employees (3)
- GET /employees
- GET /employees/:id
- PUT /employees/:id

### Analytics (3)
- GET /analytics/dashboard
- GET /analytics/attendance-trends
- GET /analytics/employee-performance/:userId

### Notifications (4)
- GET /notifications/preferences
- PUT /notifications/preferences
- POST /notifications/fcm-token
- POST /notifications/test

### Attendance (3)
- POST /attendance/checkin
- POST /attendance/checkout
- GET /attendance/my-attendance

### Leave (4)
- POST /leave/apply
- GET /leave/my-leaves
- GET /leave/balance
- PUT /leave/approve/:leaveId

### Projects & Tasks (6)
- POST /projects
- GET /projects
- POST /tasks/project/:projectId
- GET /tasks/my-tasks
- PUT /tasks/:taskId/progress
- POST /tasks/bulk-update

### Milestones (2)
- POST /milestones/project/:projectId
- POST /milestones/:milestoneId/complete

### Payroll (2)
- POST /payroll/generate
- GET /payroll/my-payslips

### Geofences (2)
- POST /geofences
- GET /geofences

### Health (4)
- GET /health
- GET /health/live
- GET /health/ready
- GET /metrics

**Total: 39+ core endpoints with query parameters for 70+ variations**

---

## 🎉 Ready to Use!

The collection is production-ready with:
- ✅ Auto-token management
- ✅ Comprehensive examples
- ✅ Advanced search patterns
- ✅ All enterprise features
- ✅ Health monitoring
- ✅ Error handling

**Happy Testing! 🚀**
