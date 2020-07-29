/*
 * @Author: your name
 * @Date: 2020-07-20 09:23:43
 * @LastEditTime: 2020-07-23 11:05:29
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node爬虫\新视频播放\index.js
 */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Person = require('./person');
const {
  并发数量
} = require('./config');
const request = require('request-promise').defaults({
  jar: true,
});
let accountList = fs
  .readFileSync(path.join(__dirname, './1.txt'), 'utf8')
  .split('\r\n');
fs.writeFileSync(path.join(__dirname, './已经完成.txt'), '');
let files = fs.readdirSync(__dirname);
files.forEach((file, index) => {
  if (file.includes('_验证码')) {
    fs.unlinkSync(path.join(__dirname, file));
  }
});
let queue = [];
accountList = accountList.filter((e) => e !== '');
accountList = _.uniq(accountList)
let accountList_copy = _.cloneDeep(accountList);

async function control(user) {
  console.log(user.account + '开始任务');
  let person = new Person(user);
  await person.study();
  console.log(person.account + '完成任务');
  _.remove(accountList, (e) => e.split('----')[0] === person.account);
  _.remove(queue, (e) => e.split('----')[0] === person.account);

}

(async () => {


  while (accountList.length > 0) {
    if (queue.length < 并发数量 && accountList_copy.length > 0) {
      queue.push(accountList_copy[0]);
      let element = accountList_copy.shift();
      let user = {
        account: element.split('----')[0],
        password: element.split('----')[1],
      };
      control(user);
    }
    await delayTime(1000);
  }
})();

function delayTime(params) {
  params = params || 1000;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, params);
  });
}