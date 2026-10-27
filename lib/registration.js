const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\d{10}$/;

class RegistrationValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RegistrationValidationError";
    this.code = code;
  }
}

function reject(code, message) {
  throw new RegistrationValidationError(code, message);
}

function requiredText(value, field, minLength = 2, maxLength = 160) {
  const text = String(value ?? "").trim();
  if (text.length < minLength || text.length > maxLength) {
    reject("INVALID_PARTICIPANT", `${field} must be between ${minLength} and ${maxLength} characters.`);
  }
  return text;
}

function validateRegistrationPayload(body = {}) {
  const team = requiredText(body.team, "Team name", 2, 100);
  const teamSize = body.teamSize;
  if (!Number.isInteger(teamSize) || teamSize < 2 || teamSize > 4) {
    reject("INVALID_TEAM_SIZE", "Team size must be an integer between 2 and 4.");
  }

  if (!Array.isArray(body.participants) || body.participants.length !== teamSize) {
    reject("INVALID_PARTICIPANT_COUNT", `Provide details for exactly ${teamSize} participants.`);
  }

  const seenEmails = new Set();
  const participants = body.participants.map((item, index) => {
    const label = index === 0 ? "Team leader" : `Participant ${index + 1}`;
    const name = requiredText(item?.name, `${label} name`, 2, 100);
    const email = String(item?.email ?? "").trim().toLowerCase();
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      reject("INVALID_EMAIL", `${label} must have a valid email address.`);
    }
    if (seenEmails.has(email)) {
      reject("DUPLICATE_EMAIL", "Each participant must use a different email address.");
    }
    seenEmails.add(email);

    const mobile = String(item?.mobile ?? "").trim();
    if (!MOBILE_PATTERN.test(mobile)) {
      reject("INVALID_MOBILE", `${label} must have a valid 10-digit mobile number.`);
    }

    const college = requiredText(item?.college, `${label} college`);
    const department = requiredText(item?.department, `${label} department`, 2, 120);
    const year = String(item?.year ?? "").trim();
    if (!/^[1-4]$/.test(year)) {
      reject("INVALID_YEAR", `${label} year of study must be between 1 and 4.`);
    }
    return { name, email, mobile, college, department, year };
  });

  return { team, teamSize, participants };
}

module.exports = { RegistrationValidationError, validateRegistrationPayload };
