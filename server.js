
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validateRegistrationPayload, RegistrationValidationError } = require("./lib/registration");

const app = express();
app.set("trust proxy", 1);
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

// In-memory fallback map for rate limiting when DB connection is offline
const memoryLoginAttempts = new Map();

// Rate limiting helper using MongoDB collection with TTL (keyed by IP + username)
function getRateLimitKey(req) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "unknown_ip";
  const user = String(req.body?.username || req.body?.u || "").trim().toLowerCase();
  return `${ip}:${user || "anon"}`;
}

async function rateLimitLogin(req, res, next) {
  const key = getRateLimitKey(req);
  const now = Date.now();

  if (process.env.MONGODB_URI) {
    try {
      await getDbConnection();
      const doc = await LoginAttempt.findOne({ key }).lean();
      if (doc && new Date(doc.resetAt).getTime() > now) {
        if (doc.count >= 5) {
          const waitSeconds = Math.max(1, Math.ceil((new Date(doc.resetAt).getTime() - now) / 1000));
          return res.status(429).json({
            success: false,
            error: "TOO_MANY_REQUESTS",
            message: `Too many login attempts. Please try again in ${waitSeconds} seconds.`
          });
        }
      }
      return next();
    } catch (_err) {
      // Fall through to in-memory check
    }
  }

  const memDoc = memoryLoginAttempts.get(key);
  if (memDoc && memDoc.resetAt > now) {
    if (memDoc.count >= 5) {
      const waitSeconds = Math.max(1, Math.ceil((memDoc.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        error: "TOO_MANY_REQUESTS",
        message: `Too many login attempts. Please try again in ${waitSeconds} seconds.`
      });
    }
  }

  next();
}

async function recordFailedLogin(req) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const resetAt = new Date(now + 15 * 60 * 1000);

  if (process.env.MONGODB_URI) {
    try {
      await getDbConnection();
      await LoginAttempt.findOneAndUpdate(
        { key },
        {
          $inc: { count: 1 },
          $setOnInsert: { resetAt }
        },
        { upsert: true }
      );
    } catch (_err) {}
  }

  const memDoc = memoryLoginAttempts.get(key);
  if (memDoc && memDoc.resetAt > now) {
    memDoc.count += 1;
  } else {
    memoryLoginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
}

async function clearLoginAttempts(req) {
  const key = getRateLimitKey(req);
  if (process.env.MONGODB_URI) {
    try {
      await getDbConnection();
      await LoginAttempt.deleteOne({ key });
    } catch (_err) {}
  }
  memoryLoginAttempts.delete(key);
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
// Support JSON payloads with route-level body limits:
// - POST /api/teams/register: 100 KB limit
// - PUT /api/admin/problem-file/:id: 3.5 MB limit (accommodates up to 2 MB binary files = ~2.7 MB base64)
// - All other routes: 1 MB default
const defaultJsonParser = express.json({ limit: "1mb" });
const registerJsonParser = express.json({ limit: "100kb" });
const problemFileJsonParser = express.json({ limit: "3.5mb" });

app.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/api/teams/register") {
    return registerJsonParser(req, res, next);
  }
  if (req.method === "PUT" && req.path.startsWith("/api/admin/problem-file/")) {
    return problemFileJsonParser(req, res, next);
  }
  return defaultJsonParser(req, res, next);
});

// Convert body-parser 413 Payload Too Large error into 400 PAYLOAD_TOO_LARGE JSON response
app.use((err, req, res, next) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    let limitMsg = "Request payload exceeds the maximum allowed size of 1 MB.";
    if (req.path === "/api/teams/register") {
      limitMsg = "Registration payload exceeds the maximum allowed size of 100 KB.";
    } else if (req.path.startsWith("/api/admin/problem-file/")) {
      limitMsg = "Problem statement file payload exceeds the maximum allowed size of 3 MB.";
    }
    return res.status(400).json({
      success: false,
      error: "PAYLOAD_TOO_LARGE",
      message: limitMsg
    });
  }
  return next(err);
});

// Serve static assets (css, js, assets, index.html) for local development
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const DB_RETRY_COOLDOWN_MS = 5000;
let cachedDbPromise = null;
let nextDbRetryAt = 0;

function isDatabaseUnavailable(err) {
  return err?.code === "MONGODB_URI_NOT_CONFIGURED"
    || err?.code === "DATABASE_UNAVAILABLE"
    || ["DatabaseUnavailableError", "MongooseServerSelectionError", "MongoServerSelectionError", "MongoNetworkError", "MongoNetworkTimeoutError", "MongoTopologyClosedError"].includes(err?.name);
}

function databaseUnavailableResponse(res, message = "The database is temporarily unavailable. Please try again later.") {
  return res.status(503).json({
    success: false,
    error: "DATABASE_UNAVAILABLE",
    message
  });
}

// Safe connection event listeners for diagnostics
mongoose.connection.on("connecting", () => {
  console.log("[MongoDB] State: Connecting to cluster...");
});
mongoose.connection.on("connected", () => {
  nextDbRetryAt = 0;
  console.log("[MongoDB] State: Connected successfully.");
});
mongoose.connection.on("open", () => {
  console.log("[MongoDB] State: Connection open and ready.");
});
mongoose.connection.on("disconnected", () => {
  cachedDbPromise = null;
  nextDbRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
  console.log("[MongoDB] State: Disconnected.");
});
mongoose.connection.on("error", (err) => {
  console.warn(`[MongoDB Error] ${err.name}${err.code ? ` (${err.code})` : ""}`);
});

