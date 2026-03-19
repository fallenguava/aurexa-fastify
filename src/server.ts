import "dotenv/config";
import { buildApp } from "./app";

const PORT = Number(process.env.PORT);
const HOST = process.env.HOST;

const validateEnv = (): void => {
  if (!PORT) {
    throw new Error("PORT is not defined in the environment variables.");
  }
  if (!HOST) {
    throw new Error("HOST is not defined in the environment variables.");
  }
};

// ANSI Color Codes for terminal beautification
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
};

const start = async (): Promise<void> => {
  validateEnv();
  try {
    const app = await buildApp();
    
    // We must wait for Fastify to fully register all plugins and routes
    await app.ready();
    
    // Start the server
    await app.listen({ port: PORT, host: HOST });

    // ---------------------------------------------------------
    // 🎨 Beautified Startup Sequence
    // ---------------------------------------------------------
    console.log(`\n${colors.cyan}${colors.bold}====================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}              🚀 Aurexa API Server                 ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}\n`);

    console.log(`${colors.green}${colors.bold}📡 Server Details:${colors.reset}`);
    console.log(`   ${colors.bold}URL:${colors.reset}       ${colors.blue}http://${HOST}:${PORT}${colors.reset}`);
    console.log(`   ${colors.bold}ENV:${colors.reset}       ${colors.yellow}${process.env.NODE_ENV || "development"}${colors.reset}`);
    console.log(`   ${colors.bold}CORS:${colors.reset}      ${colors.yellow}http://localhost:5173${colors.reset}\n`);

    console.log(`${colors.magenta}${colors.bold}🛣️  Available Endpoints:${colors.reset}`);
    // Fastify's built-in router tree printer
    console.log(`${colors.yellow}${app.printRoutes()}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}❌ Server failed to start:${colors.reset}\n`, error);
    process.exit(1);
  }
};

start();