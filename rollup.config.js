// rollup.config.js
import kontra from 'rollup-plugin-kontra'

export default {
    entry: 'src/index.js',
    dest: 'build/main.min.js',
    plugins: [
        kontra({
            gameObject: {
                acceleration: true,
                anchor: true,
                group: true,
                opacity: true,
                rotation: true,
                scale: true,
                ttl: true,
                velocity:true,
            },
            vector: {
                angle: true,
                clamp: true,
                distance: true,
                dot: true,
                normalize: true,
                subtract: true,
                scale: true,
            }
        })
    ],
    format: 'iife',
    sourceMap: 'inline',
    input: {

    },
    input: 'src/index.js',
    output: {
        file: 'build/bundle.js',
    }
}
