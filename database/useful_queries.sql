-- =============================================
-- Useful Queries for WorkOrbit Database
-- =============================================

-- =============================================
-- 1. USER MANAGEMENT QUERIES
-- =============================================

-- Get all users with their organization details
SELECT 
    u."id",
    u."name",
    u."email",
    u."role",
    u."status",
    u."employeeId",
    o."name" as organization,
    o."orgCode"
FROM "Users" u
LEFT JOIN "Organizations" o ON u."organizationId" = o."id"
ORDER BY u."role", u."name";

-- Get all active employees in an organization
SELECT * FROM "Users" 
WHERE "organizationId" = 'your-org-id-here' 
AND "status" IN ('active', 'approved')
ORDER BY "role", "name";

-- Get users by role
SELECT * FROM "Users" WHERE "role" = 'hr';
SELECT * FROM "Users" WHERE "role" = 'manager';
SELECT * FROM "Users" WHERE "role" = 'employee';

-- Get pending approval users
SELECT 
    "id", "name", "email", "role", 
    "requestedRole", "requestedOrgCode", "requestedHRCode",
    "createdAt"
FROM "Users" 
WHERE "status" IN ('pending_hr_approval', 'pending_staff_approval')
ORDER BY "createdAt" DESC;

-- =============================================
-- 2. ORGANIZATION QUERIES
-- =============================================

-- Get all organizations with admin info
SELECT 
    o."id",
    o."name",
    o."orgCode",
    o."email",
    o."status",
    u."name" as admin_name,
    u."email" as admin_email
FROM "Organizations" o
INNER JOIN "Users" u ON o."adminId" = u."id"
ORDER BY o."name";

-- Get organization with employee count
SELECT 
    o."name",
    o."orgCode",
    COUNT(u."id") as employee_count
FROM "Organizations" o
LEFT JOIN "Users" u ON o."id" = u."organizationId" 
    AND u."status" IN ('active', 'approved')
GROUP BY o."id", o."name", o."orgCode"
ORDER BY employee_count DESC;

-- Get organization by code
SELECT * FROM "Organizations" WHERE "orgCode" = 'ORG001';

-- =============================================
-- 3. HR MANAGER QUERIES
-- =============================================

-- Get all HR managers with their details
SELECT 
    hr."hrCode",
    u."name",
    u."email",
    o."name" as organization,
    hr."currentEmployeeCount",
    hr."maxEmployeesAllowed"
FROM "HRManagers" hr
INNER JOIN "Users" u ON hr."userId" = u."id"
INNER JOIN "Organizations" o ON hr."organizationId" = o."id"
WHERE hr."status" = 'active'
ORDER BY o."name", u."name";

-- Get HR manager by code
SELECT 
    hr.*,
    u."name" as hr_name,
    u."email" as hr_email
FROM "HRManagers" hr
INNER JOIN "Users" u ON hr."userId" = u."id"
WHERE hr."hrCode" = 'HR001-ORG001';

-- =============================================
-- 4. JOIN REQUEST QUERIES
-- =============================================

-- Get all pending join requests
SELECT 
    jr."id",
    u."name",
    u."email",
    jr."requestedRole",
    jr."requestType",
    jr."requestedOrgCode",
    jr."requestedHRCode",
    jr."requestMessage",
    jr."requestedAt"
FROM "JoinRequests" jr
INNER JOIN "Users" u ON jr."userId" = u."id"
WHERE jr."status" = 'pending'
ORDER BY jr."requestedAt" DESC;

-- Get join requests for a specific organization
SELECT 
    jr.*,
    u."name" as requester_name,
    u."email" as requester_email
FROM "JoinRequests" jr
INNER JOIN "Users" u ON jr."userId" = u."id"
WHERE jr."organizationId" = 'your-org-id-here'
AND jr."status" = 'pending';

-- Get approved requests with approver details
SELECT 
    jr."id",
    requester."name" as requester_name,
    jr."requestedRole",
    approver."name" as approved_by,
    jr."respondedAt"
FROM "JoinRequests" jr
INNER JOIN "Users" requester ON jr."userId" = requester."id"
INNER JOIN "Users" approver ON jr."approvedBy" = approver."id"
WHERE jr."status" = 'approved'
ORDER BY jr."respondedAt" DESC;

-- =============================================
-- 5. HIERARCHY QUERIES
-- =============================================

-- Get organization hierarchy tree
WITH RECURSIVE org_hierarchy AS (
    -- Anchor: Start with admin
    SELECT 
        u."id",
        u."name",
        u."email",
        u."role",
        u."managerId",
        o."name" as org_name,
        0 as level
    FROM "Users" u
    INNER JOIN "Organizations" o ON u."id" = o."adminId"
    WHERE o."id" = 'your-org-id-here'
    
    UNION ALL
    
    -- Recursive: Get all employees
    SELECT 
        e."id",
        e."name",
        e."email",
        e."role",
        e."managerId",
        h.org_name,
        h.level + 1
    FROM "Users" e
    INNER JOIN org_hierarchy h ON e."managerId" = h."id"
)
SELECT * FROM org_hierarchy ORDER BY level, role, name;

-- Get employees under a specific manager
SELECT 
    "id", "name", "email", "role", "department"
