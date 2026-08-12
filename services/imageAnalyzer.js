const sharp = require("sharp");

async function analyzeImage(buffer) {
    console.log("🔬 Starting banana image analysis...");

    const { data, info } = await sharp(buffer)
        .resize({
            width: 300,
            height: 300,
            fit: "inside"
        })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    console.log(
        `📐 Analysis image: ${info.width} x ${info.height}`
    );

    let greenPixels = 0;
    let yellowPixels = 0;
    let brownPixels = 0;
    let darkPixels = 0;

    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Green
        if (
            g > r * 1.10 &&
            g > b * 1.10 &&
            g > 60
        ) {
            greenPixels++;
            continue;
        }

        // Yellow
        if (
            r > 150 &&
            g > 120 &&
            b < 130 &&
            r > b * 1.25 &&
            g > b * 1.10
        ) {
            yellowPixels++;
            continue;
        }

        // Brown
        if (
            r > 60 &&
            r < 190 &&
            g > 30 &&
            g < 140 &&
            b < 110 &&
            r > g * 1.15 &&
            g > b * 1.15
        ) {
            brownPixels++;
            continue;
        }

        // Dark / black
        if (
            r < 55 &&
            g < 55 &&
            b < 55
        ) {
            darkPixels++;
        }
    }

    const result = {
        width: info.width,
        height: info.height,

        greenPercent: Number(
            ((greenPixels / totalPixels) * 100).toFixed(2)
        ),

        yellowPercent: Number(
            ((yellowPixels / totalPixels) * 100).toFixed(2)
        ),

        brownPercent: Number(
            ((brownPixels / totalPixels) * 100).toFixed(2)
        ),

        darkPercent: Number(
            ((darkPixels / totalPixels) * 100).toFixed(2)
        )
    };

    console.log("🎨 Banana visual features:", result);

    return result;
}

module.exports = {
    analyzeImage
};