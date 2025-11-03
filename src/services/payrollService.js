const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Payroll,
  SalaryStructure,
  SalaryComponent,
  Payslip,
  User,
  Organization,
  Attendance,
  Leave
} = require('../models');
const { sequelize } = require('../config/database');

class PayrollService {
  // ============= SALARY STRUCTURE METHODS =============

  async createSalaryStructure(data) {
    const transaction = await sequelize.transaction();

    try {
      const { employeeId, basicSalary, components, ctc, effectiveDate } = data;

      // Deactivate existing salary structure
      await SalaryStructure.update(
        { isActive: false, endDate: new Date() },
        {
          where: {
            employeeId,
            isActive: true,
            organizationId: data.organizationId
          },
          transaction
        }
      );

      // Create new salary structure
      const structure = await SalaryStructure.create({
        ...data,
        isActive: true,
        ctc: ctc || basicSalary * 12
      }, { transaction });

      // Create salary components if provided
      if (components && components.length > 0) {
        const componentData = components.map((comp, index) => ({
          ...comp,
          salaryStructureId: structure.id,
          displayOrder: index
        }));

        await SalaryComponent.bulkCreate(componentData, { transaction });
      }

      await transaction.commit();

      // Fetch complete structure with components
      return await this.getSalaryStructureById(structure.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSalaryStructure(employeeId, organizationId) {
    const structure = await SalaryStructure.findOne({
      where: {
        employeeId,
        organizationId,
        isActive: true
      },
      include: [
        {
          model: SalaryComponent,
          as: 'components',
          order: [['displayOrder', 'ASC']]
        }
      ]
    });

    return structure;
  }

  async getSalaryStructureById(id) {
    return await SalaryStructure.findByPk(id, {
      include: [
        {
          model: SalaryComponent,
          as: 'components',
          order: [['displayOrder', 'ASC']]
        }
      ]
    });
  }

  async updateSalaryStructure(employeeId, data, organizationId) {
    const transaction = await sequelize.transaction();

    try {
      const existingStructure = await this.getSalaryStructure(employeeId, organizationId);

      if (!existingStructure) {
        // Create new structure if doesn't exist
        return await this.createSalaryStructure({
          ...data,
          employeeId,
          organizationId
        });
      }

      // Update basic salary and CTC
      if (data.basicSalary || data.ctc) {
        await existingStructure.update({
          basicSalary: data.basicSalary || existingStructure.basicSalary,
          ctc: data.ctc || (data.basicSalary ? data.basicSalary * 12 : existingStructure.ctc)
        }, { transaction });
      }

      // Update components if provided
      if (data.components) {
        // Delete existing components
        await SalaryComponent.destroy({
          where: { salaryStructureId: existingStructure.id },
          transaction
        });

        // Create new components
        const componentData = data.components.map((comp, index) => ({
          ...comp,
          salaryStructureId: existingStructure.id,
          displayOrder: index
        }));

        await SalaryComponent.bulkCreate(componentData, { transaction });
      }

      await transaction.commit();

      return await this.getSalaryStructureById(existingStructure.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async bulkUpdateSalaries(salaryUpdates, organizationId, updatedBy) {
    const transaction = await sequelize.transaction();
    const results = [];

    try {
      for (const update of salaryUpdates) {
        const { employeeId, basicSalary } = update;

        const structure = await this.updateSalaryStructure(
          employeeId,
          { basicSalary },
          organizationId
        );

        results.push({
          employeeId,
          success: true,
          structure
        });
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============= PAYROLL PROCESSING METHODS =============

  async generatePayroll(params) {
    const { month, year, employeeIds, organizationId, processedBy } = params;
    const transaction = await sequelize.transaction();
    const payrolls = [];

    try {
      console.log('=== PAYROLL GENERATION DEBUG START ===');
      console.log('GeneratePayroll - Input params:', { month, year, employeeIds, organizationId, processedBy });

      // First, let's check if there are any users in the organization at all
      const totalOrgUsers = await User.count({ where: { organizationId } });
      const activeOrgUsers = await User.count({ where: { organizationId, status: 'active' } });
      console.log(`GeneratePayroll - Organization ${organizationId} has ${totalOrgUsers} total users, ${activeOrgUsers} active users`);

      // If employeeIds provided, let's see what we have
      if (employeeIds && employeeIds.length > 0) {
        console.log('GeneratePayroll - Checking provided employee IDs:', employeeIds);
        for (const empId of employeeIds) {
          const emp = await User.findByPk(empId);
          if (emp) {
            console.log(`GeneratePayroll - Employee ${empId}: ${emp.name}, org: ${emp.organizationId}, status: ${emp.status}`);
          } else {
            console.log(`GeneratePayroll - Employee ${empId}: NOT FOUND`);
          }
        }
      }

      // Build where clause for employees
      const whereClause = {
        organizationId,
        status: 'active'
      };

      // Add employee IDs filter if provided
      if (employeeIds && employeeIds.length > 0) {
        whereClause.id = { [Op.in]: employeeIds };
      }

      console.log('GeneratePayroll - Employee query where clause:', JSON.stringify(whereClause, null, 2));

      // Get employees to process - first without the salary structure join to see if the basic query works
      const employeesWithoutSalary = await User.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'email', 'organizationId', 'status']
      });

      console.log(`GeneratePayroll - Found ${employeesWithoutSalary.length} employees matching criteria (without salary join)`);
      employeesWithoutSalary.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.id}), org: ${emp.organizationId}, status: ${emp.status}`);
      });

      // Now get employees with salary structures
      const employees = await User.findAll({
        where: whereClause,
        include: [{
          model: SalaryStructure,
          as: 'salaryStructures',
          where: { isActive: true },
          required: false,
          include: [{
            model: SalaryComponent,
            as: 'components'
          }]
        }]
      });

      console.log(`GeneratePayroll - Found ${employees.length} employees with salary structure query`);
      employees.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.id}), has salary: ${!!emp.salaryStructures?.[0]}`);
      });

      // Clean up any corrupted or duplicate payroll records for this period first
      console.log('GeneratePayroll - Cleaning up existing payroll records for this period...');
      await Payroll.destroy({
        where: {
          organizationId,
          month,
          year
        },
        transaction
      });
      console.log('GeneratePayroll - Cleanup completed');

      if (employees.length === 0) {
        console.log('GeneratePayroll - No employees found with the given criteria');
        console.log('GeneratePayroll - Check: 1) Employee IDs exist, 2) Employees are active, 3) Employees belong to organization');

        // Let's also check how many users exist in total for debugging
        const totalUsers = await User.count({ where: { organizationId } });
        const activeUsers = await User.count({ where: { organizationId, status: 'active' } });
        console.log(`GeneratePayroll - Total users in org: ${totalUsers}, Active users: ${activeUsers}`);
      }

      for (const employee of employees) {
        console.log(`GeneratePayroll - Processing employee: ${employee.name} (${employee.id})`);

        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          where: {
            employeeId: employee.id,
            month,
            year,
            organizationId
          },
          transaction
        });

        if (existingPayroll) {
          console.log(`GeneratePayroll - Skipping ${employee.name}: payroll already exists`);
          continue; // Skip if already exists
        }

        // Get salary structure
        const salaryStructure = employee.salaryStructures?.[0];
        console.log(`GeneratePayroll - Employee ${employee.name} has salary structure:`, !!salaryStructure);

        if (!salaryStructure) {
          console.log(`GeneratePayroll - Skipping ${employee.name}: no salary structure`);

          // Let's create a basic payroll record even without salary structure
          // This matches what your existing payroll data shows (all zeros)
          const payrollData = {
            id: uuidv4(),
            organizationId,
            employeeId: employee.id,
            month,
            year,
            basicSalary: 0,
            hra: 0,
            da: 0,
            otherAllowances: 0,
            pf: 0,
            esi: 0,
            professionalTax: 200, // Standard professional tax
            incomeTax: 0,
            otherDeductions: 0,
            grossSalary: 0,
            totalDeductions: 200,
            netPay: -200, // Professional tax deduction
            workingDays: 22,
            presentDays: 0,
            absentDays: 22,
            paidLeaves: 0,
            unpaidLeaves: 0,
            overtimeHours: 0,
            overtimeAmount: 0,
            status: 'draft',
            processedBy
          };

          console.log(`GeneratePayroll - Creating basic payroll for ${employee.name}`);
          console.log('GeneratePayroll - Payroll data being created:', JSON.stringify(payrollData, null, 2));

          try {
            const payroll = await Payroll.create(payrollData, { transaction });
            console.log(`GeneratePayroll - Successfully created payroll for ${employee.name} with ID: ${payroll.id}`);
            payrolls.push(payroll);
          } catch (createError) {
            console.error(`GeneratePayroll - Error creating payroll for ${employee.name}:`, createError);
            throw createError;
          }
          continue;
        }

        // Calculate attendance data for the month
        const attendanceData = await this.calculateAttendanceData(
          employee.id,
          month,
          year
        );

        // Calculate salary components
        const salaryCalculation = this.calculateSalary(
          salaryStructure,
          attendanceData
        );

        // Create payroll record
        const payroll = await Payroll.create({
          organizationId,
          employeeId: employee.id,
          month,
          year,
          ...salaryCalculation,
          ...attendanceData,
          status: 'draft',
          processedBy
        }, { transaction });

        payrolls.push(payroll);
      }

      console.log(`GeneratePayroll - Final result: Created ${payrolls.length} payroll records`);
      console.log('GeneratePayroll - Payroll IDs created:', payrolls.map(p => p.id));
      console.log('=== PAYROLL GENERATION DEBUG END ===');

      await transaction.commit();
      return payrolls;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async calculateAttendanceData(employeeId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance records
    const attendanceRecords = await Attendance.count({
      where: {
        userId: employeeId,
        date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'present'
      }
    });

    console.log(`CalculateAttendanceData - Employee ${employeeId}: found ${attendanceRecords} attendance records for ${month}/${year}`);

    // Get leave records
    const leaves = await Leave.findAll({
      where: {
        employeeId,
        status: 'approved',
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      }
    });

    let paidLeaves = 0;
    let unpaidLeaves = 0;

    leaves.forEach(leave => {
      // Use numberOfDays and handle undefined/null values
      const leaveDays = parseFloat(leave.numberOfDays || leave.totalDays || 0);
      if (leave.isPaid) {
        paidLeaves += leaveDays;
      } else {
        unpaidLeaves += leaveDays;
      }
    });

    const totalWorkingDays = this.getWorkingDaysInMonth(month, year);
    const presentDays = attendanceRecords || 0;

    // Ensure all values are numbers and not NaN
    const safePaidLeaves = isNaN(paidLeaves) ? 0 : paidLeaves;
    const safeUnpaidLeaves = isNaN(unpaidLeaves) ? 0 : unpaidLeaves;
    const absentDays = Math.max(0, totalWorkingDays - presentDays - safePaidLeaves - safeUnpaidLeaves);

    console.log(`CalculateAttendanceData - Employee ${employeeId}: workingDays=${totalWorkingDays}, presentDays=${presentDays}, absentDays=${absentDays}, paidLeaves=${safePaidLeaves}, unpaidLeaves=${safeUnpaidLeaves}`);

    // IMPORTANT: Only assume full attendance if this is the current/future month
    // For past months, if no attendance data exists, it means employee was absent
    const currentDate = new Date();
    const isCurrentOrFutureMonth = (year > currentDate.getFullYear()) ||
                                   (year === currentDate.getFullYear() && month >= (currentDate.getMonth() + 1));

    let effectivePresentDays = presentDays;

    // Only apply full attendance assumption for current/future months with no attendance tracking yet
    if (attendanceRecords === 0 && safePaidLeaves === 0 && safeUnpaidLeaves === 0) {
      if (isCurrentOrFutureMonth) {
        console.log(`CalculateAttendanceData - Current/Future month detected, assuming full attendance for ${employeeId}`);
        effectivePresentDays = totalWorkingDays;
      } else {
        console.log(`CalculateAttendanceData - Past month with no attendance, treating as absent for ${employeeId}`);
        effectivePresentDays = 0; // Past month with no records = absent
      }
    }

    const calculatedAbsentDays = Math.max(0, totalWorkingDays - effectivePresentDays - safePaidLeaves - safeUnpaidLeaves);

    return {
      workingDays: totalWorkingDays || 0,
      presentDays: effectivePresentDays || 0,
      absentDays: isNaN(calculatedAbsentDays) ? 0 : Math.floor(calculatedAbsentDays),
      paidLeaves: isNaN(safePaidLeaves) ? 0 : Math.floor(safePaidLeaves),
      unpaidLeaves: isNaN(safeUnpaidLeaves) ? 0 : Math.floor(safeUnpaidLeaves)
    };
  }

  calculateSalary(salaryStructure, attendanceData) {
    const { basicSalary = 0, components } = salaryStructure;
    const { workingDays = 22, presentDays = 0, paidLeaves = 0, unpaidLeaves = 0 } = attendanceData;

    // Validate inputs
    if (basicSalary <= 0) {
      console.warn('calculateSalary - Basic salary is 0 or negative, returning zero salary');
      return this.getZeroSalaryCalculation();
    }

    // Calculate basic salary based on attendance with proper validation
    const effectiveDays = Math.max(0, (presentDays || 0) + (paidLeaves || 0));
    const safeWorkingDays = workingDays > 0 ? workingDays : 22; // Default to 22 working days if invalid

    // Calculate daily rate from MONTHLY basic salary
    const dailyRate = basicSalary / safeWorkingDays;

    // Calculate adjusted basic salary based on actual attendance
    const adjustedBasicSalary = Math.round((dailyRate * effectiveDays) * 100) / 100;

    console.log(`calculateSalary - Basic: ${basicSalary}, Working Days: ${safeWorkingDays}, Effective Days: ${effectiveDays}, Daily Rate: ${dailyRate.toFixed(2)}, Adjusted Basic: ${adjustedBasicSalary.toFixed(2)}`);

    let totalAllowances = 0;
    let totalDeductions = 0;
    const allowanceBreakdown = {};
    const deductionBreakdown = {};

    // Calculate components
    if (components && components.length > 0) {
      components.forEach(component => {
        let amount = 0;

        if (component.calculationType === 'percentage') {
          amount = (adjustedBasicSalary * (component.percentage || 0)) / 100;
        } else {
          amount = component.amount || 0;
        }

        if (component.componentType === 'allowance') {
          totalAllowances += amount;
          allowanceBreakdown[component.name] = amount;
        } else {
          totalDeductions += amount;
          deductionBreakdown[component.name] = amount;
        }
      });
    }

    // Standard calculations with safety checks and proper rounding
    const hra = Math.round(adjustedBasicSalary * 0.4 * 100) / 100; // 40% of basic
    const da = Math.round(adjustedBasicSalary * 0.1 * 100) / 100;  // 10% of basic
    const pf = Math.round(adjustedBasicSalary * 0.12 * 100) / 100; // 12% of basic (employee contribution)

    // ESI applicable only if gross salary <= 21,000 per month (1.75% employee share)
    const monthlyGross = adjustedBasicSalary + hra + da + totalAllowances;
    const esi = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0175 * 100) / 100 : 0;

    // Professional tax (varies by state, using Karnataka slab as example)
    let professionalTax = 0;
    if (monthlyGross > 15000) {
      professionalTax = 200; // Fixed PT for salary > 15,000 in Karnataka
    }

    // Calculate income tax on gross salary (not adjusted basic)
    const incomeTax = this.calculateIncomeTax(monthlyGross);

    // Calculate final totals with proper rounding
    const grossSalary = Math.round((adjustedBasicSalary + hra + da + totalAllowances) * 100) / 100;
    const calculatedTotalDeductions = Math.round((pf + esi + professionalTax + incomeTax + totalDeductions) * 100) / 100;
    const netPay = Math.round((grossSalary - calculatedTotalDeductions) * 100) / 100;

    console.log(`calculateSalary - Gross: ${grossSalary}, Deductions: ${calculatedTotalDeductions}, Net: ${netPay}`);

    // Ensure no NaN values are returned
    return {
      basicSalary: isNaN(adjustedBasicSalary) ? 0 : adjustedBasicSalary,
      hra: isNaN(hra) ? 0 : hra,
      da: isNaN(da) ? 0 : da,
      otherAllowances: isNaN(totalAllowances) ? 0 : totalAllowances,
      pf: isNaN(pf) ? 0 : pf,
      esi: isNaN(esi) ? 0 : esi,
      professionalTax: isNaN(professionalTax) ? 0 : professionalTax,
      incomeTax: isNaN(incomeTax) ? 0 : incomeTax,
      otherDeductions: isNaN(totalDeductions) ? 0 : totalDeductions,
      grossSalary: isNaN(grossSalary) ? 0 : grossSalary,
      totalDeductions: isNaN(calculatedTotalDeductions) ? 0 : calculatedTotalDeductions,
      netPay: isNaN(netPay) ? 0 : netPay
    };
  }

