/*
 * @Author: your name
 * @Date: 2020-07-20 09:11:35
 * @LastEditTime: 2020-07-23 09:37:43
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node爬虫\青海电大教学视频 - 副本\person.js
 */

const {
  hex_md5
} = require('./md5');
const {
  saveVideoLearnDetailRecord
} = require('./study.js');
const _ = require('lodash');
let courseList = require('./video.json');
let IPS = require('./ip.json')
let {
  client_id,
  client_secret,
  waitTimes
} = require('./config');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const superagent = require('superagent')

function delayTime(params) {
  params = params || 1000;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, params);
  });
}

/**
 * 用户
 */
module.exports = class Person {
  constructor(user) {
    this.account = user.account;
    this.password = user.password;
    this.name = '';
    this.cookie_3q3z = '';
    this.cookie_thty = '';
    this.access_token = '';
    this.request = require('request-promise');
    this.superagent_agent = require('superagent-proxy')(superagent).agent();

    this.courseList = _.cloneDeep(courseList);
    this.success = [];
    this.选择课程 = [];
    this.ipindex = 0
  }

  async study() {
    try {
      if (!this.cookie_thty) {
        await this.login();
      }
      await this.getStudyContent();
      await this.lookVideo();
      console.log(`${this.account} ====> 完成学习`);
    } catch (error) {
      console.log('error =>', error);
      this.success = [];
      this.courseList = _.cloneDeep(courseList);
      console.log(`${this.account} ====> 学习出错,重启任务`);
      await this.study();
    }
  }

  async login() {
    console.log(`账号:${this.account},开始登陆`);


    try {
      //获取百度图片识别
      // let ip_item = IPS[this.ipindex]
      // let ip = `https://${ip_item.Ip}:${ip_item.Port}`
      let ip_item = [
        '156.251.125.135:7173',
        '156.251.125.135:7173',
        '156.251.125.135:7280',
        '156.251.125.135:7197',
        '156.251.125.135:7187',
        '47.74.232.57:26880',
        '156.251.125.135:7298',
        '156.251.125.135:7453',
        '156.251.125.135:7202',
        '47.74.232.57:26718',
        '47.74.232.57:27112',
      ][this.ipindex]
      let ip = `https://${ip_item}`
      this.ipindex++;
      let options = {
        // url: 'https://cart.books.com.tw/member/login',
        url: 'https://www.qhce.gov.cn/',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
          Connection: 'Keep-Alive',
          cookie: 'bid=5f20590602325; __gads=ID=24fdb01800772dc4:T=1595955474:S=ALNI_MaIZiwETSeEfwrIEfW2xzrAcfhmZg; _gcl_au=1.1.28585779.1595955475; _ga=GA1.3.342218789.1595955474; _gid=GA1.3.752505869.1595955476; _fbp=fb.2.1595955476907.43835527; afk=2b0f40560955f20596297d43084270603; cid=piglet8602; pd=B4zhlWmrNbsZsO9ATRIj6ivrC6; t=5848b7bb11589eb582b6a4957a5b9fc60ddba2c783b9552a132bbc7aac4cd207d4a0f4344a3cff54; 2fassid_d=a%3A1%3A%7Bi%3A1%3Bs%3A32%3A%22c38f1fd192247d24a266a039b6679485%22%3B%7D; ukk=57c91701ba29f3fdaa001e8e38a5c75f8d4a81de; PHPSESSID=udi88852r564aef970d7msgkb0'
        },
        proxy: ip,
        timeout: 5000,
        pool: false
      }
      let ret = await this.request(options)

      //请求主页获取cookie
      console.log(`账号:${this.account},获取登录主页的cookie`);




    } catch (error) {
      console.log('error', error);
      console.log(`账号:${this.account},登录失败重新登录`);
      await this.login();
    }
  }

  async getStudyContent() {
    console.log(`账号:${this.account},获取 学习内容`);
    let getClassOptions = {
      method: 'get',
      url: `http://3q3z.pep.com.cn/learning/u/student/training/settingInfo.action`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        Connection: 'Keep-Alive',
        Host: '3q3z.pep.com.cn',
        cookie: this.cookie_3q3z,
      },
    };
    let body = await this.request(getClassOptions);

    let $ = cheerio.load(body);
    this.选择课程 = [];
    _.map($('[checked="checked"]'), (e) => {
      this.选择课程.push($(e).parent().text());
    });
    // 选择课程 = ['小学语文'];
    this.courseList = this.courseList.filter((e) =>
      this.选择课程.includes(e.课程)
    );
    for (let index = 0; index < this.courseList.length; index++) {
      //步骤1：记录学习时间
      let courseId = this.courseList[index].courseId;
      let classId = this.courseList[index].classId;
      let itemId = this.courseList[index].itemId;
      let videoTime = this.courseList[index].videoTime;
      let md5key = 'md5Value';
      let sign = hex_md5(classId + this.account + courseId + md5key);
      //步骤2:激活视频，防止没有权限
      let activeOptions2 = {
        method: 'post',
        url: 'http://3q3z.pep.com.cn/patch/thtypep/selectCourseToClass.action',
        headers: {
          Origin: 'http://3q3z.pep.com.cn',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
          Connection: 'Keep-Alive',
          cookie: this.cookie_3q3z,
        },
        form: {
          openCourseId: courseId,
          classId: classId,
          loginId: this.account,
          sign: sign,
        },
      };
      try {
        let ret = await this.request(activeOptions2);
      } catch (error) {
        console.log('激活视频失败', this.account, this.courseList[index].name)
      }


      //步骤3:获取视频的已观看时间
      let getLearnTimeOptions = {
        method: 'post',
        url: `http://thtypep.p.kfkc.webtrn.cn/learnspace/learn/learn/common/video_learn_record_detail.action`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
          Connection: 'Keep-Alive',
          Host: 'thtypep.p.kfkc.webtrn.cn',
          cookie: this.cookie_thty,
        },
        form: {
          'params.courseId': `${courseId}___`,
          'params.itemId': itemId,
          'params.videoTotalTime': videoTime,
        },
      };
      let body = await this.request(getLearnTimeOptions);

      let $ = cheerio.load(body);
      let haveLearnTime = '00:00:00'
      // let haveLearnTime = $('.track-txt')
      //   .first()
      //   .next()
      //   .text()
      //   .split('结束：')[1];
      let nowatchList = $('.track-tit4');
      if (nowatchList.length > 0) {
        haveLearnTime = $(nowatchList[0]).next().text().split('开始：')[1];
      } else {
        haveLearnTime = this.courseList[index].videoTime
      }
      let temp = haveLearnTime.split(':');
      let time_s = temp[0] * 3600 + +temp[1] * 60 + +temp[2];
      console.log(
        this.account + '=====>' + '获取课程已经学习时间：',
        this.courseList[index].name,
        'haveLearnTime',
        haveLearnTime
      );
      this.courseList[index].currentTime = this.courseList[
        index
      ].startTime = time_s;
      this.courseList[index].endTime = this.courseList[index].currentTime;
      temp = videoTime.split(':');
      this.courseList[index].total_time =
        temp[0] * 3600 + +temp[1] * 60 + +temp[2];
      if (
        this.courseList[index].startTime >= this.courseList[index].total_time
      ) {
        this.courseList[index].done = true;
        this.success.push(this.courseList[index]);
      }
    }
  }

  async lookVideo() {
    console.log(`账号:${this.account},开始播放视频`);

    while (!this.complete) {
      //对多个视频做一个初始化请求
      for (let index = 0; index < this.courseList.length; index++) {
        if (this.courseList[index].done) {
          continue;
        }
        let courseId = this.courseList[index].courseId;
        console.log(
          `${this.account} =====> itemId:${
            this.courseList[index].itemId
          },视频:${this.courseList[index].课程}--${
            this.courseList[index].name
          },总学习时间:${this.courseList[index].total_time},还需要学习时间:${
            this.courseList[index].total_time -
            this.courseList[index].currentTime
          }`
        );

        let queryLearningTimeOptions = {
          method: 'post',
          url: 'http://thtypep.p.kfkc.webtrn.cn/learnspace/course/study/learningTime_queryLearningTime.action',
          headers: {
            Referer: `http://thtypep.p.kfkc.webtrn.cn/learnspace/learn/learn/blue/index.action?params.courseId=${courseId}&params.templateType=&params.templateStyleType=&params.template=blue&params.classId=&params.tplRoot=learn`,
            Host: 'thtypep.p.kfkc.webtrn.cn',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
            Connection: 'Keep-Alive',
            cookie: this.cookie_thty,
          },
          form: {
            courseId: courseId,
          },
        };
        let ret = await this.request(queryLearningTimeOptions);

        if (/您没有该课程的访问权限/.test(ret)) {
          console.log('queryLearningTimeOptions', ret);
        }
      }
      console.log(
        `${this.account} =====> 成功：${this.success.length};总量:${this.courseList.length}`
      );
      console.log(
        this.account +
        '=====>' +
        new Date().toLocaleTimeString() +
        ':开始等待' +
        waitTimes +
        '秒'
      );

      //多个视频同时等待
      await delayTime(waitTimes * 1000);

      //等待完成之后
      for (let index = 0; index < this.courseList.length; index++) {
        if (this.courseList[index].done) {
          continue;
        }
        let itemId = this.courseList[index].itemId;
        let courseId = this.courseList[index].courseId;
        let videoTime = this.courseList[index].videoTime;
        let temp = videoTime.split(':');
        let time_s = temp[0] * 3600 + +temp[1] * 60 + +temp[2];
        this.courseList[index].endTime =
          this.courseList[index].currentTime + waitTimes + waitTimes;
        if (this.courseList[index].endTime >= time_s) {
          this.courseList[index].done = true;
          this.courseList[index].endTime = time_s;
          this.success.push(this.courseList[index]);
        }
        //保存学习时间
        let saveLearningTimeOptions = {
          method: 'post',
          url: 'http://thtypep.p.kfkc.webtrn.cn/learnspace/course/study/learningTime_saveLearningTime.action',
          headers: {
            Referer: `http://thtypep.p.kfkc.webtrn.cn/learnspace/learn/learn/blue/index.action?params.courseId=${courseId}&params.templateType=&params.templateStyleType=&params.template=blue&params.classId=&params.tplRoot=learn`,
            Host: 'thtypep.p.kfkc.webtrn.cn',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
            Connection: 'Keep-Alive',
            cookie: this.cookie_thty,
          },
          form: {
            courseId,
            studyTime: 300,
          },
        };
        let ret = await this.request(saveLearningTimeOptions);

        let params = {
          courseId: courseId,
          itemId: itemId,
          startTime: this.courseList[index].currentTime,
          videoTotalTime: videoTime,
          endTime: this.courseList[index].endTime,
          videoIndex: 0,
          studyTimeLong: this.courseList[index].endTime - this.courseList[index].currentTime,
          terminalType: 0,
        };
        //获取轨迹数据
        let studyRecord = saveVideoLearnDetailRecord(params);

        let studyRecordOptions = {
          method: 'post',
          url: 'http://thtypep.p.kfkc.webtrn.cn/learnspace/course/study/learningTime_saveVideoLearnDetailRecord.action',
          headers: {
            Referer: `http://thtypep.p.kfkc.webtrn.cn/learnspace/learn/learn/blue/content_video.action?params.courseId=${courseId}&params.itemId=${itemId}&params.parentId=ff8080816b41c9b7016b45995aef3e17&params.videoTime=2652&_t=1594315611007&_t=1594315611007`,
            Host: 'thtypep.p.kfkc.webtrn.cn',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
            Connection: 'Keep-Alive',
            cookie: this.cookie_thty,
          },
          form: {
            studyRecord,
          },
        };
        ret = await this.request(studyRecordOptions);
        this.courseList[index].currentTime = this.courseList[index].endTime;
        // console.log('studyRecordOptions', ret);
      }

      // require('fs').writeFileSync(
      //   require('path').join(__dirname, './完成状态.json'),
      //   JSON.stringify(this.courseList)
      // );

      let balance = this.courseList.filter((e) => !e.done);
      if (balance.length === 0) {
        this.complete = true;
        let str = fs.readFileSync(
          path.join(__dirname, './已经完成.txt'),
          'utf8'
        );

        str =
          str +
          `${this.account}----${
            this.password
          }---${new Date().toLocaleTimeString()}----${this.选择课程.join(
            '----'
          )}` +
          '\r\n';
        require('fs').writeFileSync(
          require('path').join(__dirname, './已经完成.txt'),
          str
        );
      }
    }
  }
};