export interface Score {
    name: string;
    score: number;
}

const LEADERBOARD_KEY = 'figsInSpaceLeaderboard';
const MAX_SCORES = 10;

class LeaderboardManager {
    private static instance: LeaderboardManager;

    private constructor() {
        this.init();
    }

    public static getInstance(): LeaderboardManager {
        if (!LeaderboardManager.instance) {
            LeaderboardManager.instance = new LeaderboardManager();
        }
        return LeaderboardManager.instance;
    }

    private init() {
        const scores = this.getScores();
        if (scores.length === 0) {
            const defaultScores: Score[] = [];
            for (let i = 0; i < MAX_SCORES; i++) {
                defaultScores.push({ name: '...', score: 0 });
            }
            this.saveScores(defaultScores);
        }
    }

    public getScores(): Score[] {
        const scoresJson = localStorage.getItem(LEADERBOARD_KEY);
        if (!scoresJson) {
            return [];
        }
        try {
            const scores = JSON.parse(scoresJson) as Score[];
            return scores.sort((a, b) => b.score - a.score);
        } catch (e) {
            console.error('Error parsing leaderboard scores', e);
            return [];
        }
    }

    private saveScores(scores: Score[]) {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores));
    }

    public isHighScore(score: number): boolean {
        if (score === 0) {
            return false;
        }
        const scores = this.getScores();
        if (scores.length < MAX_SCORES) {
            return true;
        }
        const lowestScore = scores[scores.length - 1].score;
        return score > lowestScore;
    }

    public addScore(score: number, name?: string): void {
        if (!name) {
            name = this.generateRandomName();
        }
        const scores = this.getScores();
        scores.push({ name, score });
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > MAX_SCORES) {
            scores.pop();
        }
        this.saveScores(scores);
    }

    private generateRandomName(): string {
        const adjectives = ['Hot', 'Race', 'Super', 'Mega', 'Ultra', 'Cosmic', 'Galactic', 'Atomic', 'Rocket', 'Space'];
        const nouns = ['Dog', 'Track', 'Pilot', 'Cadet', 'Ranger', 'Explorer', 'Voyager', 'Blaster', 'Striker', 'Fighter'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj} ${noun}`;
    }
}

export const leaderboardManager = LeaderboardManager.getInstance();
