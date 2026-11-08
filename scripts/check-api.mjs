const cohort = process.env.VITE_MESTO_COHORT;
const token = process.env.VITE_MESTO_TOKEN;

if (!cohort || !token) {
  throw new Error('Настройте VITE_MESTO_COHORT и VITE_MESTO_TOKEN.');
}

const results = await Promise.all(['/users/me', '/cards'].map(async (endpoint) => {
  try {
    const response = await fetch(`https://mesto.nomoreparties.co/v1/${encodeURIComponent(cohort)}${endpoint}`, {
      headers: { authorization: token },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { endpoint, ok: false, status: response.status };
    const data = await response.json();
    const valid = endpoint === '/cards' ? Array.isArray(data) : Boolean(data?._id && data.name);
    return { endpoint, ok: valid, status: response.status };
  } catch (error) {
    return { endpoint, ok: false, error: error.name, cause: error.cause?.code };
  }
}));

console.log(JSON.stringify(results));
if (results.some((result) => !result.ok)) process.exitCode = 1;
