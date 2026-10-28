const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 8080

const app = express()
// Local preview only. Production uses nginx + the backend containers.
// Never expose the repository, credentials or server source as static files.
app.use(express.static(path.resolve(__dirname, 'build')))

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.listen(PORT)
