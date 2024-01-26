import * as xl from 'excel4node'
import fs from 'fs'

const wb = new xl.Workbook();
const ws = wb.addWorksheet('translations');
import * as ph from 'path'

let filename = 'translate'
let path
let outputpath
let jsonDir
let dirFiles
let rows = []
let filesContent = {}

// Process argv:
// 2: Json Files path
// 3: Output route

function init() {
    const rowOffset = 2
    let columnIndex = 1

    path = cleanPath(process.cwd().replace(/\\/g, '/'), false)
    filename = path.replace(/\/$/, '').split('/').pop()
    jsonDir = process.argv[2] && process.argv[2] != '' ? cleanPath(process.argv[2]) : ''
    outputpath = path

    const output = process.argv[3]

    if (output) {
        if (output.match('/')) {
            outputpath = cleanPath(output.replace(/[^\/]*$/, ''), false)
        }
        if (!output.match('/$')) {
            filename = getFilename(ph.basename(output))
        }
    }

    dirFiles = fs.readdirSync(cleanDoubleSlash(path + jsonDir))
    processJsons()

    //Agrego todos los textID (key) de cada lenguaje (por si algun lenguaje tiene alguno extra)
    Object.keys(filesContent).forEach(lang => {
        addRows(filesContent[lang])
    })

    //Escribo los textID obtenidos en la columna 1
    rows.forEach((textID, row) => {
        ws.cell(row + rowOffset, columnIndex).string(textID)
    })

    //Escribo en cada columna primero el lenguaje y luego en cada fila de esa columna el contenido
    Object.keys(filesContent).forEach((lang, column) => {
        ws.cell(1, ++columnIndex).string(lang)
        rows.forEach((textID, row) => {
            ws.cell(row + rowOffset, columnIndex).string(filesContent[lang][textID] ?? '')
        })
    })

    const outputfile = cleanDoubleSlash(outputpath + filename)
    fs.writeFileSync(`${outputfile}.xlsx`, '')
    wb.write(`${outputfile}.xlsx`);
}

function cleanDoubleSlash(text) {
    return text.replace(/(\/){2,}/, '/')
}

function cleanPath(path, start = true) {
    if (start && !path.match('^/')) {
        path = '/' + path
    }
    if (!path.match('/$')) {
        path = path.concat('/')
    }
    return path
}

function getFilename(file) {
    return file.replace(/\.[^/.]+$/, "")
}

function addRows(data) {
    Object.keys(data).forEach(key => {
        if (!rows.includes(key)) {
            rows.push(key)
        }
    })
}

function processJsons() {
    dirFiles.forEach((file) => {
        const fileContent = readJson(cleanDoubleSlash(path + jsonDir + file))
        filesContent[getFilename(file)] = fileContent
    })
}

function readJson(name) {
    return JSON.parse(fs.readFileSync(name, {encoding: 'utf-8'}))
}

init()