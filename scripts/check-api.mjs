import { getUserInfo, getCardList } from '../src/scripts/components/api.js';

const results = await Promise.all([
  ['/users/me', getUserInfo, (data) => Boolean(data?._id && data.name)],
  ['/cards', getCardList, Array.isArray],
].map(async ([endpoint, load, validate]) => {
  try {
    return { endpoint, ok: validate(await load()) };
  } catch (error) {
    return { endpoint, ok: false, error: error.name, cause: error.cause?.code };
  }
}));
console.log(JSON.stringify(results));
if (results.some((result) => !result.ok)) process.exitCode = 1;