async function getDbConnection() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGODB_URI) {
    const err = new Error("MONGODB_URI_NOT_CONFIGURED");
    err.code = "MONGODB_URI_NOT_CONFIGURED";
    throw err;
  }
  if (cachedDbPromise) {
    return cachedDbPromise;
  }
  if (Date.now() < nextDbRetryAt) {
    const err = new Error("Database retry is temporarily delayed after a connection failure.");
    err.name = "DatabaseUnavailableError";
    err.code = "DATABASE_UNAVAILABLE";
    throw err;
  }

  const connectionAttempt = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).then(m => {
      console.log("[MongoDB] mongoose.connect() resolved successfully.");
      return m.connection;
    }).catch(err => {
      if (cachedDbPromise === connectionAttempt) {
        cachedDbPromise = null;
        nextDbRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
      }
      console.warn(`[MongoDB Connection Failed] ${err.name}${err.code ? ` (${err.code})` : ""}`);
      throw err;
    });
  cachedDbPromise = connectionAttempt;
  return cachedDbPromise;
}

// Event Data Schema (Single Document "global_event" for event info, timeline, rules, prizes, judges, FAQ, tracks, files, announcements)
const eventDataSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "global_event" },
  event: {
    title: { type: String, default: "" },
    about: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    venue: { type: String, default: "" },
    contact: { type: String, default: "" }
  },
  timeline: { type: [{ t: String, d: String }], default: [] },
  rules: { type: [{ t: String, d: String }], default: [] },
  prizes: { type: [{ t: String, d: String }], default: [] },
  judges: { type: [{ t: String, d: String, img: { type: String, default: "" } }], default: [] },
  faq: { type: [{ t: String, d: String }], default: [] },
  tracks: { type: [{ name: String, problems: [String] }], default: [] },
  problemStatementFiles: {
    type: [{
      id: String,
      track: String,
      title: String,
      description: String,
      fileName: String,
      fileType: String,
      uploadDate: String,
      active: { type: Boolean, default: true }
    }],
    default: []
  },
  announcements: { type: [{ t: String, d: String }], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

const EventData = mongoose.models.EventData || mongoose.model("EventData", eventDataSchema);

// ProblemFile Schema (Separate collection for storing large base64 file payloads, max 2MB)
const problemFileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  fileData: { type: String, required: true },
  fileName: { type: String, default: "" },
  fileType: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

const ProblemFile = mongoose.models.ProblemFile || mongoose.model("ProblemFile", problemFileSchema);

// Team Member Sub-schema
const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  mobile: { type: String, default: "", trim: true },
  college: { type: String, default: "", trim: true },
  department: { type: String, default: "", trim: true },
  year: { type: String, default: "1", trim: true }
}, { _id: false });

// Team Schema (Full MongoDB persistence for teams, accounts, and projects)
const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, // Format: 24H001
  name: { type: String, required: true, trim: true },
  leader: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  college: { type: String, default: "", trim: true },
  department: { type: String, default: "", trim: true },
  year: { type: String, default: "1", trim: true },
  teamSize: { type: Number, min: 1, max: 4, default: 4 },
  feePerPerson: { type: Number, required: false },
  totalAmount: { type: Number, required: false },
  members: { type: [teamMemberSchema], default: [] },
  track: { type: String, default: "", trim: true },
  problem: { type: String, default: "", trim: true },
  problemStatementId: { type: String, default: "", trim: true },
  title: { type: String, default: "", trim: true },
  desc: { type: String, default: "", trim: true },
  pay: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Approved", index: true },
  acc: {
    userId: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true }, // Salted bcrypt hash, NEVER plaintext
    enabled: { type: Boolean, default: true, index: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Composite/unique constraints
teamSchema.index({ email: 1 }, { unique: true });
teamSchema.index({ mobile: 1 }, { unique: true });
teamSchema.index({ "members.email": 1 });

const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

// MongoDB LoginAttempt Schema for distributed, serverless rate limiting
const loginAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true }, // Format: ip:username
  count: { type: Number, default: 1 },
  resetAt: { type: Date, required: true }
});
loginAttemptSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", loginAttemptSchema);

