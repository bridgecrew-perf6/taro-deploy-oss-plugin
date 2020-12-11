const co = require("co");
const fs = require("fs");
const OSS = require("ali-oss");
const path = require("path");
const { exec, execSync } = require("child_process");
const files = [];
//取出所有文件夹下所有文件的路径
function readDirSync(p) {
    let pa = fs.readdirSync(p);
    pa.forEach((e) => {
        const cur_path = `${p}/${e}`;
        const info = fs.statSync(cur_path);
        if (info.isDirectory()) {
            readDirSync(cur_path);
        } else {
            if (cur_path.indexOf("assets/images") > 0) {
                files.push(cur_path);
            }
        }
    });
}

module.exports = (ctx, options) => {
    
    // plugin 主体
    ctx.onBuildStart(() => {
        console.log("上传开始!");
        console.log(1)
        // 入口
        let entry = options.path;
        // 当前环境
        const mode = options.env;
        // oss阿里参数
        let ossConfig = options.ossConfig;
        let bucket = options.bucket;
        // 当前上传
        const currentBucket = bucket[mode];
        // 根据环境获取bucket
        ossConfig.bucket = currentBucket.name;
        const client = new OSS(ossConfig);
        const root = path.resolve(__dirname, `${entry}`);
     
        readDirSync(root);
        //上传文件
        co(function*() {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                //文件名取root后面的,添加项目文件夹，默认为空
                const projectRootPath = currentBucket.projectPath
                    ? currentBucket.projectPath
                    : "";
                const result = yield client.put(
                    file.replace(root, projectRootPath),
                    file
                );
                console.log(result)
               options&&options.success(result);
            }
        }).catch(function(err) {
            console.log(err);
        });
    });

    ctx.modifyWebpackChain((args) => {});
    ctx.modifyBuildAssets((args) => {});

    ctx.onBuildFinish(() => {
   

        options&&options.finish();

    });
};
