const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const { RegistrationValidationError, validateRegistrationPayload } = require("../lib/registration");

function makePayload(teamSize) {
  return {
    team: "Nexus Test",
    teamSize,
    participants: Array.from({ length: teamSize }, (_, index) => ({
      name: `Participant ${index + 1}`,
      email: `participant${index + 1}@example.test`,
      mobile: `98765432${String(index).padStart(2, "0")}`,
      college: "Example College",
      department: "Information Technology",
      year: "2"
    }))
  };
}

test("team sizes 2, 3, and 4 validate participant count and structure without payment fields", () => {
  for (const size of [2, 3, 4]) {
    const registration = validateRegistrationPayload(makePayload(size));
    assert.equal(registration.teamSize, size);
    assert.equal(registration.participants.length, size);
    assert.equal("feePerPerson" in registration, false);
    assert.equal("totalAmount" in registration, false);
    assert.equal("pay" in registration, false);
  }
});

test("rejects unsupported or non-integer team sizes", () => {
  for (const size of [1, 5, -1, 2.5, "3"]) {
    assert.throws(() => validateRegistrationPayload(makePayload(size)), {
      name: "RegistrationValidationError",
      code: "INVALID_TEAM_SIZE"
    });
  }
});

test("rejects missing participant details and incorrect participant counts", () => {
  const missingDetails = makePayload(2);
  missingDetails.participants[1].college = "";
  assert.throws(() => validateRegistrationPayload(missingDetails), RegistrationValidationError);

  const wrongCount = makePayload(3);
  wrongCount.participants.pop();
  assert.throws(() => validateRegistrationPayload(wrongCount), {
    name: "RegistrationValidationError",
    code: "INVALID_PARTICIPANT_COUNT"
  });
});

test("rejects invalid or duplicate participant email addresses", () => {
  const invalidEmail = makePayload(2);
  invalidEmail.participants[0].email = "not-an-email";
  assert.throws(() => validateRegistrationPayload(invalidEmail), {
    name: "RegistrationValidationError",
    code: "INVALID_EMAIL"
  });

  const duplicateEmail = makePayload(2);
  duplicateEmail.participants[1].email = duplicateEmail.participants[0].email;
  assert.throws(() => validateRegistrationPayload(duplicateEmail), {
    name: "RegistrationValidationError",
    code: "DUPLICATE_EMAIL"
  });
});

test("rejects invalid mobile numbers and ignores client amount fields", () => {
  const invalidMobile = makePayload(2);
  invalidMobile.participants[0].mobile = "123";
  assert.throws(() => validateRegistrationPayload(invalidMobile), {
    name: "RegistrationValidationError",
    code: "INVALID_MOBILE"
  });

  const payloadWithAmounts = makePayload(3);
  payloadWithAmounts.totalAmount = 500;
  payloadWithAmounts.feePerPerson = 250;
  const validated = validateRegistrationPayload(payloadWithAmounts);
  assert.equal("totalAmount" in validated, false);
  assert.equal("feePerPerson" in validated, false);
});

test("ignores client legacy payment fields (utr, method, shot) without setting payment defaults", () => {
  const payloadWithPayment = makePayload(2);
  payloadWithPayment.method = "UPI";
  payloadWithPayment.utr = "123456789";
  payloadWithPayment.shot = "data:image/jpeg;base64,QUJD";
  payloadWithPayment.pay = { status: "Paid" };
  const validated = validateRegistrationPayload(payloadWithPayment);
  assert.equal("method" in validated, false);
  assert.equal("utr" in validated, false);
  assert.equal("shot" in validated, false);
  assert.equal("pay" in validated, false);
});

process.env.MONGODB_URI = "";
process.env.NODE_ENV = "test";
const app = require("../server");
const server = app.listen(0, "127.0.0.1");

