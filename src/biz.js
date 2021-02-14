const axios = require('axios');

const {
  favorApi,
  queryApi,
  username,
  password,
} = require('../config/ziki');

async function favorArticle(link, title) {
  try {
    const res = await axios.post(favorApi, { link, title }, {
      auth: {
        username,
        password,
      }
    })
    if (res && res.data === 'success') {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function queryArticle(node) {
  try {
    const res = await axios.get(queryApi, {
      params: { node },
      auth: {
        username,
        password,
      }
    })
    if (res && res.data && res.data.result === 'success') {
      return res.data.data || [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function getMultiArticleLinks(articles) {
  return articles.reduce((res, item) => {
    return `${res}《${item.rssTitle}》\n${item.rssLink}\n`;
  }, '');
}

module.exports = {
  favorArticle,
  queryArticle,
  getMultiArticleLinks,
}
