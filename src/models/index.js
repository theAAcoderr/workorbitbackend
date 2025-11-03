const { sequelize } = require('../config/database');
const User = require('./User');
const Organization = require('./Organization');
const HRManager = require('./HRManager');
const JoinRequest = require('./JoinRequest');
const Attendance = require('./Attendance');
const LocationTracking = require('./LocationTracking');
const DailyPlanReport = require('./DailyPlanReport');
const ActivityLog = require('./ActivityLog');
const GeofenceViolation = require('./GeofenceViolation');
const Geofence = require('./Geofence');
const Leave = require('./Leave');
const LeaveBalance = require('./LeaveBalance');
const LeavePolicy = require('./LeavePolicy');
const Project = require('./Project');
const Task = require('./Task');
const ProgressReport = require('./ProgressReport');
const Meeting = require('./Meeting');
const MeetingAttendee = require('./MeetingAttendee');
const MeetingAction = require('./MeetingAction');
const Shift = require('./Shift');
const ShiftRoster = require('./ShiftRoster');
const ShiftAssignment = require('./ShiftAssignment');
const Payroll = require('./Payroll');
const SalaryStructure = require('./SalaryStructure');
const SalaryComponent = require('./SalaryComponent');
const Payslip = require('./Payslip');
const Job = require('./Job');
const Application = require('./Application');
const Department = require('./Department');
const { Team, TeamMember } = require('./Team');
const Form = require('./Form');
const FormResponse = require('./FormResponse');
const UserSetting = require('./UserSetting');
const NotificationPreference = require('./NotificationPreference');
const Holiday = require('./Holiday');
const Policy = require('./Policy');
const PolicyAcknowledgment = require('./PolicyAcknowledgment');
const Compliance = require('./Compliance');
const Announcement = require('./Announcement');
const AnnouncementRead = require('./AnnouncementRead');
const OnboardingTask = require('./OnboardingTask');
const Onboarding = require('./Onboarding');
const Feedback = require('./Feedback');
const Document = require('./Document');
const PerformanceReview = require('./PerformanceReview');
const Course = require('./Course');
const CourseEnrollment = require('./CourseEnrollment');
const Asset = require('./Asset');
const AssetRequest = require('./AssetRequest');
const Expense = require('./Expense');
const Exit = require('./Exit');

// Organization - User associations
Organization.belongsTo(User, { 
  as: 'admin', 
  foreignKey: 'adminId' 
});
User.hasMany(Organization, { 
  as: 'ownedOrganizations', 
  foreignKey: 'adminId' 
});

// Organization - User (employees) associations
Organization.hasMany(User, { 
  as: 'employees', 
  foreignKey: 'organizationId' 
});
User.belongsTo(Organization, { 
  as: 'organization', 
  foreignKey: 'organizationId' 
});

// HRManager associations
HRManager.belongsTo(User, { 
  as: 'user', 
  foreignKey: 'userId' 
});
User.hasOne(HRManager, { 
  as: 'hrManager', 
  foreignKey: 'userId' 
});

HRManager.belongsTo(Organization, { 
  as: 'organization', 
  foreignKey: 'organizationId' 
});
Organization.hasMany(HRManager, { 
  as: 'hrManagers', 
  foreignKey: 'organizationId' 
});

// JoinRequest associations
JoinRequest.belongsTo(User, { 
  as: 'requester', 
  foreignKey: 'userId' 
});
User.hasMany(JoinRequest, { 
  as: 'joinRequests', 
  foreignKey: 'userId' 
});

JoinRequest.belongsTo(User, { 
  as: 'approver', 
  foreignKey: 'approvedBy' 
});
User.hasMany(JoinRequest, { 
  as: 'approvedRequests', 
  foreignKey: 'approvedBy' 
});

JoinRequest.belongsTo(Organization, { 
  as: 'organization', 
  foreignKey: 'organizationId' 
});
Organization.hasMany(JoinRequest, { 
  as: 'joinRequests', 
  foreignKey: 'organizationId' 
});

// Manager - Employee associations
User.belongsTo(User, { 
  as: 'manager', 
  foreignKey: 'managerId' 
});
User.hasMany(User, { 
  as: 'subordinates', 
  foreignKey: 'managerId' 
});