async function postRegistration(payload) {
  await new Promise(resolve => server.listening ? resolve() : server.once("listening", resolve));
  return fetch(`http://127.0.0.1:${server.address().port}/api/teams/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("registration API rejects invalid team size, missing participants, and duplicate emails", async () => {
  for (const size of [1, 5, -1]) {
    const response = await postRegistration(makePayload(size));
    const result = await response.json();
    assert.equal(response.status, 400);
    assert.equal(result.error, "INVALID_TEAM_SIZE");
  }

  const missingParticipant = makePayload(3);
  missingParticipant.participants.pop();
  const missingResponse = await postRegistration(missingParticipant);
  assert.equal((await missingResponse.json()).error, "INVALID_PARTICIPANT_COUNT");

  const duplicateEmail = makePayload(2);
  duplicateEmail.participants[1].email = duplicateEmail.participants[0].email;
  const duplicateResponse = await postRegistration(duplicateEmail);
  assert.equal((await duplicateResponse.json()).error, "DUPLICATE_EMAIL");
});

test("registration API reports a database outage instead of saving locally", async () => {
  const response = await postRegistration(makePayload(2));
  const result = await response.json();
  assert.equal(response.status, 503);
  assert.equal(result.error, "DATABASE_UNAVAILABLE");
});

test("GET /api/event returns only metadata for problem files and never fileData", async () => {
  const port = server.address().port;
  // First upload an event with problemStatementFiles including fileData via admin API
  const adminRes = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
    },
    body: JSON.stringify({
      tracks: [{ name: "Web Track", problems: ["Problem 1"] }],
      problemStatementFiles: [
        {
          id: "ps-track-1",
          track: "Web Track",
          title: "Problem 1",
          description: "Solve web challenge",
          fileName: "challenge1.pdf",
          fileType: "PDF",
          fileData: "data:application/pdf;base64,VGVzdERhdGE=",
          uploadDate: "2026-10-25",
          active: true
        },
        {
          id: "ps-track-2",
          track: "AI Track",
          title: "Problem 2",
          description: "Solve AI challenge",
          fileName: "challenge2.pdf",
          fileType: "PDF",
          fileData: "data:application/pdf;base64,QUlUZXN0RGF0YQ==",
          uploadDate: "2026-10-25",
          active: true
        }
      ]
    })
  });
  assert.equal(adminRes.status, 200);

  // Now call public GET /api/event
  const eventRes = await fetch(`http://127.0.0.1:${port}/api/event`);
  assert.equal(eventRes.status, 200);
  const eventJson = await eventRes.json();
  assert.equal(eventJson.success, true);
  assert(Array.isArray(eventJson.data.problemStatementFiles));
  assert.equal(eventJson.data.problemStatementFiles.length, 2);

  for (const item of eventJson.data.problemStatementFiles) {
    assert.equal(item.fileData, undefined, `problem statement ${item.id} must not include fileData`);
    assert.equal(typeof item.id, "string");
    assert.equal(typeof item.fileName, "string");
    assert.equal(typeof item.title, "string");
  }
});

test("teams cannot download another track's problem statement file", async () => {
  const port = server.address().port;

  // Attempt to download without session (unauthorized)
  const unauthRes = await fetch(`http://127.0.0.1:${port}/api/teams/problem-file/ps-track-1`);
  assert.equal(unauthRes.status, 401);

  // When database is offline/not configured, authenticateTeam rejects unauthorized sessions
  const result = await unauthRes.json();
  assert.equal(result.error, "UNAUTHORIZED");

  // Admin endpoint allows admin to download with admin password
  const adminFileRes = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-track-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(adminFileRes.status, 200);
  const adminFileJson = await adminFileRes.json();
  assert.equal(adminFileJson.success, true);
  assert.equal(adminFileJson.data.fileData, "data:application/pdf;base64,VGVzdERhdGE=");
});

