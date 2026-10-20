
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validateRegistrationPayload, RegistrationValidationError } = require("./lib/registration");

const app = express();
const PORT = process.env.PORT || 3000;

// Simple cookie parser helper
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      const key = parts.shift().trim();
      const value = decodeURIComponent(parts.join("="));
      list[key] = value;
    });
  }
  return list;
}

// In-memory brute force rate limiter for sensitive auth endpoints
const loginAttempts = new Map(); // ip -> { count: number, resetAt: number }

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown_ip";
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record && record.resetAt > now) {
    if (record.count >= 5) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        error: "TOO_MANY_REQUESTS",
        message: `Too many login attempts. Please try again in ${waitSeconds} seconds.`
      });
    }
  } else {
    loginAttempts.set(ip, { count: 0, resetAt: now + 15 * 60 * 1000 }); // 15 min window
  }
  next();
}

function recordFailedLogin(req) {
  const ip = req.ip || req.connection.remoteAddress || "unknown_ip";
  const record = loginAttempts.get(ip);
  if (record) {
    record.count += 1;
  }
}

function clearLoginAttempts(req) {
  const ip = req.ip || req.connection.remoteAddress || "unknown_ip";
  loginAttempts.delete(ip);
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_TTL_SECONDS = 2 * 60 * 60; // 7200 seconds

// SHA-256 helper to ensure only hashed tokens are stored in the database
function hashSessionToken(token) {
  if (!token || typeof token !== "string") return "";
  return crypto.createHash("sha256").update(token).digest("hex");
}

app.use(cors({
  credentials: true,
  origin: true
}));
// Support JSON payloads including base64 QR images
app.use(express.json({ limit: "10mb" }));

// Serve static assets (css, js, assets, index.html) for local development
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Safe connection event listeners for diagnostics
mongoose.connection.on("connecting", () => {
  console.log("[MongoDB] State: Connecting to cluster...");
});
mongoose.connection.on("connected", () => {
  console.log("[MongoDB] State: Connected successfully.");
});
mongoose.connection.on("open", () => {
  console.log("[MongoDB] State: Connection open and ready.");
});
mongoose.connection.on("disconnected", () => {
  console.log("[MongoDB] State: Disconnected.");
});
mongoose.connection.on("error", (err) => {
  console.warn(`[MongoDB Error] ${err.name}: ${err.message}`);
});

let cachedDbPromise = null;

async function getDbConnection() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI_NOT_CONFIGURED");
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).then(m => {
      console.log("[MongoDB] mongoose.connect() resolved successfully.");
      return m.connection;
    }).catch(err => {
      cachedDbPromise = null;
      let detailedMsg = err.message;
      if (err.reason && err.reason.servers) {
        const serverErrors = [];
        for (const [srv, desc] of err.reason.servers.entries()) {
          if (desc.error) {
            serverErrors.push(`${srv} -> ${desc.error.message}`);
          }
        }
        if (serverErrors.length > 0) {
          detailedMsg += ` [Server handshake errors: ${serverErrors.join("; ")}]`;
        }
      }
      console.warn(`[MongoDB Connection Failed] ${err.name}: ${detailedMsg}`);
      throw err;
    });
  }
  return cachedDbPromise;
}

// Payment Settings Schema
const paymentSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "global_payment_settings" },
  upiId: { type: String, required: true, default: "suba.arni@okaxis" },
  payeeName: { type: String, required: true, default: "Banu Priya" },
  fee: { type: String, required: true, default: "500" },
  qrImage: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model("PaymentSettings", paymentSettingsSchema);

// Team Member Sub-schema
const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  mobile: { type: String, default: "", trim: true },
  college: { type: String, default: "", trim: true },
  department: { type: String, default: "", trim: true },
  year: { type: String, default: "1", trim: true }
}, { _id: false });

