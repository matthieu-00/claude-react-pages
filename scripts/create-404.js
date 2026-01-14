import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')

// Read the built index.html
const indexHtmlPath = join(distDir, 'index.html')
const indexHtml = readFileSync(indexHtmlPath, 'utf-8')

// Redirect script for GitHub Pages SPA routing
const redirectScript = `
    <script>
      // Single Page Apps for GitHub Pages
      // https://github.com/rafgraph/spa-github-pages
      // This script takes the current url and converts the path and query
      // string into just a query string, and then redirects the browser
      // to the new url with only a query string and hash fragment,
      // e.g., https://www.foo.com/pst-toolings/one/two?a=b&c=d#qwe, becomes
      // https://www.foo.com/pst-toolings/?/one/two&a=b~and~c=d#qwe
      // Note: this 404.html file must be at least 512 bytes for some
      // browsers to accept it as a valid 404 page. Otherwise, the browser
      // will show its default 404 page.

      var l = window.location;
      var pathname = l.pathname;
      
      // Extract the path after /pst-toolings
      var pathAfterBase = pathname.replace(/^\\/pst-toolings/, '') || '/';
      
      // Build the redirect URL
      var redirectUrl = l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        '/pst-toolings/?/' + pathAfterBase.slice(1).replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash;
      
      l.replace(redirectUrl);
    </script>`

// Inject the redirect script into the head section
const modifiedHtml = indexHtml.replace('</head>', redirectScript + '\n  </head>')

// Write 404.html
const html404Path = join(distDir, '404.html')
writeFileSync(html404Path, modifiedHtml, 'utf-8')

console.log('Created 404.html from index.html with redirect script')