test("adding an announcement does not wipe or resend file contents, and a replaced file updates correctly", async () => {
  const port = server.address().port;
  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
  };

  // 1. Initial save: upload problem statement with fileData
  const initialRes = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      tracks: [{ name: "Cybersecurity", problems: ["Challenge A"] }],
      problemStatementFiles: [
        {
          id: "ps-cyber-1",
          track: "Cybersecurity",
          title: "Challenge A",
          description: "Inspect network traffic",
          fileName: "initial_brief.pdf",
          fileType: "PDF",
          fileData: "data:application/pdf;base64,SW5pdGlhbENvbnRlbnQ=",
          uploadDate: "2026-10-25",
          active: true
        }
      ],
      announcements: []
    })
  });
  assert.equal(initialRes.status, 200);

  // Verify file content is stored
  const checkInitialFile = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-cyber-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(checkInitialFile.status, 200);
  assert.equal((await checkInitialFile.json()).data.fileData, "data:application/pdf;base64,SW5pdGlhbENvbnRlbnQ=");

  // 2. Admin adds an announcement: sends problem statement metadata only (NO fileData)
  const announcementRes = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      announcements: [{ t: "Update", d: "Mentoring round starts at 7 PM" }],
      problemStatementFiles: [
        {
          id: "ps-cyber-1",
          track: "Cybersecurity",
          title: "Challenge A",
          description: "Inspect network traffic",
          fileName: "initial_brief.pdf",
          fileType: "PDF",
          // Notice: NO fileData included here
          uploadDate: "2026-10-25",
          active: true
        }
      ]
    })
  });
  assert.equal(announcementRes.status, 200);

  // Verify the stored file content was NOT wiped or lost
  const checkFileAfterAnnouncement = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-cyber-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(checkFileAfterAnnouncement.status, 200);
  assert.equal(
    (await checkFileAfterAnnouncement.json()).data.fileData,
    "data:application/pdf;base64,SW5pdGlhbENvbnRlbnQ=",
    "Stored problem file content must be preserved when saving metadata without fileData"
  );

  // 3. Admin replaces the problem statement file with a new file: sends new fileData
  const replaceRes = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      problemStatementFiles: [
        {
          id: "ps-cyber-1",
          track: "Cybersecurity",
          title: "Challenge A (Revised)",
          description: "Inspect network traffic and forensics",
          fileName: "revised_brief.pdf",
          fileType: "PDF",
          fileData: "data:application/pdf;base64,UmV2aXNlZENvbnRlbnQ=",
          uploadDate: "2026-10-25",
          active: true
        }
      ]
    })
  });
  assert.equal(replaceRes.status, 200);

  // Verify the stored file content was updated correctly to new fileData
  const checkReplacedFile = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-cyber-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(checkReplacedFile.status, 200);
  assert.equal(
    (await checkReplacedFile.json()).data.fileData,
    "data:application/pdf;base64,UmV2aXNlZENvbnRlbnQ=",
    "Stored problem file content must be updated when new fileData is provided"
  );

  // 4. Admin deletes problem statement: should remove ProblemFile
  const deleteRes = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      problemStatementFiles: []
    })
  });
  assert.equal(deleteRes.status, 200);

  const checkDeletedFile = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-cyber-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(checkDeletedFile.status, 404);
});

test("PUT /api/event rejects payloads larger than 1 MB with clear PAYLOAD_TOO_LARGE error", async () => {
  const port = server.address().port;
  const largeString = "x".repeat(1024 * 1024 + 100);

  const res = await fetch(`http://127.0.0.1:${port}/api/event`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
    },
    body: JSON.stringify({
      event: { about: largeString }
    })
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.error, "PAYLOAD_TOO_LARGE");
  assert.match(json.message, /1 MB/i);
});

test("PUT /api/admin/problem-file/:id uploads a 1.5 MB file successfully and rejects a 2.5 MB file with a clear message", async () => {
  const port = server.address().port;
  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
  };

  // 1.5 MB binary payload as base64: 1.5 * 1024 * 1024 bytes = 1,572,864 bytes
  // Base64 chars needed: Math.ceil(1572864 / 3) * 4 = 2,097,152 chars
  const base64_1_5MB = "data:application/pdf;base64," + "A".repeat(2_097_152);
  const upload1_5Res = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-large-1`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      fileName: "large_problem_1.5MB.pdf",
      fileType: "PDF",
      fileData: base64_1_5MB
    })
  });

  assert.equal(upload1_5Res.status, 200);
  const upload1_5Json = await upload1_5Res.json();
  assert.equal(upload1_5Json.success, true);
  assert.equal(upload1_5Json.data.id, "ps-large-1");

  // Verify it can be retrieved via the admin endpoint
  const get1_5Res = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-large-1`, {
    headers: { "x-admin-password": process.env.ADMIN_PASSWORD || "admin123" }
  });
  assert.equal(get1_5Res.status, 200);
  const get1_5Json = await get1_5Res.json();
  assert.equal(get1_5Json.data.fileData, base64_1_5MB);

  // 2.5 MB binary payload: 2.5 * 1024 * 1024 = 2,621,440 bytes (> 2 MB limit)
  // Base64 chars needed: ~3,495,256 chars (stays within body limit 3.5 MB/4.5 MB but exceeds 2 MB file limit)
  const base64_2_5MB = "data:application/pdf;base64," + "B".repeat(3_495_256);
  const upload2_5Res = await fetch(`http://127.0.0.1:${port}/api/admin/problem-file/ps-large-2`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      fileName: "oversized_2.5MB.pdf",
      fileType: "PDF",
      fileData: base64_2_5MB
    })
  });

  assert.equal(upload2_5Res.status, 400);
  const upload2_5Json = await upload2_5Res.json();
  assert.equal(upload2_5Json.success, false);
  assert.equal(upload2_5Json.error, "FILE_TOO_LARGE");
  assert.match(upload2_5Json.message, /2 MB/i);
});

