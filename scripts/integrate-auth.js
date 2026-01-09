#!/usr/bin/env node

/**
 * Authentication System Integration Script
 * Ensures all components are properly integrated and configured
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");
const SERVER_ROOT = path.join(PROJECT_ROOT, "server");
const CLIENT_ROOT = path.join(PROJECT_ROOT, "client");

console.log("🔧 AI Trip Planner - Authentication Integration Script");
console.log("================================================\n");

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Write JSON file
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check backend dependencies
 */
function checkBackendDependencies() {
  console.log("📦 Checking Backend Dependencies...");

  const packageJsonPath = path.join(SERVER_ROOT, "package.json");
  const packageJson = readJsonFile(packageJsonPath);

  if (!packageJson) {
    console.error("❌ Backend package.json not found");
    return false;
  }

  const requiredDependencies = {
    bcryptjs: "^2.4.3",
    jsonwebtoken: "^9.0.0",
    nodemailer: "^6.9.0",
    "express-validator": "^6.15.0",
    "express-rate-limit": "^6.7.0",
    helmet: "^6.1.5",
    hpp: "^0.2.3",
    "xss-clean": "^0.1.1",
    "express-mongo-sanitize": "^2.2.0",
    compression: "^1.7.4",
    "cookie-parser": "^1.4.6",
  };

  let missingDeps = [];

  for (const [dep, version] of Object.entries(requiredDependencies)) {
    if (
      !packageJson.dependencies?.[dep] &&
      !packageJson.devDependencies?.[dep]
    ) {
      missingDeps.push(`${dep}@${version}`);
    }
  }

  if (missingDeps.length > 0) {
    console.log("⚠️  Missing backend dependencies:");
    missingDeps.forEach((dep) => console.log(`   - ${dep}`));
    console.log("\n   Run: npm install " + missingDeps.join(" "));
    return false;
  }

  console.log("✅ All backend dependencies are installed\n");
  return true;
}

/**
 * Check frontend dependencies
 */
function checkFrontendDependencies() {
  console.log("📦 Checking Frontend Dependencies...");

  const packageJsonPath = path.join(CLIENT_ROOT, "package.json");
  const packageJson = readJsonFile(packageJsonPath);

  if (!packageJson) {
    console.error("❌ Frontend package.json not found");
    return false;
  }

  const requiredDependencies = {
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.1.0",
    zod: "^3.21.0",
    "@hookform/error-message": "^2.0.1",
    "react-hot-toast": "^2.4.1",
    "@heroicons/react": "^2.0.18",
  };

  let missingDeps = [];

  for (const [dep, version] of Object.entries(requiredDependencies)) {
    if (
      !packageJson.dependencies?.[dep] &&
      !packageJson.devDependencies?.[dep]
    ) {
      missingDeps.push(`${dep}@${version}`);
    }
  }

  if (missingDeps.length > 0) {
    console.log("⚠️  Missing frontend dependencies:");
    missingDeps.forEach((dep) => console.log(`   - ${dep}`));
    console.log("\n   Run: cd client && npm install " + missingDeps.join(" "));
    return false;
  }

  console.log("✅ All frontend dependencies are installed\n");
  return true;
}

/**
 * Check required files
 */
function checkRequiredFiles() {
  console.log("📁 Checking Required Files...");

  const requiredFiles = {
    // Backend files
    "server/models/User.js": "Enhanced User Model",
    "server/utils/tokens.js": "Token Manager",
    "server/services/email.js": "Email Service",
    "server/controllers/authControllerNew.js": "Auth Controller",
    "server/middleware/auth.js": "Auth Middleware",
    "server/middleware/enhancedSecurity.js": "Security Middleware",
    "server/routes/authNew.js": "Auth Routes",

    // Frontend files
    "client/src/contexts/AuthContextNew.js": "Enhanced Auth Context",
    "client/src/services/apiNew.js": "Enhanced API Service",
    "client/src/hooks/useAuth.js": "Auth Hooks",
    "client/src/pages/auth/LoginNew.js": "Enhanced Login Form",
    "client/src/pages/auth/RegisterNew.js": "Enhanced Register Form",
    "client/src/pages/auth/VerifyEmail.js": "Email Verification",
    "client/src/pages/auth/ForgotPassword.js": "Forgot Password",
    "client/src/pages/auth/ResetPassword.js": "Reset Password",
  };

  let missingFiles = [];

  for (const [filePath, description] of Object.entries(requiredFiles)) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fileExists(fullPath)) {
      missingFiles.push(`${filePath} (${description})`);
    }
  }

  if (missingFiles.length > 0) {
    console.log("❌ Missing required files:");
    missingFiles.forEach((file) => console.log(`   - ${file}`));
    return false;
  }

  console.log("✅ All required files are present\n");
  return true;
}