  // Helper method to return zero salary calculation
  getZeroSalaryCalculation() {
    return {
      basicSalary: 0,
      hra: 0,
      da: 0,
      otherAllowances: 0,
      pf: 0,
      esi: 0,
      professionalTax: 0,
      incomeTax: 0,
      otherDeductions: 0,
      grossSalary: 0,
      totalDeductions: 0,
      netPay: 0
    };
  }

  calculateIncomeTax(monthlyGrossSalary) {
    // Calculate annual salary from monthly gross
    const annualSalary = monthlyGrossSalary * 12;
    let annualTax = 0;

    // Indian tax slabs for FY 2024-25 (New Regime - Simplified)
    // These are simplified slabs - actual implementation should use configurable tax rules
    if (annualSalary <= 300000) {
      annualTax = 0; // No tax up to 3 lakhs (new regime)
    } else if (annualSalary <= 600000) {
      annualTax = (annualSalary - 300000) * 0.05; // 5% tax
    } else if (annualSalary <= 900000) {
      annualTax = 15000 + (annualSalary - 600000) * 0.10; // 10% tax
    } else if (annualSalary <= 1200000) {
      annualTax = 45000 + (annualSalary - 900000) * 0.15; // 15% tax
    } else if (annualSalary <= 1500000) {
      annualTax = 90000 + (annualSalary - 1200000) * 0.20; // 20% tax
    } else {
      annualTax = 150000 + (annualSalary - 1500000) * 0.30; // 30% tax
    }

    // Add 4% health and education cess
    const cessAmount = annualTax * 0.04;
    const totalAnnualTax = annualTax + cessAmount;

    // Return monthly tax (rounded to 2 decimals)
    return Math.round((totalAnnualTax / 12) * 100) / 100;
  }

