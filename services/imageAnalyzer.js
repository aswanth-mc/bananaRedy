const sharp = require("sharp");

async function analyzeImage(buffer) {

    console.log("🔬 imageAnalyzer.js started");

    const { data, info } = await sharp(buffer)
        .removeAlpha()
        .raw()
        .toBuffer({
            resolveWithObject: true
        });

    console.log(
        "📐 Image:",
        info.width,
        "x",
        info.height,
        "channels:",
        info.channels
    );

    let greenPixels = 0;
    let yellowPixels = 0;
    let brownPixels = 0;
    let darkPixels = 0;

    const totalPixels =
        info.width * info.height;

    for (
        let i = 0;
        i < data.length;
        i += info.channels
    ) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (
            g > r * 1.1 &&
            g > b * 1.1 &&
            g > 70
        ) {
            greenPixels++;
        }

        else if (
            r > 150 &&
            g > 120 &&
            b < 120 &&
            r > b * 1.4 &&
            g > b * 1.2
        ) {
            yellowPixels++;
        }

        else if (
            r > 60 &&
            r < 190 &&
            g > 35 &&
            g < 140 &&
            b < 100 &&
            r > g * 1.15
        ) {
            brownPixels++;
        }

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

        greenPercent:
            Number(
                ((greenPixels / totalPixels) * 100)
                    .toFixed(2)
            ),

        yellowPercent:
            Number(
                ((yellowPixels / totalPixels) * 100)
                    .toFixed(2)
            ),

        brownPercent:
            Number(
                ((brownPixels / totalPixels) * 100)
                    .toFixed(2)
            ),

        darkPercent:
            Number(
                ((darkPixels / totalPixels) * 100)
                    .toFixed(2)
            )
    };

    console.log(
        "✅ imageAnalyzer result:",
        result
    );

    return result;
}

module.exports = {
    analyzeImage
};