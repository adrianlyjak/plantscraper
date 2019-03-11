

const puppeteer = require('puppeteer')
const fs = require('fs')
const imageDataURI = require('image-data-uri')

const categories = require('../data/practicalplants.org')

async function main() {
    const browser = await puppeteer.launch({
        headless: false, // Change this to false for debugging
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36")
    
    let proxy;
    if (proxy) {
        const { username, password } = proxy
        await page.authenticate({ username, password })
    }

    // page.setRequestInterception(true)
    // your code here buddy

    await runCategories(page)
}



main()

let written
// try {
const read = fs.readFileSync('./data/complete.js', {encoding: 'utf8'})
written = read.split('\n').filter(x => x).map(x => {
    return JSON.parse(x)
})
// } catch (e) {
//     written = []
// }

console.log({written})
async function runCategories(page) {
    
    for (let [name] of categories) {
        const plants = fs.readFileSync(`./data/${name}/plants.txt`).toString().split('\n')
        for (let p of plants) {
            if (written.find(([otherName, otherPlant]) => name == otherName && p == otherPlant)) {
                console.log(`skipping ${name} ${p} - already ran`)
            } else {try{
                let url = `https://www.google.com/search?q=${p.replace(/\s+/, "+")}+leaf&tbm=isch&tbs=itp:photo,ic:color&as_st=y&hl=en&gbv=1&sei=YkKEXKSxCKOb_Qa9vbGgCw`
                
                let responses = []
            

                const onResponse = resp => {
                    if (resp.url().includes('https://encrypted-tbn0.gstatic.com/images')) {
                        responses.push(resp.buffer().catch(ex => {}))
                    }
                }
                page.on('response', onResponse)

                await page.goto(url)

                await new Promise(res => setTimeout(res, 2000))
                let current = 0
                let target = 7000
                while (current < target) {
                    let next = current+=1000
                    await page.evaluate((next) => window.scroll(0, next), next)
                    await new Promise(res => setTimeout(res, 1000))    
                }
                
                const srcs = await page.evaluate(({}) => {
                    return Array.from(document.querySelectorAll("img.rg_ic"))
                        .map(x => x.getAttribute('src')).filter(x => x && x.includes('data:'))
                }, {})

                
                const buffs = await Promise.all(responses).then(xs => xs.filter(x => x))
                page.removeListener('response', onResponse)
                let index = 0
                for (let src of srcs) {
                    imageDataURI.outputFile(src, `./data/${name}/${p.replace("\\s+", "_")}---${index}.jpg`)
                    index++
                }
                console.log(`writing ${buffs.length} images for ${name} - ${p}
-- ${srcs.length} from src attribute and ${responses.length} responses intercepted`)

            
                for (let buff of buffs) {
                    if (buff) 
                    await new Promise(res => fs.writeFile(
                        `./data/${name}/${p.replace("\\s+", "_")}---${index}.jpg`,
                        buff,
                        () => res()
                    ))
                    index++
                }
                fs.appendFileSync('./data/complete.js', JSON.stringify([name, p]) + '\n')
            } catch (e) {
                console.error('kablam', e)
            }}
        }
    }
}

async function pullPlants(page) {
    throw new Error("Not Implemented (did in scala)")
    // select ".common-name" from each url in categories
    //
}