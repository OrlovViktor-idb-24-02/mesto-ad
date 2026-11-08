const cohort = import.meta.env.VITE_MESTO_COHORT || '';
const config = {
  baseUrl: `https://mesto.nomoreparties.co/v1/${encodeURIComponent(cohort)}`,
  headers: {
    authorization: import.meta.env.VITE_MESTO_TOKEN || '',
    'Content-Type': 'application/json',
  },
};

const hasApiConfig = () => Boolean(config.headers.authorization && cohort);

export const getResponseData = (res) =>
  res.ok ? res.json() : Promise.reject(new Error(`Ошибка: ${res.status}`));

const request = (endpoint, options = {}) => {
  if (!hasApiConfig()) {
    return Promise.reject(new Error('Не настроено подключение к серверу Mesto.'));
  }
  return fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
  }).then(getResponseData);
};

export const getUserInfo = () => request('/users/me');
export const getCardList = () => request('/cards');
export const setUserInfo = ({ name, about }) => request('/users/me', {
  method: 'PATCH', body: JSON.stringify({ name, about }),
});
export const setUserAvatar = ({ avatar }) => request('/users/me/avatar', {
  method: 'PATCH', body: JSON.stringify({ avatar }),
});
export const addCard = ({ name, link }) => request('/cards', {
  method: 'POST', body: JSON.stringify({ name, link }),
});
export const deleteCard = (cardId) => request(`/cards/${encodeURIComponent(cardId)}`, {
  method: 'DELETE',
});
export const changeLikeCardStatus = (cardId, isLiked) => request(`/cards/likes/${encodeURIComponent(cardId)}`, {
  method: isLiked ? 'DELETE' : 'PUT',
});
