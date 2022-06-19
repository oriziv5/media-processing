import { Request, Response } from 'express'

export async function Home(req: Request, res: Response) {
    res.send('OK');
}