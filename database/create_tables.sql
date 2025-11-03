-- =============================================
-- WorkOrbit Database Schema
-- PostgreSQL Database Creation Script
-- =============================================

-- Create Database
CREATE DATABASE workorbit;

-- Connect to the database
\c workorbit;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: Organizations
-- =============================================
CREATE TABLE IF NOT EXISTS "Organizations" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "orgCode" VARCHAR(10) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "logo" VARCHAR(500),
    "address" JSONB,
    "industry" VARCHAR(100),
    "size" VARCHAR(20) CHECK ("size" IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    "description" TEXT,
    "adminId" UUID NOT NULL,
    "settings" JSONB DEFAULT '{
        "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "workingHours": {"start": "09:00", "end": "18:00"},
        "timeZone": "UTC",
        "currency": "USD",
        "dateFormat": "MM/DD/YYYY",
        "leavePolicy": {},
        "attendancePolicy": {}
    }'::jsonb,
    "subscription" JSONB DEFAULT '{
        "plan": "free",
        "status": "active",
        "maxEmployees": 50
    }'::jsonb,
    "status" VARCHAR(20) DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'suspended')),
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Table: Users
-- =============================================
CREATE TABLE IF NOT EXISTS "Users" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "role" VARCHAR(20) DEFAULT 'employee' CHECK ("role" IN ('admin', 'hr', 'manager', 'employee', 'temp_setup')),
    "status" VARCHAR(30) DEFAULT 'pending_hr_approval' CHECK ("status" IN ('active', 'approved', 'pending_hr_approval', 'pending_staff_approval', 'inactive', 'suspended')),
    "profilePicture" VARCHAR(500),
    "department" VARCHAR(100),
    "designation" VARCHAR(100),
    "employeeId" VARCHAR(50) UNIQUE,
    "dateOfJoining" DATE,
    "dateOfBirth" DATE,
    "address" JSONB,
    "emergencyContact" JSONB,
    "bankDetails" JSONB,
    "salary" DECIMAL(10, 2),
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "isEmailVerified" BOOLEAN DEFAULT FALSE,
    "emailVerificationToken" VARCHAR(255),
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMP WITH TIME ZONE,
    "refreshToken" TEXT,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "hrCode" VARCHAR(20),
    "orgCode" VARCHAR(10),
    "managerId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
    "requestedRole" VARCHAR(20),
    "requestedOrgCode" VARCHAR(10),
    "requestedHRCode" VARCHAR(20),
    "isAssigned" BOOLEAN DEFAULT FALSE,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for Organizations.adminId after Users table is created
ALTER TABLE "Organizations" 
ADD CONSTRAINT "fk_organization_admin" 
FOREIGN KEY ("adminId") REFERENCES "Users"("id") ON DELETE RESTRICT;

-- =============================================
-- Table: HRManagers
-- =============================================
CREATE TABLE IF NOT EXISTS "HRManagers" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "hrCode" VARCHAR(20) NOT NULL UNIQUE,
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "organizationId" UUID NOT NULL REFERENCES "Organizations"("id") ON DELETE CASCADE,
    "orgCode" VARCHAR(10) NOT NULL,
    "permissions" JSONB DEFAULT '{
        "canApproveEmployees": true,
        "canManageAttendance": true,
        "canManageLeaves": true,
        "canManagePayroll": true,
        "canGenerateReports": true,
        "canManageDepartments": true,
        "canManageRoles": true
    }'::jsonb,
    "department" VARCHAR(100) DEFAULT 'Human Resources',
    "maxEmployeesAllowed" INTEGER DEFAULT 100,
    "currentEmployeeCount" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'suspended')),
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Table: JoinRequests
-- =============================================
CREATE TABLE IF NOT EXISTS "JoinRequests" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "requestType" VARCHAR(20) NOT NULL CHECK ("requestType" IN ('hr_join', 'staff_join')),
    "requestedRole" VARCHAR(20) NOT NULL CHECK ("requestedRole" IN ('hr', 'manager', 'employee')),
    "requestedOrgCode" VARCHAR(10),
    "requestedHRCode" VARCHAR(20),
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE CASCADE,
    "approvedBy" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
    "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled')),
    "requestMessage" TEXT,
    "responseMessage" TEXT,
    "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP WITH TIME ZONE,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Users table indexes
