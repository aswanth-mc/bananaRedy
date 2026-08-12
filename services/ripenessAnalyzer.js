function calculateRipeness(features) {

    const {
        greenPercent = 0,
        yellowPercent = 0,
        brownPercent = 0,
        darkPercent = 0
    } = features;


    // ========================================
    // IMPORTANT:
    // Ignore small background/color noise
    // by looking at the relative distribution
    // of detected banana-like colors.
    // ========================================

    const bananaColorPixels =
        greenPercent +
        yellowPercent +
        brownPercent +
        darkPercent;


    const brownDarkPercent =
        brownPercent +
        darkPercent;


    const brownDarkRatio =
        bananaColorPixels > 0
            ? (brownDarkPercent / bananaColorPixels) * 100
            : 0;


    const greenYellowRatio =
        bananaColorPixels > 0
            ? (
                (greenPercent + yellowPercent)
                / bananaColorPixels
            ) * 100
            : 0;


    let score;


    // ========================================
    // STRONG OVERRIPE / DARK CONDITION
    // ========================================

    if (
        brownDarkRatio >= 60 ||
        darkPercent >= 25
    ) {

        score = 90;

    }


    // ========================================
    // CLEARLY OVERRIPE
    // ========================================

    else if (
        brownDarkRatio >= 45 ||
        brownPercent >= 30
    ) {

        score = 82;

    }


    // ========================================
    // MOSTLY GREEN
    // ========================================

    else if (
        greenPercent >= yellowPercent &&
        greenPercent >= brownPercent &&
        greenPercent >= darkPercent
    ) {

        score = 20;

    }


    // ========================================
    // MOSTLY YELLOW
    // ========================================

    else if (
        yellowPercent >
        greenPercent &&
        yellowPercent >
        brownPercent &&
        yellowPercent >
        darkPercent
    ) {

        if (brownDarkRatio < 20) {
            score = 65;
        } else {
            score = 75;
        }

    }


    // ========================================
    // MIXED GREEN + YELLOW
    // ========================================

    else if (
        greenYellowRatio >= 65
    ) {

        score = 40;

    }


    // ========================================
    // DEFAULT
    // ========================================

    else {

        score = 55;

    }


    score =
        Math.max(
            0,
            Math.min(100, Math.round(score))
        );


    // ========================================
    // CLASSIFICATION
    // ========================================

    let stage;
    let condition;
    let recommendation;


    if (
        brownDarkRatio >= 60 ||
        darkPercent >= 25
    ) {

        stage = "OVER-RIPE";

        condition = "Very ripe";

        recommendation =
            "You've entered the final banana chapter. Eat soon and inspect carefully.";

    }

    else if (
        brownDarkRatio >= 45 ||
        brownPercent >= 30
    ) {

        stage = "EAT SOON";

        condition = "Overripe";

        recommendation =
            "The banana looks very mature. Best to eat soon.";

    }

    else if (
        greenPercent >= yellowPercent &&
        greenPercent >= brownPercent &&
        greenPercent >= darkPercent
    ) {

        stage = "NOT RIPE";

        condition = "Unripe";

        recommendation =
            "Too green for this visual profile. Give me more time.";

    }

    else if (
        yellowPercent >
        greenPercent &&
        yellowPercent >
        brownPercent &&
        yellowPercent >
        darkPercent
    ) {

        if (brownDarkRatio < 15) {

            stage = "READY TO EAT";

            condition = "Good";

            recommendation =
                "The visible appearance suggests a good eating stage.";

        } else {

            stage = "EAT SOON";

            condition = "Ripe";

            recommendation =
                "Looks ripe with visible browning. Eat soon.";

        }

    }

    else if (
        greenYellowRatio >= 65
    ) {

        stage = "ALMOST READY";

        condition = "Developing";

        recommendation =
            "The banana is still showing a lot of green. Check again later.";

    }

    else {

        stage = "UNCERTAIN";

        condition = "Uncertain";

        recommendation =
            "The visual features are unusual. Even the Banana Intelligence Department is unsure.";

    }


    return {
        score,
        stage,
        condition,
        recommendation,

        // Useful for debugging
        brownDarkRatio:
            Number(brownDarkRatio.toFixed(2)),

        greenYellowRatio:
            Number(greenYellowRatio.toFixed(2))
    };
}


module.exports = {
    calculateRipeness
};