// Attendance associations
Attendance.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(Attendance, {
  as: 'attendanceRecords',
  foreignKey: 'userId'
});

// LocationTracking associations
LocationTracking.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(LocationTracking, {
  as: 'locationTracks',
  foreignKey: 'userId'
});

LocationTracking.belongsTo(Attendance, {
  as: 'attendance',
  foreignKey: 'attendanceId'
});
Attendance.hasMany(LocationTracking, {
  as: 'locationTracks',
  foreignKey: 'attendanceId'
});

// DailyPlanReport associations
DailyPlanReport.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(DailyPlanReport, {
  as: 'dailyPlanReports',
  foreignKey: 'userId'
});

DailyPlanReport.belongsTo(Attendance, {
  as: 'attendance',
  foreignKey: 'attendanceId'
});
Attendance.hasOne(DailyPlanReport, {
  as: 'dailyPlanReport',
  foreignKey: 'attendanceId'
});

// ActivityLog associations
ActivityLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(ActivityLog, {
  as: 'activityLogs',
  foreignKey: 'userId'
});

ActivityLog.belongsTo(Attendance, {
  as: 'attendance',
  foreignKey: 'attendanceId'
});
Attendance.hasMany(ActivityLog, {
  as: 'activityLogs',
  foreignKey: 'attendanceId'
});

// Geofence associations
Geofence.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Geofence, {
  as: 'geofences',
  foreignKey: 'organizationId'
});

Geofence.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Geofence, {
  as: 'createdGeofences',
  foreignKey: 'createdBy'
});

// GeofenceViolation associations
GeofenceViolation.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(GeofenceViolation, {
  as: 'geofenceViolations',
  foreignKey: 'userId'
});

// GeofenceViolation to Geofence association
GeofenceViolation.belongsTo(Geofence, {
  as: 'geofence',
  foreignKey: 'geofenceId'
});
Geofence.hasMany(GeofenceViolation, {
  as: 'violations',
  foreignKey: 'geofenceId'
});

GeofenceViolation.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(GeofenceViolation, {
  as: 'geofenceViolations',
  foreignKey: 'organizationId'
});

GeofenceViolation.belongsTo(Attendance, {
  as: 'attendance',
  foreignKey: 'attendanceId'
});
Attendance.hasMany(GeofenceViolation, {
  as: 'geofenceViolations',
  foreignKey: 'attendanceId'
});

GeofenceViolation.belongsTo(User, {
  as: 'overriddenByUser',
  foreignKey: 'overriddenBy'
});
User.hasMany(GeofenceViolation, {
  as: 'overriddenViolations',
  foreignKey: 'overriddenBy'
});

GeofenceViolation.belongsTo(User, {
  as: 'resolvedByUser',
  foreignKey: 'resolvedBy'
});
User.hasMany(GeofenceViolation, {
  as: 'resolvedViolations',
  foreignKey: 'resolvedBy'
});

// Leave associations
Leave.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(Leave, {
  as: 'leaves',
  foreignKey: 'employeeId'
});

Leave.belongsTo(User, {
  as: 'manager',
  foreignKey: 'managerId'
});
User.hasMany(Leave, {
  as: 'teamLeaves',
  foreignKey: 'managerId'
});

Leave.belongsTo(User, {
  as: 'approver',
  foreignKey: 'approvedBy'
});
User.hasMany(Leave, {
  as: 'approvedLeaves',
  foreignKey: 'approvedBy'
});

Leave.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Leave, {
  as: 'leaves',
  foreignKey: 'organizationId'
});

// LeaveBalance associations
LeaveBalance.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(LeaveBalance, {
  as: 'leaveBalances',
  foreignKey: 'employeeId'
});

LeaveBalance.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(LeaveBalance, {
  as: 'leaveBalances',
  foreignKey: 'organizationId'
});

// LeavePolicy associations
LeavePolicy.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(LeavePolicy, {
  as: 'leavePolicies',
  foreignKey: 'organizationId'
});

// Project associations
Project.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Project, {
  as: 'projects',
  foreignKey: 'organizationId'
});

Project.belongsTo(User, {
  as: 'projectManager',
  foreignKey: 'projectManagerId'
});
User.hasMany(Project, {
  as: 'managedProjects',
  foreignKey: 'projectManagerId'
});

