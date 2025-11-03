-- =============================================
-- Test Data for WorkOrbit Database
-- Use this to seed test users for Postman testing
-- =============================================

-- Note: All passwords are hashed version of "Test123!" 
-- Bcrypt hash for "Test123!" = $2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum

-- =============================================
-- 1. Create Admin User with Organization
-- =============================================

-- Insert Admin User
INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status", 
    "isEmailVerified", 
    "isAssigned",
    "createdAt",
    "updatedAt"
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'John Admin',
    '+1234567890',
    'admin',
    'active',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert Organization
INSERT INTO "Organizations" (
    "id",
    "orgCode",
    "name",
    "email",
    "phone",
    "industry",
    "size",
    "adminId",
    "status",
    "createdAt",
    "updatedAt"
) VALUES (
    'org-123e4567-e89b-12d3-a456-426614174000',
    'ORG001',
    'Tech Solutions Inc',
    'info@techsolutions.com',
    '+1234567890',
    'Technology',
    '51-200',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (orgCode) DO NOTHING;

-- Update Admin with Organization
UPDATE "Users" 
SET "organizationId" = 'org-123e4567-e89b-12d3-a456-426614174000',
    "orgCode" = 'ORG001'
WHERE "id" = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- =============================================
-- 2. Create HR Manager
-- =============================================

-- Insert HR User
INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status",
    "organizationId",
    "orgCode",
    "hrCode",
    "isEmailVerified", 
    "isAssigned",
    "department",
    "designation",
    "createdAt",
    "updatedAt"
) VALUES (
    'hr-123e4567-e89b-12d3-a456-426614174001',
    'hr@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'Sarah HR',
    '+1234567891',
    'hr',
    'active',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'ORG001',
    'HR001-ORG001',
    true,
    true,
    'Human Resources',
    'HR Manager',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert HR Manager Record
INSERT INTO "HRManagers" (
    "id",
    "hrCode",
    "userId",
    "organizationId",
    "orgCode",
    "status",
    "createdAt",
    "updatedAt"
) VALUES (
    'hrm-123e4567-e89b-12d3-a456-426614174002',
    'HR001-ORG001',
    'hr-123e4567-e89b-12d3-a456-426614174001',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'ORG001',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (hrCode) DO NOTHING;

-- =============================================
-- 3. Create Manager
-- =============================================

INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status",
    "organizationId",
    "orgCode",
    "hrCode",
    "isEmailVerified", 
    "isAssigned",
    "department",
    "designation",
    "employeeId",
    "dateOfJoining",
    "createdAt",
    "updatedAt"
) VALUES (
    'mgr-123e4567-e89b-12d3-a456-426614174003',
    'manager@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'Mike Manager',
    '+1234567892',
    'manager',
    'active',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'ORG001',
    'HR001-ORG001',
    true,
    true,
    'Engineering',
    'Team Manager',
    'EMP202400001',
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 4. Create Employee
-- =============================================

INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status",
    "organizationId",
    "orgCode",
    "hrCode",
    "managerId",
    "isEmailVerified", 
    "isAssigned",
    "department",
    "designation",
    "employeeId",
    "dateOfJoining",
    "createdAt",
    "updatedAt"
) VALUES (
    'emp-123e4567-e89b-12d3-a456-426614174004',
    'employee@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'Emma Employee',
    '+1234567893',
    'employee',
    'active',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'ORG001',
    'HR001-ORG001',
    'mgr-123e4567-e89b-12d3-a456-426614174003',
    true,
    true,
    'Engineering',
    'Software Developer',
    'EMP202400002',
    CURRENT_DATE - INTERVAL '3 months',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 5. Create Pending Users (for testing approval flow)
-- =============================================

-- Pending HR Approval User
INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status",
    "requestedRole",
    "requestedOrgCode",
    "isEmailVerified", 
    "isAssigned",
    "createdAt",
    "updatedAt"
) VALUES (
    'pnd-hr-123e4567-e89b-12d3-a456-426614174005',
    'pending.hr@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'Peter Pending',
    '+1234567894',
    'hr',
    'pending_hr_approval',
    'hr',
    'ORG001',
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create Join Request for Pending HR
INSERT INTO "JoinRequests" (
    "userId",
    "requestType",
    "requestedRole",
    "requestedOrgCode",
    "organizationId",
    "status",
    "requestMessage",
    "createdAt",
    "updatedAt"
) VALUES (
    'pnd-hr-123e4567-e89b-12d3-a456-426614174005',
    'hr_join',
    'hr',
    'ORG001',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'pending',
    'I would like to join as HR Manager',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Pending Employee Approval User
INSERT INTO "Users" (
    "id",
    "email", 
    "password", 
    "name",
    "phone",
    "role", 
    "status",
    "requestedRole",
    "requestedHRCode",
    "isEmailVerified", 
    "isAssigned",
    "createdAt",
    "updatedAt"
) VALUES (
    'pnd-emp-123e4567-e89b-12d3-a456-426614174006',
    'pending.employee@workorbit.com',
    '$2a$10$5dwsS5snIRlKu8ka5r7z0eoRyQVAsOtAZHkPJuSx.agOWjchXhSum',
    'Paula Pending',
    '+1234567895',
    'employee',
    'pending_staff_approval',
    'employee',
    'HR001-ORG001',
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create Join Request for Pending Employee
INSERT INTO "JoinRequests" (
    "userId",
    "requestType",
    "requestedRole",
    "requestedHRCode",
    "organizationId",
    "status",
    "requestMessage",
    "createdAt",
    "updatedAt"
) VALUES (
    'pnd-emp-123e4567-e89b-12d3-a456-426614174006',
    'staff_join',
    'employee',
    'HR001-ORG001',
    'org-123e4567-e89b-12d3-a456-426614174000',
    'pending',
    'I would like to join the engineering team',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- =============================================
-- Display Test Users
-- =============================================
SELECT 
    '===========================================' as separator,
    'TEST USERS CREATED (Password for all: Test123!)' as info
UNION ALL
SELECT 
    '-------------------------------------------',
    ''
UNION ALL
SELECT 
    "email",
    "role" || ' - ' || "status" as details
FROM "Users"
WHERE "email" IN (
    'admin@workorbit.com',
    'hr@workorbit.com',
    'manager@workorbit.com',
    'employee@workorbit.com',
    'pending.hr@workorbit.com',
    'pending.employee@workorbit.com'
)
ORDER BY 
    CASE 
        WHEN "email" = 'admin@workorbit.com' THEN 1
        WHEN "email" = 'hr@workorbit.com' THEN 2
        WHEN "email" = 'manager@workorbit.com' THEN 3
        WHEN "email" = 'employee@workorbit.com' THEN 4
        ELSE 5
    END;