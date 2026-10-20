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