Project.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Project, {
  as: 'createdProjects',
  foreignKey: 'createdBy'
});

// Task associations
Task.belongsTo(Project, {
  as: 'project',
  foreignKey: 'projectId',
  onDelete: 'CASCADE'
});
Project.hasMany(Task, {
  as: 'tasks',
  foreignKey: 'projectId'
});

Task.belongsTo(User, {
  as: 'assignee',
  foreignKey: 'assigneeId'
});
User.hasMany(Task, {
  as: 'assignedTasks',
  foreignKey: 'assigneeId'
});

Task.belongsTo(User, {
  as: 'reporter',
  foreignKey: 'reporterId'
});
User.hasMany(Task, {
  as: 'reportedTasks',
  foreignKey: 'reporterId'
});

Task.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Task, {
  as: 'createdTasks',
  foreignKey: 'createdBy'
});

Task.belongsTo(Task, {
  as: 'parentTask',
  foreignKey: 'parentTaskId'
});
Task.hasMany(Task, {
  as: 'subtasks',
  foreignKey: 'parentTaskId'
});

// ProgressReport associations
ProgressReport.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(ProgressReport, {
  as: 'progressReports',
  foreignKey: 'userId'
});

ProgressReport.belongsTo(Project, {
  as: 'project',
  foreignKey: 'projectId'
});
Project.hasMany(ProgressReport, {
  as: 'progressReports',
  foreignKey: 'projectId'
});

ProgressReport.belongsTo(Task, {
  as: 'task',
  foreignKey: 'taskId'
});
Task.hasMany(ProgressReport, {
  as: 'progressReports',
  foreignKey: 'taskId'
});

ProgressReport.belongsTo(User, {
  as: 'reviewer',
  foreignKey: 'reviewedBy'
});
User.hasMany(ProgressReport, {
  as: 'reviewedReports',
  foreignKey: 'reviewedBy'
});

// Meeting associations
Meeting.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Meeting, {
  as: 'createdMeetings',
  foreignKey: 'createdBy'
});

Meeting.hasMany(MeetingAttendee, {
  as: 'attendees',
  foreignKey: 'meetingId'
});
MeetingAttendee.belongsTo(Meeting, {
  as: 'meeting',
  foreignKey: 'meetingId'
});

MeetingAttendee.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(MeetingAttendee, {
  as: 'meetingAttendees',
  foreignKey: 'userId'
});

Meeting.hasMany(MeetingAction, {
  as: 'actionItems',
  foreignKey: 'meetingId'
});
MeetingAction.belongsTo(Meeting, {
  as: 'meeting',
  foreignKey: 'meetingId'
});

MeetingAction.belongsTo(User, {
  as: 'assignee',
  foreignKey: 'assignedTo'
});
User.hasMany(MeetingAction, {
  as: 'assignedActions',
  foreignKey: 'assignedTo'
});

MeetingAction.belongsTo(User, {
  as: 'completor',
  foreignKey: 'completedBy'
});
User.hasMany(MeetingAction, {
  as: 'completedActions',
  foreignKey: 'completedBy'
});

// Self-referencing association for recurring meetings
Meeting.hasMany(Meeting, {
  as: 'childMeetings',
  foreignKey: 'parentMeetingId'
});
Meeting.belongsTo(Meeting, {
  as: 'parentMeeting',
  foreignKey: 'parentMeetingId'
});

// Shift associations
Shift.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Shift, {
  as: 'shifts',
  foreignKey: 'organizationId'
});

Shift.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Shift, {
  as: 'createdShifts',
  foreignKey: 'createdBy'
});

// ShiftRoster associations
ShiftRoster.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(ShiftRoster, {
  as: 'shiftRosters',
  foreignKey: 'organizationId'
});

ShiftRoster.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(ShiftRoster, {
  as: 'createdRosters',
  foreignKey: 'createdBy'
});

ShiftRoster.belongsTo(User, {
  as: 'publisher',
  foreignKey: 'publishedBy'
});

ShiftRoster.belongsTo(User, {
  as: 'approver',
  foreignKey: 'approvedBy'
});