// Team Schema (Full MongoDB persistence for teams, accounts, projects, & payment reviews)
const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, // Format: 24H001
  name: { type: String, required: true, trim: true },
  leader: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  college: { type: String, default: "", trim: true },
  department: { type: String, default: "", trim: true },
  year: { type: String, default: "1", trim: true },
  teamSize: { type: Number, min: 1, max: 4, default: 4 },
  feePerPerson: { type: Number, default: 500 },
  totalAmount: { type: Number, default: 2000 },
  members: { type: [teamMemberSchema], default: [] },
  track: { type: String, default: "", trim: true },
  problem: { type: String, default: "", trim: true },
  problemStatementId: { type: String, default: "", trim: true },
  title: { type: String, default: "", trim: true },
  desc: { type: String, default: "", trim: true },
  pay: {
    method: { type: String, default: "UPI", trim: true },
    utr: { type: String, default: "", trim: true, index: true },
    shot: { type: String, default: "" }, // Safe base64 or storage url
    status: { type: String, enum: ["Pending", "Paid", "Rejected"], default: "Pending", index: true }
  },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  acc: {
    userId: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true }, // Salted bcrypt hash, NEVER plaintext
    enabled: { type: Boolean, default: false, index: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Composite/unique constraints
teamSchema.index({ email: 1 });
teamSchema.index({ "members.email": 1 });

const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

// MongoDB Session Schema for Serverless-compatible authentication
const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, enum: ["admin", "team"], index: true },
  teamId: { type: String, default: null, index: true },
  userId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// Configure MongoDB TTL index for automatic deletion of expired sessions.
// Note: Application code also checks expiresAt > Date.now() on every request so security does not depend on TTL run frequency.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

// Fallback in-memory store if MongoDB is offline or unreachable
let memoryPaymentSettings = {
  key: "global_payment_settings",
  upiId: "suba.arni@okaxis",
  payeeName: "Banu Priya",
  fee: "500",
  qrImage: "",
  updatedAt: new Date().toISOString()
};

// Server-side Admin Authentication & Session Management
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const IS_PROD = process.env.NODE_ENV === "production";

// Fail safely in production if ADMIN_PASSWORD is unset or trivial default
if (IS_PROD && (!ADMIN_PASSWORD || ADMIN_PASSWORD === "admin123" || ADMIN_PASSWORD.length < 8)) {
  console.error("CRITICAL SECURITY ERROR: ADMIN_PASSWORD environment variable must be set to a strong password in production. Terminating process.");
  process.exit(1);
}

const EFFECTIVE_ADMIN_PASSWORD = ADMIN_PASSWORD || "admin123";

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = crypto.createHash("sha256").update(a).digest();
  const bufB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

// Session-aware admin authentication middleware (backed by MongoDB Session collection)
async function authenticateAdmin(req, res, next) {
  try {
    // 1. Check HTTP-only session cookie
    const cookies = parseCookies(req);
    const sessionToken = cookies["admin_session"];
    if (sessionToken) {
      await getDbConnection();
      const tokenHash = hashSessionToken(sessionToken);
      const sessionDoc = await Session.findOne({ tokenHash, role: "admin" }).lean();
      if (sessionDoc) {
        // Enforce strict expiration in application code on every request
        if (new Date(sessionDoc.expiresAt).getTime() > Date.now()) {
          req.adminSession = sessionDoc;
          return next();
        } else {
          // Immediately purge expired session document
          await Session.deleteOne({ _id: sessionDoc._id }).catch(() => {});
        }
      }
    }

    // 2. Fallback to x-admin-password / Authorization header (or body adminPassword) for programmatic/API operations
    const authHeader = req.headers["x-admin-password"] || req.headers["authorization"];
    let providedPassword = "";

    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        providedPassword = authHeader.slice(7).trim();
      } else {
        providedPassword = String(authHeader).trim();
      }
    }

    if (!providedPassword && req.body && req.body.adminPassword) {
      providedPassword = String(req.body.adminPassword).trim();
    }

    if (providedPassword && safeCompare(providedPassword, EFFECTIVE_ADMIN_PASSWORD)) {
      return next();
    }

    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid or expired admin session. Please log in with valid credentials."
    });
  } catch (err) {
    console.error("Admin authentication middleware error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Error verifying admin authentication."
    });
  }
}