// Counter Schema for atomic, sequence-based Team ID generation
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

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
let memoryEventData = {
  key: "global_event",
  event: {
    title: "26 HRS HACKATHON – NEXUS",
    about: "26 HRS HACKATHON – NEXUS is an intensive technical hackathon organized by Excel Engineering College (Autonomous), Department of Information Technology in association with Binary Brains – Domain Club, in collaboration with United Soft Tech, Salem. Open for students across all years to build innovative technological solutions.",
    date: "2026-10-30",
    time: "10:00 AM (Start: Oct 30, 10:00 AM · End: Oct 31, 1:00 PM)",
    venue: "IT Lab, B Block, Excel Engineering College (Autonomous), Komarapalayam",
    contact: "Coordinators: Mrs. Banupriya (AP/IT) · Mrs. Divya K. (AP/IT) | Excel Engineering College (Autonomous), Komarapalayam – 637303, Namakkal District"
  },
  timeline: [
    { t: "Day 1 – 10:00 AM (Oct 30)", d: "Inauguration & Hackathon Commencement at IT Lab, B Block" },
    { t: "Day 1 – 01:00 PM", d: "Lunch Break" },
    { t: "Day 1 – 04:30 PM", d: "Refreshment / Tea & Snacks" },
    { t: "Day 1 – 07:00 PM", d: "Mentoring & First Review by Industry Experts" },
    { t: "Day 2 – 08:30 AM (Oct 31)", d: "Breakfast & Final Sprint" },
    { t: "Day 2 – 11:30 AM", d: "Final Project Presentation & Evaluation" },
    { t: "Day 2 – 01:00 PM (Oct 31)", d: "Valedictory Ceremony & Prize Distribution" }
  ],
  rules: [
    { t: "Eligibility & Team Size", d: "Open to students of all years. Each team must consist of 2 to 4 members, including 1 Team Leader." },
    { t: "Hackathon Duration", d: "Continuous 26-hour hackathon starting October 30, 2026 at 10:00 AM and concluding October 31, 2026 at 1:00 PM." },
    { t: "Venue & Conduct", d: "The event will be held physically at IT Lab, B Block. Participants must maintain academic integrity and professional conduct." },
    { t: "Evaluation Criteria", d: "Projects are evaluated by industry experts on innovation, technical implementation, feasibility, presentation, and team collaboration." }
  ],
  prizes: [
    { t: "Total Cash Prize Pool", d: "₹10,000 for top performing teams" },
    { t: "Excellence Awards", d: "Certificates of Merit & Trophy for Winners" },
    { t: "Participation Certificate", d: "Official Certificate of Participation for all registered team members" }
  ],
  judges: [
    { t: "Mr. S. Alagappandi", d: "Team Lead – United Soft Tech, Salem" },
    { t: "Mr. G. Mohanraj", d: "Circuit Division – United Soft Tech, Salem" },
    { t: "Mr. A. Karthick", d: "Graphic Designer – United Soft Tech, Salem" }
  ],
  faq: [
    { t: "Who can participate in 26 HRS HACKATHON – NEXUS?", d: "Students from all years across engineering and technology disciplines are eligible to participate." },
    { t: "What is the required team size?", d: "Each team must have 2 to 4 members, including the Team Leader." },
    { t: "Where will the hackathon take place?", d: "The event will be conducted at IT Lab, B Block, Excel Engineering College (Autonomous), Komarapalayam." },
    { t: "When does the event start and end?", d: "It begins on October 30, 2026 at 10:00 AM IST and concludes on October 31, 2026 at 1:00 PM IST (26 hours duration)." },
    { t: "Who are the event coordinators?", d: "Faculty Coordinators: Mrs. Banupriya (AP/IT) and Mrs. Divya K. (AP/IT), Department of Information Technology." }
  ],
  tracks: [],
  problemStatementFiles: [],
  announcements: [],
  updatedAt: new Date().toISOString()
};

// Server-side Admin Authentication & Session Management
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const IS_PROD = process.env.NODE_ENV === "production";

// Middleware to ensure critical environment variables are configured
function checkRequiredConfig(req, res, next) {
  // Allow health endpoint to report status independently
  if (req.path === "/api/health") {
    return next();
  }

  const isProd = process.env.NODE_ENV === "production";
  const adminPass = process.env.ADMIN_PASSWORD;

  // In production or admin login/verify requests, ensure ADMIN_PASSWORD is set and strong
  if ((isProd || req.path.startsWith("/api/admin")) && (!adminPass || adminPass.trim().length < 8)) {
    return res.status(500).json({
      success: false,
      error: "CONFIGURATION_ERROR",
      message: "Server configuration error: ADMIN_PASSWORD environment variable must be set to at least 8 characters. Please configure it in your Vercel Project Settings."
    });
  }

  // If in production and MONGODB_URI is completely missing
  if (isProd && !process.env.MONGODB_URI) {
    return res.status(503).json({
      success: false,
      error: "CONFIGURATION_ERROR",
      message: "Server configuration error: MONGODB_URI environment variable is missing. Please configure it in your Vercel Project Settings."
    });
  }

  next();
}

app.use(checkRequiredConfig);

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
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Admin authentication is temporarily unavailable because the database cannot be reached.");
    }
    console.error("Admin authentication middleware error:", err.name);
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
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Admin login is temporarily unavailable because the database cannot be reached.");
    }
    console.error("Admin login error:", err.name);
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
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Admin session verification is temporarily unavailable because the database cannot be reached.");
    }
    console.error("Error in /api/admin/me:", err.name);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to verify the admin session." });
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
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Team authentication is temporarily unavailable because the database cannot be reached.");
    }
    console.error("Team authentication middleware error:", err.name);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Error verifying team authentication."
    });
  }
}