// ShiftAssignment associations
ShiftAssignment.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(ShiftAssignment, {
  as: 'shiftAssignments',
  foreignKey: 'organizationId'
});

ShiftAssignment.belongsTo(ShiftRoster, {
  as: 'roster',
  foreignKey: 'rosterId'
});
ShiftRoster.hasMany(ShiftAssignment, {
  as: 'assignments',
  foreignKey: 'rosterId'
});

ShiftAssignment.belongsTo(Shift, {
  as: 'shift',
  foreignKey: 'shiftId'
});
Shift.hasMany(ShiftAssignment, {
  as: 'assignments',
  foreignKey: 'shiftId'
});

ShiftAssignment.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(ShiftAssignment, {
  as: 'shiftAssignments',
  foreignKey: 'employeeId'
});

ShiftAssignment.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});

ShiftAssignment.belongsTo(User, {
  as: 'swapRequester',
  foreignKey: 'swapRequestedWith'
});

ShiftAssignment.belongsTo(User, {
  as: 'swapApprover',
  foreignKey: 'swapApprovedBy'
});

// Payroll associations
Payroll.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Payroll, {
  as: 'payrolls',
  foreignKey: 'organizationId'
});

Payroll.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(Payroll, {
  as: 'payrolls',
  foreignKey: 'employeeId'
});

Payroll.belongsTo(User, {
  as: 'processor',
  foreignKey: 'processedBy'
});

Payroll.belongsTo(User, {
  as: 'approver',
  foreignKey: 'approvedBy'
});

// SalaryStructure associations
SalaryStructure.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(SalaryStructure, {
  as: 'salaryStructures',
  foreignKey: 'organizationId'
});

SalaryStructure.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(SalaryStructure, {
  as: 'salaryStructures',
  foreignKey: 'employeeId'
});

// SalaryComponent associations
SalaryComponent.belongsTo(SalaryStructure, {
  as: 'salaryStructure',
  foreignKey: 'salaryStructureId',
  onDelete: 'CASCADE'
});
SalaryStructure.hasMany(SalaryComponent, {
  as: 'components',
  foreignKey: 'salaryStructureId'
});

// Payslip associations
Payslip.belongsTo(Payroll, {
  as: 'payroll',
  foreignKey: 'payrollId',
  onDelete: 'CASCADE'
});
Payroll.hasOne(Payslip, {
  as: 'payslip',
  foreignKey: 'payrollId'
});

Payslip.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(Payslip, {
  as: 'payslips',
  foreignKey: 'employeeId'
});

Payslip.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Payslip, {
  as: 'payslips',
  foreignKey: 'organizationId'
});

Payslip.belongsTo(User, {
  as: 'generator',
  foreignKey: 'generatedBy'
});

// Job associations
Job.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Job, {
  as: 'createdJobs',
  foreignKey: 'createdBy'
});

Job.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Job, {
  as: 'jobs',
  foreignKey: 'organizationId'
});

// Application associations
Application.belongsTo(Job, {
  as: 'job',
  foreignKey: 'jobId'
});
Job.hasMany(Application, {
  as: 'applications',
  foreignKey: 'jobId'
});

Application.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Application, {
  as: 'applications',
  foreignKey: 'organizationId'
});

// Department associations
Department.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Department, {
  as: 'departments',
  foreignKey: 'organizationId'
});

Department.belongsTo(User, {
  as: 'manager',
  foreignKey: 'managerId'
});
User.hasMany(Department, {
  as: 'managedDepartments',
  foreignKey: 'managerId'
});

Department.belongsTo(Department, {
  as: 'parentDepartment',
  foreignKey: 'parentDepartmentId'
});
Department.hasMany(Department, {
  as: 'subDepartments',
  foreignKey: 'parentDepartmentId'
});

// TEMPORARILY DISABLED: Conflicts with existing 'department' string column in User model
// TODO: Decide whether to use 'department' as string OR 'departmentId' as foreign key
// User.belongsTo(Department, {
//   as: 'userDepartment',  // Changed from 'department' to avoid collision with department column
//   foreignKey: 'departmentId'
// });
// Department.hasMany(User, {
//   as: 'employees',
//   foreignKey: 'departmentId'
// });

// Team associations
Team.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Team, {
  as: 'teams',
  foreignKey: 'organizationId'
});

