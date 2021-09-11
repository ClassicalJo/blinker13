let nodes = ['canvas', 'body', 'html']
let [canvas, body, html] = nodes.map(key => document.querySelector(key))

export const WORLD_X = 5
export const WORLD_Y = 5
export const WORLD_Z = 3
export const WORLD_INITIAL_COORDS = [0, 0, 0]
export const WORLD_WIDTH = canvas.width
export const WORLD_HEIGHT = canvas.height
export const WORLD_CENTER_WIDTH = WORLD_WIDTH / 2
export const WORLD_CENTER_HEIGHT = WORLD_HEIGHT / 2

function style(node) {
    let s = node.style
    s.position = 'absolute'
    s.height = '100vh'
    s.width = '100vw'
    s.margin = 0
    s.overflow = 'hidden'
}
function styleBody(node) {
    let s = node.style
    s.display = 'flex'
    s.height = '100 %';
    s.alignItems = 'center';
    s.justifyContent = 'center';
}
style(html)
style(body)
styleBody(body)
canvas.style.height = '100vh'



