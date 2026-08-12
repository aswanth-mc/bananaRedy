function calculateRipeness(features) {
    const {
        greenPercent,
        yellowPercent,
        brownPercent,
        darkPercent
    } = features;

    let score = 50;

    // Green usually indicates earlier ripening
    score -= greenPercent * 0.35;

    // Yellow is generally associated with ripeness
    score += yellowPercent * 0.45;

    // Brown areas increase with overripening
    score -= brownPercent * 0.25;

    // Large dark areas are a stronger negative signal
    score -= darkPercent * 0.50;

    score = Math.round(
        Math.max(0, Math.min(100, score))
    );

    let stage;
    let recommendation;
    let condition;

    if (darkPercent >= 20 || brownPercent >= 45) {
        stage = "POSSIBLE VISUAL SPOILAGE";
        recommendation = "Inspect carefully before eating.";
        condition = "Poor";
    } else if (score < 30) {
        stage = "NOT RIPE";
        recommendation = "Wait before eating.";
        condition = "Unripe";
    } else if (score < 55) {
        stage = "ALMOST READY";
        recommendation = "It may need more time.";
        condition = "Developing";
    } else if (score < 75) {
        stage = "READY TO EAT";
        recommendation = "Looks ready based on visible features.";
        condition = "Good";
    } else if (score < 90) {
        stage = "EAT SOON";
        recommendation = "Best to eat soon.";
        condition = "Ripe";
    } else {
        stage = "OVER-RIPE";
        recommendation = "Eat soon or inspect carefully.";
        condition = "Overripe";
    }

    return {
        score,
        stage,
        recommendation,
        condition
    };
}

module.exports = {
    calculateRipeness
};