Team.belongsTo(Department, {
  as: 'department',
  foreignKey: 'departmentId'
});
Department.hasMany(Team, {
  as: 'teams',
  foreignKey: 'departmentId'
});

Team.belongsTo(User, {
  as: 'teamLead',
  foreignKey: 'teamLeadId'
});
User.hasMany(Team, {
  as: 'ledTeams',
  foreignKey: 'teamLeadId'
});

// Team - User many-to-many through TeamMember
Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: 'teamId',
  otherKey: 'userId',
  as: 'members'
});
User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: 'userId',
  otherKey: 'teamId',
  as: 'teams'
});

TeamMember.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});
Team.hasMany(TeamMember, {
  foreignKey: 'teamId',
  as: 'teamMembers'
});

TeamMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
User.hasMany(TeamMember, {
  foreignKey: 'userId',
  as: 'teamMemberships'
});

// Form associations
Form.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});
Organization.hasMany(Form, {
  foreignKey: 'organizationId',
  as: 'forms'
});

Form.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});
User.hasMany(Form, {
  foreignKey: 'createdBy',
  as: 'createdForms'
});

Form.belongsTo(Department, {
  foreignKey: 'targetDepartmentId',
  as: 'targetDepartment'
});
Department.hasMany(Form, {
  foreignKey: 'targetDepartmentId',
  as: 'targetedForms'
});

Form.belongsTo(Team, {
  foreignKey: 'targetTeamId',
  as: 'targetTeam'
});
Team.hasMany(Form, {
  foreignKey: 'targetTeamId',
  as: 'targetedForms'
});

// FormResponse associations
FormResponse.belongsTo(Form, {
  foreignKey: 'formId',
  as: 'form'
});
Form.hasMany(FormResponse, {
  foreignKey: 'formId',
  as: 'responses'
});

FormResponse.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});
Organization.hasMany(FormResponse, {
  foreignKey: 'organizationId',
  as: 'formResponses'
});

FormResponse.belongsTo(User, {
  foreignKey: 'respondentId',
  as: 'respondent'
});
User.hasMany(FormResponse, {
  foreignKey: 'respondentId',
  as: 'formResponses'
});

FormResponse.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer'
});
User.hasMany(FormResponse, {
  foreignKey: 'reviewedBy',
  as: 'reviewedFormResponses'
});

// Holiday associations
Holiday.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});
Organization.hasMany(Holiday, {
  foreignKey: 'organizationId',
  as: 'holidays'
});

Holiday.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});
User.hasMany(Holiday, {
  foreignKey: 'createdBy',
  as: 'createdHolidays'
});

// Policy associations
Policy.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});
Organization.hasMany(Policy, {
  foreignKey: 'organizationId',
  as: 'policies'
});

Policy.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});
User.hasMany(Policy, {
  foreignKey: 'createdBy',
  as: 'createdPolicies'
});

Policy.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater'
});
User.hasMany(Policy, {
  foreignKey: 'updatedBy',
  as: 'updatedPolicies'
});

// Policy-User acknowledgment (many-to-many)
Policy.belongsToMany(User, {
  through: PolicyAcknowledgment,
  foreignKey: 'policyId',
  otherKey: 'userId',
  as: 'acknowledgedBy'
});
User.belongsToMany(Policy, {
  through: PolicyAcknowledgment,
  foreignKey: 'userId',
  otherKey: 'policyId',
  as: 'acknowledgedPolicies'
});

// PolicyAcknowledgment direct associations
PolicyAcknowledgment.belongsTo(Policy, {
  foreignKey: 'policyId',
  as: 'policy'
});
PolicyAcknowledgment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Compliance associations
Compliance.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Compliance, {
  as: 'compliances',
  foreignKey: 'organizationId'
});

Compliance.belongsTo(User, {
  as: 'assignee',
  foreignKey: 'assignedTo'
});
User.hasMany(Compliance, {
  as: 'assignedCompliances',
  foreignKey: 'assignedTo'
});

Compliance.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Compliance, {
  as: 'createdCompliances',
  foreignKey: 'createdBy'
});

// Announcement associations
Announcement.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Announcement, {
  as: 'announcements',
  foreignKey: 'organizationId'
});

