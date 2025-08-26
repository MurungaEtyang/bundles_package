import jwt from "jsonwebtoken";

export const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.decode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.type !== 'access') {
            return res.status(403).json({ message: 'Invalid token type.' });
        }

        // const expirationTimeThreshold = decoded.exp - currentTime;
        // if (expirationTimeThreshold <= 3600 && expirationTimeThreshold > 0) {
        //     return res.status(403).json({
        //         message: 'Access token will expire soon. Please use the refresh token to get a new access token.'
        //     });
        // }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token is invalid or expired', authorized: false });
            }

            req.user = user;

            next();
        });
    } else {
        return res.status(401).json({ message: 'Authorization token required', authorized: false });
    }
};