// Helper to generate next unique team ID backed by an atomic Counter collection
async function generateNextTeamId() {
  // If database is available, atomically increment the counter
  if (mongoose.connection.readyState === 1 || process.env.MONGODB_URI) {
    try {
      await getDbConnection();
      // Ensure counter starts at current max team ID if counter not initialized
      const existingCounter = await Counter.findById("team_id");
      if (!existingCounter) {
        const latestTeam = await Team.findOne({ id: /^24H\d{3,}$/ }).sort({ id: -1 }).lean();
        let maxNum = 0;
        if (latestTeam && latestTeam.id) {
          const match = latestTeam.id.match(/^24H(\d+)$/);
          if (match) maxNum = parseInt(match[1], 10);
        }
        await Counter.findByIdAndUpdate(
          "team_id",
          { $max: { seq: maxNum } },
          { upsert: true, returnDocument: "after" }
        );
      }

      const counter = await Counter.findByIdAndUpdate(
        "team_id",
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
      );
      return "24H" + String(counter.seq).padStart(3, "0");
    } catch (_err) {
      // Fallback to highest team ID scan if counter update encounters issue
    }
  }

  const latestTeam = await Team.findOne({ id: /^24H\d{3,}$/ }).sort({ id: -1 }).lean();
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

    // 1. Check duplicate team name (case-insensitive)
    const escapedTeamName = registration.team.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingName = await Team.findOne({
      name: new RegExp(`^${escapedTeamName}$`, "i")
    }).lean();
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_TEAM_NAME",
        message: "This team name is already taken. Please choose a different team name."
      });
    }

    // 2. Check duplicate leader mobile
    const existingMobile = await Team.findOne({ mobile: leader.mobile }).lean();
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_MOBILE",
        message: "The team leader mobile number is already registered with another team."
      });
    }

    // 3. Check duplicate emails across leader and all members
    const participantEmails = registration.participants.map(participant => participant.email.toLowerCase());
    const existingEmail = await Team.findOne({
      $or: [
        { email: { $in: participantEmails } },
        { "members.email": { $in: participantEmails } }
      ]
    }).lean();
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_EMAIL",
        message: "One or more participant email addresses are already registered."
      });
    }

    // Hash password with bcrypt (default password is leader mobile number)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(leader.mobile, saltRounds);

    let createdTeam = null;
    let attempts = 0;
    while (!createdTeam && attempts < 5) {
      attempts++;
      const newTeamId = await generateNextTeamId();
      try {
        createdTeam = await Team.create({
          id: newTeamId,
          name: registration.team,
          leader: leader.name,
          mobile: leader.mobile,
          email: leader.email,
          college: leader.college,
          department: leader.department,
          year: leader.year,
          teamSize: registration.teamSize,
          members: normMembers,
          track: "",
          problem: "",
          title: "",
          desc: "",
          status: "Approved",
          acc: {
            userId: leader.name,
            passwordHash,
            enabled: true
          }
        });
      } catch (createErr) {
        if (createErr.code === 11000 && createErr.keyPattern?.id && attempts < 5) {
          // Collision on team ID, retry with next incremented counter
          continue;
        }
        if (createErr.code === 11000) {
          if (createErr.keyPattern?.name) {
            return res.status(400).json({ success: false, error: "DUPLICATE_TEAM_NAME", message: "This team name is already taken. Please choose a different team name." });
          }
          if (createErr.keyPattern?.mobile) {
            return res.status(400).json({ success: false, error: "DUPLICATE_MOBILE", message: "The team leader mobile number is already registered with another team." });
          }
          if (createErr.keyPattern?.email || createErr.keyPattern?.["members.email"]) {
            return res.status(400).json({ success: false, error: "DUPLICATE_EMAIL", message: "One or more participant email addresses are already registered." });
          }
        }
        throw createErr;
      }
    }

    return res.status(201).json({
      success: true,
      message: "Team registration successful! You can log in immediately.",
      data: {
        id: createdTeam.id,
        name: createdTeam.name,
        leader: createdTeam.leader,
        teamSize: createdTeam.teamSize,
        userId: createdTeam.acc.userId,
        status: createdTeam.status,
        createdAt: createdTeam.createdAt
      }
    });
  } catch (err) {
    if (err instanceof RegistrationValidationError) {
      return res.status(400).json({ success: false, error: err.code, message: err.message });
    }
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Registration could not be saved because the database is unavailable. Please try again later.");
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

    // Find ALL teams whose acc.userId matches the leader name (case-insensitive)
    const escapedUser = cleanUser.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingTeams = await Team.find({
      "acc.userId": new RegExp(`^${escapedUser}$`, "i")
    });

    if (!matchingTeams || matchingTeams.length === 0) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid User ID or password."
      });
    }

    // Accept the login if the bcrypt password matches any one of them
    let authenticatedTeam = null;
    for (const candidate of matchingTeams) {
      if (candidate.acc?.passwordHash) {
        const isMatch = await bcrypt.compare(cleanPass, candidate.acc.passwordHash);
        if (isMatch) {
          authenticatedTeam = candidate;
          break;
        }
      }
    }

    if (!authenticatedTeam) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid User ID or password."
      });
    }

    // Check acc.enabled after password match
    if (!authenticatedTeam.acc.enabled) {
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
      teamId: authenticatedTeam.id,
      userId: authenticatedTeam.acc.userId,
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
      teamId: authenticatedTeam.id,
      token
    });
  } catch (err) {
    console.error("Team login error:", err);
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Team login is temporarily unavailable because the database cannot be reached.");
    }
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
        createdAt: team.createdAt,
        members: team.members,
        track: team.track,
        problem: team.problem,
        problemStatementId: team.problemStatementId,
        title: team.title,
        desc: team.desc,
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
      createdAt: t.createdAt,
      members: t.members,
      track: t.track,
      problem: t.problem,
      problemStatementId: t.problemStatementId,
      title: t.title,
      desc: t.desc,
      status: t.status,
      acc: {
        userId: t.acc?.userId,
        enabled: t.acc?.enabled
      }
    }));

    return res.status(200).json({ success: true, data: sanitizedTeams });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Teams list is temporarily unavailable because the database cannot be reached.");
    }
    console.error("Admin list teams error:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to load teams." });
  }
});

