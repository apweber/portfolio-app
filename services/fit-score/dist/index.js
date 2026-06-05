"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const calculate_1 = require("./calculate");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const SECRET = process.env.FIT_SCORE_SECRET;
app.post("/calculate", (req, res) => {
    if (SECRET) {
        const auth = req.headers.authorization ?? "";
        if (auth !== `Bearer ${SECRET}`) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
    }
    try {
        const result = (0, calculate_1.calculateFitScore)(req.body);
        res.json(result);
    }
    catch (e) {
        const message = e instanceof Error ? e.message : "Bad request";
        res.status(400).json({ error: message });
    }
});
const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
    console.log(`fit-score service listening on :${PORT}`);
});
