import { Request, Response } from 'express'

export async function Home(req: Request, res: Response) {
    res.render(
        'index',
        {
        },
        (err, html) => {
            if (err) {
                res.send(err)
            }
            res.send(html)
        }
    )
}