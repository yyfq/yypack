let path = require('path')
let fs = require('fs')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
let UglifyJS = require("uglify-js")
var CleanCSS = require('clean-css')

let babel = require('babel-core')
let es2015 = require('babel-preset-es2015')

let util = require('./util')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.yypackJSON.release

function optimizeFile(f){
    if (!fs.existsSync(f)){
        return
    }
    let rf = path.relative(tmpDir.c, f)
    let f2 = path.join(tmpDir.d, rf)

    if (util.isext(f, '.js')){
        util.log(`[optimize]: ${rf}`)
        let body = babel.transform(util.getBody(f),{presets: [es2015]}).code
        util.createF(
            f2,
            UglifyJS.minify(body, {fromString:true, output:{'ascii_only':true}, compress: {
                unsafe:true,
                'unsafe_comps':true,
                'unsafe_math':true,
                'unsafe_proto':true,
                'unsafe_regexp':true,
                unused:true,
                toplevel:true
            }, mangle: {
                toplevel:true
            }}).code
        )

    }
    else if (util.isext(f, '.css')){
        util.log(`[optimize]: ${rf}`)
        util.createF(
            f2,
            (new CleanCSS()).minify(util.getBody(f)).styles
        )
    }
    else {
        return util.copy(f, f2)
    }
}

function optimize(){
    let ps = []

    util.walk(tmpDir.c, f=>{
        let p = optimizeFile(f)
        if (p){
            ps.push(p)
        }
    })

    return Promise.all(ps)
}

function watch(){
    util.watch(tmpDir.c, (e,f)=>{
        optimizeFile(path.join(tmpDir.c, f))
    })
}

exports.optimize = optimize
exports.watch = watch
