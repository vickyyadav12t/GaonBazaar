const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseAllowedOrigins,
  createCorsOriginCallback,
} = require("./corsConfig");

test("parseAllowedOrigins defaults to localhost:8080 when unset", async (t) => {
  const prevO = process.env.CORS_ORIGINS;
  const prevA = process.env.CORS_ALLOW_ORIGINS;
  t.after(() => {
    if (prevO === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prevO;
    if (prevA === undefined) delete process.env.CORS_ALLOW_ORIGINS;
    else process.env.CORS_ALLOW_ORIGINS = prevA;
  });
  delete process.env.CORS_ORIGINS;
  delete process.env.CORS_ALLOW_ORIGINS;
  assert.deepEqual(parseAllowedOrigins(), ["http://localhost:8080"]);
});

test("parseAllowedOrigins splits comma-separated list", async (t) => {
  const prevO = process.env.CORS_ORIGINS;
  const prevA = process.env.CORS_ALLOW_ORIGINS;
  t.after(() => {
    if (prevO === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prevO;
    if (prevA === undefined) delete process.env.CORS_ALLOW_ORIGINS;
    else process.env.CORS_ALLOW_ORIGINS = prevA;
  });
  process.env.CORS_ORIGINS = " https://a.com ,http://b.com ";
  delete process.env.CORS_ALLOW_ORIGINS;
  assert.deepEqual(parseAllowedOrigins(), ["https://a.com", "http://b.com"]);
});

test("createCorsOriginCallback allows listed origin", async () => {
  const cb = createCorsOriginCallback(["http://localhost:8080"]);
  const ok = await new Promise((resolve, reject) => {
    cb("http://localhost:8080", (err, allow) => {
      if (err) reject(err);
      else resolve(allow);
    });
  });
  assert.equal(ok, true);
});

test("createCorsOriginCallback rejects unknown origin", async () => {
  const cb = createCorsOriginCallback(["http://localhost:8080"]);
  await assert.rejects(
    () =>
      new Promise((resolve, reject) => {
        cb("https://evil.com", (err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
    /CORS blocked/,
  );
});
