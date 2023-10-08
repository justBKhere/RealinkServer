import { NextFunction, Request, Response } from 'express';
import { generate_Sol_Wallet, loadWalletFromMnemonic, AddNewWalletFromMnemonic, setSolanaCluster, getDefaultWalletPortfolio, getWalletPortfolioByAddress, getWalletAddressesByUserId } from '../../services/SolanaServices/solanaWalletService';
import { UserService } from '../../services/userService';
import { GetAllDomainsShyft, GetAllNFTsShyft, GetAllTokenBalances, GetAllTransactionsShyft } from '../../utils/Shyft/shyftApiService';


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
        const { network, walletAddress } = req.body;
        const tokenBalances = await GetAllTokenBalances(walletAddress, network);
        res.status(200).json(tokenBalances);
    }
    catch (error) {
        next(error);
    }
}


export const getAllCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { network, walletAddress } = req.body;
        const collections = await GetAllNFTsShyft(walletAddress, network);
        res.status(200).json(collections);
    }
    catch (error) {
        next(error);
    }
}

export const getAllDomains = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { network, walletAddress } = req.body;
        const domains = await GetAllDomainsShyft(walletAddress, network);
        res.status(200).json(domains);
    }
    catch (error) {
        next(error);
    }
}

export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { network, walletAddress } = req.body;
        const transactions = await GetAllTransactionsShyft(walletAddress, network);
        res.status(200).json(transactions);
    }
    catch (error) {
        next(error);
    }
}