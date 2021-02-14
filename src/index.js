const {
  Wechaty,
  ScanStatus,
  log,
}               = require('wechaty');
const convert = require('xml-js');

const wechatyCfg = require('../config/wechaty');
const { favorArticle, queryArticle, getMultiArticleLinks } = require('./biz');

function onScan (qrcode, status) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    require('qrcode-terminal').generate(qrcode, { small: true })  // show qrcode on console

    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')

    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

function onLogin (user) {
  log.info('StarterBot', '%s login', user)
}

function onLogout (user) {
  log.info('StarterBot', '%s logout', user)
}

async function onMessage (msg) {
  const contact = msg.from();
  const room = msg.room();
  // 群消息不处理，非指定发件人不处理
  if (room || wechatyCfg.limitedUsers.indexOf(contact.id) < 0) {
    return;
  }

  log.info('StarterBot', msg.toString());
  // link share
  let url = '';
  let title = '';
  // pure text
  let text = '';

  if (msg.type() === bot.Message.Type.Url) { // link share
    const urlObj = await msg.toUrlLink();
    url = urlObj.url();
    title = urlObj.title();
  } else if (msg.type() === bot.Message.Type.MiniProgram) { // miniprogram share
    try {
      const xmlStr = msg.text();
      const xmlObj = convert.xml2js(xmlStr, {compact: true});
      url = xmlObj.msg.appmsg.url._text;
      title = xmlObj.msg.appmsg.title._text;
    } catch (e) {
      log.error('Message parse error:', e);
    }
  } else if (msg.type() === bot.Message.Type.Text) { // text query
    text = msg.text();
  }

  if (url && title) { // link share
    await msg.say(`正在入库：\n${title}\n${url}`);
    const result = await favorArticle(url, title);
    if (result) {
      await msg.say('已入库，等待下次匹配');
    }
  } else if (text) {
    const result = await queryArticle(text);
    if (result.length) {
      await msg.say(getMultiArticleLinks(result));
    } else {
      await msg.say('no node or article found');
    }
  }
}

const bot = new Wechaty({
  name: wechatyCfg.name,
  puppet: wechatyCfg.puppet,
  puppetOptions: { token: wechatyCfg.token }
});

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))