// PUT /api/admin/teams/:id - Admin update team details, registration approval
app.put("/api/admin/teams/:id", authenticateAdmin, async (req, res) => {
  try {
    await getDbConnection();
    const targetId = req.params.id;
    const { name, leader, mobile, email, college, department, year, track, problem, title, desc, st, members, enabled, password } = req.body || {};

    const existingTeam = await Team.findOne({ id: targetId });
    if (!existingTeam) {
      return res.status(404).json({ success: false, error: "TEAM_NOT_FOUND", message: "Team not found." });
    }

    const cleanMobile = mobile !== undefined ? String(mobile).trim() : undefined;
    const cleanEmail = email !== undefined ? String(email).trim().toLowerCase() : undefined;

    // Check duplicate mobile if mobile is changing
    if (cleanMobile && cleanMobile !== existingTeam.mobile) {
      const duplicateMobile = await Team.findOne({
        id: { $ne: targetId },
        mobile: cleanMobile
      }).lean();
      if (duplicateMobile) {
        return res.status(400).json({
          success: false,
          error: "DUPLICATE_MOBILE",
          message: "This mobile number is already registered with another team."
        });
      }
    }

    // Check duplicate email if email is changing
    if (cleanEmail && cleanEmail !== existingTeam.email) {
      const duplicateEmail = await Team.findOne({
        id: { $ne: targetId },
        $or: [
          { email: cleanEmail },
          { "members.email": cleanEmail }
        ]
      }).lean();
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          error: "DUPLICATE_EMAIL",
          message: "This email address is already registered with another team."
        });
      }
    }

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = String(name).trim();
    if (leader !== undefined) {
      const cleanLeader = String(leader).trim();
      updateFields.leader = cleanLeader;
      updateFields["acc.userId"] = cleanLeader;
    }
    if (cleanMobile !== undefined) updateFields.mobile = cleanMobile;
    if (cleanEmail !== undefined) updateFields.email = cleanEmail;
    if (college !== undefined) updateFields.college = String(college).trim();
    if (department !== undefined) updateFields.department = String(department).trim();
    if (year !== undefined) updateFields.year = String(year).trim();
    if (track !== undefined) updateFields.track = String(track).trim();
    if (problem !== undefined) updateFields.problem = String(problem).trim();
    if (title !== undefined) updateFields.title = String(title).trim();
    if (desc !== undefined) updateFields.desc = String(desc).trim();
    if (st !== undefined) updateFields.status = st;
    if (enabled !== undefined) updateFields["acc.enabled"] = Boolean(enabled);
    if (Array.isArray(members)) updateFields.members = members;

    if (password && String(password).trim()) {
      updateFields["acc.passwordHash"] = await bcrypt.hash(String(password).trim(), 10);
    }

    let updated;
    try {
      updated = await Team.findOneAndUpdate({ id: targetId }, { $set: updateFields }, { returnDocument: "after" }).lean();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        if (saveErr.keyPattern?.mobile) {
          return res.status(400).json({
            success: false,
            error: "DUPLICATE_MOBILE",
            message: "This mobile number is already registered with another team."
          });
        }
        if (saveErr.keyPattern?.email || saveErr.keyPattern?.["members.email"]) {
          return res.status(400).json({
            success: false,
            error: "DUPLICATE_EMAIL",
            message: "This email address is already registered with another team."
          });
        }
      }
      throw saveErr;
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

// In-memory fallback map for ProblemFile when MongoDB is not connected
const memoryProblemFiles = new Map();

// GET /api/teams/problem-file/:id - Authenticated team retrieves problem statement file
app.get("/api/teams/problem-file/:id", authenticateTeam, async (req, res) => {
  try {
    const fileId = String(req.params.id || "").trim();
    if (!fileId) {
      return res.status(400).json({ success: false, error: "INVALID_FILE_ID", message: "File ID is required." });
    }

    let team = null;
    if (process.env.MONGODB_URI) {
      await getDbConnection();
      const teamId = req.teamSession.teamId;
      team = await Team.findOne({ id: teamId }).lean();
    } else if (req.teamSession?.team) {
      team = req.teamSession.team;
    }

    if (!team) {
      return res.status(404).json({ success: false, error: "TEAM_NOT_FOUND", message: "Team record not found." });
    }

    // Return the file only if the logged-in team's account is enabled
    if (!team.acc?.enabled) {
      return res.status(403).json({
        success: false,
        error: "ACCOUNT_DISABLED",
        message: "Your team account is not enabled. Only enabled teams can access problem statement files."
      });
    }

    // Check if the team selected this problem statement (either by problemStatementId or by track + problem title)
    let isSelected = team.problemStatementId && team.problemStatementId === fileId;

    // Retrieve file metadata from event data
    let fileMeta = null;
    if (process.env.MONGODB_URI) {
      const eventDoc = await EventData.findOne({ key: "global_event" }).lean();
      if (eventDoc && Array.isArray(eventDoc.problemStatementFiles)) {
        fileMeta = eventDoc.problemStatementFiles.find(item => item.id === fileId);
      }
    }
    if (!fileMeta) {
      fileMeta = memoryEventData.problemStatementFiles.find(item => item.id === fileId);
    }

    if (!fileMeta) {
      return res.status(404).json({ success: false, error: "FILE_NOT_FOUND", message: "Problem statement file not found." });
    }

    if (!isSelected && team.track && team.problem) {
      if (fileMeta.track === team.track && fileMeta.title === team.problem) {
        isSelected = true;
      }
    }

    if (!isSelected) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You can only download the problem statement file for your team's assigned track and problem."
      });
    }

    if (fileMeta.active === false) {
      return res.status(403).json({
        success: false,
        error: "FILE_INACTIVE",
        message: "This problem statement file is currently inactive."
      });
    }

    // Retrieve fileData from ProblemFile collection (or memory fallback)
    let fileDoc = null;
    if (process.env.MONGODB_URI) {
      fileDoc = await ProblemFile.findOne({ id: fileId }).lean();
    }
    if (!fileDoc) {
      fileDoc = memoryProblemFiles.get(fileId);
    }

    if (!fileDoc || !fileDoc.fileData) {
      return res.status(404).json({ success: false, error: "FILE_CONTENT_NOT_FOUND", message: "Problem statement file content not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: fileMeta.id,
        track: fileMeta.track,
        title: fileMeta.title,
        fileName: fileMeta.fileName || fileDoc.fileName,
        fileType: fileMeta.fileType || fileDoc.fileType,
        fileData: fileDoc.fileData
      }
    });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Problem file cannot be retrieved because the database is unavailable.");
    }
    console.error("Error retrieving team problem file:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to retrieve problem file." });
  }
});

