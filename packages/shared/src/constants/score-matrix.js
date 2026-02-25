"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENT_RATING_ROUNDS = exports.MAX_PLAYERS = exports.NICKNAME_MAX_LENGTH = exports.NICKNAME_MIN_LENGTH = exports.AVATAR_COUNT = exports.SCORE_MATRIX = void 0;
exports.calculateScore = calculateScore;
const decision_types_1 = require("../types/decision.types");
exports.SCORE_MATRIX = {
    [`${decision_types_1.Decision.AGREE}_${decision_types_1.Decision.AGREE}`]: { scoreA: 6, scoreB: 6 },
    [`${decision_types_1.Decision.AGREE}_${decision_types_1.Decision.INSIST}`]: { scoreA: 0, scoreB: 10 },
    [`${decision_types_1.Decision.INSIST}_${decision_types_1.Decision.AGREE}`]: { scoreA: 10, scoreB: 0 },
    [`${decision_types_1.Decision.INSIST}_${decision_types_1.Decision.INSIST}`]: { scoreA: 1, scoreB: 1 },
};
function calculateScore(decisionA, decisionB) {
    const key = `${decisionA}_${decisionB}`;
    const result = exports.SCORE_MATRIX[key];
    if (!result) {
        throw new Error(`Invalid decision combination: ${key}`);
    }
    return result;
}
exports.AVATAR_COUNT = 30;
exports.NICKNAME_MIN_LENGTH = 2;
exports.NICKNAME_MAX_LENGTH = 20;
exports.MAX_PLAYERS = 30;
exports.RECENT_RATING_ROUNDS = 2;
//# sourceMappingURL=score-matrix.js.map