// POST /api/admin/login - Authenticate admin, issue secure HTTP-only cookie session stored in MongoDB
app.post("/api/admin/login", rateLimitLogin, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const cleanUser = String(username || "").trim();
    const cleanPass = String(password || "").trim();

    if (!cleanUser || !cleanPass) {
      recordFailedLogin(req);
      return res.status(400).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Username and password are required."
      });
    }

    if (cleanUser !== "admin" || !safeCompare(cleanPass, EFFECTIVE_ADMIN_PASSWORD)) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid admin username or password."
      });
    }

    // Success: clear rate limit counter and generate cryptographically secure token
    clearLoginAttempts(req);
    await getDbConnection();

    // Prevent session fixation: issue a completely fresh session token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await Session.create({
      tokenHash,
      role: "admin",
      userId: "admin",
      teamId: null,
      createdAt: new Date(),
      expiresAt
    });

    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    const cookieHeader = `admin_session=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Strict${isSecure ? "; Secure" : ""}`;
    res.setHeader("Set-Cookie", cookieHeader);

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful.",
      role: "admin",
      user: "admin",
      expiresIn: Math.floor(SESSION_TTL_MS / 1000)
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal server error occurred during login."
    });
  }
});

// POST /api/admin/verify - Verify admin password for sensitive operations
app.post("/api/admin/verify", rateLimitLogin, (req, res) => {
  try {
    const { password } = req.body || {};
    const cleanPass = String(password || "").trim();
    if (!cleanPass || !safeCompare(cleanPass, EFFECTIVE_ADMIN_PASSWORD)) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Incorrect admin password."
      });
    }
    clearLoginAttempts(req);
    return res.status(200).json({
      success: true,
      message: "Admin password verified."
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Error verifying admin password."
    });
  }
});

// GET /api/admin/me - Check current admin session status from MongoDB
app.get("/api/admin/me", async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies["admin_session"];
    if (token) {
      await getDbConnection();
      const tokenHash = hashSessionToken(token);
      const sessionDoc = await Session.findOne({ tokenHash, role: "admin" }).lean();
      if (sessionDoc) {
        if (new Date(sessionDoc.expiresAt).getTime() > Date.now()) {
          return res.status(200).json({
            success: true,
            authenticated: true,
            role: "admin",
            user: "admin"
          });
        } else {
          await Session.deleteOne({ _id: sessionDoc._id }).catch(() => {});
        }
      }
    }
    return res.status(200).json({
      success: true,
      authenticated: false
    });
  } catch (err) {
    console.error("Error in /api/admin/me:", err);
    return res.status(200).json({
      success: true,
      authenticated: false
    });
  }
});

// POST /api/admin/logout - Invalidate admin session in MongoDB & clear cookie
app.post("/api/admin/logout", async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies["admin_session"];
    if (token) {
      await getDbConnection();
      const tokenHash = hashSessionToken(token);
      await Session.deleteOne({ tokenHash, role: "admin" });
    }
  } catch (err) {
    console.warn("Notice: Session deletion on logout failed:", err.message);
  }
  res.setHeader("Set-Cookie", "admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict");
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully."
  });
});