/**
 * Check environment configuration
 */
function checkEnvironmentConfig() {
  console.log("🔐 Checking Environment Configuration...");

  const envExamplePath = path.join(SERVER_ROOT, ".env.example");
  const envPath = path.join(SERVER_ROOT, ".env");

  if (!fileExists(envExamplePath)) {
    console.log("⚠️  .env.example file not found");
  }

  if (!fileExists(envPath)) {
    console.log(
      "⚠️  .env file not found - copy from .env.example and configure"
    );
    return false;
  }

  // Read .env file
  const envContent = fs.readFileSync(envPath, "utf8");

  const requiredVars = [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "EMAIL_HOST",
    "EMAIL_USER",
    "EMAIL_PASS",
    "FRONTEND_URL",
  ];

  let missingVars = [];

  for (const varName of requiredVars) {
    if (
      !envContent.includes(`${varName}=`) ||
      envContent.includes(`${varName}=your-`)
    ) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log("⚠️  Missing or unconfigured environment variables:");
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    console.log("\n   Please configure these in your .env file");
    return false;
  }

  console.log("✅ Environment configuration looks good\n");
  return true;
}

/**
 * Create startup checklist
 */
function createStartupChecklist() {
  console.log("📋 Creating Startup Checklist...");

  const checklist = `# 🚀 Authentication System Startup Checklist

## Backend Setup
- [ ] Install dependencies: \`npm install\`
- [ ] Configure .env file with all required variables
- [ ] Start MongoDB service
- [ ] Run server: \`npm run dev\`
- [ ] Verify health check: http://localhost:5000/api/health

## Frontend Setup  
- [ ] Install dependencies: \`cd client && npm install\`
- [ ] Configure environment variables in .env.local
- [ ] Start development server: \`npm start\`
- [ ] Verify app loads: http://localhost:3000

## Authentication Testing
- [ ] Test user registration flow
- [ ] Test email verification (check email service)
- [ ] Test login with valid credentials
- [ ] Test password reset flow
- [ ] Test account lockout (5 failed attempts)
- [ ] Test token refresh (wait 15+ minutes)
- [ ] Test cross-tab synchronization
- [ ] Test logout from all devices

## Security Verification
- [ ] Check security headers in browser dev tools
- [ ] Verify HTTPS redirect in production
- [ ] Test rate limiting on auth endpoints
- [ ] Verify XSS protection
- [ ] Test CSRF protection
- [ ] Check CORS configuration

## Production Deployment
- [ ] Set secure JWT secrets (256+ bit entropy)
- [ ] Configure email service (SMTP/SendGrid/AWS SES)
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test disaster recovery procedures

## Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure security alerts
- [ ] Set up log aggregation
- [ ] Monitor authentication metrics

---
Generated on: ${new Date().toISOString()}
`;

  const checklistPath = path.join(PROJECT_ROOT, "STARTUP_CHECKLIST.md");
  fs.writeFileSync(checklistPath, checklist);

  console.log(`✅ Startup checklist created: ${checklistPath}\n`);
}

/**
 * Main integration check
 */
async function main() {
  let allGood = true;

  // Check all components
  if (!checkBackendDependencies()) allGood = false;
  if (!checkFrontendDependencies()) allGood = false;
  if (!checkRequiredFiles()) allGood = false;
  if (!checkEnvironmentConfig()) allGood = false;

  // Create checklist regardless
  createStartupChecklist();

  // Final status
  console.log("================================================");
  if (allGood) {
    console.log("🎉 Authentication System Integration Complete!");
    console.log("✅ All components are properly configured");
    console.log("📋 Check STARTUP_CHECKLIST.md for next steps");
  } else {
    console.log("⚠️  Integration Issues Found");
    console.log("❌ Please resolve the issues above before deployment");
  }
  console.log("================================================\n");

  process.exit(allGood ? 0 : 1);
}

// Run the integration check
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Integration script failed:", error);
    process.exit(1);
  });
}

module.exports = {
  checkBackendDependencies,
  checkFrontendDependencies,
  checkRequiredFiles,
  checkEnvironmentConfig,
  createStartupChecklist,
};