// GET /api/admin/problem-file/:id - Authenticated admin retrieves problem statement file
app.get("/api/admin/problem-file/:id", authenticateAdmin, async (req, res) => {
  try {
    const fileId = String(req.params.id || "").trim();
    if (!fileId) {
      return res.status(400).json({ success: false, error: "INVALID_FILE_ID", message: "File ID is required." });
    }

    let fileDoc = null;
    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();
        fileDoc = await ProblemFile.findOne({ id: fileId }).lean();
      } catch (_dbErr) {}
    }
    if (!fileDoc) {
      fileDoc = memoryProblemFiles.get(fileId);
    }

    // Also get metadata if available
    let fileMeta = null;
    if (process.env.MONGODB_URI) {
      try {
        const eventDoc = await EventData.findOne({ key: "global_event" }).lean();
        if (eventDoc && Array.isArray(eventDoc.problemStatementFiles)) {
          fileMeta = eventDoc.problemStatementFiles.find(item => item.id === fileId);
        }
      } catch (_dbErr) {}
    }
    if (!fileMeta) {
      fileMeta = memoryEventData.problemStatementFiles.find(item => item.id === fileId);
    }

    if (!fileDoc || !fileDoc.fileData) {
      return res.status(404).json({ success: false, error: "FILE_NOT_FOUND", message: "Problem statement file content not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: fileId,
        fileName: fileMeta?.fileName || fileDoc.fileName,
        fileType: fileMeta?.fileType || fileDoc.fileType,
        fileData: fileDoc.fileData
      }
    });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Problem file cannot be retrieved because the database is unavailable.");
    }
    console.error("Error retrieving admin problem file:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR", message: "Failed to retrieve problem file." });
  }
});

// 2 MB in bytes = 2 * 1024 * 1024 = 2,097,152 bytes. In base64 string, max length is ~2,800,000 characters.
const MAX_PROBLEM_FILE_BYTES = 2 * 1024 * 1024;

function calculateBase64Bytes(base64String) {
  if (typeof base64String !== "string") return 0;
  const commaIdx = base64String.indexOf(",");
  const rawBase64 = commaIdx >= 0 ? base64String.slice(commaIdx + 1) : base64String;
  const padding = (rawBase64.endsWith("==") ? 2 : rawBase64.endsWith("=") ? 1 : 0);
  return Math.max(0, Math.floor((rawBase64.length * 3) / 4) - padding);
}

// PUT /api/admin/problem-file/:id - Authenticated admin uploads or replaces a single problem statement file
// Accepts up to 2 MB file (request body at most 3 MB)
app.put("/api/admin/problem-file/:id", authenticateAdmin, async (req, res) => {
  try {
    const fileId = String(req.params.id || "").trim();
    if (!fileId) {
      return res.status(400).json({ success: false, error: "INVALID_FILE_ID", message: "File ID is required." });
    }

    const { fileName, fileType, fileData } = req.body || {};
    if (!fileData || typeof fileData !== "string" || !fileData.trim()) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FILE_DATA",
        message: "fileData (base64 string) is required."
      });
    }

    const fileBytes = calculateBase64Bytes(fileData);
    if (fileBytes > MAX_PROBLEM_FILE_BYTES) {
      return res.status(400).json({
        success: false,
        error: "FILE_TOO_LARGE",
        message: "The problem statement file exceeds the maximum allowed size of 2 MB."
      });
    }

    const cleanFileName = String(fileName || "").slice(0, 255).trim();
    const cleanFileType = String(fileType || "").slice(0, 20).trim();

    const fileDoc = {
      id: fileId,
      fileData,
      fileName: cleanFileName,
      fileType: cleanFileType,
      updatedAt: new Date()
    };

    let savedToDb = false;
    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();
        await ProblemFile.findOneAndUpdate(
          { id: fileId },
          fileDoc,
          { upsert: true, returnDocument: "after" }
        );
        savedToDb = true;
      } catch (dbErr) {
        if (isDatabaseUnavailable(dbErr)) {
          console.warn("[ProblemFile] MongoDB write failed due to database unavailability.");
        } else {
          console.error("Error saving problem file to MongoDB:", dbErr);
        }
      }
    }

    if (process.env.MONGODB_URI && !savedToDb) {
      return databaseUnavailableResponse(res, "MongoDB database is currently unreachable. Problem file could not be persisted.");
    }

    // Always update in-memory fallback
    memoryProblemFiles.set(fileId, fileDoc);

    return res.status(200).json({
      success: true,
      message: "Problem statement file saved successfully.",
      data: {
        id: fileId,
        fileName: cleanFileName,
        fileType: cleanFileType,
        sizeBytes: fileBytes
      }
    });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return databaseUnavailableResponse(res, "Problem file cannot be saved because the database is unavailable.");
    }
    console.error("Error saving admin problem file:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to save problem statement file."
    });
  }
});

function sanitizeProblemFilesMeta(files) {
  if (!Array.isArray(files)) return [];
  return files.map(item => ({
    id: item.id,
    track: item.track,
    title: item.title,
    description: item.description,
    fileName: item.fileName,
    fileType: item.fileType,
    uploadDate: item.uploadDate,
    active: item.active !== false
  }));
}

