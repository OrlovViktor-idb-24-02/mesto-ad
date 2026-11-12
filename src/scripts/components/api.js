const config = {
  baseUrl: 'https://mesto.nomoreparties.co/v1/apf-cohort-203',
  headers: {
    authorization: "42558611-24e8-4f37-b78f-f4638e558c21",
    'Content-Type': 'application/json',
  },
};

export const getResponseData = (res) =>
  res.ok ? res.json() : Promise.reject(new Error(`Ошибка: ${res.status}`));

const request = (endpoint, options = {}) => {
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