FROM "Users"
WHERE "managerId" = 'manager-id-here'
AND "status" = 'active'
ORDER BY "name";

-- =============================================
-- 6. STATISTICS QUERIES
-- =============================================

-- Get system statistics
SELECT 
    (SELECT COUNT(*) FROM "Organizations") as total_organizations,
    (SELECT COUNT(*) FROM "Users" WHERE "role" = 'admin') as total_admins,
    (SELECT COUNT(*) FROM "Users" WHERE "role" = 'hr') as total_hr,
    (SELECT COUNT(*) FROM "Users" WHERE "role" = 'manager') as total_managers,
    (SELECT COUNT(*) FROM "Users" WHERE "role" = 'employee') as total_employees,
    (SELECT COUNT(*) FROM "JoinRequests" WHERE "status" = 'pending') as pending_requests;

-- Get organization statistics
SELECT 
    o."name",
    o."orgCode",
    COUNT(DISTINCT CASE WHEN u."role" = 'hr' THEN u."id" END) as hr_count,
    COUNT(DISTINCT CASE WHEN u."role" = 'manager' THEN u."id" END) as manager_count,
    COUNT(DISTINCT CASE WHEN u."role" = 'employee' THEN u."id" END) as employee_count,
    COUNT(DISTINCT jr."id") as pending_requests
FROM "Organizations" o
LEFT JOIN "Users" u ON o."id" = u."organizationId" 
    AND u."status" IN ('active', 'approved')
LEFT JOIN "JoinRequests" jr ON o."id" = jr."organizationId" 
    AND jr."status" = 'pending'
GROUP BY o."id", o."name", o."orgCode"
ORDER BY o."name";

-- =============================================
-- 7. MAINTENANCE QUERIES
-- =============================================

-- Find duplicate emails
SELECT "email", COUNT(*) as count
FROM "Users"
GROUP BY "email"
HAVING COUNT(*) > 1;

-- Find users without organizations
SELECT "id", "name", "email", "role"
FROM "Users"
WHERE "organizationId" IS NULL
AND "role" != 'admin';

-- Clean up old unverified users (older than 30 days)
DELETE FROM "Users"
WHERE "isEmailVerified" = false
AND "createdAt" < NOW() - INTERVAL '30 days';

-- Update employee counts for HR managers
UPDATE "HRManagers" hr
SET "currentEmployeeCount" = (
    SELECT COUNT(*)
    FROM "Users" u
    WHERE u."hrCode" = hr."hrCode"
    AND u."status" IN ('active', 'approved')
    AND u."role" IN ('manager', 'employee')
);

-- =============================================
-- 8. REPORTING QUERIES
-- =============================================

-- Monthly registration report
SELECT 
    DATE_TRUNC('month', "createdAt") as month,
    "role",
    COUNT(*) as registrations
FROM "Users"
GROUP BY DATE_TRUNC('month', "createdAt"), "role"
ORDER BY month DESC, "role";

-- Organization growth report
SELECT 
    o."name",
    o."orgCode",
    DATE_TRUNC('month', u."createdAt") as month,
    COUNT(*) as new_employees
FROM "Organizations" o
INNER JOIN "Users" u ON o."id" = u."organizationId"
WHERE u."status" IN ('active', 'approved')
GROUP BY o."id", o."name", o."orgCode", DATE_TRUNC('month', u."createdAt")
ORDER BY o."name", month;

-- Approval time analysis
SELECT 
    jr."requestedRole",
    AVG(EXTRACT(EPOCH FROM (jr."respondedAt" - jr."requestedAt"))/3600) as avg_hours_to_approve,
    COUNT(*) as total_requests
FROM "JoinRequests" jr
WHERE jr."status" = 'approved'
AND jr."respondedAt" IS NOT NULL
GROUP BY jr."requestedRole";

-- =============================================
-- 9. SEARCH QUERIES
-- =============================================

-- Search users by name or email
SELECT * FROM "Users"
WHERE LOWER("name") LIKE '%search_term%'
OR LOWER("email") LIKE '%search_term%';

-- Search organizations
SELECT * FROM "Organizations"
WHERE LOWER("name") LIKE '%search_term%'
OR "orgCode" LIKE '%search_term%';

-- =============================================
-- 10. VALIDATION QUERIES
-- =============================================

-- Check if organization code exists
SELECT EXISTS(
    SELECT 1 FROM "Organizations" 
    WHERE "orgCode" = 'ORG001'
) as exists;

-- Check if HR code exists
SELECT EXISTS(
    SELECT 1 FROM "HRManagers" 
    WHERE "hrCode" = 'HR001-ORG001'
) as exists;

-- Check if email is already registered
SELECT EXISTS(
    SELECT 1 FROM "Users" 
    WHERE "email" = 'user@example.com'
) as exists;

-- Validate organization has capacity for more employees
SELECT 
    o."subscription"->>'maxEmployees' as max_employees,
    COUNT(u."id") as current_employees,
    (CAST(o."subscription"->>'maxEmployees' AS INTEGER) - COUNT(u."id")) as available_slots
FROM "Organizations" o
LEFT JOIN "Users" u ON o."id" = u."organizationId" 
    AND u."status" IN ('active', 'approved')
WHERE o."id" = 'your-org-id-here'
GROUP BY o."id", o."subscription";