// GET /api/event - Public endpoint to retrieve global event data (metadata only for problem statement files, NEVER fileData)
app.get("/api/event", async (req, res) => {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();
        const doc = await EventData.findOne({ key: "global_event" }).lean();
        if (doc) {
          return res.status(200).json({
            success: true,
            source: "database",
            data: {
              event: {
                title: doc.event?.title || memoryEventData.event.title,
                about: doc.event?.about || memoryEventData.event.about,
                date: doc.event?.date || memoryEventData.event.date,
                time: doc.event?.time || memoryEventData.event.time,
                venue: doc.event?.venue || memoryEventData.event.venue,
                contact: doc.event?.contact || memoryEventData.event.contact
              },
              timeline: doc.timeline || [],
              rules: doc.rules || [],
              prizes: doc.prizes || [],
              judges: doc.judges || [],
              faq: doc.faq || [],
              tracks: doc.tracks || [],
              problemStatementFiles: sanitizeProblemFilesMeta(doc.problemStatementFiles),
              announcements: doc.announcements || [],
              updatedAt: doc.updatedAt
            }
          });
        }
      } catch (dbErr) {
        console.warn(`[Event Data] MongoDB read failed: ${dbErr.name}`);
      }
    }

    return res.status(200).json({
      success: true,
      source: "fallback",
      data: {
        event: memoryEventData.event,
        timeline: memoryEventData.timeline,
        rules: memoryEventData.rules,
        prizes: memoryEventData.prizes,
        judges: memoryEventData.judges,
        faq: memoryEventData.faq,
        tracks: memoryEventData.tracks,
        problemStatementFiles: sanitizeProblemFilesMeta(memoryEventData.problemStatementFiles),
        announcements: memoryEventData.announcements,
        updatedAt: memoryEventData.updatedAt
      }
    });
  } catch (err) {
    console.error("Error in GET /api/event:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to retrieve event data."
    });
  }
});