  getWorkingDaysInMonth(month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      // Exclude Sundays (0) and Saturdays (6)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }

  async getPayrolls(filters) {
    const where = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const payrolls = await Payroll.findAll({
      where,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId', 'department', 'designation']
        },
        {
          model: Payslip,
          as: 'payslip',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform payrolls to include employee name at root level for frontend compatibility
    const transformedPayrolls = payrolls.map(payroll => {
      const payrollJson = payroll.toJSON();
      return {
        ...payrollJson,
        employeeName: payrollJson.employee?.name || 'Unknown Employee',
        employeeEmail: payrollJson.employee?.email || '',
        department: payrollJson.employee?.department || '',
        designation: payrollJson.employee?.designation || '',
        employee: payrollJson.employee // Keep nested object as well
      };
    });

    return transformedPayrolls;
  }

  async getPayrollById(id, organizationId) {
    return await Payroll.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId', 'department', 'designation']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name']
        },
        {
          model: Payslip,
          as: 'payslip'
        }
      ]
    });
  }

  async updatePayrollStatus(id, status, userId, remarks, organizationId) {
    const payroll = await Payroll.findOne({
      where: { id, organizationId }
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    const updateData = { status, remarks };

    if (status === 'approved') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    await payroll.update(updateData);
    return payroll;
  }

  async processPayment(params) {
    const { payrollIds, paymentMethod, paymentDate, processedBy, organizationId } = params;
    const transaction = await sequelize.transaction();

    try {
      const payrolls = await Payroll.findAll({
        where: {
          id: payrollIds,
          organizationId,
          status: 'approved'
        },
        transaction
      });

      const results = [];

      for (const payroll of payrolls) {
        await payroll.update({
          status: 'paid',
          paymentMethod,
          paymentDate: paymentDate || new Date(),
          processedBy
        }, { transaction });

        results.push(payroll);
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============= PAYSLIP METHODS =============

  async generatePayslips(payrollIds, generatedBy, organizationId) {
    const transaction = await sequelize.transaction();
    const payslips = [];

    try {
      const payrolls = await Payroll.findAll({
        where: {
          id: payrollIds,
          organizationId
        },
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId', 'department', 'designation']
        }],
        transaction
      });

      for (const payroll of payrolls) {
        // Check if payslip already exists
        let payslip = await Payslip.findOne({
          where: { payrollId: payroll.id },
          transaction
        });

        if (!payslip) {
          // Calculate allowances and deductions
          const allowances = {
            hra: payroll.hra,
            da: payroll.da,
            other: payroll.otherAllowances
          };

          const deductions = {
            pf: payroll.pf,
            esi: payroll.esi,
            professionalTax: payroll.professionalTax,
            incomeTax: payroll.incomeTax,
            other: payroll.otherDeductions
          };

          // Ensure numeric values for calculations
          const hra = parseFloat(payroll.hra) || 0;
          const da = parseFloat(payroll.da) || 0;
          const otherAllowances = parseFloat(payroll.otherAllowances) || 0;
          const totalDeductions = parseFloat(payroll.totalDeductions) || 0;

          payslip = await Payslip.create({
            payrollId: payroll.id,
            employeeId: payroll.employeeId,
            organizationId,
            month: payroll.month.toString().padStart(2, '0'),
            year: payroll.year,
            employeeName: payroll.employee.name,
            employeeCode: payroll.employee.employeeId,
            designation: payroll.employee.designation,
            department: payroll.employee.department,
            basicSalary: payroll.basicSalary,
            grossSalary: payroll.grossSalary,
            netPay: payroll.netPay,
            allowances,
            deductions,
            allowancesTotal: hra + da + otherAllowances,
            deductionsTotal: totalDeductions,
            taxAmount: payroll.incomeTax,
            status: 'generated',
            paidOn: payroll.paymentDate,
            generatedBy
          }, { transaction });
        }

        payslips.push(payslip);
      }

      await transaction.commit();
      return payslips;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getEmployeePayslips(employeeId, organizationId) {
    const payslips = await Payslip.findAll({
      where: {
        employeeId,
        organizationId
      },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'orgCode']
      }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    // Transform payslips to include organizationName
    return payslips.map(payslip => {
      const payslipData = payslip.toJSON();
      return {
        ...payslipData,
        organizationName: payslip.organization?.name || ''
      };
    });
  }

  async getPayslipById(id, organizationId) {
    return await Payslip.findOne({
      where: { id, organizationId },
      include: [{
        model: Payroll,
        as: 'payroll'
      }]
    });
  }

  async sendPayslips(payslipIds, sendEmail, organizationId) {
    const payslips = await Payslip.findAll({
      where: {
        id: payslipIds,
        organizationId
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['email', 'name']
      }]
    });

    const results = [];

    for (const payslip of payslips) {
      // Update status
      await payslip.update({
        status: 'sent',
        sentAt: new Date(),
        sentTo: payslip.employee.email
      });

      // TODO: Implement email sending logic here
      if (sendEmail) {
        // Send email with payslip
      }

      results.push(payslip);
    }

    return results;
  }

  // ============= REPORT METHODS =============

  async getPayrollSummary(params) {
    const { month, year, department, organizationId } = params;

    const where = { organizationId };
    if (month) where.month = month;
    if (year) where.year = year;

    const includeOptions = [{
      model: User,
      as: 'employee',
      attributes: ['department'],
      where: department ? { department } : undefined
    }];

    const payrolls = await Payroll.findAll({
      where,
      include: includeOptions
    });

    const summary = {
      totalEmployees: payrolls.length,
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      statusBreakdown: {},
      departmentBreakdown: {}
    };

    payrolls.forEach(payroll => {
      summary.totalGrossSalary += parseFloat(payroll.grossSalary);
      summary.totalDeductions += parseFloat(payroll.totalDeductions);
      summary.totalNetPay += parseFloat(payroll.netPay);

      // Status breakdown
      summary.statusBreakdown[payroll.status] =
        (summary.statusBreakdown[payroll.status] || 0) + 1;

      // Department breakdown
      const dept = payroll.employee.department || 'Unknown';
      if (!summary.departmentBreakdown[dept]) {
        summary.departmentBreakdown[dept] = {
          count: 0,
          totalNetPay: 0
        };
      }
      summary.departmentBreakdown[dept].count++;
      summary.departmentBreakdown[dept].totalNetPay += parseFloat(payroll.netPay);
    });

    return summary;
  }

  async getDepartmentWiseReport(params) {
    const { month, year, organizationId } = params;

    const payrolls = await Payroll.findAll({
      where: {
        month,
        year,
        organizationId
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['department', 'designation']
      }],
      raw: true,
      nest: true
    });

    const departments = {};

    payrolls.forEach(payroll => {
      const dept = payroll.employee.department || 'Unknown';

      if (!departments[dept]) {
        departments[dept] = {
          employeeCount: 0,
          totalBasicSalary: 0,
          totalGrossSalary: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          employees: []
        };
      }

      departments[dept].employeeCount++;
      departments[dept].totalBasicSalary += parseFloat(payroll.basicSalary);
      departments[dept].totalGrossSalary += parseFloat(payroll.grossSalary);
      departments[dept].totalDeductions += parseFloat(payroll.totalDeductions);
      departments[dept].totalNetPay += parseFloat(payroll.netPay);

      departments[dept].employees.push({
        name: payroll.employee.name,
        designation: payroll.employee.designation,
        netPay: payroll.netPay
      });
    });

    return departments;
  }

  async getYearlyReport(params) {
    const { year, employeeId, organizationId } = params;

    const where = { year, organizationId };
    if (employeeId) where.employeeId = employeeId;

    const payrolls = await Payroll.findAll({
      where,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['name', 'email', 'department']
      }],
      order: [['month', 'ASC']]
    });

    const monthlyData = {};
    let yearlyTotals = {
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalTax: 0
    };

    payrolls.forEach(payroll => {
      const monthName = this.getMonthName(payroll.month);

      monthlyData[monthName] = {
        grossSalary: parseFloat(payroll.grossSalary),
        totalDeductions: parseFloat(payroll.totalDeductions),
        netPay: parseFloat(payroll.netPay),
        incomeTax: parseFloat(payroll.incomeTax),
        status: payroll.status
      };

      yearlyTotals.totalGross += parseFloat(payroll.grossSalary);
      yearlyTotals.totalDeductions += parseFloat(payroll.totalDeductions);
      yearlyTotals.totalNet += parseFloat(payroll.netPay);
      yearlyTotals.totalTax += parseFloat(payroll.incomeTax);
    });

    return {
      year,
      monthlyData,
      yearlyTotals,
      averageMonthly: {
        gross: yearlyTotals.totalGross / 12,
        net: yearlyTotals.totalNet / 12
      }
    };
  }

  getMonthName(monthNumber) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  }

  async exportPayrollReport(params) {
    // TODO: Implement Excel/PDF export functionality
    // This would typically use libraries like exceljs for Excel or puppeteer/pdfkit for PDF
    const payrollData = await this.getPayrolls({
      month: params.month,
      year: params.year,
      organizationId: params.organizationId
    });

    // For now, return JSON data
    return JSON.stringify(payrollData, null, 2);
  }
}

module.exports = new PayrollService();