CREATE INDEX "idx_users_email" ON "Users"("email");
CREATE INDEX "idx_users_organizationId" ON "Users"("organizationId");
CREATE INDEX "idx_users_role" ON "Users"("role");
CREATE INDEX "idx_users_status" ON "Users"("status");
CREATE INDEX "idx_users_hrCode" ON "Users"("hrCode");
CREATE INDEX "idx_users_orgCode" ON "Users"("orgCode");
CREATE INDEX "idx_users_managerId" ON "Users"("managerId");

-- Organizations table indexes
CREATE INDEX "idx_organizations_orgCode" ON "Organizations"("orgCode");
CREATE INDEX "idx_organizations_adminId" ON "Organizations"("adminId");
CREATE INDEX "idx_organizations_status" ON "Organizations"("status");

-- HRManagers table indexes
CREATE INDEX "idx_hrmanagers_hrCode" ON "HRManagers"("hrCode");
CREATE INDEX "idx_hrmanagers_userId" ON "HRManagers"("userId");
CREATE INDEX "idx_hrmanagers_organizationId" ON "HRManagers"("organizationId");
CREATE INDEX "idx_hrmanagers_orgCode" ON "HRManagers"("orgCode");

-- JoinRequests table indexes
CREATE INDEX "idx_joinrequests_userId" ON "JoinRequests"("userId");
CREATE INDEX "idx_joinrequests_organizationId" ON "JoinRequests"("organizationId");
CREATE INDEX "idx_joinrequests_status" ON "JoinRequests"("status");
CREATE INDEX "idx_joinrequests_requestType" ON "JoinRequests"("requestType");

-- =============================================
-- Triggers for Updated Timestamps
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON "Organizations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hrmanagers_updated_at BEFORE UPDATE ON "HRManagers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_joinrequests_updated_at BEFORE UPDATE ON "JoinRequests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Sample Data (Optional - Remove in Production)
-- =============================================

-- Insert a sample admin user (password: Admin123!)
-- Note: Password is hashed using bcrypt
INSERT INTO "Users" (
    "email", 
    "password", 
    "name", 
    "role", 
    "status", 
    "isEmailVerified", 
    "isAssigned"
) VALUES (
    'admin@workorbit.com',
    '$2a$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'System Admin',
    'admin',
    'active',
    true,
    true
);

-- =============================================
-- Views for Reporting
-- =============================================

-- View: Active Employees by Organization
CREATE OR REPLACE VIEW active_employees_view AS
SELECT 
    o."name" as organization_name,
    o."orgCode",
    u."name" as employee_name,
    u."email",
    u."role",
    u."department",
    u."designation",
    u."employeeId",
    u."dateOfJoining"
FROM "Users" u
INNER JOIN "Organizations" o ON u."organizationId" = o."id"
WHERE u."status" IN ('active', 'approved')
ORDER BY o."name", u."role", u."name";

-- View: Pending Join Requests
CREATE OR REPLACE VIEW pending_requests_view AS
SELECT 
    jr."id",
    u."name" as requester_name,
    u."email" as requester_email,
    jr."requestedRole",
    jr."requestType",
    jr."requestedOrgCode",
    jr."requestedHRCode",
    o."name" as organization_name,
    jr."requestedAt",
    jr."requestMessage"
FROM "JoinRequests" jr
INNER JOIN "Users" u ON jr."userId" = u."id"
LEFT JOIN "Organizations" o ON jr."organizationId" = o."id"
WHERE jr."status" = 'pending'
ORDER BY jr."requestedAt" DESC;

-- View: Organization Hierarchy
CREATE OR REPLACE VIEW organization_hierarchy_view AS
SELECT 
    o."id" as org_id,
    o."name" as org_name,
    o."orgCode",
    admin."name" as admin_name,
    admin."email" as admin_email,
    COUNT(DISTINCT hr."id") as hr_count,
    COUNT(DISTINCT CASE WHEN u."role" = 'manager' THEN u."id" END) as manager_count,
    COUNT(DISTINCT CASE WHEN u."role" = 'employee' THEN u."id" END) as employee_count,
    COUNT(DISTINCT u."id") as total_employees
FROM "Organizations" o
LEFT JOIN "Users" admin ON o."adminId" = admin."id"
LEFT JOIN "HRManagers" hr ON o."id" = hr."organizationId"
LEFT JOIN "Users" u ON o."id" = u."organizationId" AND u."status" IN ('active', 'approved')
GROUP BY o."id", o."name", o."orgCode", admin."name", admin."email";

-- =============================================
-- Grant Permissions (Adjust based on your setup)
-- =============================================

-- Example: Grant permissions to application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- =============================================
-- End of Script
-- =============================================

-- Display created tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;