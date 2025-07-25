// controller handle request and response
//this checks if user is authenticated
export function isAuthenticated (req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        next(); 
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}