// PUT /api/event - Protected endpoint (authenticateAdmin) to publish and update global event data
app.put("/api/event", authenticateAdmin, async (req, res) => {
  try {
    const body = req.body || {};

    // Validate and limit input sizes: keep every PUT /api/event request body strictly under 1 MB
    const payloadStr = JSON.stringify(body);
    if (payloadStr.length > 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "PAYLOAD_TOO_LARGE",
        message: "Event data payload exceeds the maximum limit of 1 MB."
      });
    }

    const eventObj = body.event && typeof body.event === "object" ? body.event : memoryEventData.event;
    const cleanEvent = {
      title: String(eventObj.title || "").slice(0, 200).trim(),
      about: String(eventObj.about || "").slice(0, 5000).trim(),
      date: String(eventObj.date || "").slice(0, 50).trim(),
      time: String(eventObj.time || "").slice(0, 100).trim(),
      venue: String(eventObj.venue || "").slice(0, 300).trim(),
      contact: String(eventObj.contact || "").slice(0, 500).trim()
    };

    const cleanPairs = (arr, maxItems = 100) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, maxItems).map(item => ({
        t: String(item?.t || "").slice(0, 200).trim(),
        d: String(item?.d || "").slice(0, 3000).trim()
      })).filter(item => item.t || item.d);
    };

    const validateJudgeImg = (img) => {
      if (!img || typeof img !== "string" || !img.trim()) return "";
      const val = img.trim();
      if (val.length > 120) {
        throw new Error("Judge image path must be at most 120 characters.");
      }
      if (!val.startsWith("assets/images/guests/")) {
        throw new Error("Judge image path must start with 'assets/images/guests/'.");
      }
      if (!/\.(jpg|jpeg|png|webp)$/i.test(val)) {
        throw new Error("Judge image path must end with .jpg, .jpeg, .png, or .webp.");
      }
      if (val.includes("..") || val.includes("//") || val.includes(":") || /\s/.test(val)) {
        throw new Error("Judge image path must not contain '..', '//', ':', or spaces.");
      }
      return val;
    };

    let cleanJudgesList = [];
    try {
      if (Array.isArray(body.judges)) {
        cleanJudgesList = body.judges.slice(0, 50).map(item => {
          const t = String(item?.t || "").slice(0, 200).trim();
          const d = String(item?.d || "").slice(0, 3000).trim();
          const img = validateJudgeImg(item?.img);
          return { t, d, img };
        }).filter(item => item.t || item.d);
      }
    } catch (valErr) {
      return res.status(400).json({
        success: false,
        error: "INVALID_JUDGE_IMAGE",
        message: valErr.message
      });
    }

    const cleanTracks = (arr, maxItems = 50) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, maxItems).map(track => ({
        name: String(track?.name || "").slice(0, 150).trim(),
        problems: Array.isArray(track?.problems)
          ? track.problems.slice(0, 100).map(p => String(p || "").slice(0, 300).trim()).filter(Boolean)
          : []
      })).filter(track => track.name);
    };

    // Separate file metadata from file content, and enforce 2 MB limit per file
    // Include fileData only for a file that was newly uploaded or replaced in this save
    const separateFileContents = [];
    const cleanProblemFilesMeta = [];
    const incomingFileIds = new Set();

    if (Array.isArray(body.problemStatementFiles)) {
      for (const item of body.problemStatementFiles.slice(0, 50)) {
        if (!item || !item.track || !item.title) continue;

        const id = String(item.id || "").slice(0, 100).trim() || `ps-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const fileName = String(item.fileName || "").slice(0, 255).trim();
        const fileType = String(item.fileType || "").slice(0, 20).trim();
        incomingFileIds.add(id);

        if (typeof item.fileData === "string" && item.fileData.trim()) {
          const fileBytes = calculateBase64Bytes(item.fileData);
          if (fileBytes > MAX_PROBLEM_FILE_BYTES) {
            return res.status(400).json({
              success: false,
              error: "FILE_TOO_LARGE",
              message: `The problem statement file "${fileName || item.title}" exceeds the maximum allowed size of 2 MB.`
            });
          }

          separateFileContents.push({
            id,
            fileData: item.fileData,
            fileName,
            fileType,
            updatedAt: new Date()
          });
        }

        cleanProblemFilesMeta.push({
          id,
          track: String(item.track || "").slice(0, 150).trim(),
          title: String(item.title || "").slice(0, 200).trim(),
          description: String(item.description || "").slice(0, 3000).trim(),
          fileName,
          fileType,
          uploadDate: String(item.uploadDate || "").slice(0, 30).trim(),
          active: item.active !== false
        });
      }
    }

    const updatePayload = {
      key: "global_event",
      event: cleanEvent,
      timeline: cleanPairs(body.timeline, 50),
      rules: cleanPairs(body.rules, 50),
      prizes: cleanPairs(body.prizes, 50),
      judges: cleanJudgesList,
      faq: cleanPairs(body.faq, 50),
      tracks: cleanTracks(body.tracks, 50),
      problemStatementFiles: cleanProblemFilesMeta,
      announcements: cleanPairs(body.announcements, 100),
      updatedAt: new Date()
    };

    let savedToDb = false;

    if (process.env.MONGODB_URI) {
      try {
        await getDbConnection();

        // One-time migration: check if legacy event document has problemStatementFiles with fileData, move to ProblemFile
        try {
          const existingEventDoc = await EventData.findOne({ key: "global_event" }).lean();
          if (existingEventDoc && Array.isArray(existingEventDoc.problemStatementFiles)) {
            let hadLegacyData = false;
            for (const legItem of existingEventDoc.problemStatementFiles) {
              if (legItem && legItem.id && legItem.fileData) {
                hadLegacyData = true;
                const existingProblemFile = await ProblemFile.findOne({ id: legItem.id }).lean();
                if (!existingProblemFile) {
                  await ProblemFile.create({
                    id: legItem.id,
                    fileData: legItem.fileData,
                    fileName: legItem.fileName || "",
                    fileType: legItem.fileType || "",
                    updatedAt: new Date()
                  });
                }
              }
            }
            if (hadLegacyData) {
              // Strip legacy fileData from EventData problemStatementFiles
              const sanitizedLegacyFiles = sanitizeProblemFilesMeta(existingEventDoc.problemStatementFiles);
              await EventData.updateOne(
                { key: "global_event" },
                { $set: { problemStatementFiles: sanitizedLegacyFiles } }
              );
            }

            // Delete ProblemFile documents only when admin deletes that problem statement
            const existingIds = existingEventDoc.problemStatementFiles.map(f => f.id).filter(Boolean);
            const deletedIds = existingIds.filter(id => !incomingFileIds.has(id));
            if (deletedIds.length > 0) {
              await ProblemFile.deleteMany({ id: { $in: deletedIds } });
            }
          }
        } catch (migrationErr) {
          console.warn(`[Event Data Migration] Warning: ${migrationErr.message}`);
        }

        // 1. Save new or replaced file contents to separate ProblemFile collection (keeps omitted fileData unchanged)
        for (const fileItem of separateFileContents) {
          await ProblemFile.findOneAndUpdate(
            { id: fileItem.id },
            fileItem,
            { upsert: true, returnDocument: "after" }
          );
        }

        // 2. Save event metadata (without fileData)
        const updated = await EventData.findOneAndUpdate(
          { key: "global_event" },
          updatePayload,
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        ).lean();

        savedToDb = true;
        Object.assign(memoryEventData, updatePayload);

        for (const fileItem of separateFileContents) {
          memoryProblemFiles.set(fileItem.id, fileItem);
        }
        // In memory: delete files that are no longer in problem statements
        for (const key of memoryProblemFiles.keys()) {
          if (!incomingFileIds.has(key)) {
            memoryProblemFiles.delete(key);
          }
        }

        return res.status(200).json({
          success: true,
          database: "connected",
          message: "Event data published and saved to MongoDB successfully.",
          data: {
            event: updated.event,
            timeline: updated.timeline,
            rules: updated.rules,
            prizes: updated.prizes,
            judges: updated.judges,
            faq: updated.faq,
            tracks: updated.tracks,
            problemStatementFiles: sanitizeProblemFilesMeta(updated.problemStatementFiles),
            announcements: updated.announcements,
            updatedAt: updated.updatedAt
          }
        });
      } catch (dbErr) {
        console.warn(`[Event Data] MongoDB write failed: ${dbErr.name}`);
      }
    }

    if (process.env.MONGODB_URI && !savedToDb) {
      return databaseUnavailableResponse(res, "MongoDB database is currently unreachable. Event data could not be persisted to the database.");
    }

    // In-memory fallback if no DB configured
    Object.assign(memoryEventData, updatePayload);
    for (const fileItem of separateFileContents) {
      memoryProblemFiles.set(fileItem.id, fileItem);
    }
    // Delete problem files that were removed from the problem statements
    for (const key of memoryProblemFiles.keys()) {
      if (!incomingFileIds.has(key)) {
        memoryProblemFiles.delete(key);
      }
    }

    return res.status(200).json({
      success: true,
      database: "fallback",
      message: "Event data saved in-memory (persistent database storage not configured).",
      data: {
        ...memoryEventData,
        problemStatementFiles: sanitizeProblemFilesMeta(memoryEventData.problemStatementFiles)
      }
    });

  } catch (err) {
    console.error("Error updating event data:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Internal server error updating event data."
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
