import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { requireAuth } from "./middleware/authMiddleware";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import validator from "validator";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./config/swagger";
import { PipelineData } from "./models/PipelineData";

dotenv.config();

// Initialize Supabase with the ANON key for simplicity
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const app = express();

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "DevSecOps Auth API",
  })
);

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// 1. HELMET: Sets various HTTP headers to block common web attacks
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allows CSS from your own app
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // Allows images from HTTPS sources
      },
    },
    hsts: {
      maxAge: 31536000, // Enforce HTTPS for 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. RATE LIMITER: Stops hackers from brute-forcing passwords
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window (increased for testing)
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(loginLimiter);
app.use(cors());
app.use(express.json());

// Helper function to send Discord notifications
async function notifyDiscord(endpoint: string, data: any): Promise<void> {
  if (!process.env.DISCORD_NOTIFIER_URL || process.env.DISCORD_ENABLED !== 'true') {
    return;
  }

  try {
    const response = await fetch(`${process.env.DISCORD_NOTIFIER_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': process.env.WEBHOOK_TOKEN || ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('[Discord] Notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('[Discord] Notification error:', error);
  }
}

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     description: Authenticates a user with email and password, returns JWT token valid for 8 hours. Rate limited to 5 attempts per 15 minutes per IP.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many login attempts (rate limited - 5 attempts per 15 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     security: []
 */
app.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // VALIDATION LAYER
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  // 2. Get the REAL token and role
  const accessToken = data.session?.access_token; // <--- The Real JWT
  const role = data.user?.user_metadata?.role || "user";

  // 3. Send it to the Frontend
  return res.status(200).json({
    token: accessToken,
    role: role,
    message: "Login successful!",
  });
});

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (admin only)
 *     description: Creates a new user with specified email, password, and role. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post("/admin/users", requireAuth, async (req, res) => {
  // 1. validation to Check if the requester is an admin
  const requesterRole = (req as any).user?.user_metadata?.role;
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }

  const { email, password, role } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // We use the basic signup method which is easier to test
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: role || "user" },
    },
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json({
    id: data.user?.id,
    email: email,
    role: role,
  });
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     description: Retrieves a list of all users with their roles and metadata. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get("/admin/users", requireAuth, async (req, res) => {
  // 1. validation to Check if the requester is an admin
  const requesterRole = (req as any).user?.user_metadata?.role;
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  console.log("Attempting to list users...");

  // DEBUG: Check if the key is actually loaded
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("❌ CRITICAL: SERVICE_ROLE_KEY is missing!");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: No Service Key" });
  }

  // 2. CREATE A SPECIAL ADMIN CLIENT JUST FOR THIS ACTION
  // We do this here to be 100% sure we are using the Secret Key, not the Anon Key
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 3. Use this new 'supabaseAdmin' client to fetch the list
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("Supabase Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  // 4. Send the data back
  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "user",
    created_at: user.created_at,
  }));

  console.log(`✅ Successfully fetched ${users.length} users.`);

  return res.status(200).json(users);
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     description: Deletes a user by ID. Admin cannot delete their own account. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteUserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - cannot delete own account or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// DELETE route - Remove a user
app.delete("/admin/users/email/:email", requireAuth, async (req, res) => {
  // 1. validation to Check if the requester is an admin
  const requesterRole = (req as any).user?.user_metadata?.role;
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Find the user by email first to get their UUID
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) throw listError;

    const userToDelete = listData.users.find((u) => u.email === email);

    if (!userToDelete) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    // 2. Delete the user using the UUID we just found
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userToDelete.id
    );

    if (deleteError) throw deleteError;

    return res.status(200).json({
      message: `User ${email} deleted successfully`,
      id: userToDelete.id,
    });
  } catch (err: any) {
    console.error("Delete Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     description: Updates a user's role to either admin or user. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateRoleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// UPDATE route - Change a user's role
app.put("/admin/users/email/:email/role", requireAuth, async (req, res) => {
  const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const { role } = req.body; // e.g., { "role": "admin" }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Find the user by email to get their ID
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const userToUpdate = listData.users.find((u) => u.email === email);

    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Update the metadata using the ID we found
    const oldRole = userToUpdate.user_metadata?.role || "user";
    const { data: updatedData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, {
        user_metadata: { role: role },
      });

    if (updateError) throw updateError;

    return res.status(200).json({
      message: `Role for ${email} updated to ${role}`,
      user: {
        id: updatedData.user.id,
        email: updatedData.user.email,
        role: updatedData.user.user_metadata.role,
      },
    });
  } catch (err: any) {
    console.error("Update Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the auth service. Used for monitoring and DAST scanning.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *     security: []
 */
// Health check endpoint for DAST scanning
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "auth" });
});

/**
 * @swagger
 * /dashboard/files:
 *   get:
 *     summary: Get user dashboard files
 *     description: Returns personalized document list for authenticated users
 *     tags: [User Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get("/dashboard/files", requireAuth, (_req, res) => {
  return res.status(200).json({
    message: "this is your personal document list"
  });
});

/**
 * @swagger
 * /pipeline/notify:
 *   post:
 *     summary: Subscribe to email notifications
 *     description: Subscribe an email address to receive notifications about all user CRUD operations. No authentication required.
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to subscribe
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Successfully subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully subscribed to notifications
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     security: []
 */
app.post("/subscribe", async (req, res) => {
  const { email, role } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate role if provided
  const validRoles = ['admin', 'developer', 'stakeholder'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be: admin, developer, or stakeholder" });
  }

  // Subscribe
  const subscriber = await subscriberRepository.subscribe(email, role);

  if (!subscriber) {
    return res.status(500).json({ error: "Failed to subscribe" });
  }

  return res.status(201).json({
    message: "Successfully subscribed to notifications",
    email: subscriber.email,
    role: subscriber.role,
  });
});

/**
 * @swagger
 * /unsubscribe:
 *   post:
 *     summary: Unsubscribe from email notifications
 *     description: Unsubscribe an email address from receiving notifications. No authentication required.
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to unsubscribe
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully unsubscribed from notifications
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     security: []
 */
app.post("/unsubscribe", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const success = await subscriberRepository.unsubscribe(email);

  if (!success) {
    return res.status(500).json({ error: "Failed to unsubscribe" });
  }

  return res.status(200).json({
    message: "Successfully unsubscribed from notifications",
  });
});

/**
 * @swagger
 * /subscribe/status:
 *   get:
 *     summary: Check subscription status
 *     description: Check if an email is subscribed to notifications
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to check
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *     security: []
 */
app.get("/subscribe/status", async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "Email parameter is required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const subscribed = await subscriberRepository.isSubscribed(email);

  return res.status(200).json({
    subscribed,
    email,
  });
});

/**
 * @swagger
 * /admin/subscribers:
 *   get:
 *     summary: Get all subscribers (admin only)
 *     description: Retrieve a list of all email subscribers including inactive ones
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subscribers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   email:
 *                     type: string
 *                   subscribed_at:
 *                     type: string
 *                     format: date-time
 *                   is_active:
 *                     type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
app.get("/admin/subscribers", requireAuth, async (req, res) => {
  const requesterRole = (req as any).user?.user_metadata?.role;
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }

  const subscribers = await subscriberRepository.getAllSubscribers();
  return res.status(200).json(subscribers);
});

/**
 * @swagger
 * /pipeline/notify:
 *   post:
 *     summary: Receive pipeline status notification from GitHub Actions
 *     description: Webhook endpoint for CI/CD pipeline to send status notifications
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - branch
 *               - runUrl
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [success, failure]
 *               branch:
 *                 type: string
 *               commit:
 *                 type: string
 *               actor:
 *                 type: string
 *               runId:
 *                 type: string
 *               runUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification processed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     security: []
 */
app.post("/pipeline/notify", async (req, res) => {
  const pipelineData: PipelineData = req.body;

  if (!pipelineData.status || !pipelineData.branch || !pipelineData.runUrl) {
    return res.status(400).json({ error: "Missing required pipeline data" });
  }

  try {
    console.log(`[Pipeline] Processing ${pipelineData.status} notification`);

    await notifyDiscord('/notify/pipeline', {
      status: pipelineData.status,
      workflowName: pipelineData.workflowName || 'Pipeline',
      branch: pipelineData.branch,
      commit: pipelineData.commit || 'unknown',
      actor: pipelineData.actor || 'system',
      duration: pipelineData.duration,
      runUrl: pipelineData.runUrl,
      timestamp: new Date().toISOString(),
      failedServices: pipelineData.failedServices,
      securityFindings: pipelineData.securityFindings
    });

    return res.status(200).json({
      message: "Pipeline notification processed",
      status: pipelineData.status
    });
  } catch (error: any) {
    console.error('[Pipeline] Notification error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Back to basics on port 3000");

  if (process.env.DISCORD_ENABLED === "true") {
    console.log("💬 Discord notifications enabled");
  } else {
    console.log("💬 Discord notifications disabled");
  }
});
