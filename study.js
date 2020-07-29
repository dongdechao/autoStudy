const CryptoJS = require('./crypto-js')

let CommonUtil = {}


CommonUtil.Base64 = function () {
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    this.decode = function (c) {
        var a = "";
        var l, h, f;
        var k, g, e, d;
        var b = 0;
        c = c.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (b < c.length) {
            k = _keyStr.indexOf(c.charAt(b++));
            g = _keyStr.indexOf(c.charAt(b++));
            e = _keyStr.indexOf(c.charAt(b++));
            d = _keyStr.indexOf(c.charAt(b++));
            l = (k << 2) | (g >> 4);
            h = ((g & 15) << 4) | (e >> 2);
            f = ((e & 3) << 6) | d;
            a = a + String.fromCharCode(l);
            if (e != 64) {
                a = a + String.fromCharCode(h);
            }
            if (d != 64) {
                a = a + String.fromCharCode(f);
            }
        }
        a = _utf8_decode(a);
        return a;
    };
    _utf8_decode = function (a) {
        var b = "";
        var d = 0;
        var e = c1 = c2 = 0;
        while (d < a.length) {
            e = a.charCodeAt(d);
            if (e < 128) {
                b += String.fromCharCode(e);
                d++;
            } else {
                if ((e > 191) && (e < 224)) {
                    c2 = a.charCodeAt(d + 1);
                    b += String.fromCharCode(((e & 31) << 6) | (c2 & 63));
                    d += 2;
                } else {
                    c2 = a.charCodeAt(d + 1);
                    c3 = a.charCodeAt(d + 2);
                    b += String.fromCharCode(((e & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    d += 3;
                }
            }
        }
        return b;
    };
};
CommonUtil.encrypt = function (e) {
    var b = "bGVhcm5zcGFjZWFlczEyMw==";
    var a = new CommonUtil.Base64();
    var c = a.decode(b);
    var f = CryptoJS.enc.Utf8.parse(c);
    var d = CryptoJS.AES.encrypt(e, f, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return d.toString();
}
CommonUtil.formatStr = function (c, a) {
    var l = "";
    var k = (c + "").length;
    if (k > 0) {
        if (k + 2 > a) {
            return c + "";
        } else {
            var g = a - k - 2;
            var h = 1;
            for (var e = 0; e < g; e++) {
                h = h * 10;
            }
            var b = parseInt(Math.random() * h);
            var f = (b + "").length;
            if (f < g) {
                for (var d = f; d < g; d++) {
                    b = b * 10;
                }
            }
            if (k >= 10) {
                l += k;
            } else {
                l += "0" + k;
            }
            l += c + (b + "");
        }
    } else {
        return c + "";
    }
    return l;
};

CommonUtil.timeToSeconds = function (f) {
    var b = f.split(":");
    var d = parseInt(b[0]);
    var a = parseInt(b[1]);
    var c = parseInt(b[2]);
    var e = d * 3600 + a * 60 + c;
    return e;
}

function getParams(c) {
    var d = {
        courseId: c.courseId,
        itemId: c.itemId,
        time1: CommonUtil.formatStr((new Date()).getTime(), 20),
        time2: CommonUtil.formatStr(parseInt(c.startTime), 20),
        time3: CommonUtil.formatStr(CommonUtil.timeToSeconds(c.videoTotalTime), 20),
        time4: CommonUtil.formatStr(parseInt(c.endTime), 20),
        videoIndex: c.videoIndex,
        time5: CommonUtil.formatStr(c.studyTimeLong, 20),
        terminalType: c.terminalType
    };
    return d;
}
/**
 * 获取视频轨迹
 */
exports.saveVideoLearnDetailRecord = function (q) {

    var j = getParams(q);
    var g = "";
    g = CommonUtil.encrypt(JSON.stringify(j));

    return g;
}