// Team Authentication Middleware (backed by MongoDB Session collection)
async function authenticateTeam(req, res, next) {
  try {
    const cookies = parseCookies(req);
    const sessionToken = cookies["team_session"];
    let token = sessionToken;

    // Fallback to Bearer token or x-team-token
    if (!token) {
      const authHeader = req.headers["authorization"] || req.headers["x-team-token"];
      if (authHeader) {
        token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : String(authHeader).trim();
      }
    }

    if (token) {
      await getDbConnection();
      const tokenHash = hashSessionToken(token);
      const sessionDoc = await Session.findOne({ tokenHash, role: "team" }).lean();
      if (sessionDoc) {
        // Enforce strict expiration in application code on every request
        if (new Date(sessionDoc.expiresAt).getTime() > Date.now()) {
          req.teamSession = sessionDoc;
          return next();
        } else {
          await Session.deleteOne({ _id: sessionDoc._id }).catch(() => {});
        }
      }
    }

    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Please log in to access your team dashboard."
    });
  } catch (err) {
    console.error("Team authentication middleware error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Error verifying team authentication."
    });
  }
}

// Helper to generate next unique team ID
async function generateNextTeamId() {
  const latestTeam = await Team.findOne({ id: /^24H\d{3}$/ }).sort({ id: -1 }).lean();
  let nextNum = 1;
  if (latestTeam && latestTeam.id) {
    const match = latestTeam.id.match(/^24H(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  return "24H" + String(nextNum).padStart(3, "0");
}

// POST /api/teams/register - Public endpoint to register new team
app.post("/api/teams/register", rateLimitLogin, async (req, res) => {
  try {
    const registration = validateRegistrationPayload(req.body || {});
    const [leader, ...normMembers] = registration.participants;
    await getDbConnection();

    const participantEmails = registration.participants.map(participant => participant.email);
    const existingLeader = await Team.findOne({
      $or: [
        { email: { $in: participantEmails } },
        { "members.email": { $in: participantEmails } },
        { mobile: leader.mobile }
      ]
    }).lean();

    if (existingLeader) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_REGISTRATION",
        message: "A participant email or the team leader mobile is already registered."
      });
    }

    // Hash password with bcrypt (default password is leader mobile number)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(leader.mobile, saltRounds);
    const newTeamId = await generateNextTeamId();

    const createdTeam = await Team.create({
      id: newTeamId,
      name: registration.team,
      leader: leader.name,
      mobile: leader.mobile,
      email: leader.email,
      college: leader.college,
      department: leader.department,
      year: leader.year,
      teamSize: registration.teamSize,
      feePerPerson: registration.feePerPerson,
      totalAmount: registration.totalAmount,
      members: normMembers,
      track: "",
      problem: "",
      title: "",
      desc: "",
      pay: {
        method: registration.method,
        utr: registration.utr,
        shot: registration.shot,
        status: "Pending"
      },
      status: "Pending",
      acc: {
        userId: leader.name,
        passwordHash,
        enabled: false // Admin approval required
      }
    });

    return res.status(201).json({
      success: true,
      message: "Team registration successful! Please wait for admin approval.",
      data: {
        id: createdTeam.id,
        name: createdTeam.name,
        leader: createdTeam.leader,
        teamSize: createdTeam.teamSize,
        feePerPerson: createdTeam.feePerPerson,
        totalAmount: createdTeam.totalAmount,
        userId: createdTeam.acc.userId,
        status: createdTeam.status,
        payStatus: createdTeam.pay.status,
        createdAt: createdTeam.createdAt
      }
    });
  } catch (err) {
    if (err instanceof RegistrationValidationError) {
      return res.status(400).json({ success: false, error: err.code, message: err.message });
    }
    if (err.message === "MONGODB_URI_NOT_CONFIGURED" || /mongoose|mongo|database/i.test(err.name || "")) {
      return res.status(503).json({
        success: false,
        error: "DATABASE_UNAVAILABLE",
        message: "Registration could not be saved because the database is unavailable. Please try again later."
      });
    }
    console.error("Team registration error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal server error occurred while registering the team."
    });
  }
});

