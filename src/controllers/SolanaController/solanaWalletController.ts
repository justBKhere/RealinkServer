import { NextFunction, Request, Response } from 'express';
import { generate_Sol_Wallet, loadWalletFromMnemonic, AddNewWalletFromMnemonic, setSolanaCluster, getDefaultWalletPortfolio, getWalletPortfolioByAddress, getWalletAddressesByUserId } from '../../services/SolanaServices/solanaWalletService';
import { UserService } from '../../services/userService';
import { GetAllDomainsShyft, GetAllNFTsShyft, GetAllTokenBalances, GetAllTransactionsShyft, getAllcNFTsShyft } from '../../utils/Shyft/shyftApiService';


export const UpdateSolanaCluster = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cluster } = req.body;

        setSolanaCluster(cluster);
        res.status(200).json({ message: `Cluster set to ${cluster}` });

    } catch (error) {
        next(error); // Forward error to error-handling middleware
    }
};

export const LoadWalletFromMnemonic = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestParam: any = req;
        const userId = requestParam.user.id;
        const { password, mnemonic } = requestParam.body;
        console.log("userID", userId);
        const wallet = await AddNewWalletFromMnemonic(userId, password, mnemonic);
        if (wallet) {
            res.status(200).json(`Wallet successfully created. Public Address: ${wallet.publicAddress}`);
        }
        else {
            next();
        }

    } catch (error) {
        next(error); // Forward error to error-handling middleware
    }
}

export const getWalletBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { network } = req.body;
        const requestParam: any = req;
        const userId = requestParam.user.id;
        const walletBalances = await UserService.getWalletBalances(userId, network);
        if (walletBalances) {
            res.status(200).json(walletBalances);
        }
        else {
            next();
        }

    } catch (error) {
        next(error); // Forward error to error-handling middleware
    }
}

export const getDefaultPortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestParam: any = req;
        const userId = requestParam.user.id;
        const { network } = req.body;
        const portfolio = await getDefaultWalletPortfolio(userId, network);
        if (portfolio) {
            res.status(200).json(portfolio);
        }
        else {
            next();
        }

    } catch (error) {
        next(error); // Forward error to error-handling middleware
    }
}

export const getPortfoliobyAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = (req as any).user.id;

        console.log("userID", userId);

        const { network, walletAddress } = req.body;

        let resolvedWalletAddress: string;

        if (walletAddress === "default") {
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }

        const portfolio = await getWalletPortfolioByAddress(resolvedWalletAddress, network);

        if (portfolio) {
            return res.status(200).json(portfolio);
        } else {
            return res.status(404).json({ message: 'Portfolio not found.' });
        }

    } catch (error) {
        next(error); // Forward error to error-handling middleware
    }
}



export const getAllTokenBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { network, walletAddress } = req.body;

        let resolvedWalletAddress: string;

        if (walletAddress === "default") {
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }

        const tokenBalances = await GetAllTokenBalances(resolvedWalletAddress, network);
        res.status(200).json(tokenBalances);
    }
    catch (error) {
        console.error("Error getting all token balances:", error);
        next(error); // Forward error to error-handling middleware
    }
}



export const getAllCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { network, walletAddress } = req.body;

        let resolvedWalletAddress: string;

        if (walletAddress === "default") {
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }

        const collections = await GetAllNFTsShyft(resolvedWalletAddress, network);
        res.status(200).json(collections);
    }
    catch (error) {
        console.error("Error getting all collections:", error);
        next(error); // Forward error to error-handling middleware
    }
}


export const getAllDomains = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { network, walletAddress } = req.body;

        let resolvedWalletAddress: string;

        if (walletAddress === "default") {
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }

        const domains = await GetAllDomainsShyft(resolvedWalletAddress, network);
        res.status(200).json(domains);
    }
    catch (error) {
        console.error("Error getting all domains:", error);
        next(error); // Forward error to error-handling middleware
    }
}


export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { network, walletAddress } = req.body;

        let resolvedWalletAddress: string;

        if (walletAddress === "default") {
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }

        const transactions = await GetAllTransactionsShyft(resolvedWalletAddress, network);
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error("Error getting all transactions:", error);
        next(error); // Forward error to error-handling middleware
    }
}

export const getAllcNFTS = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("getAllcNFTS - Start");

        const userId = (req as any).user.id;
        console.log("User ID:", userId);

        const { network, walletAddress } = req.body;
        console.log("Network:", network, "Wallet Address:", walletAddress);

        let resolvedWalletAddress: string;
        if (walletAddress === "default") {
            console.log("Resolving default wallet address for user");
            const walletDetails = await getWalletAddressesByUserId(userId);
            resolvedWalletAddress = walletDetails[0]?.publicKey;

            if (!resolvedWalletAddress) {
                console.warn("No default wallet found for the user.");
                return res.status(404).json({ message: 'No default wallet found for the user.' });
            }
        } else {
            resolvedWalletAddress = walletAddress;
        }
        console.log("Using Wallet Address:", resolvedWalletAddress);

        const listOfcNFTs = await getAllcNFTsShyft(resolvedWalletAddress, network);
        console.log("List of cNFTs:", listOfcNFTs);

        res.status(200).json({ message: "Successfully fetched data", result: listOfcNFTs });
    }
    catch (error) {
        console.error("Error getting all the transactions:", error);
        next(error);
    }
}
