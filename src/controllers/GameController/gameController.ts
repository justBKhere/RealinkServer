import { Request, Response } from "express";
import { buildUsingTokens, handleItemPickup } from "../../services/GameServices/gameService";
const GameController = {
    async HandleItemPickup(req: Request, res: Response) {
        const result = await handleItemPickup(req);
        console.log("result", result);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        return res.status(200).json({ success: true, message: "Item picked up", result: result });
    },
    async BuildUsingTokens(req: Request, res: Response) {
        try {
            const result = await buildUsingTokens(req);
            console.log("result", result);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }
            return res.status(200).json({ success: true, message: "Item Built", result: result });
        } catch (error: any) {
            console.error(`Error sending SOL: ${error.message}`);
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            res.status(error.statusCode).json({ error: error.message });
        }
    }
}

export default GameController;