// POST /api/teams/login - Team login, verifies bcrypt password & issues secure session cookie
app.post("/api/teams/login", rateLimitLogin, async (req, res) => {
  try {
    await getDbConnection();
    const { username, password } = req.body || {};
    const cleanUser = String(username || "").trim();
    const cleanPass = String(password || "").trim();

    if (!cleanUser || !cleanPass) {
      recordFailedLogin(req);
      return res.status(400).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "User ID and password are required."
      });
    }

    // Find team by leader user ID or mobile (case insensitive user ID)
    const team = await Team.findOne({
      "acc.userId": new RegExp(`^${cleanUser.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    });

    if (!team) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid User ID or password."
      });
    }

    // Compare bcrypt password hash
    const isMatch = await bcrypt.compare(cleanPass, team.acc.passwordHash);
    if (!isMatch) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid User ID or password."
      });
    }

    if (!team.acc.enabled) {
      return res.status(403).json({
        success: false,
        error: "ACCOUNT_DISABLED",
        message: "Your team account is not enabled yet. Please wait for the admin to enable it."
      });
    }

    // Issue secure session cookie backed by MongoDB Session collection
    clearLoginAttempts(req);
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await Session.create({
      tokenHash,
      role: "team",
      teamId: team.id,
      userId: team.acc.userId,
      createdAt: new Date(),
      expiresAt
    });

    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    const cookieHeader = `team_session=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Strict${isSecure ? "; Secure" : ""}`;
    res.setHeader("Set-Cookie", cookieHeader);

    return res.status(200).json({
      success: true,
      message: "Team login successful.",
      role: "team",
      teamId: team.id,
      token
    });
  } catch (err) {
    console.error("Team login error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal server error occurred during team login."
    });
  }
});

// GET /api/teams/me - Retrieve authenticated team's own profile and project data (ID derived strictly from session)
app.get("/api/teams/me", authenticateTeam, async (req, res) => {
  try {
    await getDbConnection();
    const teamId = req.teamSession.teamId;
    const team = await Team.findOne({ id: teamId }).lean();
    if (!team) {
      return res.status(404).json({ success: false, error: "TEAM_NOT_FOUND", message: "Team record not found." });
    }

    // Return sanitized team object (never expose passwordHash or other teams' data)
    return res.status(200).json({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        leader: team.leader,
        mobile: team.mobile,
        email: team.email,
        college: team.college,
        department: team.department || "",
        year: team.year,
        teamSize: team.teamSize || (1 + (team.members || []).length),
        feePerPerson: team.feePerPerson || 500,
        totalAmount: team.totalAmount || (team.teamSize || (1 + (team.members || []).length)) * 500,
        createdAt: team.createdAt,
        members: team.members,
        track: team.track,
        problem: team.problem,
        problemStatementId: team.problemStatementId,
        title: team.title,
        desc: team.desc,
        pay: {
          method: team.pay?.method || "UPI",
          utr: team.pay?.utr || "",
          status: team.pay?.status || "Pending",
          hasProof: Boolean(team.pay?.shot)
        },
        status: team.status,
        acc: {
          userId: team.acc?.userId,
          enabled: team.acc?.enabled
        }
      }
    });
  } catch (err) {
    console.error("Error retrieving team profile:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to retrieve team dashboard." });
  }
});

// PUT /api/teams/track-selection - Team selects their track and problem statement (strictly for own team)
app.put("/api/teams/track-selection", authenticateTeam, async (req, res) => {
  try {
    await getDbConnection();
    const teamId = req.teamSession.teamId;
    const { track, problem, problemStatementId } = req.body || {};

    const updated = await Team.findOneAndUpdate(
      { id: teamId },
      {
        track: String(track || "").trim(),
        problem: String(problem || "").trim(),
        problemStatementId: String(problemStatementId || "").trim(),
        updatedAt: new Date()
      },
      { returnDocument: "after" }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Track and problem statement saved.",
      data: {
        track: updated.track,
        problem: updated.problem,
        problemStatementId: updated.problemStatementId
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to save track selection." });
  }
});

// POST /api/teams/logout - Invalidate team session in MongoDB & clear cookie
app.post("/api/teams/logout", async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies["team_session"];
    if (token) {
      await getDbConnection();
      const tokenHash = hashSessionToken(token);
      await Session.deleteOne({ tokenHash, role: "team" });
    }
  } catch (err) {
    console.warn("Notice: Session deletion on team logout failed:", err.message);
  }
  res.setHeader("Set-Cookie", "team_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict");
  return res.status(200).json({ success: true, message: "Team logged out successfully." });
});

// ADMIN TEAM MANAGEMENT ENDPOINTS (Strictly protected by authenticateAdmin)

// GET /api/admin/teams - List all teams for Admin Dashboard
app.get("/api/admin/teams", authenticateAdmin, async (req, res) => {
  try {
    await getDbConnection();
    const teams = await Team.find({}).sort({ id: 1 }).lean();
    const sanitizedTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      leader: t.leader,
      mobile: t.mobile,
      email: t.email,
      college: t.college,
      department: t.department || "",
      year: t.year,
      teamSize: t.teamSize || (1 + (t.members || []).length),
      feePerPerson: t.feePerPerson || 500,
      totalAmount: t.totalAmount || (t.teamSize || (1 + (t.members || []).length)) * 500,
      createdAt: t.createdAt,
      members: t.members,
      track: t.track,
      problem: t.problem,
      problemStatementId: t.problemStatementId,
      title: t.title,
      desc: t.desc,
      pay: {
        method: t.pay?.method || "UPI",
        utr: t.pay?.utr || "",
        status: t.pay?.status || "Pending",
        shot: t.pay?.shot || ""
      },
      status: t.status,
      acc: {
        userId: t.acc?.userId,
        enabled: t.acc?.enabled
      }
    }));

    return res.status(200).json({ success: true, data: sanitizedTeams });
  } catch (err) {
    console.error("Admin list teams error:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to load teams." });
  }
});

// PUT /api/admin/teams/:id - Admin update team details, payment status, registration approval
app.put("/api/admin/teams/:id", authenticateAdmin, async (req, res) => {
  try {
    await getDbConnection();
    const targetId = req.params.id;
    const { name, leader, mobile, email, college, department, year, track, problem, title, desc, ps, st, utr, members, enabled, password } = req.body || {};

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = String(name).trim();
    if (leader !== undefined) updateFields.leader = String(leader).trim();
    if (mobile !== undefined) updateFields.mobile = String(mobile).trim();
    if (email !== undefined) updateFields.email = String(email).trim().toLowerCase();
    if (college !== undefined) updateFields.college = String(college).trim();
    if (department !== undefined) updateFields.department = String(department).trim();
    if (year !== undefined) updateFields.year = String(year).trim();
    if (track !== undefined) updateFields.track = String(track).trim();
    if (problem !== undefined) updateFields.problem = String(problem).trim();
    if (title !== undefined) updateFields.title = String(title).trim();
    if (desc !== undefined) updateFields.desc = String(desc).trim();
    if (ps !== undefined) updateFields["pay.status"] = ps;
    if (utr !== undefined) updateFields["pay.utr"] = String(utr).trim();
    if (st !== undefined) updateFields.status = st;
    if (enabled !== undefined) updateFields["acc.enabled"] = Boolean(enabled);
    if (Array.isArray(members)) updateFields.members = members;

    if (password && String(password).trim()) {
      updateFields["acc.passwordHash"] = await bcrypt.hash(String(password).trim(), 10);
    }

    const updated = await Team.findOneAndUpdate({ id: targetId }, { $set: updateFields }, { returnDocument: "after" }).lean();
    if (!updated) {
      return res.status(404).json({ success: false, error: "TEAM_NOT_FOUND", message: "Team not found." });
    }

    return res.status(200).json({ success: true, message: "Team updated successfully.", data: updated });
  } catch (err) {
    console.error("Admin update team error:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to update team." });
  }
});

// DELETE /api/admin/teams/:id - Admin delete team
app.delete("/api/admin/teams/:id", authenticateAdmin, async (req, res) => {
  try {
    await getDbConnection();
    const targetId = req.params.id;
    const deleted = await Team.findOneAndDelete({ id: targetId });
    if (!deleted) {
      return res.status(404).json({ success: false, error: "TEAM_NOT_FOUND", message: "Team not found." });
    }
    return res.status(200).json({ success: true, message: `Team ${targetId} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to delete team." });
  }
});

// POST /api/admin/teams/migrate - Safe legacy import endpoint to migrate teams from localStorage to MongoDB
app.post("/api/admin/teams/migrate", authenticateAdmin, async (req, res) => {
  try {
    await getDbConnection();
    const { teams } = req.body || {};
    if (!Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ success: false, error: "NO_TEAMS", message: "No teams provided for migration." });
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const t of teams) {
      if (!t.id || !t.leader) {
        skippedCount++;
        continue;
      }
      const existing = await Team.findOne({ id: t.id }).lean();
      if (existing) {
        skippedCount++;
        continue;
      }

      // Hash password (mobile or t.acc.password)
      const rawPw = t.acc?.password || t.mobile || "1234567890";
      const passwordHash = await bcrypt.hash(String(rawPw), 10);

      await Team.create({
        id: t.id,
        name: t.name || "Team " + t.id,
        leader: t.leader,
        mobile: t.mobile || "",
        email: (t.email || "").toLowerCase(),
        college: t.college || "",
        year: t.year || "1",
        members: Array.isArray(t.members) ? t.members : [],
        track: t.track || "",
        problem: t.problem || "",
        problemStatementId: t.problemStatementId || "",
        title: t.title || "",
        desc: t.desc || "",
        pay: {
          method: t.pay?.method || "UPI",
          utr: t.pay?.utr || "",
          shot: t.pay?.shot || "",
          status: t.pay?.status || "Pending"
        },
        status: t.status || "Pending",
        acc: {
          userId: t.acc?.userId || t.leader,
          passwordHash,
          enabled: Boolean(t.acc?.enabled)
        }
      });
      importedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Migration completed: ${importedCount} teams imported to MongoDB, ${skippedCount} skipped (already present or invalid).`,
      importedCount,
      skippedCount
    });
  } catch (err) {
    console.error("Migration error:", err);
    return res.status(500).json({ success: false, error: "MIGRATION_ERROR", message: err.message });
  }
});

// GET /api/payment-settings - Public endpoint to retrieve active payment configuration
app.get("/api/payment-settings", async (req, res) => {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();
        let doc = await PaymentSettings.findOne({ key: "global_payment_settings" }).lean();
        if (!doc) {
          doc = await PaymentSettings.create(memoryPaymentSettings);
        }
        return res.status(200).json({
          success: true,
          source: "database",
          data: {
            upiId: doc.upiId,
            payeeName: doc.payeeName,
            fee: doc.fee,
            qrImage: doc.qrImage || "",
            updatedAt: doc.updatedAt
          }
        });
      } catch (dbErr) {
        console.warn("MongoDB unavailable in /api/payment-settings, using fallback store:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source: "fallback",
      data: {
        upiId: memoryPaymentSettings.upiId,
        payeeName: memoryPaymentSettings.payeeName,
        fee: memoryPaymentSettings.fee,
        qrImage: memoryPaymentSettings.qrImage || "",
        updatedAt: memoryPaymentSettings.updatedAt
      }
    });
  } catch (err) {
    console.error("Error in /api/payment-settings:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to retrieve payment settings."
    });
  }
});

// POST /api/payment-settings - Protected endpoint to update active payment configuration
app.post("/api/payment-settings", authenticateAdmin, async (req, res) => {
  try {
    const { upiId, payeeName, fee, qrImage } = req.body;

    // Backend Validation: UPI ID
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiId || !upiRegex.test(String(upiId).trim())) {
      return res.status(400).json({
        success: false,
        error: "INVALID_UPI_ID",
        message: "Invalid UPI ID format. Expected format: name@bank"
      });
    }

    // Backend Validation: Payee Name
    const cleanPayee = String(payeeName || "").trim();
    if (!cleanPayee || cleanPayee.length < 2 || cleanPayee.length > 80) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PAYEE_NAME",
        message: "Payee Name must be between 2 and 80 characters."
      });
    }

    // Backend Validation: Fee Amount
    const cleanFee = String(fee || "").trim();
    const numFee = Number(cleanFee);
    if (!cleanFee || isNaN(numFee) || numFee <= 0 || !/^\d+(\.\d{1,2})?$/.test(cleanFee)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_FEE_AMOUNT",
        message: "Fee must be a valid positive number with up to 2 decimal places."
      });
    }
    const formattedFee = (Math.round(numFee * 100) / 100).toFixed(cleanFee.includes(".") ? 2 : 0);

    const updatePayload = {
      upiId: String(upiId).trim(),
      payeeName: cleanPayee,
      fee: formattedFee,
      qrImage: typeof qrImage === "string" ? qrImage : (memoryPaymentSettings.qrImage || ""),
      updatedAt: new Date()
    };

    let savedToDb = false;
    let dbErrorMessage = null;

    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();
        const updated = await PaymentSettings.findOneAndUpdate(
          { key: "global_payment_settings" },
          updatePayload,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        ).lean();

        savedToDb = true;
        Object.assign(memoryPaymentSettings, updatePayload);

        return res.status(200).json({
          success: true,
          database: "connected",
          message: "Payment settings saved to MongoDB successfully.",
          data: {
            upiId: updated.upiId,
            payeeName: updated.payeeName,
            fee: updated.fee,
            qrImage: updated.qrImage || "",
            updatedAt: updated.updatedAt
          }
        });
      } catch (dbErr) {
        dbErrorMessage = dbErr.name === "MongooseServerSelectionError"
          ? "Database unreachable (check Atlas IP access list or network connection)"
          : dbErr.message;
        console.warn("MongoDB write failed, reporting failure:", dbErrorMessage);
      }
    }

    // If MongoDB was configured but unreachable, report connection failure
    if (process.env.MONGODB_URI && !savedToDb) {
      return res.status(503).json({
        success: false,
        database: "disconnected",
        error: "DATABASE_UNAVAILABLE",
        message: dbErrorMessage || "MongoDB database is currently unreachable. Settings could not be persisted to the database."
      });
    }

    // If no MONGODB_URI configured at all, fallback to local memory
    Object.assign(memoryPaymentSettings, updatePayload);
    return res.status(200).json({
      success: true,
      database: "none",
      message: "Payment settings saved to backend memory (MONGODB_URI not set).",
      data: memoryPaymentSettings
    });

  } catch (err) {
    console.error("Error updating payment settings:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Internal server error updating payment settings."
    });
  }
});

app.get("/api/health", async (req, res) => {
  const timestamp = new Date().toISOString();

  if (!process.env.MONGODB_URI) {
    return res.status(503).json({
      status: "degraded",
      api: "ok",
      database: "disconnected",
      message: "MONGODB_URI environment variable is not configured",
      timestamp
    });
  }

  try {
    await getDbConnection();
    return res.status(200).json({
      status: "healthy",
      api: "ok",
      database: "connected",
      message: "26hrs Hackathon API and database are operational",
      timestamp
    });
  } catch (error) {
    const isWhitelistOrNetwork = error.name === "MongooseServerSelectionError";
    const safeReason = isWhitelistOrNetwork
      ? "Database unreachable (check Atlas IP access list or network connection)"
      : "Database connection failed";

    return res.status(503).json({
      status: "degraded",
      api: "ok",
      database: "disconnected",
      message: safeReason,
      timestamp
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