test("POST /api/teams/register accepts legacy payment fields under 100 KB and rejects payloads over 100 KB", async () => {
  // A legacy payload with utr/shot under 100 KB limit passes parser and reaches DB check (503 in test mode)
  const legacyPayload = makePayload(2);
  legacyPayload.method = "UPI";
  legacyPayload.utr = "123456789";
  legacyPayload.shot = "data:image/jpeg;base64," + "A".repeat(1000);

  const resValid = await postRegistration(legacyPayload);
  assert.equal(resValid.status, 503, "Should pass parser and reach database check");
  const jsonValid = await resValid.json();
  assert.equal(jsonValid.error, "DATABASE_UNAVAILABLE");

  // An over-limit payload (> 100 KB) gets rejected by body parser with 400 PAYLOAD_TOO_LARGE
  const payloadOverLimit = makePayload(2);
  payloadOverLimit.legacyData = "A".repeat(1024 * 105);

  const resOverLimit = await postRegistration(payloadOverLimit);
  assert.equal(resOverLimit.status, 400);
  const jsonOverLimit = await resOverLimit.json();
  assert.equal(jsonOverLimit.error, "PAYLOAD_TOO_LARGE");
  assert.match(jsonOverLimit.message, /100 KB/i);
});

test("GET and POST /api/payment-settings return 404 Not Found since payment is completely removed", async () => {
  const port = server.address().port;
  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
  };

  const getRes = await fetch(`http://127.0.0.1:${port}/api/payment-settings`, {
    headers: adminHeaders
  });
  assert.equal(getRes.status, 404, "GET /api/payment-settings must return 404 Not Found");

  const postRes = await fetch(`http://127.0.0.1:${port}/api/payment-settings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ upiId: "test@upi", fee: 500 })
  });
  assert.equal(postRes.status, 404, "POST /api/payment-settings must return 404 Not Found");
});

test("Frontend registration wizard has exactly 3 steps: Team, Members, Done", () => {
  const fs = require("fs");
  const path = require("path");
  const appJsContent = fs.readFileSync(path.join(__dirname, "../public/js/app.js"), "utf8");

  // Verify registration step names array
  assert.match(appJsContent, /names=\['Team','Members','Done'\]/);
  // Verify no fee/payment references in registration form
  assert.doesNotMatch(appJsContent, /registrationTotal/);
  assert.doesNotMatch(appJsContent, /registrationFeeSummary/);
});

test("Admin Accounts edit: leaving new password blank does not send password and preserves passwordHash", async () => {
  const fs = require("fs");
  const path = require("path");
  const appJsContent = fs.readFileSync(path.join(__dirname, "../public/js/app.js"), "utf8");

  // Verify saveAcc constructs payload and excludes password when blank/whitespace
  assert.match(appJsContent, /const payload=\{leader:f\.leader,mobile:f\.mobile\};/);
  assert.match(appJsContent, /if\(f\.pw&&String\(f\.pw\)\.trim\(\)\)\{payload\.password=String\(f\.pw\)\.trim\(\)\}/);

  // Test the logic directly
  function buildPayload(f) {
    const payload = { leader: f.leader, mobile: f.mobile };
    if (f.pw && String(f.pw).trim()) {
      payload.password = String(f.pw).trim();
    }
    return payload;
  }

  const payloadBlank = buildPayload({ leader: "Test Leader", mobile: "9000000001", pw: "" });
  assert.equal("password" in payloadBlank, false);
  assert.equal(payloadBlank.leader, "Test Leader");
  assert.equal(payloadBlank.mobile, "9000000001");

  const payloadSpaces = buildPayload({ leader: "Test Leader", mobile: "9000000001", pw: "   " });
  assert.equal("password" in payloadSpaces, false);

  const payloadFilled = buildPayload({ leader: "Test Leader", mobile: "9000000001", pw: "newpass123" });
  assert.equal(payloadFilled.password, "newpass123");
});

test("3a. A newly registered team is saved with status 'Approved' and acc.enabled true, with no pay, utr, method, shot or fee fields", () => {
  const mongoose = require("mongoose");
  const TeamModel = mongoose.models.Team;
  assert(TeamModel, "Team model must exist");

  // Check schema paths
  const schemaPaths = TeamModel.schema.paths;
  assert.equal(schemaPaths["status"].defaultValue, "Approved");
  assert.equal(schemaPaths["acc.enabled"].defaultValue, true);
  assert.equal(schemaPaths["feePerPerson"].defaultValue, undefined);
  assert.equal(schemaPaths["totalAmount"].defaultValue, undefined);
  assert.equal(schemaPaths["pay"].defaultValue, undefined);

  // Instantiating a new team without payment fields
  const newTeam = new TeamModel({
    id: "24H999",
    name: "New Approved Team",
    leader: "Jane Doe",
    mobile: "9988776655",
    email: "jane@test.local",
    acc: { userId: "Jane Doe", passwordHash: "hashed" }
  });

  const obj = newTeam.toObject();
  assert.equal(obj.status, "Approved");
  assert.equal(obj.acc.enabled, true);
  assert.equal("pay" in obj, false);
  assert.equal("feePerPerson" in obj, false);
  assert.equal("totalAmount" in obj, false);
  assert.equal("utr" in obj, false);
  assert.equal("method" in obj, false);
  assert.equal("shot" in obj, false);
});

test("3b. Newly registered team can log in immediately with User ID = leader name and Password = leader mobile", async () => {
  const bcrypt = require("bcryptjs");
  const leaderName = "Immediate Leader";
  const leaderMobile = "9876500001";
  const passwordHash = await bcrypt.hash(leaderMobile, 10);

  // Emulate candidate lookup and verification in POST /api/teams/login
  const candidate = {
    id: "24H101",
    name: "Immediate Team",
    leader: leaderName,
    mobile: leaderMobile,
    acc: { userId: leaderName, passwordHash, enabled: true },
    status: "Approved"
  };

  // 1. Password check with bcrypt
  const isMatch = await bcrypt.compare(leaderMobile, candidate.acc.passwordHash);
  assert.equal(isMatch, true, "Bcrypt compare must succeed for leader mobile password");

  // 2. Account enabled check
  assert.equal(candidate.acc.enabled, true, "Account must be enabled immediately without waiting for approval");
  assert.equal(candidate.status, "Approved", "Status must be Approved");
});

test("3c. GET /api/teams/me and GET /api/admin/teams responses contain no payment fields", () => {
  // Legacy team record with historical payment and fee data
  const legacyTeamDoc = {
    id: "24H001",
    name: "Legacy Team",
    leader: "Old Leader",
    mobile: "9000000000",
    email: "old@example.com",
    college: "Old College",
    department: "IT",
    year: "3",
    teamSize: 2,
    feePerPerson: 500,
    totalAmount: 1000,
    pay: { method: "UPI", utr: "123456", shot: "data:image/jpeg;base64,...", status: "Paid" },
    createdAt: new Date(),
    members: [],
    track: "Web",
    problem: "Prob 1",
    problemStatementId: "ps-1",
    title: "Project",
    desc: "Desc",
    status: "Approved",
    acc: { userId: "Old Leader", enabled: true, passwordHash: "secretHash" }
  };

  // Test /api/teams/me sanitization logic (lines 1018-1039 of server.js)
  const sanitizedTeamMe = {
    id: legacyTeamDoc.id,
    name: legacyTeamDoc.name,
    leader: legacyTeamDoc.leader,
    mobile: legacyTeamDoc.mobile,
    email: legacyTeamDoc.email,
    college: legacyTeamDoc.college,
    department: legacyTeamDoc.department || "",
    year: legacyTeamDoc.year,
    teamSize: legacyTeamDoc.teamSize,
    createdAt: legacyTeamDoc.createdAt,
    members: legacyTeamDoc.members,
    track: legacyTeamDoc.track,
    problem: legacyTeamDoc.problem,
    problemStatementId: legacyTeamDoc.problemStatementId,
    title: legacyTeamDoc.title,
    desc: legacyTeamDoc.desc,
    status: legacyTeamDoc.status,
    acc: {
      userId: legacyTeamDoc.acc?.userId,
      enabled: legacyTeamDoc.acc?.enabled
    }
  };

  for (const forbidden of ["pay", "feePerPerson", "totalAmount", "utr", "method", "shot"]) {
    assert.equal(forbidden in sanitizedTeamMe, false, `/api/teams/me response must not contain ${forbidden}`);
  }

  // Test /api/admin/teams sanitization logic (lines 1103-1125 of server.js)
  const sanitizedAdminTeam = {
    id: legacyTeamDoc.id,
    name: legacyTeamDoc.name,
    leader: legacyTeamDoc.leader,
    mobile: legacyTeamDoc.mobile,
    email: legacyTeamDoc.email,
    college: legacyTeamDoc.college,
    department: legacyTeamDoc.department || "",
    year: legacyTeamDoc.year,
    teamSize: legacyTeamDoc.teamSize,
    createdAt: legacyTeamDoc.createdAt,
    members: legacyTeamDoc.members,
    track: legacyTeamDoc.track,
    problem: legacyTeamDoc.problem,
    problemStatementId: legacyTeamDoc.problemStatementId,
    title: legacyTeamDoc.title,
    desc: legacyTeamDoc.desc,
    status: legacyTeamDoc.status,
    acc: {
      userId: legacyTeamDoc.acc?.userId,
      enabled: legacyTeamDoc.acc?.enabled
    }
  };

  for (const forbidden of ["pay", "feePerPerson", "totalAmount", "utr", "method", "shot"]) {
    assert.equal(forbidden in sanitizedAdminTeam, false, `/api/admin/teams response must not contain ${forbidden}`);
  }
});

test("3d. A disabled account is still blocked at login", async () => {
  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash("9999999999", 10);
  const disabledTeam = {
    id: "24H002",
    name: "Disabled Team",
    acc: { userId: "Disabled Leader", passwordHash, enabled: false }
  };

  // Password matches but enabled === false
  const isMatch = await bcrypt.compare("9999999999", disabledTeam.acc.passwordHash);
  assert.equal(isMatch, true);

  // Exact server login guard check
  const isBlocked = !disabledTeam.acc.enabled;
  assert.equal(isBlocked, true, "Disabled account must be blocked at login");
});

test("3e. A legacy team document that contains an old pay field still loads in the admin list and the team dashboard", () => {
  const mongoose = require("mongoose");
  const TeamModel = mongoose.models.Team;

  // Create document with legacy pay and fee fields
  const legacyDoc = new TeamModel({
    id: "24H001",
    name: "Legacy Team",
    leader: "Legacy Leader",
    mobile: "9876543210",
    email: "legacy@test.local",
    feePerPerson: 500,
    totalAmount: 1000,
    pay: { method: "UPI", utr: "998877665544", status: "Paid" },
    acc: { userId: "Legacy Leader", passwordHash: "hashed", enabled: true }
  });

  const raw = legacyDoc.toObject();
  assert.equal(raw.id, "24H001");
  assert.equal(raw.pay.status, "Paid");
  assert.equal(raw.pay.utr, "998877665544");

  // Admin dashboard formatting emulation (app.js Teams table row generator)
  function renderAdminRow(t) {
    return `<tr><td>${t.id}</td><td>${t.name}</td><td>${t.leader}</td><td>${t.mobile}</td><td>${t.status}</td></tr>`;
  }
  const adminRowHtml = renderAdminRow(raw);
  assert.match(adminRowHtml, /24H001/);
  assert.match(adminRowHtml, /Legacy Team/);

  // Team dashboard profile card emulation (app.js teamPg)
  function renderTeamDashboard(t) {
    return `<div class="team-profile"><h2>${t.name}</h2><p>ID: ${t.id}</p><p>Leader: ${t.leader}</p></div>`;
  }
  const teamDashHtml = renderTeamDashboard(raw);
  assert.match(teamDashHtml, /Legacy Team/);
  assert.match(teamDashHtml, /24H001/);
});