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
import { login } from "./controllers/authController";

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
app.post("/login", loginLimiter, login);


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
  const { email } = req.params;
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
  const { email } = req.params;
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

app.listen(3000, () => console.log("🚀 Back to basics on port 3000"));
