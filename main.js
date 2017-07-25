const log = console.log.bind(console)
// 导入所需库
const request = require('sync-request')
const cheerio = require('cheerio')
const requestJpg = require('request')
const fs = require('fs')

// 定义一个电影数据的类
class Movie {
    constructor() {
        // 分别是电影名/评分/排名/导演/主演/类型/简介/封面图片链接
        this.name = ''
        this.ranking = 0
        this.score = 0
        this.director = ''
        this.coStar = ''
        this.type = ''
        this.discription = ''
        this.coverUrl = ''
    }
}

const cachedUrl = url => {
    var cacheFile = 'cached_html/' + url.split('top100/')[1]
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        var r = request('GET', url)
        var body = r.getBody('utf-8')
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

const getAText = function(as) {
    var s = []
    for (var i = 0; i < as.length; i++) {
        var a1 = cheerio.load(as[i]).text()
        s.push(a1)
    }
    var s = s.join('/')
    return s
}

const movieFromDiv = function(div) {
    var e = cheerio.load(div)
    // 分析 html 结构
    var movie = new Movie()
    movie.name = e('.mov_pic').find('img').attr('alt')
    movie.discription = e('.mt3').text()
    movie.ranking = e('.number').find('em').text()
    movie.score = e('.total').text() + e('.total2').text()
    movie.coverUrl = e('.mov_pic').find('img').attr('src')
    var ps = e('p')
    movie.director = e(ps[0]).find('a').text()
    var as = e(ps[1]).find('a')
    movie.coStar = getAText(as)
    var bs = e(ps[2]).find('a')
    movie.type = getAText(bs)
    return movie
}

const moviesFromUrl = function(url) {
    var body = cachedUrl(url)
    var e = cheerio.load(body)
    var list = e('.top_list')
    var movieLis = list.find('li')
    var movies = []
    for (var i = 0; i < movieLis.length; i++) {
        var div = movieLis[i]
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

const saveMovie = function(movies) {
    var s = JSON.stringify(movies, null, 2)
    var path = 'shiguang.txt'
    fs.writeFileSync(path, s)
}

const downloadCovers = movies => {
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        requestJpg(url).pipe(fs.createWriteStream(path))
    }
}

const __main = function() {
    // 主函数
    var movies = []
    for (var i = 0; i < 10; i++) {
        var ind = ['', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10']
        var index = ind[i]
        var url = `http://www.mtime.com/top/movie/top100/index${index}.html`
        var moviesInPage = moviesFromUrl(url)
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    downloadCovers(movies)
}

__main()
