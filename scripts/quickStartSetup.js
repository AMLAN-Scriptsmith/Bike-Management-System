const fs = require("fs");
const path = require("path");

const root = process.cwd();
const files = [
  {
    env: path.join(root, ".env"),
    example: path.join(root, ".env.example"),
  },
  {
    env: path.join(root, "backend", ".env"),
    example: path.join(root, "backend", ".env.example"),
  },
];

const copyIfMissing = ({ env, example }) => {
  if (fs.existsSync(env)) return false;
  if (!fs.existsSync(example)) return false;
  fs.copyFileSync(example, env);
  return true;
};

let createdCount = 0;
for (const item of files) {
  if (copyIfMissing(item)) {
    createdCount += 1;
    console.log(`Created ${path.relative(root, item.env)} from example.`);
  }
}

if (createdCount === 0) {
  console.log("Environment files already exist. Quick setup check complete.");
}
