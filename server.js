const http = require('http')
const port = process.env.PORT || 3000
const fs = require('fs')
const server = http.createServer((req, res) => {
    fs.readFile(__dirname + req.url, function (err, data) {
        res.writeHead(200)
        res.end(data)
    })

})

server.listen(port, () => { console.log('listening on port ' + port) })
