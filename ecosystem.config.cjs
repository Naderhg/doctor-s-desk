module.exports = {
  apps: [
    {
      name: "doctors-desk-api",
      cwd: "./server",
      script: "src/index.ts",
      interpreter: "npx tsx",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
