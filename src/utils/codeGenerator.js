const generateOrgCode = async (Organization) => {
  const count = await Organization.count();
  const codeNumber = (count + 1).toString().padStart(3, '0');
  return `ORG${codeNumber}`;
};

const generateHRCode = async (HRManager, orgCode) => {
  const count = await HRManager.count({ where: { orgCode } });
  const codeNumber = (count + 1).toString().padStart(3, '0');
  return `HR${codeNumber}-${orgCode}`;
};

const generateEmployeeId = async (User, organizationId) => {
  const year = new Date().getFullYear();
  let codeNumber = 1;
  let employeeId;
  let isUnique = false;

  // Keep trying until we find a unique employee ID
  while (!isUnique) {
    const paddedNumber = codeNumber.toString().padStart(5, '0');
    employeeId = `EMP${year}${paddedNumber}`;

    // Check if this employeeId already exists
    const existingUser = await User.findOne({
      where: { employeeId }
    });

    if (!existingUser) {
      isUnique = true;
    } else {
      codeNumber++;
    }

    // Safety check to prevent infinite loop
    if (codeNumber > 99999) {
      throw new Error('Unable to generate unique employee ID');
    }
  }

  return employeeId;
};

const validateOrgCode = (code) => {
  return /^ORG\d{3}$/.test(code);
};

const validateHRCode = (code) => {
  return /^HR\d{3}-ORG\d{3}$/.test(code);
};

module.exports = {
  generateOrgCode,
  generateHRCode,
  generateEmployeeId,
  validateOrgCode,
  validateHRCode
};