Announcement.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Announcement, {
  as: 'createdAnnouncements',
  foreignKey: 'createdBy'
});

Announcement.hasMany(AnnouncementRead, {
  as: 'reads',
  foreignKey: 'announcementId'
});
AnnouncementRead.belongsTo(Announcement, {
  as: 'announcement',
  foreignKey: 'announcementId'
});

AnnouncementRead.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(AnnouncementRead, {
  as: 'announcementReads',
  foreignKey: 'userId'
});

// OnboardingTask associations
OnboardingTask.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(OnboardingTask, {
  as: 'onboardingTasks',
  foreignKey: 'organizationId'
});

OnboardingTask.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(OnboardingTask, {
  as: 'createdOnboardingTasks',
  foreignKey: 'createdBy'
});

OnboardingTask.belongsTo(User, {
  as: 'updater',
  foreignKey: 'updatedBy'
});
User.hasMany(OnboardingTask, {
  as: 'updatedOnboardingTasks',
  foreignKey: 'updatedBy'
});

// Onboarding associations
Onboarding.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(Onboarding, {
  as: 'onboardingProgress',
  foreignKey: 'userId'
});

Onboarding.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Onboarding, {
  as: 'onboardingRecords',
  foreignKey: 'organizationId'
});

Onboarding.belongsTo(OnboardingTask, {
  as: 'task',
  foreignKey: 'taskId'
});
OnboardingTask.hasMany(Onboarding, {
  as: 'userProgress',
  foreignKey: 'taskId'
});

// Feedback associations
Feedback.belongsTo(User, {
  as: 'submitter',
  foreignKey: 'submitterId'
});
User.hasMany(Feedback, {
  as: 'submittedFeedback',
  foreignKey: 'submitterId'
});

Feedback.belongsTo(User, {
  as: 'recipient',
  foreignKey: 'recipientId'
});
User.hasMany(Feedback, {
  as: 'receivedFeedback',
  foreignKey: 'recipientId'
});

Feedback.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Feedback, {
  as: 'feedbacks',
  foreignKey: 'organizationId'
});

// Document associations
Document.belongsTo(User, {
  as: 'uploader',
  foreignKey: 'uploadedById'
});
User.hasMany(Document, {
  as: 'uploadedDocuments',
  foreignKey: 'uploadedById'
});

Document.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Document, {
  as: 'documents',
  foreignKey: 'organizationId'
});

Document.belongsTo(Document, {
  as: 'parentDocument',
  foreignKey: 'parentDocumentId'
});
Document.hasMany(Document, {
  as: 'versions',
  foreignKey: 'parentDocumentId'
});

// PerformanceReview associations
PerformanceReview.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(PerformanceReview, {
  as: 'performanceReviews',
  foreignKey: 'employeeId'
});

PerformanceReview.belongsTo(User, {
  as: 'reviewer',
  foreignKey: 'reviewerId'
});
User.hasMany(PerformanceReview, {
  as: 'reviewedPerformanceReviews',
  foreignKey: 'reviewerId'
});

PerformanceReview.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(PerformanceReview, {
  as: 'performanceReviews',
  foreignKey: 'organizationId'
});

// Course associations
Course.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Course, {
  as: 'courses',
  foreignKey: 'organizationId'
});

Course.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy'
});
User.hasMany(Course, {
  as: 'createdCourses',
  foreignKey: 'createdBy'
});

// CourseEnrollment associations
CourseEnrollment.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId'
});
Course.hasMany(CourseEnrollment, {
  as: 'enrollments',
  foreignKey: 'courseId'
});

CourseEnrollment.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId'
});
User.hasMany(CourseEnrollment, {
  as: 'courseEnrollments',
  foreignKey: 'userId'
});

// Asset associations
Asset.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Asset, {
  as: 'assets',
  foreignKey: 'organizationId'
});

Asset.belongsTo(User, {
  as: 'assignedTo',
  foreignKey: 'assignedToId'
});
User.hasMany(Asset, {
  as: 'assignedAssets',
  foreignKey: 'assignedToId'
});

Asset.belongsTo(User, {
  as: 'assignedBy',
  foreignKey: 'assignedById'
});
User.hasMany(Asset, {
  as: 'assetsAssigned',
  foreignKey: 'assignedById'
});

