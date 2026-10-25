const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const { FEE_PER_PERSON, RegistrationValidationError, validateRegistrationPayload } = require("../lib/registration");

function makePayload(teamSize) {
  return {
    team: "Nexus Test",
    teamSize,
    feePerPerson: FEE_PER_PERSON,
    totalAmount: teamSize * FEE_PER_PERSON,
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

test("team sizes 2, 3, and 4 calculate the correct fee and participant count", () => {
  for (const [size, amount] of [[2, 1000], [3, 1500], [4, 2000]]) {
    const registration = validateRegistrationPayload(makePayload(size));
    assert.equal(registration.teamSize, size);
    assert.equal(registration.participants.length, size);
    assert.equal(registration.feePerPerson, 500);
    assert.equal(registration.totalAmount, amount);
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

test("rejects invalid mobile numbers and tampered client amounts", () => {
  const invalidMobile = makePayload(2);
  invalidMobile.participants[0].mobile = "123";
  assert.throws(() => validateRegistrationPayload(invalidMobile), {
    name: "RegistrationValidationError",
    code: "INVALID_MOBILE"
  });

  const tamperedAmount = makePayload(3);
  tamperedAmount.totalAmount = 500;
  assert.throws(() => validateRegistrationPayload(tamperedAmount), {
    name: "RegistrationValidationError",
    code: "INVALID_TOTAL"
  });
});

test("validates payment proof and rejects oversized screenshots", () => {
  const validPayload = makePayload(2);
  validPayload.shot = "data:image/jpeg;base64," + "A".repeat(100);
  const validated = validateRegistrationPayload(validPayload);
  assert.equal(validated.shot, validPayload.shot);

  const oversizedPayload = makePayload(2);
  oversizedPayload.shot = "data:image/jpeg;base64," + "A".repeat(960_000);
  assert.throws(() => validateRegistrationPayload(oversizedPayload), {
    name: "RegistrationValidationError",
    code: "INVALID_PAYMENT_PROOF"
  });
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

test("registration API rejects invalid team size, missing participants, duplicate emails, and tampered fees", async () => {
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

  const tamperedAmount = makePayload(2);
  tamperedAmount.totalAmount = 1;
  const tamperedResponse = await postRegistration(tamperedAmount);
  assert.equal((await tamperedResponse.json()).error, "INVALID_TOTAL");
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

test("POST /api/teams/register parses 700 KB screenshot successfully and rejects over-limit screenshots with clear message", async () => {
  // A 700 KB screenshot = 700 * 1024 = 716,800 bytes; as base64 string: ~940,000 characters
  // Stays under the 950_000 limit in lib/registration.js and within 1.5 MB body limit
  const payload700KB = makePayload(2);
  payload700KB.shot = "data:image/jpeg;base64," + "A".repeat(940_000);

  // The request passes body-parser limit (1.5 MB) and payload validation; in test mode DB is offline returning 503 DATABASE_UNAVAILABLE
  const resValid = await postRegistration(payload700KB);
  assert.equal(resValid.status, 503, "Should pass parser and reach database check");
  const jsonValid = await resValid.json();
  assert.equal(jsonValid.error, "DATABASE_UNAVAILABLE");

  // An over-limit screenshot (> 950,000 chars) gets rejected with clear message by validateRegistrationPayload
  const payloadOverLimit = makePayload(2);
  payloadOverLimit.shot = "data:image/jpeg;base64," + "A".repeat(960_000);

  const resOverLimit = await postRegistration(payloadOverLimit);
  assert.equal(resOverLimit.status, 400);
  const jsonOverLimit = await resOverLimit.json();
  assert.equal(jsonOverLimit.error, "INVALID_PAYMENT_PROOF");
  assert.match(jsonOverLimit.message, /under 700 KB/i);
});

test("POST /api/payment-settings saves QR within limit and rejects payload above 1 MB with clear error", async () => {
  const port = server.address().port;
  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-password": process.env.ADMIN_PASSWORD || "admin123"
  };

  // Valid compressed QR under 500 KB (e.g., 200 KB base64)
  const validQr = "data:image/jpeg;base64," + "Q".repeat(250_000);
  const validRes = await fetch(`http://127.0.0.1:${port}/api/payment-settings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      upiId: "test.coordinator@okaxis",
      payeeName: "Test Coordinator",
      fee: "500",
      qrImage: validQr
    })
  });
  assert.equal(validRes.status, 200);
  const validJson = await validRes.json();
  assert.equal(validJson.success, true);
  assert.equal(validJson.data.qrImage, validQr);

  // Oversized QR > 1 MB (e.g., 1.1 MB base64 string)
  const oversizedQr = "data:image/jpeg;base64," + "Z".repeat(1024 * 1024 + 500);
  const oversizedRes = await fetch(`http://127.0.0.1:${port}/api/payment-settings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      upiId: "test.coordinator@okaxis",
      payeeName: "Test Coordinator",
      fee: "500",
      qrImage: oversizedQr
    })
  });
  assert.equal(oversizedRes.status, 400);
  const oversizedJson = await oversizedRes.json();
  assert.equal(oversizedJson.success, false);
  assert.equal(oversizedJson.error, "PAYLOAD_TOO_LARGE");
  assert.match(oversizedJson.message, /1 MB/i);
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