Asset.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdById'
});
User.hasMany(Asset, {
  as: 'createdAssets',
  foreignKey: 'createdById'
});

Asset.belongsTo(Department, {
  as: 'department',
  foreignKey: 'departmentId'
});
Department.hasMany(Asset, {
  as: 'assets',
  foreignKey: 'departmentId'
});

// AssetRequest associations
AssetRequest.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(AssetRequest, {
  as: 'assetRequests',
  foreignKey: 'organizationId'
});

AssetRequest.belongsTo(User, {
  as: 'requestedBy',
  foreignKey: 'requestedById'
});
User.hasMany(AssetRequest, {
  as: 'assetRequests',
  foreignKey: 'requestedById'
});

AssetRequest.belongsTo(User, {
  as: 'approvedBy',
  foreignKey: 'approvedById'
});
User.hasMany(AssetRequest, {
  as: 'approvedAssetRequests',
  foreignKey: 'approvedById'
});

AssetRequest.belongsTo(Asset, {
  as: 'asset',
  foreignKey: 'assetId'
});
Asset.hasMany(AssetRequest, {
  as: 'requests',
  foreignKey: 'assetId'
});

// Expense associations
Expense.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'employeeId'
});

Expense.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'organizationId'
});

Expense.belongsTo(User, {
  as: 'reviewer',
  foreignKey: 'reviewedBy'
});
User.hasMany(Expense, {
  as: 'reviewedExpenses',
  foreignKey: 'reviewedBy'
});

Expense.belongsTo(Project, {
  as: 'project',
  foreignKey: 'projectId'
});
Project.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'projectId'
});

Expense.belongsTo(Department, {
  as: 'department',
  foreignKey: 'departmentId'
});
Department.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'departmentId'
});

// Exit associations
Exit.belongsTo(User, {
  as: 'employee',
  foreignKey: 'employeeId'
});
User.hasMany(Exit, {
  as: 'exitProcesses',
  foreignKey: 'employeeId'
});

Exit.belongsTo(User, {
  as: 'initiator',
  foreignKey: 'initiatedBy'
});
User.hasMany(Exit, {
  as: 'initiatedExits',
  foreignKey: 'initiatedBy'
});

Exit.belongsTo(Organization, {
  as: 'organization',
  foreignKey: 'organizationId'
});
Organization.hasMany(Exit, {
  as: 'exits',
  foreignKey: 'organizationId'
});

Exit.belongsTo(User, {
  as: 'approver',
  foreignKey: 'approvedBy'
});
User.hasMany(Exit, {
  as: 'approvedExits',
  foreignKey: 'approvedBy'
});

Exit.belongsTo(User, {
  as: 'handoverUser',
  foreignKey: 'handoverTo'
});
User.hasMany(Exit, {
  as: 'handoversReceived',
  foreignKey: 'handoverTo'
});

Exit.belongsTo(User, {
  as: 'exitInterviewer',
  foreignKey: 'exitInterviewConductedBy'
});
User.hasMany(Exit, {
  as: 'conductedExitInterviews',
  foreignKey: 'exitInterviewConductedBy'
});

module.exports = {
  sequelize,
  User,
  Organization,
  HRManager,
  JoinRequest,
  Attendance,
  LocationTracking,
  DailyPlanReport,
  ActivityLog,
  GeofenceViolation,
  Geofence,
  Leave,
  LeaveBalance,
  LeavePolicy,
  Project,
  Task,
  ProgressReport,
  Meeting,
  MeetingAttendee,
  MeetingAction,
  Shift,
  ShiftRoster,
  ShiftAssignment,
  Payroll,
  SalaryStructure,
  SalaryComponent,
  Payslip,
  Job,
  Application,
  Department,
  Team,
  TeamMember,
  Form,
  FormResponse,
  UserSetting,
  NotificationPreference,
  Holiday,
  Policy,
  PolicyAcknowledgment,
  Compliance,
  Announcement,
  AnnouncementRead,
  OnboardingTask,
  Onboarding,
  Feedback,
  Document,
  PerformanceReview,
  Course,
  CourseEnrollment,
  Asset,
  AssetRequest,
  Expense,
  Exit
};